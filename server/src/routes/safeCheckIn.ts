import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { NotificationService } from '../services/notificationService';
import { normalizeTransliteration } from '../utils/fuzzy';
import { surgeTelemetryService } from '../services/surgeTelemetryService';

const router = Router();

// "I am Safe" one-tap check-in with Surge Idempotency & Duplicate Suppression
router.post('/', async (req: Request, res: Response) => {
  const { fullName, phone, currentLocation, message, disasterId: reqDisasterId, idempotencyKey } = req.body;
  if (!fullName || !phone) {
    return res.status(400).json({ error: 'fullName and phone are required' });
  }

  // Generate robust idempotency key
  const submissionKey =
    idempotencyKey ||
    `checkin-${phone.trim().replace(/\D/g, '')}-${fullName.trim().toLowerCase()}`;

  // 1. Check idempotency cache to prevent disaster submission floods
  const idempotencyCheck = surgeTelemetryService.checkIdempotency(submissionKey);
  if (idempotencyCheck.isDuplicate && idempotencyCheck.existingId) {
    const existing = await prisma.safeCheckIn.findUnique({
      where: { id: idempotencyCheck.existingId },
    }).catch(() => null);

    if (existing) {
      return res.status(200).json({
        success: true,
        isDuplicatePrevented: true,
        message: 'Your safe check-in is already recorded. Duplicate submission gracefully handled.',
        checkIn: existing,
        notifiedFamiliesCount: 0,
        notifiedFamilies: [],
      });
    }
  }

  try {
    let disasterId = reqDisasterId;
    if (!disasterId) {
      const active = await prisma.disaster.findFirst({ where: { isActive: true } });
      if (!active) return res.status(400).json({ error: 'No active disaster found' });
      disasterId = active.id;
    }

    // 2. Persist safe check-in transactionally
    const checkIn = await prisma.safeCheckIn.create({
      data: {
        disasterId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        currentLocation: currentLocation ? currentLocation.trim() : 'Self-reported safe location',
        message: message ? message.trim() : 'I am safe and sound.',
        isNotified: true,
      },
    });

    // Record idempotency in telemetry
    surgeTelemetryService.recordCheckIn(submissionKey, checkIn.id, true);

    // 3. Find any matching missing reports using normalized transliterations
    const normalized = normalizeTransliteration(fullName);
    const matchedReports = await prisma.missingReport.findMany({
      where: {
        disasterId,
        status: { not: 'VERIFIED_SAFE' },
        OR: [
          { person: { normalizedName: { contains: normalized } } },
          { reporterPhone: { contains: phone.trim() } },
        ],
      },
      include: { person: true },
      take: 10, // Paginate/cap to prevent unbounded query explosion during surge
    });

    // 4. Asynchronously process family notifications with retry queue
    const notifiedFamilies: any[] = [];
    for (const report of matchedReports) {
      // Execute through resilient background queue
      await surgeTelemetryService.enqueueBackgroundJob(
        'NOTIFICATION',
        `notif-${report.id}-${checkIn.id}`,
        async () => {
          // Update report status
          await prisma.missingReport.update({
            where: { id: report.id },
            data: { status: 'VERIFIED_SAFE' },
          });

          // Add timeline audit event
          await prisma.statusEvent.create({
            data: {
              personId: report.personId,
              missingReportId: report.id,
              status: 'VERIFIED_SAFE',
              source: 'DIRECT_REPORT',
              location: checkIn.currentLocation,
              notes: `Self check-in completed: "${checkIn.message}" from ${checkIn.phone}`,
            },
          });

          // Send simulated SMS alert
          NotificationService.sendSimulatedSMS(
            report.reporterPhone,
            report.reporterName,
            `GlobalX ALERT: ${fullName} just tapped "I am Safe"! Location: ${checkIn.currentLocation}. Message: "${checkIn.message}"`,
            'SMS'
          );
        }
      );

      notifiedFamilies.push({
        reporterName: report.reporterName,
        reporterPhone: report.reporterPhone,
        reportCode: report.reportCode,
      });
    }

    return res.status(201).json({
      success: true,
      isDuplicatePrevented: false,
      checkIn,
      notifiedFamiliesCount: notifiedFamilies.length,
      notifiedFamilies,
    });
  } catch (err: any) {
    surgeTelemetryService.recordCheckIn(submissionKey, '', false);
    return res.status(500).json({ error: err.message || 'Error processing safe check-in' });
  }
});

export default router;
