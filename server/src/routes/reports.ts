import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { MatchingEngineService } from '../services/matchingEngine';
import { NotificationService } from '../services/notificationService';
import { normalizeTransliteration } from '../utils/fuzzy';

const router = Router();

function generateCode(prefix: string): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

// 1. Missing Person Report ("I'm looking for someone")
router.post('/missing', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      approxAge,
      gender = 'UNKNOWN',
      physicalDesc,
      medicalNeeds,
      priorityFlag = 'NONE',
      lastSeenLocation,
      lastSeenDate,
      reporterName,
      reporterPhone,
      reporterRelationship,
      disasterId: reqDisasterId,
      familyToken,
      notes,
    } = req.body;

    if (!fullName || !reporterName || !reporterPhone || !lastSeenLocation) {
      return res.status(400).json({
        error: 'Missing required fields: fullName, reporterName, reporterPhone, lastSeenLocation',
      });
    }

    // Determine disaster ID
    let disasterId = reqDisasterId;
    if (!disasterId) {
      const active = await prisma.disaster.findFirst({ where: { isActive: true } });
      if (!active) return res.status(400).json({ error: 'No active disaster found' });
      disasterId = active.id;
    }

    // Handle Family Group
    let familyGroupId: string | null = null;
    let assignedToken = familyToken;
    if (assignedToken) {
      const group = await prisma.familyGroup.findUnique({ where: { token: assignedToken } });
      if (group) familyGroupId = group.id;
    }

    if (!familyGroupId) {
      assignedToken = assignedToken || `FAM-${Math.floor(1000 + Math.random() * 9000)}`;
      const newGroup = await prisma.familyGroup.create({
        data: {
          token: assignedToken,
          disasterId,
          primaryContactName: reporterName,
          contactPhone: reporterPhone,
          notes: `Family group created with report for ${fullName}`,
        },
      });
      familyGroupId = newGroup.id;
    }

    // Create Person
    const person = await prisma.person.create({
      data: {
        disasterId,
        fullName,
        normalizedName: normalizeTransliteration(fullName),
        approxAge: approxAge ? Number(approxAge) : null,
        gender: gender as any,
        physicalDesc,
        medicalNeeds,
        priorityFlag: priorityFlag as any,
        familyGroupId,
      },
    });

    // Create Missing Report
    const reportCode = generateCode('MIS');
    const missingReport = await prisma.missingReport.create({
      data: {
        reportCode,
        disasterId,
        personId: person.id,
        reporterName,
        reporterPhone,
        reporterRelationship: reporterRelationship || 'Family',
        lastSeenLocation,
        lastSeenDate: lastSeenDate ? new Date(lastSeenDate) : new Date(),
        notes,
        status: 'REPORTED',
      },
      include: {
        person: true,
        disaster: true,
      },
    });

    // Create initial timeline event
    await prisma.statusEvent.create({
      data: {
        personId: person.id,
        missingReportId: missingReport.id,
        status: 'REPORTED',
        source: 'DIRECT_REPORT',
        location: lastSeenLocation,
        notes: `Report filed by ${reporterName} (${reporterRelationship || 'Family'})`,
      },
    });

    // Run matching engine asynchronously
    MatchingEngineService.matchForMissingReport(missingReport.id).catch(err =>
      console.error('Matching error:', err)
    );

    // Send simulated SMS receipt to reporter
    NotificationService.sendSimulatedSMS(
      reporterPhone,
      reporterName,
      `GlobalX: Report ${reportCode} filed for ${fullName}. Track status online with ID "${reportCode}" or SMS this code anytime. We are actively cross-referencing shelter rosters.`,
      'SMS'
    );

    res.status(201).json({
      success: true,
      reportCode,
      familyToken: assignedToken,
      report: missingReport,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Eyewitness Sighting Report ("I saw someone")
router.post('/sighting', async (req: Request, res: Response) => {
  try {
    const {
      sightedName,
      approxAge,
      gender = 'UNKNOWN',
      sightingLocation,
      directionHeading,
      groupSize = 1,
      additionalPeople, // list of other separated persons observed
      witnessName,
      witnessPhone,
      notes,
      disasterId: reqDisasterId,
    } = req.body;

    if (!sightingLocation || !witnessName || !witnessPhone) {
      return res.status(400).json({
        error: 'Missing required fields: sightingLocation, witnessName, witnessPhone',
      });
    }

    let disasterId = reqDisasterId;
    if (!disasterId) {
      const active = await prisma.disaster.findFirst({ where: { isActive: true } });
      if (!active) return res.status(400).json({ error: 'No active disaster found' });
      disasterId = active.id;
    }

    const sightingCode = generateCode('SGT');
    const sighting = await prisma.sighting.create({
      data: {
        sightingCode,
        disasterId,
        sightedName,
        approxAge: approxAge ? Number(approxAge) : null,
        gender: gender as any,
        sightingLocation,
        directionHeading: directionHeading || null,
        groupSize: Number(groupSize) || 1,
        additionalPeople: typeof additionalPeople === 'object' ? JSON.stringify(additionalPeople) : additionalPeople,
        witnessName,
        witnessPhone,
        notes,
      },
    });

    // Run matching engine for this sighting
    MatchingEngineService.matchForSighting(sighting.id).catch(err =>
      console.error('Matching error:', err)
    );

    // Send thank you SMS to witness
    NotificationService.sendSimulatedSMS(
      witnessPhone,
      witnessName,
      `GlobalX: Sighting report ${sightingCode} received for ${sightingLocation}. Relief coordinators and matching algorithms are reviewing your eyewitness lead. Thank you for helping families reunite!`,
      'SMS'
    );

    res.status(201).json({
      success: true,
      sightingCode,
      sighting,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
