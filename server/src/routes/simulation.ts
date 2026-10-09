import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Get simulated SMS inbox history
router.get('/sms', (req: Request, res: Response) => {
  const messages = NotificationService.getRecentSMS(30);
  res.json({ messages });
});

// Simulate incoming SMS or WhatsApp command (e.g., user texts "MIS-1024" or phone number to the emergency helpline)
router.post('/sms/inbound', async (req: Request, res: Response) => {
  try {
    const { fromNumber = '+91 98400 12345', text = '', channel = 'SMS' } = req.body;
    const cleanText = text.trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    // Try finding report by code
    const report = await prisma.missingReport.findFirst({
      where: {
        OR: [
          { reportCode: { equals: cleanText } },
          { reporterPhone: { contains: cleanText } },
        ],
      },
      include: {
        person: true,
        leads: {
          where: { status: 'APPROVED' },
          include: { shelterEntry: { include: { camp: true } } },
        },
      },
    });

    let replyMessage = '';

    if (report) {
      if (report.status === 'VERIFIED_SAFE') {
        const camp = report.leads[0]?.shelterEntry?.camp.name || 'a registered relief shelter';
        replyMessage = `[GlobalX HELPLINE] Status for ${report.person.fullName} (${report.reportCode}): VERIFIED SAFE at ${camp}. Please contact camp helpdesk or visit in person.`;
      } else {
        replyMessage = `[GlobalX HELPLINE] Status for ${report.person.fullName} (${report.reportCode}): Still in active matching. Status: ${report.status}. Our team is cross-referencing incoming shelter lists.`;
      }
    } else {
      replyMessage = `[GlobalX HELPLINE] No active record found for "${cleanText}". Reply with your 8-digit Report ID (e.g. MIS-1024) or register a missing person on the portal.`;
    }

    const sentReply = NotificationService.sendSimulatedSMS(
      fromNumber,
      'Citizen / Reporter',
      replyMessage,
      channel === 'WHATSAPP' ? 'WHATSAPP' : 'SMS'
    );

    res.json({
      inbound: { fromNumber, text: cleanText, channel },
      reply: sentReply,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
