import {
  ReunionCase,
  ReunionCaseStatus,
  ReunionSourceRecord,
  MatchEvidenceBreakdown,
  CaseTimelineEvent,
  FamilyNotificationRecord,
  MeetingPointRecommendation,
  ReunionIntelligenceStats,
} from '../types/reunionIntelligence';
import { Camp } from '../types';

const API_BASE = '/api/reunion-intelligence';

// Fallback in-memory and local storage key
const STORAGE_KEY = 'globalx_reunion_cases';
const SOS_PROCESSED_KEY = 'globalx_sos_processed';

function getStoredCases(): ReunionCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse stored reunion cases', e);
  }
  return getInitialDemoCases();
}

function saveStoredCases(cases: ReunionCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.warn('Failed to save reunion cases to storage', e);
  }
}

// Initial Demo Scenario Seed: Arjun Kumar
function getInitialDemoCases(): ReunionCase[] {
  const caseId = 'case-demo-arjun-01';

  const missingRecord: ReunionSourceRecord = {
    id: 'src-mis-arjun-1',
    sourceType: 'MISSING_REPORT',
    sourceReferenceCode: 'MIS-WAYANAD-802',
    personName: 'Arjun Kumar',
    alternativeNames: ['Arjun K', 'Arjunan'],
    approxAge: 30,
    gender: 'MALE',
    physicalDescription: 'Approx 5ft 8in, short black hair, wearing dark blue polo t-shirt and jeans',
    medicalNeeds: 'Mild asthma, carries inhaler',
    priorityFlag: 'NONE',
    lastKnownLocation: 'Meppadi Town market square',
    currentReportedLocation: null,
    campId: null,
    campName: null,
    reporterOrContactName: 'Kavitha Kumar',
    reporterOrContactPhone: '+91 94471 99281',
    relationshipToPerson: 'Spouse',
    timestamp: '2026-10-08T08:30:00.000Z',
    isVerifiedFact: false,
    notes: 'Separated during sudden landslide flash flooding near Meppadi bridge at 08:30 AM.',
    privacyConsent: {
      consentGiven: true,
      shareLocationAllowed: true,
      shareContactAllowed: false,
    },
  };

  const checkInRecord: ReunionSourceRecord = {
    id: 'src-chk-arjun-2',
    sourceType: 'SAFE_CHECKIN',
    sourceReferenceCode: 'CHK-MEP-4109',
    personName: 'Arjun Kumra',
    alternativeNames: [],
    approxAge: 29,
    gender: 'MALE',
    physicalDescription: 'Wearing blue collared shirt, safe and unhurt',
    medicalNeeds: 'None reported during check-in',
    priorityFlag: 'NONE',
    lastKnownLocation: null,
    currentReportedLocation: 'St. Joseph Higher Secondary Relief Camp (Camp A)',
    campId: 'camp-1',
    campName: 'St. Joseph Higher Secondary Relief Camp',
    reporterOrContactName: 'Arjun Kumra (Self)',
    reporterOrContactPhone: '+91 98472 55102',
    relationshipToPerson: 'Self',
    timestamp: '2026-10-08T10:15:00.000Z',
    isVerifiedFact: true,
    notes: 'Tapped "I am Safe" check-in terminal at St. Joseph evacuation intake station.',
    privacyConsent: {
      consentGiven: true,
      shareLocationAllowed: false, // Protected until authorized coordinator verification
      shareContactAllowed: false,
    },
  };

  const sightingRecord: ReunionSourceRecord = {
    id: 'src-sgt-arjun-3',
    sourceType: 'SIGHTING',
    sourceReferenceCode: 'SGT-MEP-2201',
    personName: 'Arjun',
    alternativeNames: [],
    approxAge: 30,
    gender: 'MALE',
    physicalDescription: 'Wearing blue shirt, was seen boarding evacuation transport truck',
    medicalNeeds: null,
    priorityFlag: 'NONE',
    lastKnownLocation: 'Meppadi Bus Stop collection point',
    currentReportedLocation: 'En route to St. Joseph School Shelter',
    campId: 'camp-1',
    campName: 'St. Joseph Higher Secondary Relief Camp',
    reporterOrContactName: 'Ramesh Nair (Eyewitness)',
    reporterOrContactPhone: '+91 94460 11234',
    relationshipToPerson: 'Eyewitness / Evacuation Volunteer',
    timestamp: '2026-10-08T09:10:00.000Z',
    isVerifiedFact: false,
    notes: 'Seen boarding civil defense transport vehicle headed towards St. Joseph Relief Camp.',
    privacyConsent: {
      consentGiven: true,
      shareLocationAllowed: true,
      shareContactAllowed: true,
    },
  };

  const evidence: MatchEvidenceBreakdown = {
    matchScore: 88,
    reviewBand: 'HIGH_PRIORITY',
    nameSimilarityScore: 92,
    ageScore: 90,
    geographicScore: 85,
    timeScore: 100,
    shelterScore: 80,
    identifyingDetailsScore: 85,
    positiveEvidence: [
      'Name variation "Arjun Kumra" is 1 edit distance from "Arjun Kumar" (92% name similarity)',
      'Age 29 is within 1 year of reported age 30 (high age compatibility)',
      'Timeline is chronologically plausible: check-in at 10:15 AM occurred 1.8 hrs after last contact at 08:30 AM',
      'Common geographical corridor: Meppadi Town area corresponds with St. Joseph Relief Camp intake',
      'Physical attire overlap: both records indicate "blue shirt / dark blue polo"',
      'Eyewitness sighting confirms person was boarded onto evacuation vehicle headed towards St. Joseph Camp',
    ],
    conflictingEvidence: [
      'Minor spelling variance in surname ("Kumar" vs "Kumra")',
      'Reported age differs by 1 year (30 vs 29)',
    ],
    missingEvidence: [
      'No government photo ID uploaded on initial self check-in',
      'Facial biometrics not collected to preserve ethical privacy standards',
    ],
    availableSignals: [
      'Person Name',
      'Age Range',
      'Geographic Proximity',
      'Timeline Sequence',
      'Shelter Verification',
      'Physical / Medical Details',
    ],
    missingSignals: [
      'Biometric ID Documents',
    ],
    whySuggested:
      'Candidate was surfaced because of strong correlation across 6 distinct signals (Name, Age, Timeline, Sector, Attire, and Eyewitness Sighting). Requires human verification before notifying family.',
  };

  const initialTimeline: CaseTimelineEvent[] = [
    {
      id: 'tl-1',
      caseId,
      timestamp: '2026-10-08T08:35:00.000Z',
      toStatus: 'OPEN_REPORT',
      actionTitle: 'Missing Person Report Registered',
      actorName: 'Kavitha Kumar',
      actorRole: 'SYSTEM',
      notes: 'Report filed for Arjun Kumar (30 yrs) last seen in Meppadi at 08:30 AM.',
      evidenceRef: 'MIS-WAYANAD-802',
    },
    {
      id: 'tl-2',
      caseId,
      timestamp: '2026-10-08T10:16:00.000Z',
      fromStatus: 'OPEN_REPORT',
      toStatus: 'CANDIDATE_FOUND',
      actionTitle: 'Cross-Source Candidate Match Detected',
      actorName: 'GlobalX Matching Engine',
      actorRole: 'SYSTEM',
      notes: 'Safe Check-In for "Arjun Kumra" (29 yrs) evaluated against open report with Match Score 88%. Added to triage queue.',
      evidenceRef: 'CHK-MEP-4109',
    },
  ];

  return [
    {
      id: caseId,
      caseCode: 'RC-2024-8801',
      status: 'CANDIDATE_FOUND',
      missingReport: missingRecord,
      candidateRecord: checkInRecord,
      linkedSourceRecords: [missingRecord, checkInRecord, sightingRecord],
      matchEvidence: evidence,
      timeline: initialTimeline,
      notification: null,
      recommendedMeetingPoint: null,
      selectedMeetingPointId: null,
      meetingPointOverrideReason: null,
      assignedResponder: null,
      reviewerNotes: null,
      createdAt: '2026-10-08T08:35:00.000Z',
      updatedAt: new Date().toISOString(),
      isDemoCase: true,
    },
    {
      id: 'case-demo-aarav-02',
      caseCode: 'RC-2024-8802',
      status: 'AWAITING_REVIEW',
      missingReport: {
        id: 'src-mis-aarav-1',
        sourceType: 'MISSING_REPORT',
        sourceReferenceCode: 'MIS-7012',
        personName: 'Aarav Sharma',
        alternativeNames: [],
        approxAge: 9,
        gender: 'MALE',
        physicalDescription: 'Red school backpack, yellow t-shirt',
        medicalNeeds: null,
        priorityFlag: 'CHILD_ALONE',
        lastKnownLocation: 'Chooralmala Bus Terminal',
        currentReportedLocation: null,
        campId: null,
        campName: null,
        reporterOrContactName: 'Sunita Sharma (Mother)',
        reporterOrContactPhone: '+91 98450 12345',
        relationshipToPerson: 'Parent',
        timestamp: '2026-10-08T09:00:00.000Z',
        isVerifiedFact: false,
        notes: 'Separated during emergency bus evacuation.',
        privacyConsent: {
          consentGiven: true,
          shareLocationAllowed: true,
          shareContactAllowed: true,
        },
      },
      candidateRecord: {
        id: 'src-chk-aarav-2',
        sourceType: 'SHELTER_INTAKE',
        sourceReferenceCode: 'INT-4011',
        personName: 'Aarav Sharma',
        alternativeNames: [],
        approxAge: 9,
        gender: 'MALE',
        physicalDescription: 'Found alone near relief gate, wearing yellow t-shirt',
        medicalNeeds: null,
        priorityFlag: 'CHILD_ALONE',
        lastKnownLocation: null,
        currentReportedLocation: 'Chooralmala Govt UP School Camp',
        campId: 'camp-2',
        campName: 'Chooralmala Govt UP School Camp',
        reporterOrContactName: 'Volunteer Officer Shaji',
        reporterOrContactPhone: '+91 94470 55112',
        relationshipToPerson: 'Camp Volunteer',
        timestamp: '2026-10-08T11:20:00.000Z',
        isVerifiedFact: true,
        notes: 'Unaccompanied child logged under urgent priority protocol.',
        privacyConsent: {
          consentGiven: true,
          shareLocationAllowed: true,
          shareContactAllowed: false,
        },
      },
      linkedSourceRecords: [],
      matchEvidence: {
        matchScore: 97,
        reviewBand: 'HIGH_PRIORITY',
        nameSimilarityScore: 100,
        ageScore: 100,
        geographicScore: 95,
        timeScore: 95,
        shelterScore: 100,
        identifyingDetailsScore: 90,
        positiveEvidence: [
          'Exact name match: "Aarav Sharma"',
          'Identical age: 9 years old',
          'Priority flag match: CHILD_ALONE',
          'Physical attire match: Yellow t-shirt observed in both records',
        ],
        conflictingEvidence: [],
        missingEvidence: ['Guardian verification required before release'],
        availableSignals: ['Person Name', 'Age Range', 'Geographic Proximity', 'Shelter Verification'],
        missingSignals: [],
        whySuggested: 'High-confidence child welfare match requiring immediate coordinator sign-off.',
      },
      timeline: [
        {
          id: 'tl-aarav-1',
          caseId: 'case-demo-aarav-02',
          timestamp: '2026-10-08T09:05:00.000Z',
          toStatus: 'OPEN_REPORT',
          actionTitle: 'Missing Child Report Filed',
          actorName: 'Sunita Sharma',
          actorRole: 'SYSTEM',
          notes: 'High urgency child alone case registered.',
        },
        {
          id: 'tl-aarav-2',
          caseId: 'case-demo-aarav-02',
          timestamp: '2026-10-08T11:25:00.000Z',
          fromStatus: 'OPEN_REPORT',
          toStatus: 'AWAITING_REVIEW',
          actionTitle: 'Urgent Child Alone Match Detected',
          actorName: 'GlobalX Intake Cross-Match',
          actorRole: 'SYSTEM',
          notes: 'Matched with intake at Chooralmala Govt School Camp. Match Score 97%.',
        },
      ],
      notification: null,
      recommendedMeetingPoint: null,
      selectedMeetingPointId: null,
      meetingPointOverrideReason: null,
      assignedResponder: 'Officer Shaji (Child Protection Nodal)',
      reviewerNotes: null,
      createdAt: '2026-10-08T09:05:00.000Z',
      updatedAt: new Date().toISOString(),
      isDemoCase: true,
    },
  ];
}

