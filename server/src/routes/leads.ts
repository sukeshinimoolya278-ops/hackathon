import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { NotificationService } from '../services/notificationService';
import { calculateNameMatchScore } from '../utils/fuzzy';

const router = Router();

// Get coordinator review queue
router.get('/', authenticate, requireRole(['COORDINATOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'PENDING', disasterId } = req.query;

    const where: any = {};
    if (status) {
      where.status = String(status);
    }
    if (disasterId) {
      where.disasterId = String(disasterId);
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        missingReport: {
          include: {
            person: {
              include: { familyGroup: true },
            },
          },
        },
        shelterEntry: {
          include: {
            camp: true,
            person: {
              include: { familyGroup: true },
            },
          },
        },
        sighting: true,
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { confidenceScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Lead
router.post('/:id/approve', authenticate, requireRole(['COORDINATOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const leadId = String(req.params.id);
    const { notes } = req.body;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        missingReport: { include: { person: true } },
        shelterEntry: { include: { camp: true, person: true } },
        sighting: true,
      },
    });

    if (!lead || !lead.missingReport) {
      return res.status(404).json({ error: 'Lead or missing report not found' });
    }

    const campName = lead.shelterEntry?.camp.name || 'Relief Center';
    const campId = lead.shelterEntry?.camp.id || null;
    const reporterPhone = lead.missingReport.reporterPhone;
    const reporterName = lead.missingReport.reporterName;
    const personName = lead.missingReport.person.fullName;

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'APPROVED',
        reviewedById: req.user?.id || null,
        reviewNotes: notes || 'Verified by camp coordinator',
        reviewedAt: new Date(),
      },
    });

    // Update Missing Report status
    await prisma.missingReport.update({
      where: { id: lead.missingReportId },
      data: { status: 'VERIFIED_SAFE' },
    });

    // Create verified StatusEvent
    await prisma.statusEvent.create({
      data: {
        personId: lead.missingReport.personId,
        missingReportId: lead.missingReportId,
        status: 'VERIFIED_SAFE',
        source: 'COORDINATOR_VERIFICATION',
        location: campName,
        notes: `Officially verified safe at ${campName} by coordinator ${req.user?.name || 'Coordinator'}. Notes: ${notes || 'Verified'}`,
        verifiedByCampId: campId,
      },
    });

    // Send automated notification to family reporter
    const message = `URGENT REUNIFICATION ALERT: ${personName} has been officially verified safe at ${campName}. You may proceed to contact the camp coordinator or visit the camp. Verified by: ${req.user?.name || 'Coordinator'}.`;

    NotificationService.sendSimulatedSMS(reporterPhone, reporterName, message, 'SMS');

    // Audit Log
    await AuditService.log({
      userId: req.user?.id,
      action: 'LEAD_APPROVED',
      entityType: 'Lead',
      entityId: lead.id,
      details: `Lead approved for ${personName} at ${campName}. Confidence: ${lead.confidenceScore}%`,
    });

    NotificationService.emit('lead:approved', {
      leadId: lead.id,
      personName,
      campName,
      status: 'VERIFIED_SAFE',
    });

    res.json({
      success: true,
      message: `Lead approved. Family notified at ${reporterPhone}`,
      lead: updatedLead,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Lead
router.post('/:id/reject', authenticate, requireRole(['COORDINATOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const leadId = String(req.params.id);
    const { notes } = req.body;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { missingReport: { include: { person: true } } },
    });

    if (!lead || !lead.missingReport) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const personName = lead.missingReport.person.fullName;

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'REJECTED',
        reviewedById: req.user?.id || null,
        reviewNotes: notes || 'Rejected after verification check',
        reviewedAt: new Date(),
      },
    });

    await AuditService.log({
      userId: req.user?.id,
      action: 'LEAD_REJECTED',
      entityType: 'Lead',
      entityId: lead.id,
      details: `Lead rejected for ${personName}. Reason: ${notes || 'Mismatch'}`,
    });

    res.json({ success: true, lead: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rumor Control: Retract Lead with audit trail
router.post('/:id/retract', authenticate, requireRole(['COORDINATOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const leadId = String(req.params.id);
    const { retractionReason } = req.body;
    if (!retractionReason) {
      return res.status(400).json({ error: 'retractionReason is required for audit trail' });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { missingReport: { include: { person: true } } },
    });

    if (!lead || !lead.missingReport) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const personName = lead.missingReport.person.fullName;

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'REJECTED',
        retractedAt: new Date(),
        retractionReason,
      },
    });

    // Revert missing report back to REPORTED
    await prisma.missingReport.update({
      where: { id: lead.missingReportId },
      data: { status: 'REPORTED' },
    });

    await AuditService.log({
      userId: req.user?.id,
      action: 'LEAD_RETRACTED',
      entityType: 'Lead',
      entityId: lead.id,
      details: `Lead retracted for ${personName}. Reason: ${retractionReason}`,
    });

    res.json({ success: true, message: 'Lead retracted and audit trail recorded', lead: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate Detection & Merge Tool
router.get('/duplicates/detect', authenticate, requireRole(['COORDINATOR', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const persons = await prisma.person.findMany({
      include: {
        missingReports: true,
        shelterEntries: { include: { camp: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const potentialDuplicates: any[] = [];

    for (let i = 0; i < persons.length; i++) {
      for (let j = i + 1; j < persons.length; j++) {
        const p1 = persons[i];
        const p2 = persons[j];

        const nameScore = calculateNameMatchScore(p1.fullName, p2.fullName);
        if (nameScore.score >= 80) {
          potentialDuplicates.push({
            personA: p1,
            personB: p2,
            nameScore: nameScore.score,
            reason: nameScore.reason,
          });
        }
      }
    }

    res.json(potentialDuplicates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
