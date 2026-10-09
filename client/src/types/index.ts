export type Role = 'PUBLIC' | 'VOLUNTEER' | 'COORDINATOR' | 'ADMIN';

export type PriorityFlag = 'NONE' | 'CHILD_ALONE' | 'ELDERLY' | 'CRITICAL_MEDICAL';

export type ReportStatus = 'REPORTED' | 'SIGHTED' | 'LOCATED_AT_CAMP' | 'VERIFIED_SAFE';

export type LeadStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MatchPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export type CampStatus = 'OPEN' | 'NEAR_CAPACITY' | 'FULL' | 'EVACUATING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  campId?: string | null;
  campName?: string | null;
}

export interface Disaster {
  id: string;
  name: string;
  description: string;
  location: string;
  state?: string | null;
  latitude: number;
  longitude: number;
  alertLevel?: string;
  isActive: boolean;
  createdAt: string;
  camps?: Camp[];
  distanceToEpicenterKm?: number;
  _count?: {
    camps: number;
    missingReports: number;
    shelterEntries: number;
    leads: number;
  };
}

export interface Camp {
  id: string;
  disasterId: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  status: CampStatus;
  contactPerson: string;
  contactPhone: string;
  needs: string;
}

export interface Person {
  id: string;
  fullName: string;
  approxAge?: number | null;
  gender: string;
  physicalDesc?: string | null;
  medicalNeeds?: string | null;
  priorityFlag: PriorityFlag;
  familyGroupId?: string | null;
}

export interface StatusTimelineEvent {
  id: string;
  status: ReportStatus;
  source: string;
  location: string;
  notes: string;
  verifiedByCamp?: string | null;
  timestamp: string;
}

export interface SearchResult {
  id: string;
  reportCode: string;
  fullName: string;
  approxAge?: number | null;
  gender: string;
  physicalDesc?: string | null;
  priorityFlag: PriorityFlag;
  lastSeenLocation: string;
  reporterName: string;
  reporterPhoneMasked: string;
  status: ReportStatus;
  verificationBadge?: {
    verified: boolean;
    campName: string;
    campLocation: string;
    verifiedDate?: string | null;
  } | null;
  rumorControlNotice?: {
    hasPotentialLead: boolean;
    message: string;
  } | null;
  timeline: StatusTimelineEvent[];
  familyGroup?: {
    token: string;
    contactName: string;
    contactPhoneMasked: string;
  } | null;
  createdAt: string;
}

export interface Lead {
  id: string;
  disasterId: string;
  confidenceScore: number;
  matchReason: string;
  explanation: string;
  isFallback: boolean;
  status: LeadStatus;
  priority: MatchPriority;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  retractedAt?: string | null;
  retractionReason?: string | null;
  missingReport: {
    id: string;
    reportCode: string;
    reporterName: string;
    reporterPhone: string;
    reporterRelationship: string;
    lastSeenLocation: string;
    person: Person & {
      familyGroup?: { token: string } | null;
    };
  };
  shelterEntry?: {
    id: string;
    entryCode: string;
    arrivalDate: string;
    groupNotes?: string | null;
    camp: Camp;
    person: Person & {
      familyGroup?: { token: string } | null;
    };
  } | null;
  sighting?: {
    id: string;
    sightingCode: string;
    sightedName?: string | null;
    approxAge?: number | null;
    gender: string;
    sightingLocation: string;
    directionHeading?: string | null;
    witnessName: string;
    witnessPhone: string;
    notes?: string | null;
  } | null;
}

export interface DashboardStats {
  impact: {
    totalReported: number;
    totalShelterEntries: number;
    verifiedSafeCount: number;
    pendingLeadsCount: number;
    avgReunionHours: number;
    reunificationRate: number;
    priorityAlerts: {
      childrenAlone: number;
      elderlyAndMedical: number;
    };
  };
  camps: Camp[];
  recentVerifiedReunions: {
    id: string;
    personName: string;
    campName: string;
    verifiedAt: string;
  }[];
  recentAuditLogs: {
    id: string;
    action: string;
    entityType: string;
    details: string;
    createdAt: string;
    user?: { name: string; role: string } | null;
  }[];
}

export interface SimulatedSMS {
  id: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  timestamp: string;
  status: 'DELIVERED' | 'SENT';
  type: 'SMS' | 'WHATSAPP';
}

// DLE Mesh & Offline Routing Types
export interface DLEMeshNode {
  id: string;
  name: string;
  role: 'SURVIVOR_TERMINAL' | 'RELAY_ROUTER' | 'SHELTER_GATEWAY';
  latitude: number;
  longitude: number;
  rssi: number;
  distanceMeters: number;
  hops: number;
  batteryLevel: number;
  lastSeen: string;
  status: 'ONLINE' | 'RELAYING' | 'DISCONNECTED';
}

export interface DLEMeshPacket {
  id: string;
  type: 'SOS_BEACON' | 'SAFE_CHECKIN' | 'MISSING_PING' | 'SHELTER_ROSTER';
  senderId: string;
  senderName: string;
  targetCampId?: string;
  payload: any;
  timestamp: string;
  ttl: number;
  status: 'QUEUED' | 'IN_TRANSIT' | 'DELIVERED';
  hopTrace: {
    nodeId: string;
    nodeName: string;
    timestamp: string;
    signalDbm: number;
  }[];
}

export interface OfflineWaypoint {
  index: number;
  title: string;
  instruction: string;
  latitude: number;
  longitude: number;
  distanceFromPrevMeters: number;
  bearingDegrees: number;
  bearingCardinal: string;
  elevationMeters: number;
  isHazardAvoidance: boolean;
  safetyNote?: string;
}

export interface OfflineTraceableRoute {
  origin: {
    latitude: number;
    longitude: number;
    name: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    campName: string;
    campId: string;
  };
  totalDistanceKm: number;
  estimatedMinutes: number;
  coordinates: [number, number][];
  waypoints: OfflineWaypoint[];
  hazardAvoidanceNotice: string;
  generatedOfflineAt: string;
}

export interface BreadcrumbPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  note?: string;
  accuracyMeters?: number;
}

// National CAP Alert & Seismic Feed Types
export interface CapAlert {
  id: string;
  hazardType: 'THUNDERSTORM' | 'CYCLONE' | 'FLOOD' | 'LANDSLIDE' | 'HEAVY_RAIN' | 'GALE_WINDS' | 'HEATWAVE';
  severity: 'RED_ALERT' | 'ORANGE_ALERT' | 'YELLOW_ALERT';
  headline: string;
  description: string;
  locationName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  issuedAt: string;
  expiresAt: string;
  source: string;
  instruction: string;
}

export interface EarthquakeRecord {
  id: string;
  magnitude: number;
  locationName: string;
  state: string;
  latitude: number;
  longitude: number;
  depthKm: number;
  timestamp: string;
  colorCode: string;
}

export interface WeatherOverviewData {
  locationName?: string;
  latitude?: number;
  longitude?: number;
  current: {
    tempCelsius: number;
    condition: string;
    humidityPercent: number;
    windKmph: number;
    windDirection: string;
    uvIndex: number;
    airQuality: string;
  };
  hourly: {
    time: string;
    tempCelsius: number;
    condition: string;
    rainChance: number;
  }[];
  daily: {
    today: { high: number; low: number; summary: string };
    tomorrow: { high: number; low: number; summary: string };
    day3: { high: number; low: number; summary: string };
  };
  audioPodcastScript?: string;
}