export const VALID_STATUS_TRANSITIONS: Record<ReunionCaseStatus, ReunionCaseStatus[]> = {
  OPEN_REPORT: ['CANDIDATE_FOUND', 'UNRESOLVED_ESCALATED'],
  CANDIDATE_FOUND: ['AWAITING_REVIEW', 'REJECTED_MATCH', 'UNRESOLVED_ESCALATED'],
  AWAITING_REVIEW: ['VERIFICATION_REQUIRED', 'IDENTITY_VERIFIED', 'REJECTED_MATCH', 'UNRESOLVED_ESCALATED'],
  VERIFICATION_REQUIRED: ['IDENTITY_VERIFIED', 'REJECTED_MATCH', 'UNRESOLVED_ESCALATED'],
  IDENTITY_VERIFIED: ['FAMILY_CONTACT_PENDING', 'REUNION_COORDINATING', 'UNRESOLVED_ESCALATED'],
  FAMILY_CONTACT_PENDING: ['REUNION_COORDINATING', 'UNRESOLVED_ESCALATED'],
  REUNION_COORDINATING: ['REUNITED_CLOSED', 'UNRESOLVED_ESCALATED'],
  REUNITED_CLOSED: [],
  REJECTED_MATCH: ['AWAITING_REVIEW'],
  UNRESOLVED_ESCALATED: ['AWAITING_REVIEW', 'OPEN_REPORT'],
};

