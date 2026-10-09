import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Look up family group by QR token (e.g. FAM-CHENNAI-4091)
router.get('/lookup/:token', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const group = await prisma.familyGroup.findUnique({
      where: { token },
      include: {
        disaster: true,
        members: {
          include: {
            missingReports: true,
            shelterEntries: { include: { camp: true } },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: `Family token ${token} not found` });
    }

    res.json({
      token: group.token,
      primaryContactName: group.primaryContactName,
      contactPhone: group.contactPhone,
      disaster: group.disaster.name,
      notes: group.notes,
      members: (group.members || []).map((m: any) => ({
        id: m.id,
        fullName: m.fullName,
        approxAge: m.approxAge,
        gender: m.gender,
        medicalNeeds: m.medicalNeeds,
        priorityFlag: m.priorityFlag,
        currentShelter: m.shelterEntries?.[0]?.camp?.name || 'Not yet checked into shelter',
        reports: (m.missingReports || []).map((r: any) => ({
          reportCode: r.reportCode,
          status: r.status,
        })),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
