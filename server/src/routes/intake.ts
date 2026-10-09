import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { MatchingEngineService } from '../services/matchingEngine';
import { NotificationService } from '../services/notificationService';
import { normalizeTransliteration } from '../utils/fuzzy';

const router = Router();

function generateCode(prefix: string): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

// Volunteer fast camp intake
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const {
      fullName,
      approxAge,
      gender = 'UNKNOWN',
      campId,
      medicalNeeds,
      physicalDesc,
      priorityFlag = 'NONE',
      groupNotes,
      familyToken,
      disasterId: reqDisasterId,
    } = req.body;

    if (!fullName || !campId) {
      return res.status(400).json({ error: 'fullName and campId are required' });
    }

    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) {
      return res.status(404).json({ error: 'Relief camp not found' });
    }

    const disasterId = reqDisasterId || camp.disasterId;

    // Check if family token exists
    let familyGroupId: string | null = null;
    if (familyToken) {
      const group = await prisma.familyGroup.findUnique({ where: { token: familyToken } });
      if (group) familyGroupId = group.id;
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

    const entryCode = generateCode('SHL');
    const shelterEntry = await prisma.shelterEntry.create({
      data: {
        entryCode,
        disasterId,
        campId,
        personId: person.id,
        intakeVolunteerId: req.user?.id || null,
        status: 'IN_SHELTER',
        groupNotes,
      },
      include: {
        camp: true,
        person: true,
      },
    });

    // Update camp occupancy
    await prisma.camp.update({
      where: { id: campId },
      data: { currentOccupancy: { increment: 1 } },
    });

    // Add status event
    await prisma.statusEvent.create({
      data: {
        personId: person.id,
        status: 'LOCATED_AT_CAMP',
        source: 'OFFICIAL_ROSTER',
        location: camp.name,
        notes: `Registered at ${camp.name} by volunteer ${req.user?.name || 'Intake Officer'}`,
        verifiedByCampId: camp.id,
      },
    });

    // Run matching engine asynchronously
    MatchingEngineService.matchForShelterEntry(shelterEntry.id).catch(err =>
      console.error('Matching error:', err)
    );

    NotificationService.emit('intake:created', {
      campId,
      entryCode,
      personName: fullName,
      campName: camp.name,
    });

    res.status(201).json({
      success: true,
      entryCode,
      shelterEntry,
    });
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({ success: false, error: err?.message || 'Internal server error processing intake' });
  }
});

// Offline Sync Batch Endpoint: for field volunteers syncing local queued logs
router.post('/batch-sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required' });
    }

    const syncedResults: any[] = [];

    for (const item of entries) {
      if (!item.fullName || !item.campId) continue;

      const camp = await prisma.camp.findUnique({ where: { id: item.campId } });
      if (!camp) continue;

      const person = await prisma.person.create({
        data: {
          disasterId: camp.disasterId,
          fullName: item.fullName,
          normalizedName: normalizeTransliteration(item.fullName),
          approxAge: item.approxAge ? Number(item.approxAge) : null,
          gender: (item.gender as any) || 'UNKNOWN',
          physicalDesc: item.physicalDesc,
          medicalNeeds: item.medicalNeeds,
          priorityFlag: (item.priorityFlag as any) || 'NONE',
        },
      });

      const entryCode = generateCode('SHL');
      const shelterEntry = await prisma.shelterEntry.create({
        data: {
          entryCode,
          disasterId: camp.disasterId,
          campId: item.campId,
          personId: person.id,
          intakeVolunteerId: req.user?.id || null,
          status: 'IN_SHELTER',
          groupNotes: item.groupNotes,
          arrivalDate: item.offlineTimestamp ? new Date(item.offlineTimestamp) : new Date(),
        },
        include: { camp: true, person: true },
      });

      await prisma.camp.update({
        where: { id: item.campId },
        data: { currentOccupancy: { increment: 1 } },
      });

      await prisma.statusEvent.create({
        data: {
          personId: person.id,
          status: 'LOCATED_AT_CAMP',
          source: 'OFFICIAL_ROSTER',
          location: camp.name,
          notes: `Offline intake synced: ${camp.name}`,
          verifiedByCampId: camp.id,
        },
      });

      MatchingEngineService.matchForShelterEntry(shelterEntry.id).catch(err =>
        console.error('Batch match error:', err)
      );

      syncedResults.push({
        offlineId: item.offlineId || item.id,
        entryCode,
        fullName: item.fullName,
      });
    }

    res.json({
      success: true,
      syncedCount: syncedResults.length,
      synced: syncedResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