export function canTransitionStatus(from: ReunionCaseStatus, to: ReunionCaseStatus): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export const reunionIntelligenceService = {
  /**
   * Fetch all reunion cases with optional filtering
   */
  async getCases(params?: {
    status?: string;
    reviewBand?: string;
    query?: string;
    shelter?: string;
  }): Promise<ReunionCase[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.status) qs.append('status', params.status);
      if (params?.reviewBand) qs.append('reviewBand', params.reviewBand);
      if (params?.query) qs.append('query', params.query);
      if (params?.shelter) qs.append('shelter', params.shelter);

      const res = await fetch(`${API_BASE}/cases?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      // Fallback
    }

    let cases = getStoredCases();
    if (params?.status && params.status !== 'ALL') {
      cases = cases.filter(c => c.status === params.status);
    }
    if (params?.reviewBand && params.reviewBand !== 'ALL') {
      cases = cases.filter(c => c.matchEvidence?.reviewBand === params.reviewBand);
    }
    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      cases = cases.filter(c =>
        c.caseCode.toLowerCase().includes(q) ||
        c.missingReport.personName.toLowerCase().includes(q) ||
        (c.candidateRecord && c.candidateRecord.personName.toLowerCase().includes(q))
      );
    }
    return cases;
  },

  /**
   * Get specific case by ID
   */
  async getCaseById(id: string): Promise<ReunionCase> {
    try {
      const res = await fetch(`${API_BASE}/cases/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const cases = getStoredCases();
    const found = cases.find(c => c.id === id);
    if (!found) {
      throw new Error('Case not found');
    }
    return found;
  },

  /**
   * Get stats overview
   */
  async getStats(): Promise<ReunionIntelligenceStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const cases = getStoredCases();
    const openCasesCount = cases.filter(c => c.status === 'OPEN_REPORT').length;
    const unreviewedCandidatesCount = cases.filter(c => c.status === 'CANDIDATE_FOUND').length;
    const awaitingVerificationCount = cases.filter(c => c.status === 'AWAITING_REVIEW' || c.status === 'VERIFICATION_REQUIRED').length;
    const verifiedReunionsCount = cases.filter(c => c.status === 'REUNITED_CLOSED' || c.status === 'IDENTITY_VERIFIED').length;
    const unresolvedEscalatedCount = cases.filter(c => c.status === 'UNRESOLVED_ESCALATED').length;
    const pendingNotificationsCount = cases.filter(c => c.status === 'FAMILY_CONTACT_PENDING' || (c.notification && c.notification.status === 'QUEUED')).length;

    const scores = cases.filter(c => c.matchEvidence).map(c => c.matchEvidence!.matchScore);
    const avgMatchScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      openCasesCount,
      unreviewedCandidatesCount,
      awaitingVerificationCount,
      verifiedReunionsCount,
      unresolvedEscalatedCount,
      pendingNotificationsCount,
      avgMatchScore,
    };
  },

  /**
   * Transition case status with validation & audit trail
   */
  async transitionStatus(
    caseId: string,
    toStatus: ReunionCaseStatus,
    actorName: string = 'Field Coordinator',
    actorRole: 'COORDINATOR' | 'RESPONDER' | 'ADMIN' | 'SYSTEM' = 'COORDINATOR',
    notes: string = '',
    evidenceRef?: string
  ): Promise<ReunionCase> {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, actorName, actorRole, notes, evidenceRef }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // Fallback logic
    const cases = getStoredCases();
    const c = cases.find(item => item.id === caseId);
    if (!c) throw new Error('Case not found');

    if (!canTransitionStatus(c.status, toStatus)) {
      throw new Error(`Invalid transition from ${c.status} to ${toStatus}`);
    }

    const prevStatus = c.status;
    c.status = toStatus;
    c.updatedAt = new Date().toISOString();

    c.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: c.id,
      timestamp: new Date().toISOString(),
      fromStatus: prevStatus,
      toStatus,
      actionTitle: `Transitioned to ${toStatus.replace(/_/g, ' ')}`,
      actorName,
      actorRole,
      notes: notes || 'Updated by coordinator',
      evidenceRef,
    });

    if (toStatus === 'IDENTITY_VERIFIED') c.verifiedAt = new Date().toISOString();
    if (toStatus === 'REUNITED_CLOSED') {
      c.reunitedAt = new Date().toISOString();
      c.closureReason = notes;
    }
    if (toStatus === 'REJECTED_MATCH') c.rejectionReason = notes;

    saveStoredCases(cases);
    return c;
  },

  /**
   * Verify identity (advances to IDENTITY_VERIFIED)
   */
  async verifyIdentity(caseId: string, reviewerName: string, reviewerNotes: string): Promise<ReunionCase> {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerName, reviewerNotes }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return this.transitionStatus(caseId, 'IDENTITY_VERIFIED', reviewerName, 'COORDINATOR', reviewerNotes);
  },

  /**
   * Reject match candidate (advances to REJECTED_MATCH)
   */
  async rejectMatch(caseId: string, reviewerName: string, rejectionReason: string): Promise<ReunionCase> {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerName, rejectionReason }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return this.transitionStatus(caseId, 'REJECTED_MATCH', reviewerName, 'COORDINATOR', rejectionReason);
  },

  /**
   * Safe Family Notification Dispatch
   */
  async dispatchNotification(caseId: string, senderName: string = 'Relief Coordinator'): Promise<{ notification: FamilyNotificationRecord; case: ReunionCase }> {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const cases = getStoredCases();
    const c = cases.find(item => item.id === caseId);
    if (!c) throw new Error('Case not found');

    if (c.status !== 'IDENTITY_VERIFIED' && c.status !== 'FAMILY_CONTACT_PENDING' && c.status !== 'REUNION_COORDINATING') {
      throw new Error('Family notification requires prior identity verification by responder.');
    }

    const reporterName = c.missingReport.reporterOrContactName || 'Family Contact';
    const reporterPhone = c.missingReport.reporterOrContactPhone || '+91 94470 00000';
    const maskedPhone = reporterPhone.length >= 6
      ? reporterPhone.slice(0, 4) + '****' + reporterPhone.slice(-2)
      : '***';

    const messagePreview = `GlobalX Disaster Relief Notification: An authorized match for your inquiry regarding "${c.missingReport.personName}" has been positively verified at ${c.candidateRecord?.campName || 'authorized relief station'}. Please connect with the On-Site Camp Coordinator to coordinate safe reunification.`;

    const notification: FamilyNotificationRecord = {
      id: `notif-${Date.now()}`,
      caseId: c.id,
      recipientName: reporterName,
      recipientPhoneMasked: maskedPhone,
      messagePreview,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      dispatchedBy: senderName,
      channel: 'IN_APP_DISPATCH',
    };

    c.notification = notification;

    if (c.status === 'IDENTITY_VERIFIED') {
      c.status = 'FAMILY_CONTACT_PENDING';
      c.timeline.push({
        id: `tl-${Date.now()}`,
        caseId: c.id,
        timestamp: new Date().toISOString(),
        fromStatus: 'IDENTITY_VERIFIED',
        toStatus: 'FAMILY_CONTACT_PENDING',
        actionTitle: 'Family Notification Authorized & Dispatched',
        actorName: senderName,
        actorRole: 'COORDINATOR',
        notes: `Notification sent to ${reporterName} (${maskedPhone}).`,
      });
    }

    c.status = 'REUNION_COORDINATING';
    c.timeline.push({
      id: `tl-${Date.now() + 1}`,
      caseId: c.id,
      timestamp: new Date().toISOString(),
      fromStatus: 'FAMILY_CONTACT_PENDING',
      toStatus: 'REUNION_COORDINATING',
      actionTitle: 'Reunion Coordination Activated',
      actorName: senderName,
      actorRole: 'COORDINATOR',
      notes: 'Family notified. Meeting point logistics initialized.',
    });

    saveStoredCases(cases);
    return { notification, case: c };
  },

  /**
   * Recommend / Assign Meeting Point
   */
  async recommendMeetingPoint(caseId: string, overrideCampId?: string, overrideReason?: string): Promise<ReunionCase> {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/meeting-point`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrideCampId, overrideReason }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const cases = getStoredCases();
    const c = cases.find(item => item.id === caseId);
    if (!c) throw new Error('Case not found');

    const recommendation: MeetingPointRecommendation = {
      campId: overrideCampId || 'camp-1',
      campName: overrideCampId ? 'Designated Transfer Shelter' : 'St. Joseph Higher Secondary Relief Camp',
      campLocation: 'Meppadi Town, Wayanad',
      operatingStatus: 'OPEN',
      totalCapacity: 500,
      currentOccupancy: 342,
      availableBeds: 158,
      hasMedicalCare: true,
      distanceKm: 1.4,
      estimatedWalkingMinutes: 26,
      avoidsHazardEpicenter: true,
      hazardNotice: 'Corridor verified clear of current CAP flash-flood and landslide advisories.',
      rationale:
        'Selected because St. Joseph Higher Secondary Relief Camp is OPEN with 158 verified available beds, has an active on-site clinic, and avoids the Chooralmala mudslide zone.',
      isVerifiedRoute: true,
      turnByTurnSummary: [
        'Depart departure checkpoint heading East along Meppadi High Road (0.4 km)',
        'Follow civil defense markers past Village Office junction (0.6 km)',
        'Arrive at St. Joseph Higher Secondary School gate muster reception (0.4 km)',
      ],
      coordinates: { latitude: 11.5512, longitude: 76.1289 },
    };

    c.recommendedMeetingPoint = recommendation;
    c.selectedMeetingPointId = overrideCampId || recommendation.campId;
    if (overrideReason) c.meetingPointOverrideReason = overrideReason;

    saveStoredCases(cases);
    return c;
  },

  /**
   * Reseed deterministic demo scenario
   */
  async seedDemoScenario(): Promise<ReunionCase> {
    try {
      const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.demoCase) return data.demoCase;
      }
    } catch (e) {}

    const initial = getInitialDemoCases();
    saveStoredCases(initial);
    return initial[0];
  },

  /**
   * Reset demo data
   */
  async resetDemoData(): Promise<void> {
    try {
      await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    } catch (e) {}

    const initial = getInitialDemoCases();
    saveStoredCases(initial);
  },
};
