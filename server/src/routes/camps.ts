import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Get camps for active disaster
router.get('/', async (req: Request, res: Response) => {
  try {
    const { disasterId } = req.query;

    const whereClause: any = {};
    if (disasterId) {
      whereClause.disasterId = String(disasterId);
    } else {
      // default to active disaster
      const active = await prisma.disaster.findFirst({ where: { isActive: true } });
      if (active) whereClause.disasterId = active.id;
    }

    const camps = await prisma.camp.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { shelterEntries: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(camps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single camp details with roster
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campId = String(req.params.id);
    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        shelterEntries: {
          include: {
            person: {
              include: { familyGroup: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!camp) {
      return res.status(404).json({ error: 'Camp not found' });
    }

    res.json(camp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update camp capacity, status, and urgent relief needs
router.patch('/:id', authenticate, requireRole(['COORDINATOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const campId = String(req.params.id);
    const { capacity, currentOccupancy, status, needs } = req.body;

    const data: any = {};
    if (capacity !== undefined) data.capacity = Number(capacity);
    if (currentOccupancy !== undefined) data.currentOccupancy = Number(currentOccupancy);
    if (status !== undefined) data.status = status;
    if (needs !== undefined) data.needs = needs;

    const updated = await prisma.camp.update({
      where: { id: campId },
      data,
    });

    // Notify connected clients of camp update
    NotificationService.emit('camp:updated', updated);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
