import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { NotificationService } from '../services/notificationService';
import { normalizeTransliteration } from '../utils/fuzzy';

const router = Router();

// "I am Safe" one-tap check-in
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fullName, phone, currentLocation, message, disasterId: reqDisasterId } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ error: 'fullName and phone are required' });
    }

    let disasterId = reqDisasterId;
    if (!disasterId) {
      const active = await prisma.disaster.findFirst({ where: { isActive: true } });
      if (!active) return res.status(400).json({ error: 'No active disaster found' });
      disasterId = active.id;
    }

    // 1. Record safe check-in
    const checkIn = await prisma.safeCheckIn.create({
      data: {
        disasterId,
        fullName,
        phone,
        currentLocation: currentLocation || 'Self-reported safe location',
        message: message || 'I am safe and sound.',
        isNotified: true,
      },
    });

    // 2. Find any matching missing reports with this name or phone
    const normalized = normalizeTransliteration(fullName);
    const matchedReports = await prisma.missingReport.findMany({
      where: {
        disasterId,
        status: { not: 'VERIFIED_SAFE' },
        OR: [
          { person: { normalizedName: { contains: normalized } } },
          { reporterPhone: { contains: phone } },
        ],
      },
      include: { person: true },
    });

    // 3. Notify family members who registered them
    const notifiedFamilies: any[] = [];
    for (const report of matchedReports) {
      // Update report status
      await prisma.missingReport.update({
        where: { id: report.id },
        data: { status: 'VERIFIED_SAFE' },
      });

      // Add timeline event
      await prisma.statusEvent.create({
        data: {
          personId: report.personId,
          missingReportId: report.id,
          status: 'VERIFIED_SAFE',
          source: 'DIRECT_REPORT',
          location: currentLocation || 'Direct self check-in',
          notes: `Self check-in completed: "${message || 'I am safe'}" from ${phone}`,
        },
      });

      // Send SMS
      NotificationService.sendSimulatedSMS(
        report.reporterPhone,
        report.reporterName,
        `GlobalX ALERT: ${fullName} just tapped "I am Safe"! Location: ${currentLocation || 'Reported safe'}. Message: "${message || 'I am safe'}"`,
        'SMS'
      );

      notifiedFamilies.push({
        reporterName: report.reporterName,
        reporterPhone: report.reporterPhone,
        reportCode: report.reportCode,
      });
    }

    res.status(201).json({
      success: true,
      checkIn,
      notifiedFamiliesCount: notifiedFamilies.length,
      notifiedFamilies,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
