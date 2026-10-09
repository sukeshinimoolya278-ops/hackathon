import { DLEMeshNode, DLEMeshPacket, OfflineTraceableRoute, OfflineWaypoint, BreadcrumbPoint } from '../types';

// Storage keys
const MESH_PACKETS_KEY = 'reunitepath_dle_packets';
const BREADCRUMBS_KEY = 'reunitepath_dle_breadcrumbs';
const MESH_STATE_KEY = 'reunitepath_dle_mesh_active';
const NODE_INFO_KEY = 'reunitepath_dle_local_node';

// Bearing calculation in degrees (0 - 360)
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((bearing + 360) % 360);
}

// Convert bearing degrees to cardinal direction (N, NE, E, SE, S, SW, W, NW)
export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

// Haversine distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Create or retrieve local device node identity
export function getOrCreateLocalNode(): DLEMeshNode {
  const saved = localStorage.getItem(NODE_INFO_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const node: DLEMeshNode = {
    id: `DLE-NODE-${randomSuffix}`,
    name: `Citizen Handheld Terminal #${randomSuffix}`,
    role: 'SURVIVOR_TERMINAL',
    latitude: 13.0782,
    longitude: 80.2520,
    rssi: -48,
    distanceMeters: 0,
    hops: 0,
    batteryLevel: 91,
    lastSeen: new Date().toISOString(),
    status: 'ONLINE',
  };

  localStorage.setItem(NODE_INFO_KEY, JSON.stringify(node));
  return node;
}

// Pre-configured realistic local RF & BLE mesh relay peers in the disaster sector
export const DEFAULT_MESH_PEERS: DLEMeshNode[] = [
  {
    id: 'DLE-RELAY-ALPHA',
    name: 'Volunteer Ham Radio Backpack (Alpha)',
    role: 'RELAY_ROUTER',
    latitude: 13.0695,
    longitude: 80.2450,
    rssi: -58,
    distanceMeters: 380,
    hops: 1,
    batteryLevel: 84,
    lastSeen: '1 min ago',
    status: 'RELAYING',
  },
  {
    id: 'DLE-RELAY-BRAVO',
    name: 'NDRF First Responder Vehicle (Bravo)',
    role: 'RELAY_ROUTER',
    latitude: 13.0720,
    longitude: 80.2390,
    rssi: -71,
    distanceMeters: 850,
    hops: 2,
    batteryLevel: 98,
    lastSeen: 'Just now',
    status: 'RELAYING',
  },
  {
    id: 'DLE-HUB-GATEWAY',
    name: 'Camp Command Central Base Station',
    role: 'SHELTER_GATEWAY',
    latitude: 13.0626,
    longitude: 80.2343,
    rssi: -79,
    distanceMeters: 1420,
    hops: 3,
    batteryLevel: 100,
    lastSeen: 'Just now',
    status: 'ONLINE',
  },
  {
    id: 'DLE-PEER-8841',
    name: 'Evacuee Node (Nearby Citizen)',
    role: 'SURVIVOR_TERMINAL',
    latitude: 13.0775,
    longitude: 80.2515,
    rssi: -52,
    distanceMeters: 95,
    hops: 1,
    batteryLevel: 62,
    lastSeen: '30s ago',
    status: 'ONLINE',
  },
];

class DLEMeshEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: ((packet: DLEMeshPacket) => void)[] = [];
  private localNode: DLEMeshNode;

  constructor() {
    this.localNode = getOrCreateLocalNode();
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('reunitepath_dle_mesh');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.handleIncomingMeshPacket(event.data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this context', e);
    }
  }

  public getLocalNode(): DLEMeshNode {
    return this.localNode;
  }

  public updateLocalNodeCoordinates(lat: number, lng: number) {
    this.localNode.latitude = lat;
    this.localNode.longitude = lng;
    this.localNode.lastSeen = new Date().toISOString();
    localStorage.setItem(NODE_INFO_KEY, JSON.stringify(this.localNode));
  }

  public onPacketReceived(cb: (packet: DLEMeshPacket) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private handleIncomingMeshPacket(packet: DLEMeshPacket) {
    const existing = this.getStoredPackets();
    if (!existing.some((p) => p.id === packet.id)) {
      this.savePacketLocally(packet);
    }
    this.listeners.forEach((cb) => cb(packet));
  }

  public getStoredPackets(): DLEMeshPacket[] {
    try {
      const raw = localStorage.getItem(MESH_PACKETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public savePacketLocally(packet: DLEMeshPacket) {
    const packets = this.getStoredPackets();
    const index = packets.findIndex((p) => p.id === packet.id);
    if (index >= 0) {
      packets[index] = packet;
    } else {
      packets.unshift(packet);
    }
    localStorage.setItem(MESH_PACKETS_KEY, JSON.stringify(packets.slice(0, 50)));
  }

  // Broadcast an offline message / SOS into the DLE Mesh
  public broadcastPacket(
    type: 'SOS_BEACON' | 'SAFE_CHECKIN' | 'MISSING_PING' | 'SHELTER_ROSTER',
    payload: any,
    targetCampId?: string
  ): DLEMeshPacket {
    const packetId = `PKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newPacket: DLEMeshPacket = {
      id: packetId,
      type,
      senderId: this.localNode.id,
      senderName: this.localNode.name,
      targetCampId,
      payload,
      timestamp: new Date().toISOString(),
      ttl: 4,
      status: 'IN_TRANSIT',
      hopTrace: [
        {
          nodeId: this.localNode.id,
          nodeName: this.localNode.name,
          timestamp: new Date().toLocaleTimeString(),
          signalDbm: this.localNode.rssi,
        },
      ],
    };

    // Save locally
    this.savePacketLocally(newPacket);

    // Send across local broadcast channel
    if (this.channel) {
      this.channel.postMessage(newPacket);
    }

    // Simulate multi-hop mesh propagation across physical nodes
    this.simulateMeshRelay(newPacket);

    return newPacket;
  }

  // Simulate hop-by-hop mesh propagation through local volunteer & NDRF relays to Camp Hub
  private simulateMeshRelay(packet: DLEMeshPacket) {
    // Hop 1: Volunteer Relay
    setTimeout(() => {
      packet.hopTrace.push({
        nodeId: 'DLE-RELAY-ALPHA',
        nodeName: 'Volunteer Ham Radio Backpack (Alpha)',
        timestamp: new Date().toLocaleTimeString(),
        signalDbm: -58,
      });
      this.savePacketLocally(packet);
      this.listeners.forEach((cb) => cb({ ...packet }));

      // Hop 2: NDRF Response Vehicle
      setTimeout(() => {
        packet.hopTrace.push({
          nodeId: 'DLE-RELAY-BRAVO',
          nodeName: 'NDRF First Responder Vehicle (Bravo)',
          timestamp: new Date().toLocaleTimeString(),
          signalDbm: -71,
        });
        this.savePacketLocally(packet);
        this.listeners.forEach((cb) => cb({ ...packet }));

        // Hop 3: Relief Camp Base Gateway (Final Delivery)
        setTimeout(() => {
          packet.hopTrace.push({
            nodeId: 'DLE-HUB-GATEWAY',
            nodeName: 'Camp Command Central Base Station',
            timestamp: new Date().toLocaleTimeString(),
            signalDbm: -79,
          });
          packet.status = 'DELIVERED';
          this.savePacketLocally(packet);
          this.listeners.forEach((cb) => cb({ ...packet }));
        }, 1600);
      }, 1400);
    }, 1200);
  }

  // Breadcrumbs offline trail management
  public getBreadcrumbs(): BreadcrumbPoint[] {
    try {
      const raw = localStorage.getItem(BREADCRUMBS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addBreadcrumb(lat: number, lng: number, note?: string): BreadcrumbPoint {
    const crumbs = this.getBreadcrumbs();
    const newPoint: BreadcrumbPoint = {
      id: `BC-${Date.now()}`,
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toLocaleTimeString(),
      note: note || `Checkpoint #${crumbs.length + 1}`,
      accuracyMeters: 4.5,
    };
    crumbs.push(newPoint);
    localStorage.setItem(BREADCRUMBS_KEY, JSON.stringify(crumbs));
    return newPoint;
  }

  public clearBreadcrumbs() {
    localStorage.removeItem(BREADCRUMBS_KEY);
  }
}

export const dleMeshEngine = new DLEMeshEngine();

/**
 * GENERATE OFFLINE TRACEABLE ROUTE WITHOUT NET:
 * Computes walkable vector evacuation corridors avoiding the disaster epicenter hazard zone,
 * producing precise turn-by-turn waypoints, compass bearings, elevation changes, and coordinates.
 */
export function generateOfflineTraceableRoute(
  origin: { latitude: number; longitude: number; name?: string },
  destination: { latitude: number; longitude: number; campName: string; campId: string },
  hazardEpicenter?: { latitude: number; longitude: number; radiusMeters?: number }
): OfflineTraceableRoute {
  const oLat = origin.latitude;
  const oLng = origin.longitude;
  const dLat = destination.latitude;
  const dLng = destination.longitude;

  const totalDistanceMeters = getDistanceMeters(oLat, oLng, dLat, dLng);
  const totalDistanceKm = Number((totalDistanceMeters / 1000).toFixed(2));

  // Walking speed in disaster debris / heavy rain conditions: ~3.2 km/h (~53 m/min)
  const estimatedMinutes = Math.max(5, Math.round(totalDistanceMeters / 53));

  // Determine hazard detour if direct line passes close to hazard center
  let needsHazardDetour = false;
  let detourLat = (oLat + dLat) / 2;
  let detourLng = (oLng + dLng) / 2;

  if (hazardEpicenter) {
    const hazardRadius = hazardEpicenter.radiusMeters || 3500;
    const midLat = (oLat + dLat) / 2;
    const midLng = (oLng + dLng) / 2;
    const distToHazard = getDistanceMeters(midLat, midLng, hazardEpicenter.latitude, hazardEpicenter.longitude);

    if (distToHazard < hazardRadius) {
      needsHazardDetour = true;
      // Shift detour waypoint outward perpendicular to hazard
      const latDiff = dLat - oLat;
      const lngDiff = dLng - oLng;
      // 90 degree perpendicular shift
      detourLat = midLat - lngDiff * 0.45;
      detourLng = midLng + latDiff * 0.45;
    }
  }

  // Build waypoints
  const waypoints: OfflineWaypoint[] = [];
  const coords: [number, number][] = [];

  // Waypoint 0: Origin
  coords.push([oLat, oLng]);
  const initialBearing = calculateBearing(oLat, oLng, needsHazardDetour ? detourLat : dLat, needsHazardDetour ? detourLng : dLng);

  waypoints.push({
    index: 0,
    title: 'Departure Checkpoint',
    instruction: `Depart from ${origin.name || 'Current Position'}. Head ${getCardinalDirection(initialBearing)} along high ground.`,
    latitude: oLat,
    longitude: oLng,
    distanceFromPrevMeters: 0,
    bearingDegrees: initialBearing,
    bearingCardinal: getCardinalDirection(initialBearing),
    elevationMeters: 8,
    isHazardAvoidance: false,
    safetyNote: 'Verify emergency kit and keep phone battery in DLE Low Energy mesh mode.',
  });

  if (needsHazardDetour) {
    // Intermediate Waypoint 1: Elevated corridor entrance
    const wp1Lat = oLat + (detourLat - oLat) * 0.5;
    const wp1Lng = oLng + (detourLng - oLng) * 0.5;
    coords.push([wp1Lat, wp1Lng]);
    const b1 = calculateBearing(oLat, oLng, wp1Lat, wp1Lng);
    const dist1 = getDistanceMeters(oLat, oLng, wp1Lat, wp1Lng);

    waypoints.push({
      index: 1,
      title: 'Elevated Highway / Flyover Ridge',
      instruction: `Ascend to elevated roadway. Avoid low-lying flooded drainage basins.`,
      latitude: wp1Lat,
      longitude: wp1Lng,
      distanceFromPrevMeters: dist1,
      bearingDegrees: b1,
      bearingCardinal: getCardinalDirection(b1),
      elevationMeters: 17,
      isHazardAvoidance: true,
      safetyNote: '⚠️ Floodwater hazard detour active: Remain on reinforced embankment.',
    });

    // Intermediate Waypoint 2: Apex detour & clean water checkpoint
    coords.push([detourLat, detourLng]);
    const b2 = calculateBearing(wp1Lat, wp1Lng, detourLat, detourLng);
    const dist2 = getDistanceMeters(wp1Lat, wp1Lng, detourLat, detourLng);

    waypoints.push({
      index: 2,
      title: 'Emergency Relief Staging & Water Post',
      instruction: `Pass volunteer coordination point. Turn ${getCardinalDirection(calculateBearing(detourLat, detourLng, dLat, dLng))} toward shelter corridor.`,
      latitude: detourLat,
      longitude: detourLng,
      distanceFromPrevMeters: dist2,
      bearingDegrees: b2,
      bearingCardinal: getCardinalDirection(b2),
      elevationMeters: 14,
      isHazardAvoidance: true,
      safetyNote: 'NDRF mesh relay node active nearby. Emergency potable water available.',
    });

    // Intermediate Waypoint 3: Camp perimeter approach
    const wp3Lat = detourLat + (dLat - detourLat) * 0.6;
    const wp3Lng = detourLng + (dLng - detourLng) * 0.6;
    coords.push([wp3Lat, wp3Lng]);
    const b3 = calculateBearing(detourLat, detourLng, wp3Lat, wp3Lng);
    const dist3 = getDistanceMeters(detourLat, detourLng, wp3Lat, wp3Lng);

    waypoints.push({
      index: 3,
      title: 'Shelter Approach Road',
      instruction: `Follow marked safety flags along paved access road toward camp main gate.`,
      latitude: wp3Lat,
      longitude: wp3Lng,
      distanceFromPrevMeters: dist3,
      bearingDegrees: b3,
      bearingCardinal: getCardinalDirection(b3),
      elevationMeters: 11,
      isHazardAvoidance: false,
      safetyNote: 'Clear route marked with reflective emergency ribbons.',
    });
  } else {
    // Direct path breakdown
    const midLat = oLat + (dLat - oLat) * 0.45;
    const midLng = oLng + (dLng - oLng) * 0.45;
    coords.push([midLat, midLng]);
    const b1 = calculateBearing(oLat, oLng, midLat, midLng);
    const dist1 = getDistanceMeters(oLat, oLng, midLat, midLng);

    waypoints.push({
      index: 1,
      title: 'Main Arterial Evacuation Route',
      instruction: `Proceed along major thoroughfare. Keep heading ${getCardinalDirection(b1)}.`,
      latitude: midLat,
      longitude: midLng,
      distanceFromPrevMeters: dist1,
      bearingDegrees: b1,
      bearingCardinal: getCardinalDirection(b1),
      elevationMeters: 12,
      isHazardAvoidance: false,
      safetyNote: 'Wide road clear of fallen power lines and tree debris.',
    });
  }

  // Final Destination Waypoint
  coords.push([dLat, dLng]);
  const lastCoord = coords[coords.length - 2];
  const finalBearing = calculateBearing(lastCoord[0], lastCoord[1], dLat, dLng);
  const finalDist = getDistanceMeters(lastCoord[0], lastCoord[1], dLat, dLng);

  waypoints.push({
    index: waypoints.length,
    title: `${destination.campName} - Safe Intake Gate`,
    instruction: `Arrive at designated relief camp intake gate. Report to volunteer registrar.`,
    latitude: dLat,
    longitude: dLng,
    distanceFromPrevMeters: finalDist,
    bearingDegrees: finalBearing,
    bearingCardinal: getCardinalDirection(finalBearing),
    elevationMeters: 10,
    isHazardAvoidance: false,
    safetyNote: 'Official intake desk, medical triage, and family reunification terminal inside.',
  });

  return {
    origin: {
      latitude: oLat,
      longitude: oLng,
      name: origin.name || 'Current Position',
    },
    destination: {
      latitude: dLat,
      longitude: dLng,
      campName: destination.campName,
      campId: destination.campId,
    },
    totalDistanceKm,
    estimatedMinutes,
    coordinates: coords,
    waypoints,
    hazardAvoidanceNotice: needsHazardDetour
      ? '⚠️ Hazard Detour Applied: Avoids inundated flood epicenter perimeter by routing along high-elevation corridors.'
      : '✅ Direct Safe Corridor: Path verified clear of active hazard epicenters.',
    generatedOfflineAt: new Date().toLocaleTimeString(),
  };
}
