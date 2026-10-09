import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { normalizeTransliteration } from '../utils/fuzzy';

const router = Router();

function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length < 6) return '***';
  return clean.slice(0, 4) + '****' + clean.slice(-2);
}

// Public Low-Bandwidth Search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, disasterId } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query "q" is required' });
    }

    const query = q.trim();
    const normalizedQuery = normalizeTransliteration(query);

    const whereDisaster: any = {};
    if (disasterId) {
      whereDisaster.disasterId = String(disasterId);
    }

    // 1. Check direct reportCode or family token
    const directReport = await prisma.missingReport.findFirst({
      where: {
        ...whereDisaster,
        OR: [
          { reportCode: { equals: query } },
          { reporterPhone: { contains: query } },
        ],
      },
      include: {
        person: {
          include: {
            familyGroup: true,
            statusEvents: {
              include: { verifiedByCamp: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        leads: {
          include: {
            shelterEntry: { include: { camp: true } },
            sighting: true,
          },
        },
      },
    });

    // 2. Search all matching reports by name
    const reports = await prisma.missingReport.findMany({
      where: {
        ...whereDisaster,
        OR: [
          { person: { normalizedName: { contains: normalizedQuery } } },
          { person: { fullName: { contains: query } } },
          { reportCode: { contains: query } },
          { reporterPhone: { contains: query } },
        ],
      },
      include: {
        person: {
          include: {
            familyGroup: true,
            statusEvents: {
              include: { verifiedByCamp: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        leads: {
          include: {
            shelterEntry: { include: { camp: true } },
            sighting: true,
          },
        },
      },
      take: 20,
    });

    // Combine and deduplicate
    const combined = directReport
      ? [directReport, ...reports.filter(r => r.id !== directReport.id)]
      : reports;

    // Sanitize with Rumor Control & Privacy Protection
    const sanitizedResults = combined.map(report => {
      const isVerifiedSafe = report.status === 'VERIFIED_SAFE';
      const approvedLead = report.leads.find(l => l.status === 'APPROVED');
      const pendingLeads = report.leads.filter(l => l.status === 'PENDING');

      // Determine public status label and badge
      let publicStatus = report.status;
      let verificationBadge = null;
      let rumorControlNotice = null;

      if (isVerifiedSafe && approvedLead?.shelterEntry) {
        verificationBadge = {
          verified: true,
          campName: approvedLead.shelterEntry.camp.name,
          campLocation: approvedLead.shelterEntry.camp.location,
          verifiedDate: approvedLead.reviewedAt,
        };
      } else if (pendingLeads.length > 0) {
        rumorControlNotice = {
          hasPotentialLead: true,
          message: 'We have a possible lead currently under verification by our camp coordinator team. Details will appear once officially confirmed to prevent rumors.',
        };
      }

      // Format timeline events
      const timeline = report.person.statusEvents.map(evt => ({
        id: evt.id,
        status: evt.status,
        source: evt.source,
        location: isVerifiedSafe || evt.source === 'DIRECT_REPORT' ? evt.location : 'Relief area (verifying)',
        notes: isVerifiedSafe || evt.source === 'DIRECT_REPORT' ? evt.notes : 'Lead logged by field responders',
        verifiedByCamp: evt.verifiedByCamp?.name || null,
        timestamp: evt.createdAt,
      }));

      // Related family group members
      const familyGroup = report.person.familyGroup
        ? {
            token: report.person.familyGroup.token,
            contactName: report.person.familyGroup.primaryContactName,
            contactPhoneMasked: maskPhone(report.person.familyGroup.contactPhone),
          }
        : null;

      return {
        id: report.id,
        reportCode: report.reportCode,
        fullName: report.person.fullName,
        approxAge: report.person.approxAge,
        gender: report.person.gender,
        physicalDesc: report.person.physicalDesc,
        priorityFlag: report.person.priorityFlag,
        lastSeenLocation: report.lastSeenLocation,
        reporterName: report.reporterName,
        reporterPhoneMasked: maskPhone(report.reporterPhone),
        status: publicStatus,
        verificationBadge,
        rumorControlNotice,
        timeline,
        familyGroup,
        createdAt: report.createdAt,
      };
    });

    res.json({
      query,
      count: sanitizedResults.length,
      results: sanitizedResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
