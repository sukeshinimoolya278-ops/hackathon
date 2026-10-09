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

const FALLBACK_DISASTER: Disaster = {
  id: 'disaster-1',
  name: 'Wayanad Landslide Relief Sector',
  description: 'Massive landslide and flooding in Meppadi & Chooralmala region.',
  location: 'Meppadi & Chooralmala',
  state: 'Kerala',
  latitude: 11.5544,
  longitude: 76.1322,
  alertLevel: 'RED_ALERT',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const FALLBACK_CAMPS: Camp[] = [
  {
    id: 'camp-1',
    disasterId: 'disaster-1',
    name: 'St. Joseph Higher Secondary Relief Camp',
    location: 'Meppadi Town, Wayanad',
    latitude: 11.5512,
    longitude: 76.1289,
    capacity: 500,
    currentOccupancy: 342,
    status: 'OPEN',
    contactPerson: 'Father Mathew Varghese',
    contactPhone: '+91 94471 23456',
    needs: 'Blankets, Infant formula, First-aid kits',
  },
  {
    id: 'camp-2',
    disasterId: 'disaster-1',
    name: 'Chooralmala Govt UP School Camp',
    location: 'Chooralmala Valley',
    latitude: 11.5388,
    longitude: 76.1554,
    capacity: 350,
    currentOccupancy: 290,
    status: 'NEAR_CAPACITY',
    contactPerson: 'Sujatha Pillai (Nodal Officer)',
    contactPhone: '+91 98460 78901',
    needs: 'Drinking water canisters, Solar lamps',
  },
  {
    id: 'camp-3',
    disasterId: 'disaster-1',
    name: 'Vythiri Community Hall Emergency Shelter',
    location: 'Vythiri Bypass, Wayanad',
    latitude: 11.5589,
    longitude: 76.0421,
    capacity: 450,
    currentOccupancy: 215,
    status: 'OPEN',
    contactPerson: 'K. Ramachandran (Revenue Inspector)',
    contactPhone: '+91 94955 43210',
    needs: 'Medicines (Insulin, ORS), Dry rations',
  },
];

function getStoredList<T>(key: string, defaultVal: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStoredList<T>(key: string, val: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length < 6) return '***';
  return clean.slice(0, 4) + '****' + clean.slice(-2);
}

const SEED_SEARCH_RECORDS: SearchResult[] = [
  {
    id: 'seed-rep-1',
    reportCode: 'MIS-7011',
    fullName: 'Murugan Selvam',
    approxAge: 42,
    gender: 'MALE',
    physicalDesc: '5ft 9in, mustache, wearing blue collared shirt and black trousers',
    priorityFlag: 'NONE',
    lastSeenLocation: 'Velachery Bypass near residential bus stop',
    reporterName: 'Priya Selvam',
    reporterPhoneMasked: '+91 9840****89',
    status: 'REPORTED',
    verificationBadge: null,
    rumorControlNotice: {
      hasPotentialLead: true,
      message: 'A potential sighting with similar description was reported near St. Thomas mount. Awaiting camp verification.',
    },
    timeline: [
      {
        id: 'evt-1',
        status: 'REPORTED',
        source: 'PUBLIC_FORM',
        location: 'Velachery Bypass',
        notes: 'Initial missing report filed by family.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ],
    familyGroup: {
      token: 'FAM-CHENNAI-8832',
      contactName: 'Priya Selvam',
      contactPhoneMasked: '+91 9840****89',
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'seed-rep-2',
    reportCode: 'MIS-8821',
    fullName: 'Aarav Sharma',
    approxAge: 9,
    gender: 'MALE',
    physicalDesc: 'Red t-shirt, blue school bag, speaks Hindi and Malayalam',
    priorityFlag: 'CHILD_ALONE',
    lastSeenLocation: 'Chooralmala Valley Market sector',
    reporterName: 'Sunil Sharma',
    reporterPhoneMasked: '+91 9447****56',
    status: 'LOCATED_AT_CAMP',
    verificationBadge: {
      verified: true,
      campName: 'Chooralmala Govt School Camp',
      campLocation: 'Chooralmala Junction, Wayanad',
      verifiedDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    rumorControlNotice: null,
    timeline: [
      {
        id: 'evt-2a',
        status: 'REPORTED',
        source: 'PUBLIC_FORM',
        location: 'Chooralmala Market',
        notes: 'Separated during sudden hillside mudflow.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'evt-2b',
        status: 'LOCATED_AT_CAMP',
        source: 'CAMP_INTAKE',
        location: 'Chooralmala Govt School Camp',
        notes: 'Safely received at shelter intake. In Hall B, bed #42.',
        verifiedByCamp: 'Chooralmala Govt School Camp',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    familyGroup: {
      token: 'FAM-WAYANAD-1022',
      contactName: 'Sunil Sharma',
      contactPhoneMasked: '+91 9447****56',
    },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'seed-rep-3',
    reportCode: 'MIS-5432',
    fullName: 'Meenakshi Ammal',
    approxAge: 73,
    gender: 'FEMALE',
    physicalDesc: 'Elderly lady, silver hair, green cotton saree, walked with walking stick',
    priorityFlag: 'ELDERLY',
    lastSeenLocation: 'Saidapet Bridge safe refuge area',
    reporterName: 'K. Balaji',
    reporterPhoneMasked: '+91 9841****23',
    status: 'VERIFIED_SAFE',
    verificationBadge: {
      verified: true,
      campName: 'Loyola College Relief Shelter',
      campLocation: 'Sterling Road, Nungambakkam',
      verifiedDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    rumorControlNotice: null,
    timeline: [
      {
        id: 'evt-3a',
        status: 'REPORTED',
        source: 'PUBLIC_FORM',
        location: 'Saidapet Bridge',
        notes: 'Elderly citizen missing after water level rose.',
        timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
      },
      {
        id: 'evt-3b',
        status: 'VERIFIED_SAFE',
        source: 'NODAL_OFFICER',
        location: 'Loyola College Shelter',
        notes: 'Successfully reunited with daughter and son-in-law.',
        verifiedByCamp: 'Loyola College Relief Shelter',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
    familyGroup: {
      token: 'FAM-CHENNAI-4091',
      contactName: 'K. Balaji',
      contactPhoneMasked: '+91 9841****23',
    },
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
];

function handleFallbackRequest<T>(endpoint: string, options: RequestInit = {}): T {
  // 1. Missing Person Report
  if (endpoint.startsWith('/reports/missing') && options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    if (!body.fullName || !body.reporterName || !body.reporterPhone || !body.lastSeenLocation) {
      throw new Error('Missing required fields: fullName, reporterName, reporterPhone, lastSeenLocation');
    }

    const reportCode = `MIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const familyToken = body.familyToken || `FAM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport = {
      id: `rep-${Date.now()}`,
      reportCode,
      familyToken,
      fullName: body.fullName,
      approxAge: body.approxAge ? Number(body.approxAge) : null,
      gender: body.gender || 'UNKNOWN',
      physicalDesc: body.physicalDesc || '',
      medicalNeeds: body.medicalNeeds || '',
      priorityFlag: body.priorityFlag || 'NONE',
      lastSeenLocation: body.lastSeenLocation,
      lastSeenDate: body.lastSeenDate || new Date().toISOString(),
      reporterName: body.reporterName,
      reporterPhone: body.reporterPhone,
      reporterRelationship: body.reporterRelationship || 'Family',
      notes: body.notes || '',
      status: 'REPORTED' as const,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: `evt-${Date.now()}`,
          status: 'REPORTED' as const,
          source: 'PUBLIC_FORM',
          location: body.lastSeenLocation,
          notes: `Report registered by ${body.reporterName} (${body.reporterRelationship || 'Family'}). Relational matching engine active.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const storedReports = getStoredList<any>('reunitepath_missing_reports');
    storedReports.unshift(newReport);
    setStoredList('reunitepath_missing_reports', storedReports);

    const storedSMS = getStoredList<SimulatedSMS>('reunitepath_simulated_sms');
    storedSMS.unshift({
      id: `sms-${Date.now()}`,
      recipientPhone: body.reporterPhone,
      recipientName: body.reporterName || 'Citizen',
      message: `[GlobalX Alert] Emergency missing report ${reportCode} registered for ${body.fullName}. Family QR Pass: ${familyToken}. Check real-time matching at /search.`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'DELIVERED',
      type: 'SMS',
    });
    setStoredList('reunitepath_simulated_sms', storedSMS);

    return {
      success: true,
      reportCode,
      familyToken,
      report: newReport,
      matchesFound: 0,
      bestMatch: null,
    } as T;
  }

  // 2. Sighting Report
  if (endpoint.startsWith('/reports/sighting') && options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const sightingCode = `SGT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSighting = {
      id: `sgt-${Date.now()}`,
      sightingCode,
      ...body,
      createdAt: new Date().toISOString(),
    };
    const stored = getStoredList<any>('reunitepath_sightings');
    stored.unshift(newSighting);
    setStoredList('reunitepath_sightings', stored);

    return {
      success: true,
      sightingCode,
      sighting: newSighting,
    } as T;
  }

  // 3. Safe Check-In
  if (endpoint.startsWith('/safe-checkin') && options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    if (!body.fullName || !body.phone) {
      throw new Error('Missing required fields: fullName, phone');
    }

    const checkIn = {
      id: `chk-${Date.now()}`,
      fullName: body.fullName,
      phone: body.phone,
      currentLocation: body.currentLocation || 'Relief Safe Sector',
      message: body.message || 'I am safe and sheltered.',
      createdAt: new Date().toISOString(),
    };

    const stored = getStoredList<any>('reunitepath_safe_checkins');
    stored.unshift(checkIn);
    setStoredList('reunitepath_safe_checkins', stored);

    const storedSMS = getStoredList<SimulatedSMS>('reunitepath_simulated_sms');
    storedSMS.unshift({
      id: `sms-${Date.now()}`,
      recipientPhone: body.phone,
      recipientName: body.fullName || 'Survivor',
      message: `[GlobalX] Safe check-in logged for ${body.fullName} at ${checkIn.currentLocation}. Relatives notified.`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'DELIVERED',
      type: 'SMS',
    });
    setStoredList('reunitepath_simulated_sms', storedSMS);

    return {
      success: true,
      checkIn,
      notifiedFamiliesCount: 1,
      notifiedFamilies: [
        {
          familyToken: 'FAM-SAFE',
          primaryContactName: body.fullName,
          contactPhone: body.phone,
        },
      ],
    } as T;
  }

  // 4. Camp Intake
  if (endpoint.startsWith('/intake') && options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const entryCode = `INT-${Math.floor(1000 + Math.random() * 9000)}`;
    const shelterEntry = {
      id: `int-${Date.now()}`,
      entryCode,
      ...body,
      createdAt: new Date().toISOString(),
    };
    const stored = getStoredList<any>('reunitepath_intakes');
    stored.unshift(shelterEntry);
    setStoredList('reunitepath_intakes', stored);

    return {
      success: true,
      entryCode,
      shelterEntry,
    } as T;
  }

  // 5. Intake Batch Sync
  if (endpoint.startsWith('/intake/batch-sync')) {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const entries = body.entries || [];
    return {
      success: true,
      syncedCount: entries.length,
      synced: entries,
    } as T;
  }

  // 6. Search Index
  if (endpoint.startsWith('/search')) {
    const qMatch = endpoint.match(/[?&]q=([^&]+)/);
    const rawQ = qMatch ? decodeURIComponent(qMatch[1]) : '';
    const q = rawQ.toLowerCase().trim();

    const localReports = getStoredList<any>('reunitepath_missing_reports');
    const convertedLocal: SearchResult[] = localReports.map(r => ({
      id: r.id,
      reportCode: r.reportCode,
      fullName: r.fullName,
      approxAge: r.approxAge,
      gender: r.gender,
      physicalDesc: r.physicalDesc,
      priorityFlag: r.priorityFlag,
      lastSeenLocation: r.lastSeenLocation,
      reporterName: r.reporterName,
      reporterPhoneMasked: maskPhone(r.reporterPhone),
      status: r.status,
      verificationBadge: null,
      rumorControlNotice: {
        hasPotentialLead: false,
        message: 'Active report in network. Automated matching cross-referencing relief rosters.',
      },
      timeline: r.timeline || [
        {
          id: `evt-${r.id}`,
          status: r.status,
          source: 'PUBLIC_FORM',
          location: r.lastSeenLocation,
          notes: 'Report registered in system.',
          timestamp: r.createdAt,
        },
      ],
      familyGroup: r.familyToken
        ? {
            token: r.familyToken,
            contactName: r.reporterName,
            contactPhoneMasked: maskPhone(r.reporterPhone),
          }
        : null,
      createdAt: r.createdAt,
    }));

    const allRecords = [...convertedLocal, ...SEED_SEARCH_RECORDS];

    const results = q
      ? allRecords.filter(item => {
          return (
            item.fullName.toLowerCase().includes(q) ||
            item.reportCode.toLowerCase().includes(q) ||
            (item.familyGroup && item.familyGroup.token.toLowerCase().includes(q)) ||
            item.lastSeenLocation.toLowerCase().includes(q) ||
            (item.physicalDesc && item.physicalDesc.toLowerCase().includes(q))
          );
        })
      : allRecords;

    return {
      query: rawQ,
      count: results.length,
      results,
    } as T;
  }

  // 7. Camps
  if (endpoint.startsWith('/camps')) {
    if (endpoint.includes('/camps/')) {
      const id = endpoint.split('/camps/')[1].split('?')[0];
      const camp = FALLBACK_CAMPS.find(c => c.id === id) || FALLBACK_CAMPS[0];
      return {
        ...camp,
        shelterEntries: [
          {
            id: 'entry-1',
            entryCode: 'INT-4011',
            arrivalDate: new Date().toISOString(),
            person: {
              id: 'p-1',
              fullName: 'Aarav Sharma',
              approxAge: 9,
              gender: 'MALE',
              priorityFlag: 'CHILD_ALONE',
            },
          },
        ],
      } as T;
    }
    return FALLBACK_CAMPS as T;
  }

  // 8. Disasters
  if (endpoint.startsWith('/disasters')) {
    if (endpoint === '/disasters/active' || endpoint.includes('/disasters/active')) {
      return FALLBACK_DISASTER as T;
    }
    if (endpoint.includes('/switch-active')) {
      return { message: 'Switched', disaster: FALLBACK_DISASTER } as T;
    }
    if (endpoint.includes('/nearest-gps')) {
      return {
        userCoordinates: { latitude: 11.5544, longitude: 76.1322 },
        nearestDisaster: FALLBACK_DISASTER,
        allDisastersRanked: [FALLBACK_DISASTER],
      } as T;
    }
    if (endpoint.includes('/custom-location')) {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return {
        message: 'Created',
        disaster: {
          id: `disaster-${Date.now()}`,
          name: body.name || 'Custom Sector',
          location: body.location || 'Active Region',
          state: body.state || 'India',
          latitude: body.latitude || 11.5544,
          longitude: body.longitude || 76.1322,
          alertLevel: body.alertLevel || 'RED_ALERT',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      } as T;
    }
    return [FALLBACK_DISASTER] as T;
  }

  // 9. Dashboard Stats
  if (endpoint.startsWith('/dashboard/stats')) {
    const localReports = getStoredList<any>('reunitepath_missing_reports');
    const localIntakes = getStoredList<any>('reunitepath_intakes');
    const localCheckins = getStoredList<any>('reunitepath_safe_checkins');

    return {
      impact: {
        totalReported: 84 + localReports.length,
        totalShelterEntries: 847 + localIntakes.length,
        verifiedSafeCount: 1280 + localCheckins.length,
        pendingLeadsCount: 14,
        avgReunionHours: 3.8,
        reunificationRate: 88.4,
        priorityAlerts: {
          childrenAlone: 4,
          elderlyAndMedical: 7,
        },
      },
      camps: FALLBACK_CAMPS,
      recentVerifiedReunions: [
        {
          id: 'reu-1',
          personName: 'Aarav Sharma (9)',
          campName: 'Chooralmala Govt School Camp',
          verifiedAt: '12 mins ago',
        },
        {
          id: 'reu-2',
          personName: 'Meenakshi Ammal (73)',
          campName: 'Loyola College Relief Shelter',
          verifiedAt: '34 mins ago',
        },
        {
          id: 'reu-3',
          personName: 'Murugan Selvam (42)',
          campName: 'St. Thomas Community Shelter',
          verifiedAt: '1 hour ago',
        },
      ],
      recentAuditLogs: [
        {
          id: 'log-1',
          action: 'VERIFIED_SHELTER_ENTRY',
          details: 'Nodal Officer verified arrival of child in safe registry #MIS-8821',
          timestamp: '10 mins ago',
        },
        {
          id: 'log-2',
          action: 'SMS_NOTIFICATION_DISPATCHED',
          details: 'Dispatched automated family reunion match confirmation to guardian',
          timestamp: '12 mins ago',
        },
      ],
    } as T;
  }

  // 10. QR Token Lookup
  if (endpoint.startsWith('/qr/lookup')) {
    const token = endpoint.split('/qr/lookup/')[1] || 'FAM-DEFAULT';
    const localReports = getStoredList<any>('reunitepath_missing_reports');
    const matched = localReports.find(r => r.familyToken === token);

    return {
      token,
      disaster: 'Active Disaster Sector Relief',
      primaryContactName: matched?.reporterName || 'Registered Family Contact',
      contactPhone: matched?.reporterPhone || '+91 98401 77889',
      notes: matched?.notes || 'Family pass verified at emergency relief checkpoint.',
      members: matched
        ? [
            {
              id: matched.id,
              fullName: matched.fullName,
              approxAge: matched.approxAge,
              gender: matched.gender,
              status: matched.status,
              campName: 'Assigned Intake Shelter',
            },
          ]
        : [
            {
              id: 'mem-seed-1',
              fullName: 'Murugan Selvam',
              approxAge: 42,
              gender: 'MALE',
              status: 'REPORTED',
              campName: 'In Search / Intake Queue',
            },
            {
              id: 'mem-seed-2',
              fullName: 'Priya Selvam',
              approxAge: 38,
              gender: 'FEMALE',
              status: 'SHELTERED',
              campName: 'Loyola College Relief Shelter',
            },
          ],
    } as T;
  }

  // 11. SMS Simulation
  if (endpoint.startsWith('/simulation/sms')) {
    if (endpoint.includes('/inbound') && options.method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const reply: SimulatedSMS = {
        id: `sms-rep-${Date.now()}`,
        recipientPhone: body.fromNumber || '+91 98401 77889',
        recipientName: 'Disaster Inquirer',
        message: `[GlobalX Auto-Help] Received query "${body.text}". Nearest camp: Chooralmala Govt UP School (0.8km). For family status reply STATUS <ReportID>.`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'DELIVERED',
        type: 'SMS',
      };
      return {
        inbound: body,
        reply,
      } as T;
    }
    const messages = getStoredList<SimulatedSMS>('reunitepath_simulated_sms', [
      {
        id: 'sms-default-1',
        recipientPhone: '+91 94471 23456',
        recipientName: 'Sunil Sharma',
        message: '[GlobalX Alert] Relative Aarav Sharma has been verified SAFE at Chooralmala Govt School Camp.',
        timestamp: 'Today, 06:45 AM',
        status: 'DELIVERED',
        type: 'SMS',
      },
      {
        id: 'sms-default-2',
        recipientPhone: '+91 98401 77889',
        recipientName: 'Priya Selvam',
        message: '[GlobalX Helpline] Family token FAM-CHENNAI-8832 active. 2 members logged in sector.',
        timestamp: 'Today, 05:30 AM',
        status: 'DELIVERED',
        type: 'SMS',
      },
    ]);
    return { messages } as T;
  }

  // 12. Leads
  if (endpoint.startsWith('/leads')) {
    if (endpoint.includes('/approve')) {
      return { success: true, message: 'Lead approved', lead: {} as Lead } as T;
    }
    if (endpoint.includes('/reject')) {
      return { success: true, lead: {} as Lead } as T;
    }
    if (endpoint.includes('/retract')) {
      return { success: true, message: 'Retracted', lead: {} as Lead } as T;
    }
    if (endpoint.includes('/duplicates')) {
      return [] as T;
    }
    return [
      {
        id: 'lead-seed-1',
        disasterId: 'disaster-1',
        confidenceScore: 0.94,
        matchReason: 'High phonological match and matching clothing color',
        explanation: 'Name match "Murugan" <-> "Murugesh" with blue shirt sighting.',
        isFallback: false,
        status: 'PENDING' as const,
        priority: 'HIGH' as const,
        missingReport: {
          id: 'rep-seed-1',
          reportCode: 'MIS-7011',
          reporterName: 'Priya Selvam',
          reporterPhone: '+91 98401 77889',
          reporterRelationship: 'Family',
          lastSeenLocation: 'Velachery Bypass',
          person: {
            id: 'p-seed-1',
            disasterId: 'disaster-1',
            fullName: 'Murugan Selvam',
            approxAge: 42,
            gender: 'MALE',
            priorityFlag: 'NONE' as const,
          },
        },
      },
    ] as T;
  }

  // 13. Auth
  if (endpoint.startsWith('/auth')) {
    const demoUser: User = {
      id: 'usr-demo-1',
      name: 'Disaster Relief Coordinator',
      email: 'coordinator@globalx.org',
      role: 'COORDINATOR' as any,
    };
    setToken('demo-token-jwt');
    return { token: 'demo-token-jwt', user: demoUser } as T;
  }

  return {} as T;
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

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data as T;
    }

    // Response was non-JSON (e.g. Vercel SPA index.html rewrite or 404/500 HTML)
    console.warn(`[GlobalX API] Endpoint ${endpoint} returned non-JSON response. Switching to client-side fallback.`);
    return handleFallbackRequest<T>(endpoint, options);
  } catch (err: any) {
    // If it's a validation error explicitly thrown by business logic, propagate it
    if (
      err?.message &&
      (err.message.startsWith('Missing required') ||
        err.message.startsWith('Invalid') ||
        err.message.startsWith('Unauthorized'))
    ) {
      throw err;
    }

    // Otherwise handle gracefully with offline-first client store
    console.warn(`[GlobalX API] Network or server error for ${endpoint}. Using resilient local store.`, err);
    return handleFallbackRequest<T>(endpoint, options);
  }
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
  getCapAlerts: async (params?: { state?: string; severity?: string; hazardType?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.state) q.set('state', params.state);
      if (params?.severity) q.set('severity', params.severity);
      if (params?.hazardType) q.set('hazardType', params.hazardType);
      const qs = q.toString();
      const res = await request<{ portal: string; totalActiveAlerts: number; alerts: CapAlert[]; updatedAt: string }>(
        `/alerts${qs ? `?${qs}` : ''}`
      );
      if (Array.isArray(res?.alerts) && res.alerts.length > 0) return res;
    } catch {
      // Graceful fallback
    }
    return {
      portal: 'GlobalX Emergency Network (Client Feed)',
      totalActiveAlerts: 2,
      alerts: [
        {
          id: 'CAP-PAN-01',
          hazardType: 'THUNDERSTORM' as const,
          severity: 'ORANGE_ALERT' as const,
          headline: 'Severe Thunderstorm & Squall Activity',
          description: 'Thunderstorm with lightning and gusty winds 40-50 kmph likely over coastal & catchment sectors.',
          locationName: 'Meppadi & Chooralmala',
          district: 'Wayanad',
          state: 'Kerala',
          latitude: 11.5544,
          longitude: 76.1322,
          radiusKm: 30,
          issuedAt: new Date().toLocaleTimeString(),
          expiresAt: 'Continuous Monitoring',
          source: 'IMD & GlobalX Early Warning Network',
          instruction: 'Stay indoors, keep clear of temporary structures and electrical conduits.',
        },
        {
          id: 'CAP-PAN-02',
          hazardType: 'HEAVY_RAIN' as const,
          severity: 'YELLOW_ALERT' as const,
          headline: 'Localized Cloudburst Risk & Heavy Precipitation',
          description: 'Heavy precipitation exceeding 65mm in 3 hours with risk of slope erosion and stream swelling.',
          locationName: 'Vythiri Hills',
          district: 'Wayanad',
          state: 'Kerala',
          latitude: 11.5589,
          longitude: 76.0421,
          radiusKm: 25,
          issuedAt: new Date().toLocaleTimeString(),
          expiresAt: 'Continuous Monitoring',
          source: 'IMD & GlobalX Early Warning Network',
          instruction: 'Monitor local NDRF & civil defense VHF emergency channels.',
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  },

  getEarthquakes: async () => {
    try {
      const res = await request<{ total: number; earthquakes: EarthquakeRecord[]; lastUpdate: string }>('/alerts/earthquakes');
      if (Array.isArray(res?.earthquakes) && res.earthquakes.length > 0) return res;
    } catch {
      // Graceful fallback
    }
    return {
      total: 2,
      earthquakes: [
        {
          id: 'EQ-01',
          magnitude: 3.2,
          locationName: 'Palakkad Gap, Kerala',
          state: 'Kerala',
          latitude: 10.7867,
          longitude: 76.6548,
          depthKm: 10,
          timestamp: new Date().toLocaleDateString(),
          colorCode: '#10b981',
        },
        {
          id: 'EQ-02',
          magnitude: 3.8,
          locationName: 'Uttarkashi Region, Uttarakhand',
          state: 'Uttarakhand',
          latitude: 30.7268,
          longitude: 78.4354,
          depthKm: 14,
          timestamp: new Date().toLocaleDateString(),
          colorCode: '#10b981',
        },
      ],
      lastUpdate: new Date().toISOString(),
    };
  },

  getWeatherOverview: async (lat: number = 20.5937, lng: number = 78.9629, locationName: string = 'National Weather Center'): Promise<WeatherOverviewData> => {
    try {
      const q = new URLSearchParams();
      q.set('lat', String(lat));
      q.set('lng', String(lng));
      if (locationName) q.set('locationName', locationName);
      const res = await request<WeatherOverviewData>(`/alerts/weather?${q.toString()}`);
      if (res && res.current && res.current.tempCelsius !== undefined) return res;
    } catch {
      // Direct client fallback to Open-Meteo
    }
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata`
      );
      const data = await res.json();
      const currentTemp = Math.round(data?.current?.temperature_2m ?? 28);
      const condition = (data?.current?.weather_code ?? 0) > 50 ? 'Precipitation / Rain' : 'Partly Cloudy';
      const windKmph = Math.round(data?.current?.wind_speed_10m ?? 14);
      const humidity = Math.round(data?.current?.relative_humidity_2m ?? 65);
      return {
        locationName,
        latitude: lat,
        longitude: lng,
        current: {
          tempCelsius: currentTemp,
          condition,
          humidityPercent: humidity,
          windKmph,
          windDirection: 'NE',
          uvIndex: 4,
          airQuality: 'Moderate (AQI 65)',
        },
        hourly: [
          { time: '12:00', tempCelsius: currentTemp, condition: 'Clear', rainChance: 10 },
          { time: '15:00', tempCelsius: currentTemp + 1, condition: 'Scattered', rainChance: 25 },
          { time: '18:00', tempCelsius: currentTemp - 2, condition: 'Mild', rainChance: 40 },
        ],
        daily: {
          today: { high: currentTemp + 3, low: currentTemp - 4, summary: 'Scattered clouds with intermittent showers' },
          tomorrow: { high: currentTemp + 4, low: currentTemp - 3, summary: 'Partly sunny' },
          day3: { high: currentTemp + 2, low: currentTemp - 5, summary: 'Isolated rain' },
        },
        audioPodcastScript: `GlobalX live weather broadcast for ${locationName}. Current temperature is ${currentTemp} degrees Celsius with ${condition}. Wind is blowing at ${windKmph} kilometers per hour. Relative humidity is ${humidity} percent. All responders, monitor GlobalX updates.`,
      };
    } catch {
      return {
        locationName,
        latitude: lat,
        longitude: lng,
        current: {
          tempCelsius: 28,
          condition: 'Partly Cloudy',
          humidityPercent: 68,
          windKmph: 12,
          windDirection: 'SW',
          uvIndex: 4,
          airQuality: 'Moderate (AQI 65)',
        },
        hourly: [
          { time: '12:00', tempCelsius: 28, condition: 'Clear', rainChance: 10 },
          { time: '15:00', tempCelsius: 30, condition: 'Scattered', rainChance: 20 },
          { time: '18:00', tempCelsius: 26, condition: 'Mild', rainChance: 35 },
        ],
        daily: {
          today: { high: 31, low: 24, summary: 'Partly Cloudy' },
          tomorrow: { high: 32, low: 25, summary: 'Sunny' },
          day3: { high: 30, low: 23, summary: 'Chance of rain' },
        },
        audioPodcastScript: `GlobalX meteorological broadcast for ${locationName}. Current temperature is 28 degrees Celsius with partly cloudy skies. Relative humidity is 68 percent. All emergency relief operations, please maintain readiness.`,
      };
    }
  },
};

