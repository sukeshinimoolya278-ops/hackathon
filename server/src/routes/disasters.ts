import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// 1. Get all disasters with live coordinates, alert levels, and camps count
router.get('/', async (req: Request, res: Response) => {
  try {
    const disasters = await prisma.disaster.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        camps: {
          select: {
            id: true,
            name: true,
            location: true,
            latitude: true,
            longitude: true,
            capacity: true,
            currentOccupancy: true,
            status: true,
            needs: true,
          },
        },
        _count: {
          select: {
            camps: true,
            missingReports: true,
            shelterEntries: true,
            leads: true,
          },
        },
      },
    });
    res.json(disasters);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get currently active disaster with its live location and camps
router.get('/active', async (req: Request, res: Response) => {
  try {
    let disaster = await prisma.disaster.findFirst({
      where: { isActive: true },
      include: {
        camps: true,
      },
    });

    if (!disaster) {
      disaster = await prisma.disaster.findFirst({
        include: { camps: true },
      });
    }

    res.json(disaster);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Switch active disaster location (Open to users so anyone can pick where the disaster is happening!)
router.post('/switch-active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { disasterId } = req.body;
    if (!disasterId) {
      return res.status(400).json({ error: 'disasterId is required' });
    }

    // Deactivate all
    await prisma.disaster.updateMany({ data: { isActive: false } });

    // Activate selected
    const updated = await prisma.disaster.update({
      where: { id: disasterId },
      data: { isActive: true },
      include: { camps: true },
    });

    await AuditService.log({
      userId: req.user?.id || null,
      action: 'DISASTER_LOCATION_CHANGED',
      entityType: 'Disaster',
      entityId: disasterId,
      details: `Active disaster location switched to ${updated.name} (${updated.location}) [Lat: ${updated.latitude}, Lng: ${updated.longitude}]`,
    });

    NotificationService.emit('disaster:switched', updated);

    res.json({
      message: `Active disaster location changed to ${updated.name}`,
      disaster: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create / Set Custom Disaster Location (e.g. from map click or user's town)
router.post('/custom-location', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      location,
      state,
      latitude,
      longitude,
      alertLevel = 'RED_ALERT',
    } = req.body;

    if (!name || !location || latitude == null || longitude == null) {
      return res.status(400).json({
        error: 'name, location, latitude, and longitude are required',
      });
    }

    // Deactivate others
    await prisma.disaster.updateMany({ data: { isActive: false } });

    // Create new disaster
    const disaster = await prisma.disaster.create({
      data: {
        name,
        description: description || `Emergency response operations in ${location}`,
        location,
        state: state || 'Disaster Sector',
        latitude: Number(latitude),
        longitude: Number(longitude),
        alertLevel,
        isActive: true,
      },
    });

    // Create a base relief camp at this location so volunteers have a shelter ready
    await prisma.camp.create({
      data: {
        disasterId: disaster.id,
        name: `${name} Central Relief Camp`,
        location: `${location} Headquarters`,
        latitude: Number(latitude) + 0.005,
        longitude: Number(longitude) + 0.005,
        capacity: 400,
        currentOccupancy: 120,
        status: 'OPEN',
        contactPerson: 'Disaster Control Officer',
        contactPhone: '+91 94441 99000',
        needs: 'Drinking water, Dry rations, Tarpaulins, First Aid kits',
      },
    });

    const populated = await prisma.disaster.findUnique({
      where: { id: disaster.id },
      include: { camps: true },
    });

    NotificationService.emit('disaster:switched', populated);

    res.status(201).json({
      message: `New disaster location registered: ${name}`,
      disaster: populated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Match Nearest Disaster & Camps from user's live GPS coordinates
router.post('/nearest-gps', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'User latitude and longitude are required' });
    }

    const disasters = await prisma.disaster.findMany({
      include: { camps: true },
    });

    const userLat = Number(latitude);
    const userLng = Number(longitude);

    const withDistances = disasters.map(d => {
      const distanceToEpicenter = calculateDistanceKm(userLat, userLng, d.latitude, d.longitude);
      const campsWithDistance = d.camps.map(c => ({
        ...c,
        distanceKm: calculateDistanceKm(userLat, userLng, c.latitude, c.longitude),
      }));

      campsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        ...d,
        distanceToEpicenterKm: distanceToEpicenter,
        camps: campsWithDistance,
        nearestCamp: campsWithDistance[0] || null,
      };
    });

    withDistances.sort((a, b) => a.distanceToEpicenterKm - b.distanceToEpicenterKm);

    res.json({
      userCoordinates: { latitude: userLat, longitude: userLng },
      nearestDisaster: withDistances[0] || null,
      allDisastersRanked: withDistances,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
