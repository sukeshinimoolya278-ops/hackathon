import {
  User,
  Disaster,
  Camp,
  Lead,
  DashboardStats,
  SearchResult,
  SimulatedSMS,
  CapAlert,
  EarthquakeRecord,
  WeatherOverviewData,
} from '../types';

const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('reunitepath_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('reunitepath_token', token);
  } else {
    localStorage.removeItem('reunitepath_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: any) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => request<User>('/auth/me'),

  demoSwitch: (role: string) =>
    request<{ token: string; user: User }>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Disasters
  getDisasters: () => request<Disaster[]>('/disasters'),
  getActiveDisaster: () => request<Disaster>('/disasters/active'),
  switchActiveDisaster: (disasterId: string) =>
    request<{ message: string; disaster: Disaster }>('/disasters/switch-active', {
      method: 'POST',
      body: JSON.stringify({ disasterId }),
    }),
  createCustomDisaster: (payload: {
    name: string;
    description?: string;
    location: string;
    state?: string;
    latitude: number;
    longitude: number;
    alertLevel?: string;
  }) =>
    request<{ message: string; disaster: Disaster }>('/disasters/custom-location', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getNearestDisasterByGps: (latitude: number, longitude: number) =>
    request<{
      userCoordinates: { latitude: number; longitude: number };
      nearestDisaster: Disaster;
      allDisastersRanked: Disaster[];
    }>('/disasters/nearest-gps', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    }),

  // Camps
  getCamps: (disasterId?: string) =>
    request<Camp[]>(`/camps${disasterId ? `?disasterId=${disasterId}` : ''}`),
  getCamp: (id: string) => request<Camp & { shelterEntries: any[] }>(`/camps/${id}`),
  updateCamp: (id: string, payload: Partial<Camp>) =>
    request<Camp>(`/camps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Reports
  createMissingReport: (payload: any) =>
    request<{ success: boolean; reportCode: string; familyToken: string; report: any }>('/reports/missing', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createSighting: (payload: any) =>
    request<{ success: boolean; sightingCode: string; sighting: any }>('/reports/sighting', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Volunteer Camp Intake
  createIntake: (payload: any) =>
    request<{ success: boolean; entryCode: string; shelterEntry: any }>('/intake', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  syncOfflineBatch: (entries: any[]) =>
    request<{ success: boolean; syncedCount: number; synced: any[] }>('/intake/batch-sync', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),

  // Search
  search: (query: string, disasterId?: string) =>
    request<{ query: string; count: number; results: SearchResult[] }>(
      `/search?q=${encodeURIComponent(query)}${disasterId ? `&disasterId=${disasterId}` : ''}`
    ),

  // Leads
  getLeads: (status = 'PENDING', disasterId?: string) =>
    request<Lead[]>(`/leads?status=${status}${disasterId ? `&disasterId=${disasterId}` : ''}`),

  approveLead: (id: string, notes?: string) =>
    request<{ success: boolean; message: string; lead: Lead }>(`/leads/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  rejectLead: (id: string, notes?: string) =>
    request<{ success: boolean; lead: Lead }>(`/leads/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  retractLead: (id: string, retractionReason: string) =>
    request<{ success: boolean; message: string; lead: Lead }>(`/leads/${id}/retract`, {
      method: 'POST',
      body: JSON.stringify({ retractionReason }),
    }),

  detectDuplicates: () =>
    request<any[]>('/leads/duplicates/detect'),

  // "I am Safe" Check-In
  safeCheckIn: (payload: { fullName: string; phone: string; currentLocation?: string; message?: string; disasterId?: string }) =>
    request<{ success: boolean; checkIn: any; notifiedFamiliesCount: number; notifiedFamilies: any[] }>('/safe-checkin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin Dashboard
  getDashboardStats: (disasterId?: string) =>
    request<DashboardStats>(`/dashboard/stats${disasterId ? `?disasterId=${disasterId}` : ''}`),

  // QR Token Lookup
  getFamilyByToken: (token: string) =>
    request<any>(`/qr/lookup/${token}`),

  // SMS Simulation
  getSimulatedSMS: () =>
    request<{ messages: SimulatedSMS[] }>('/simulation/sms'),

  sendInboundSMS: (fromNumber: string, text: string, channel: 'SMS' | 'WHATSAPP' = 'SMS') =>
    request<{ inbound: any; reply: SimulatedSMS }>('/simulation/sms/inbound', {
      method: 'POST',
      body: JSON.stringify({ fromNumber, text, channel }),
    }),

  // National CAP Disaster Alerts & Seismic Monitor
  getCapAlerts: (params?: { state?: string; severity?: string; hazardType?: string }) => {
    const q = new URLSearchParams();
    if (params?.state) q.set('state', params.state);
    if (params?.severity) q.set('severity', params.severity);
    if (params?.hazardType) q.set('hazardType', params.hazardType);
    const qs = q.toString();
    return request<{ portal: string; totalActiveAlerts: number; alerts: CapAlert[]; updatedAt: string }>(
      `/alerts${qs ? `?${qs}` : ''}`
    );
  },

  getEarthquakes: () =>
    request<{ total: number; earthquakes: EarthquakeRecord[]; lastUpdate: string }>('/alerts/earthquakes'),

  getWeatherOverview: (lat?: number, lng?: number, locationName?: string) => {
    const q = new URLSearchParams();
    if (lat !== undefined && lng !== undefined) {
      q.set('lat', String(lat));
      q.set('lng', String(lng));
    }
    if (locationName) {
      q.set('locationName', locationName);
    }
    const qs = q.toString();
    return request<WeatherOverviewData>(`/alerts/weather${qs ? `?${qs}` : ''}`);
  },
};

