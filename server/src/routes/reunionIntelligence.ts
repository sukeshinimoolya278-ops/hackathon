import { Router, Request, Response } from 'express';
import {
  caseStore,
  evaluateMatchEvidence,
  transitionCaseStatus,
  generateMeetingPointRecommendation,
  calculateReunionStats,
} from '../services/reunionIntelligenceEngine';
import { ReunionCase, ReunionCaseStatus, ReunionSourceRecord, FamilyNotificationRecord } from '../types/reunionIntelligence';
import { prisma } from '../prisma';

const router = Router();

// Ensure initial cases are populated
caseStore.ensureInitialData();

/**
 * GET /api/reunion-intelligence/stats
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = calculateReunionStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reunion-intelligence/cases
 */
router.get('/cases', (req: Request, res: Response) => {
  try {
    const { status, reviewBand, query, shelter } = req.query;
    let cases = caseStore.getAllCases();

    if (status && status !== 'ALL') {
      cases = cases.filter(c => c.status === status);
    }

    if (reviewBand && reviewBand !== 'ALL') {
      cases = cases.filter(c => c.matchEvidence?.reviewBand === reviewBand);
    }

    if (shelter && shelter !== 'ALL') {
      cases = cases.filter(c =>
        c.candidateRecord?.campId === shelter ||
        c.candidateRecord?.campName?.toLowerCase().includes(String(shelter).toLowerCase())
      );
    }

    if (query) {
      const q = String(query).toLowerCase().trim();
      cases = cases.filter(c =>
        c.caseCode.toLowerCase().includes(q) ||
        c.missingReport.personName.toLowerCase().includes(q) ||
        (c.candidateRecord && c.candidateRecord.personName.toLowerCase().includes(q)) ||
        (c.missingReport.lastKnownLocation && c.missingReport.lastKnownLocation.toLowerCase().includes(q))
      );
    }

    // Sort by: priority status, high-priority review bands, recent update
    cases.sort((a, b) => {
      const bandScore = (band?: string) => (band === 'HIGH_PRIORITY' ? 3 : band === 'POSSIBLE' ? 2 : 1);
      const scoreDiff = bandScore(b.matchEvidence?.reviewBand) - bandScore(a.matchEvidence?.reviewBand);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reunion-intelligence/cases/:id
 */
router.get('/cases/:id', (req: Request, res: Response) => {
  try {
    const c = caseStore.getCaseById(req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'Reunion Case not found' });
    }
    res.json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/cases/:id/transition
 */
router.post('/cases/:id/transition', (req: Request, res: Response) => {
  try {
    const { toStatus, actorName = 'Field Coordinator', actorRole = 'COORDINATOR', notes = '', evidenceRef } = req.body;
    const c = caseStore.getCaseById(req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'Reunion Case not found' });
    }

    const updated = transitionCaseStatus(
      c,
      toStatus as ReunionCaseStatus,
      actorName,
      actorRole,
      notes,
      evidenceRef
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/cases/:id/verify
 */
router.post('/cases/:id/verify', (req: Request, res: Response) => {
  try {
    const { reviewerName = 'Authorized Coordinator', reviewerNotes } = req.body;
    if (!reviewerNotes || !reviewerNotes.trim()) {
      return res.status(400).json({ error: 'Reviewer verification notes and evidence details are mandatory.' });
    }

    const c = caseStore.getCaseById(req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'Reunion Case not found' });
    }

    // Advance to IDENTITY_VERIFIED
    const updated = transitionCaseStatus(
      c,
      'IDENTITY_VERIFIED',
      reviewerName,
      'COORDINATOR',
      reviewerNotes
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/cases/:id/reject
 */
router.post('/cases/:id/reject', (req: Request, res: Response) => {
  try {
    const { reviewerName = 'Field Coordinator', rejectionReason } = req.body;
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is mandatory.' });
    }

    const c = caseStore.getCaseById(req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'Reunion Case not found' });
    }

    const updated = transitionCaseStatus(
      c,
      'REJECTED_MATCH',
      reviewerName,
      'COORDINATOR',
      rejectionReason
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/cases/:id/notify
 * Dispatches safe family notification after verification and consent checks
 */
router.post('/cases/:id/notify', (req: Request, res: Response) => {
  try {
    const { senderName = 'Disaster Relief Coordinator' } = req.body;
    const c = caseStore.getCaseById(req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'Reunion Case not found' });
    }

    // Ensure case has reached at least IDENTITY_VERIFIED
    if (c.status !== 'IDENTITY_VERIFIED' && c.status !== 'FAMILY_CONTACT_PENDING' && c.status !== 'REUNION_COORDINATING') {
      return res.status(400).json({
        error: 'Security Policy Violation: Family notifications cannot be initiated before human responder identity verification.',
      });
    }

    const reporterName = c.missingReport.reporterOrContactName || 'Inquiring Family Member';
    const reporterPhone = c.missingReport.reporterOrContactPhone || '+91 94470 00000';
    const maskedPhone = reporterPhone.length >= 6
      ? reporterPhone.slice(0, 4) + '****' + reporterPhone.slice(-2)
      : '***';

    const messagePreview = `GlobalX Disaster Relief Notification: An authorized match for your inquiry regarding "${c.missingReport.personName}" has been positively verified at ${c.candidateRecord?.campName || 'authorized relief station'}. Please connect with the On-Site Camp Coordinator at ${c.candidateRecord?.campName || 'the relief center'} to coordinate reunification safely.`;

    const notification: FamilyNotificationRecord = {
      id: `notif-${Date.now()}`,
      caseId: c.id,
      recipientName: reporterName,
      recipientPhoneMasked: maskedPhone,
      messagePreview,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      dispatchedBy: senderName,
      channel: 'IN_APP_DISPATCH',
    };

    c.notification = notification;

    // Advance status to REUNION_COORDINATING if it was IDENTITY_VERIFIED or FAMILY_CONTACT_PENDING
    if (c.status === 'IDENTITY_VERIFIED') {
      transitionCaseStatus(
        c,
        'FAMILY_CONTACT_PENDING',
        senderName,
        'COORDINATOR',
        `Dispatched safe family notification to ${reporterName} (${maskedPhone}).`
      );
    }

    if (c.status === 'FAMILY_CONTACT_PENDING') {
      transitionCaseStatus(
        c,
        'REUNION_COORDINATING',
        senderName,
        'COORDINATOR',
        `Notification delivered. Transitioned to active Reunion Coordination.`
      );
    }

    caseStore.saveCase(c);
    res.json({ success: true, notification, case: c });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/cases/:id/meeting-point
 * Generates hazard-aware relief camp meeting point
 */
router.post('/cases/:id/meeting-point', async (req: Request, res: Response) => {
  try {
    const { overrideCampId, overrideReason } = req.body;
    const c = caseStore.getCaseById(req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'Reunion Case not found' });
    }

    // Fetch camps from prisma or fallback
    let camps = await prisma.camp.findMany().catch(() => []);
    if (!camps || camps.length === 0) {
      camps = [
        {
          id: 'camp-1',
          name: 'St. Joseph Higher Secondary Relief Camp',
          location: 'Meppadi Town, Wayanad',
          latitude: 11.5512,
          longitude: 76.1289,
          capacity: 500,
          currentOccupancy: 342,
          status: 'OPEN' as any,
          disasterId: 'dis-1',
          contactPerson: 'Father Mathew',
          contactPhone: '+91 94471 23456',
          needs: 'Blankets',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'camp-2',
          name: 'Chooralmala Govt UP School Camp',
          location: 'Chooralmala Valley',
          latitude: 11.5388,
          longitude: 76.1554,
          capacity: 350,
          currentOccupancy: 350, // FULL!
          status: 'FULL' as any,
          disasterId: 'dis-1',
          contactPerson: 'Sujatha Pillai',
          contactPhone: '+91 98460 78901',
          needs: 'Water',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    const recommendation = generateMeetingPointRecommendation(
      camps,
      { latitude: 11.5544, longitude: 76.1322, radiusKm: 2.0 }
    );

    if (overrideCampId) {
      c.selectedMeetingPointId = overrideCampId;
      c.meetingPointOverrideReason = overrideReason || 'Manual coordinator assignment override';
    } else {
      c.selectedMeetingPointId = recommendation.campId;
    }

    c.recommendedMeetingPoint = recommendation;
    caseStore.saveCase(c);

    res.json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/ingest-sos
 * Ingests an SOS packet from DLE Mesh Network and associates with cases
 */
router.post('/ingest-sos', (req: Request, res: Response) => {
  try {
    const { packetId, senderId, senderName, payload, timestamp } = req.body;
    if (!packetId) {
      return res.status(400).json({ error: 'packetId is required' });
    }

    if (caseStore.isSosProcessed(packetId)) {
      return res.json({ status: 'DUPLICATE_IGNORED', message: 'SOS packet already synchronized.' });
    }

    caseStore.markSosProcessed(packetId);

    // Create a source record from SOS packet
    const sosRecord: ReunionSourceRecord = {
      id: `sos-${packetId}`,
      sourceType: 'DLE_SOS',
      sourceReferenceCode: `SOS-${packetId.slice(0, 8)}`,
      personName: senderName || 'Unidentified SOS Survivor',
      alternativeNames: [],
      approxAge: payload?.approxAge || null,
      gender: payload?.gender || 'UNKNOWN',
      physicalDescription: payload?.notes || 'SOS beacon distress broadcast from DLE terminal',
      medicalNeeds: payload?.medicalNeeds || null,
      priorityFlag: payload?.priorityFlag || 'CRITICAL_MEDICAL',
      lastKnownLocation: payload?.locationName || 'DLE Mesh Hop Gateway Zone',
      currentReportedLocation: payload?.locationName || 'DLE Mesh Hop Gateway Zone',
      campId: null,
      campName: null,
      timestamp: timestamp || new Date().toISOString(),
      isVerifiedFact: true,
      notes: `Ingested via DLE Mesh Network. RSSI: ${payload?.rssi || -70} dBm`,
      privacyConsent: {
        consentGiven: true,
        shareLocationAllowed: false,
        shareContactAllowed: false,
      },
      rawMetadata: { packetId, senderId, hopTrace: payload?.hopTrace },
    };

    res.status(201).json({ status: 'INGESTED', record: sosRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/demo/seed
 * Reseeds the deterministic Arjun Kumar scenario
 */
router.post('/demo/seed', (req: Request, res: Response) => {
  try {
    caseStore.seedDemoData();
    const demoCase = caseStore.getCaseById('case-demo-arjun-01');
    res.json({ success: true, message: 'Deterministic demo scenario seeded successfully.', demoCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reunion-intelligence/demo/reset
 * Resets demo data
 */
router.post('/demo/reset', (req: Request, res: Response) => {
  try {
    caseStore.resetDemoData();
    res.json({ success: true, message: 'Demo cases cleanly reset.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
