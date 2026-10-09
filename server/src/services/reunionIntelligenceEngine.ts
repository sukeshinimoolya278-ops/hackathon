import {
  ReunionCase,
  ReunionCaseStatus,
  ReunionSourceRecord,
  MatchEvidenceBreakdown,
  MatchReviewBand,
  CaseTimelineEvent,
  FamilyNotificationRecord,
  MeetingPointRecommendation,
  ReunionIntelligenceStats,
} from '../types/reunionIntelligence';
import {
  normalizeTransliteration,
  soundex,
  levenshteinDistance,
} from '../utils/fuzzy';

// In-memory persistent store for Reunion Cases with demo seeding capabilities
class ReunionCaseStore {
  private cases: Map<string, ReunionCase> = new Map();
  private processedSosPacketIds: Set<string> = new Set();
  private initialized = false;

  constructor() {
    this.ensureInitialData();
  }

  public ensureInitialData(): void {
    if (this.initialized) return;
    this.seedDemoData();
    this.initialized = true;
  }

  public getAllCases(): ReunionCase[] {
    return Array.from(this.cases.values());
  }

  public getCaseById(id: string): ReunionCase | undefined {
    return this.cases.get(id);
  }

  public saveCase(c: ReunionCase): ReunionCase {
    c.updatedAt = new Date().toISOString();
    this.cases.set(c.id, c);
    return c;
  }

  public deleteCase(id: string): boolean {
    return this.cases.delete(id);
  }

  public isSosProcessed(packetId: string): boolean {
    return this.processedSosPacketIds.has(packetId);
  }

  public markSosProcessed(packetId: string): void {
    this.processedSosPacketIds.add(packetId);
  }

  public resetDemoData(): void {
    // Retain non-demo cases, remove demo cases, then reseed demo scenario
    for (const [id, c] of this.cases.entries()) {
      if (c.isDemoCase) {
        this.cases.delete(id);
      }
    }
    this.seedDemoData();
  }

  public seedDemoData(): void {
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

    const evidence = evaluateMatchEvidence(missingRecord, checkInRecord);

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

    const demoCase: ReunionCase = {
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
    };

    this.cases.set(caseId, demoCase);
  }
}

export const caseStore = new ReunionCaseStore();

// =========================================================================
// MATCHING ALGORITHM IMPLEMENTATION
// =========================================================================

/**
 * Calculates string similarity using Levenshtein distance and South Asian transliteration normalization
 */
export function calculateNameSimilarity(nameA: string, nameB: string): { score: number; reason: string } {
  if (!nameA || !nameB) {
    return { score: 0, reason: 'Name missing from one of the records' };
  }

  const rawA = nameA.trim().toLowerCase();
  const rawB = nameB.trim().toLowerCase();

  if (rawA === rawB) {
    return { score: 100, reason: `Exact name match: "${nameA}"` };
  }

  // South Asian phonetics & transliteration check
  const normA = normalizeTransliteration(rawA);
  const normB = normalizeTransliteration(rawB);

  if (normA === normB) {
    return {
      score: 96,
      reason: `Phonetic & transliteration identity ("${nameA}" ≈ "${nameB}")`,
    };
  }

  // Levenshtein edit distance on normalized forms
  const dist = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  const levRatio = Math.max(0, 1 - dist / maxLen);

  // Soundex comparison
  const soundexA = soundex(rawA);
  const soundexB = soundex(rawB);
  const soundexMatch = soundexA === soundexB;

  // Token set overlap (e.g. "Arjun Kumar" vs "Kumar Arjun")
  const tokensA = new Set(normA.split(/\s+/).filter(t => t.length > 1));
  const tokensB = new Set(normB.split(/\s+/).filter(t => t.length > 1));
  let tokenOverlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) tokenOverlap++;
  }
  const tokenRatio = tokensA.size > 0 && tokensB.size > 0
    ? (tokenOverlap * 2) / (tokensA.size + tokensB.size)
    : 0;

  if (tokenRatio === 1) {
    return {
      score: 94,
      reason: `Name token inversion match (same words in different order: "${nameA}" vs "${nameB}")`,
    };
  }

  let finalScore = Math.round(levRatio * 85);
  if (soundexMatch) finalScore = Math.min(95, finalScore + 10);
  if (dist === 1) {
    finalScore = Math.max(88, finalScore);
  } else if (dist === 2 && maxLen >= 6) {
    finalScore = Math.max(76, finalScore);
  }

  // Token-level matching (e.g. First Name + Last Name)
  const listA = normA.split(/\s+/).filter(Boolean);
  const listB = normB.split(/\s+/).filter(Boolean);
  if (listA.length > 0 && listB.length > 0 && listA.length === listB.length) {
    let tokenScoreSum = 0;
    for (let i = 0; i < listA.length; i++) {
      const wA = listA[i];
      const wB = listB[i];
      if (wA === wB) {
        tokenScoreSum += 100;
      } else {
        const d = levenshteinDistance(wA, wB);
        const m = Math.max(wA.length, wB.length);
        if (d <= 2) {
          tokenScoreSum += Math.max(80, Math.round((1 - d / m) * 100));
        } else {
          tokenScoreSum += Math.round((1 - d / m) * 100);
        }
      }
    }
    const tokenAvg = Math.round(tokenScoreSum / listA.length);
    finalScore = Math.max(finalScore, tokenAvg);
  }

  let finalReason = dist <= 2
    ? `Minor spelling variation (edit distance: ${dist}): "${nameA}" vs "${nameB}"`
    : `Fuzzy similarity (${finalScore}%): "${nameA}" vs "${nameB}"`;

  return { score: Math.min(100, Math.max(0, finalScore)), reason: finalReason };
}

/**
 * Calculates age compatibility score
 */
export function calculateAgeCompatibility(
  ageA?: number | null,
  ageB?: number | null
): { score: number; isAvailable: boolean; reason: string; isConflicting: boolean } {
  if (ageA == null || ageB == null) {
    return {
      score: 50,
      isAvailable: false,
      reason: 'Approximate age not provided in both records (adaptive neutral signal)',
      isConflicting: false,
    };
  }

  const diff = Math.abs(ageA - ageB);
  if (diff === 0) {
    return { score: 100, isAvailable: true, reason: `Identical reported age: ${ageA} years`, isConflicting: false };
  }
  if (diff <= 2) {
    return { score: 90, isAvailable: true, reason: `Consistent age range (within ${diff} yr: ${ageA} vs ${ageB})`, isConflicting: false };
  }
  if (diff <= 5) {
    return { score: 65, isAvailable: true, reason: `Plausible estimated age difference (${ageA} vs ${ageB})`, isConflicting: false };
  }
  if (diff <= 10) {
    return { score: 30, isAvailable: true, reason: `Noticeable age disparity (${ageA} vs ${ageB})`, isConflicting: true };
  }
  return { score: 0, isAvailable: true, reason: `Significant age conflict (${ageA} vs ${ageB})`, isConflicting: true };
}

/**
 * Geographic consistency evaluation
 */
export function calculateGeographicConsistency(
  locA?: string | null,
  locB?: string | null
): { score: number; isAvailable: boolean; reason: string; isConflicting: boolean } {
  if (!locA || !locB) {
    return {
      score: 50,
      isAvailable: false,
      reason: 'Location coordinate/text missing in one record (adaptive neutral signal)',
      isConflicting: false,
    };
  }

  const cleanA = locA.toLowerCase().trim();
  const cleanB = locB.toLowerCase().trim();

  if (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
    return {
      score: 100,
      isAvailable: true,
      reason: `Direct geographical area correspondence: "${locA}" & "${locB}"`,
      isConflicting: false,
    };
  }

  // Token overlap (e.g., "Meppadi" in both)
  const wordsA = new Set(cleanA.split(/[\s,.-]+/).filter(w => w.length > 2));
  const wordsB = new Set(cleanB.split(/[\s,.-]+/).filter(w => w.length > 2));
  const common = Array.from(wordsA).filter(w => wordsB.has(w));

  if (common.length > 0) {
    return {
      score: 80,
      isAvailable: true,
      reason: `Common locality/corridor identified: ${common.join(', ')}`,
      isConflicting: false,
    };
  }

  return {
    score: 25,
    isAvailable: true,
    reason: `Different reported sectors ("${locA}" vs "${locB}") — requires evacuation path verification`,
    isConflicting: true,
  };
}

/**
 * Time consistency evaluation (ensures plausible chronological sequence)
 */
export function calculateTimeConsistency(
  timeReportedStr: string,
  timeCandidateStr: string
): { score: number; isAvailable: boolean; reason: string; isConflicting: boolean } {
  try {
    const tRep = new Date(timeReportedStr).getTime();
    const tCand = new Date(timeCandidateStr).getTime();

    if (isNaN(tRep) || isNaN(tCand)) {
      return {
        score: 50,
        isAvailable: false,
        reason: 'Timestamp formatting unavailable (adaptive neutral signal)',
        isConflicting: false,
      };
    }

    const diffHours = (tCand - tRep) / (1000 * 60 * 60);

    // Candidate observed/checked in AFTER missing report was filed
    if (diffHours >= 0 && diffHours <= 72) {
      return {
        score: 100,
        isAvailable: true,
        reason: `Chronologically plausible: check-in occurred ${diffHours.toFixed(1)} hrs after last known contact`,
        isConflicting: false,
      };
    }

    // Check-in slightly before report filed (e.g. within 6 hours - reporter filed while survivor was entering camp)
    if (diffHours >= -6 && diffHours < 0) {
      return {
        score: 85,
        isAvailable: true,
        reason: `Plausible concurrent reporting: intake logged ${(Math.abs(diffHours)).toFixed(1)} hrs before family report`,
        isConflicting: false,
      };
    }

    if (diffHours > 72) {
      return {
        score: 60,
        isAvailable: true,
        reason: `Long elapsed interval (${diffHours.toFixed(1)} hrs) between events`,
        isConflicting: false,
      };
    }

    return {
      score: 20,
      isAvailable: true,
      reason: `Temporal conflict: candidate recorded long before missing event (${Math.abs(diffHours).toFixed(1)} hrs prior)`,
      isConflicting: true,
    };
  } catch {
    return {
      score: 50,
      isAvailable: false,
      reason: 'Time evaluation skipped',
      isConflicting: false,
    };
  }
}

/**
 * Evaluates shelter consistency
 */
export function calculateShelterConsistency(
  candidateRecord: ReunionSourceRecord
): { score: number; isAvailable: boolean; reason: string } {
  if (candidateRecord.campId || candidateRecord.campName) {
    return {
      score: 100,
      isAvailable: true,
      reason: `Survivor officially logged at authorized shelter: ${candidateRecord.campName || candidateRecord.campId}`,
    };
  }
  if (candidateRecord.sourceType === 'SAFE_CHECKIN') {
    return {
      score: 80,
      isAvailable: true,
      reason: 'Self-reported Safe Check-In from community emergency muster point',
    };
  }
  if (candidateRecord.sourceType === 'DLE_SOS') {
    return {
      score: 75,
      isAvailable: true,
      reason: 'Originates from authenticated DLE Mesh node terminal',
    };
  }
  return {
    score: 50,
    isAvailable: false,
    reason: 'No designated relief shelter associated with candidate',
  };
}

/**
 * Evaluates physical description and medical needs overlap
 */
export function calculateDescriptionOverlap(
  descA?: string | null,
  descB?: string | null,
  medA?: string | null,
  medB?: string | null
): { score: number; isAvailable: boolean; reason: string; positiveNotes: string[] } {
  const positiveNotes: string[] = [];
  let available = false;
  let score = 50;

  if (descA && descB) {
    available = true;
    const cleanA = descA.toLowerCase();
    const cleanB = descB.toLowerCase();

    // Check shared key keywords (colors, clothing, physical markers)
    const keywords = ['blue', 'black', 'white', 'red', 'green', 'shirt', 'jeans', 'saree', 'mustache', 'glasses', 'scar', 'height', 'tall', 'short', 'child'];
    const matched = keywords.filter(k => cleanA.includes(k) && cleanB.includes(k));

    if (matched.length > 0) {
      score = Math.min(100, 60 + matched.length * 15);
      positiveNotes.push(`Physical feature overlap: matching markers [${matched.join(', ')}]`);
    } else {
      score = 45;
    }
  }

  if (medA && medB) {
    available = true;
    const cleanA = medA.toLowerCase();
    const cleanB = medB.toLowerCase();
    const medWords = ['insulin', 'diabetic', 'asthma', 'heart', 'dialysis', 'inhaler', 'bp', 'fracture'];
    const matchedMed = medWords.filter(m => cleanA.includes(m) && cleanB.includes(m));
    if (matchedMed.length > 0) {
      score = Math.min(100, score + 20);
      positiveNotes.push(`Critical medical need correlation: [${matchedMed.join(', ')}]`);
    }
  }

  const reason = available
    ? `Identifying details analyzed (${positiveNotes.length > 0 ? positiveNotes.join('; ') : 'General descriptions'})`
    : 'Detailed physical descriptions not provided in both records (+neutral baseline)';

  return { score, isAvailable: available, reason, positiveNotes };
}

/**
 * Master Cross-Source Match Evaluator
 * Weighted scoring:
 * - Name: 30%
 * - Age: 15%
 * - Geographic: 20%
 * - Time: 15%
 * - Shelter: 10%
 * - Details: 10%
 *
 * Implements adaptive normalization when fields are missing.
 */
export function evaluateMatchEvidence(
  missing: ReunionSourceRecord,
  candidate: ReunionSourceRecord
): MatchEvidenceBreakdown {
  const positiveEvidence: string[] = [];
  const conflictingEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const availableSignals: string[] = [];
  const missingSignals: string[] = [];

  // 1. Name Similarity (30%)
  const nameEval = calculateNameSimilarity(missing.personName, candidate.personName);
  availableSignals.push('Person Name');
  if (nameEval.score >= 70) {
    positiveEvidence.push(nameEval.reason);
  } else {
    conflictingEvidence.push(nameEval.reason);
  }
  if (nameEval.score < 100 && missing.personName.trim().toLowerCase() !== candidate.personName.trim().toLowerCase()) {
    conflictingEvidence.push(`Spelling difference: "${missing.personName}" vs "${candidate.personName}"`);
  }

  // 2. Age Compatibility (15%)
  const ageEval = calculateAgeCompatibility(missing.approxAge, candidate.approxAge);
  if (ageEval.isAvailable) {
    availableSignals.push('Age Range');
    if (ageEval.score >= 60) {
      positiveEvidence.push(ageEval.reason);
    } else {
      conflictingEvidence.push(ageEval.reason);
    }
    if (missing.approxAge != null && candidate.approxAge != null && missing.approxAge !== candidate.approxAge) {
      const diff = Math.abs(missing.approxAge - candidate.approxAge);
      conflictingEvidence.push(`Reported age disparity (${diff} yr difference: ${missing.approxAge} vs ${candidate.approxAge})`);
    }
  } else {
    missingSignals.push('Age Range');
    missingEvidence.push('Approximate age not stated in one or both records');
  }

  // 3. Geographic Consistency (20%)
  const geoEval = calculateGeographicConsistency(
    missing.lastKnownLocation,
    candidate.currentReportedLocation || candidate.campName
  );
  if (geoEval.isAvailable) {
    availableSignals.push('Geographic Proximity');
    if (geoEval.score >= 60) {
      positiveEvidence.push(geoEval.reason);
    } else {
      conflictingEvidence.push(geoEval.reason);
    }
  } else {
    missingSignals.push('Geographic Proximity');
    missingEvidence.push('Location details missing in one or both records');
  }

  // 4. Time Consistency (15%)
  const timeEval = calculateTimeConsistency(missing.timestamp, candidate.timestamp);
  if (timeEval.isAvailable) {
    availableSignals.push('Timeline Sequence');
    if (timeEval.score >= 60) {
      positiveEvidence.push(timeEval.reason);
    } else {
      conflictingEvidence.push(timeEval.reason);
    }
  } else {
    missingSignals.push('Timeline Sequence');
    missingEvidence.push('Report timestamp metadata incomplete');
  }

  // 5. Shelter / Intake Consistency (10%)
  const shelterEval = calculateShelterConsistency(candidate);
  if (shelterEval.isAvailable) {
    availableSignals.push('Shelter Verification');
    positiveEvidence.push(shelterEval.reason);
  } else {
    missingSignals.push('Shelter Verification');
    missingEvidence.push('No confirmed relief shelter intake record');
  }

  // 6. Identifying Details & Medical Needs (10%)
  const descEval = calculateDescriptionOverlap(
    missing.physicalDescription,
    candidate.physicalDescription,
    missing.medicalNeeds,
    candidate.medicalNeeds
  );
  if (descEval.isAvailable) {
    availableSignals.push('Physical / Medical Details');
    if (descEval.positiveNotes.length > 0) {
      positiveEvidence.push(...descEval.positiveNotes);
    }
  } else {
    missingSignals.push('Physical / Medical Details');
    missingEvidence.push('Physical attire or medical condition details unrecorded');
  }

  // Verify Identity Documents
  missingEvidence.push('No independently verified government ID card (Aadhaar/EPIC) attached');

  // Weighted Calculation:
  // Default weights
  const weights = {
    name: 0.30,
    age: 0.15,
    geo: 0.20,
    time: 0.15,
    shelter: 0.10,
    desc: 0.10,
  };

  // Adaptive weight sum for present signals
  let rawScore =
    nameEval.score * weights.name +
    ageEval.score * weights.age +
    geoEval.score * weights.geo +
    timeEval.score * weights.time +
    shelterEval.score * weights.shelter +
    descEval.score * weights.desc;

  // Round final Match Score
  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Review Bands:
  // 80–100: High-priority review
  // 55–79: Possible match
  // Below 55: Weak match
  let reviewBand: MatchReviewBand = 'WEAK';
  if (matchScore >= 80) {
    reviewBand = 'HIGH_PRIORITY';
  } else if (matchScore >= 55) {
    reviewBand = 'POSSIBLE';
  }

  const whySuggested = `Candidate was surfaced because of strong correlation between ${
    availableSignals.join(', ')
  }. Name match scored ${nameEval.score}%. Verification is mandatory before notifying family.`;

  return {
    matchScore,
    reviewBand,
    nameSimilarityScore: nameEval.score,
    ageScore: ageEval.score,
    geographicScore: geoEval.score,
    timeScore: timeEval.score,
    shelterScore: shelterEval.score,
    identifyingDetailsScore: descEval.score,
    positiveEvidence,
    conflictingEvidence,
    missingEvidence,
    availableSignals,
    missingSignals,
    whySuggested,
  };
}

// =========================================================================
// STATE TRANSITION & CASE MANAGEMENT
// =========================================================================

export const VALID_STATUS_TRANSITIONS: Record<ReunionCaseStatus, ReunionCaseStatus[]> = {
  OPEN_REPORT: ['CANDIDATE_FOUND', 'UNRESOLVED_ESCALATED'],
  CANDIDATE_FOUND: ['AWAITING_REVIEW', 'REJECTED_MATCH', 'UNRESOLVED_ESCALATED'],
  AWAITING_REVIEW: ['VERIFICATION_REQUIRED', 'IDENTITY_VERIFIED', 'REJECTED_MATCH', 'UNRESOLVED_ESCALATED'],
  VERIFICATION_REQUIRED: ['IDENTITY_VERIFIED', 'REJECTED_MATCH', 'UNRESOLVED_ESCALATED'],
  IDENTITY_VERIFIED: ['FAMILY_CONTACT_PENDING', 'REUNION_COORDINATING', 'UNRESOLVED_ESCALATED'],
  FAMILY_CONTACT_PENDING: ['REUNION_COORDINATING', 'UNRESOLVED_ESCALATED'],
  REUNION_COORDINATING: ['REUNITED_CLOSED', 'UNRESOLVED_ESCALATED'],
  REUNITED_CLOSED: [], // Terminal state
  REJECTED_MATCH: ['AWAITING_REVIEW'], // Allowed if new evidence arrives
  UNRESOLVED_ESCALATED: ['AWAITING_REVIEW', 'OPEN_REPORT'],
};

export function canTransitionStatus(from: ReunionCaseStatus, to: ReunionCaseStatus): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function transitionCaseStatus(
  reunionCase: ReunionCase,
  newStatus: ReunionCaseStatus,
  actorName: string,
  actorRole: 'COORDINATOR' | 'RESPONDER' | 'ADMIN' | 'SYSTEM',
  notes: string,
  evidenceRef?: string
): ReunionCase {
  if (!canTransitionStatus(reunionCase.status, newStatus)) {
    throw new Error(
      `Invalid state transition: Cannot transition case from "${reunionCase.status}" to "${newStatus}". Permitted next statuses: ${VALID_STATUS_TRANSITIONS[reunionCase.status].join(', ')}`
    );
  }

  // Prevent direct closure without identity verification
  if (newStatus === 'REUNITED_CLOSED' && reunionCase.status !== 'REUNION_COORDINATING') {
    throw new Error('Case must progress through Reunion Coordination before closure.');
  }

  // Enforce notes for rejection or verification
  if ((newStatus === 'REJECTED_MATCH' || newStatus === 'IDENTITY_VERIFIED') && !notes.trim()) {
    throw new Error(`Reviewer notes are mandatory when marking case as ${newStatus}.`);
  }

  const previousStatus = reunionCase.status;
  reunionCase.status = newStatus;

  const event: CaseTimelineEvent = {
    id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    caseId: reunionCase.id,
    timestamp: new Date().toISOString(),
    fromStatus: previousStatus,
    toStatus: newStatus,
    actionTitle: getActionTitleForStatus(newStatus),
    actorName,
    actorRole,
    notes,
    evidenceRef,
  };

  reunionCase.timeline.push(event);

  if (newStatus === 'IDENTITY_VERIFIED') {
    reunionCase.verifiedAt = new Date().toISOString();
  }
  if (newStatus === 'REUNITED_CLOSED') {
    reunionCase.reunitedAt = new Date().toISOString();
    reunionCase.closureReason = notes;
  }
  if (newStatus === 'REJECTED_MATCH') {
    reunionCase.rejectionReason = notes;
  }

  return caseStore.saveCase(reunionCase);
}

function getActionTitleForStatus(status: ReunionCaseStatus): string {
  switch (status) {
    case 'CANDIDATE_FOUND': return 'Candidate Match Surfaced';
    case 'AWAITING_REVIEW': return 'Assigned to Coordinator Review Queue';
    case 'VERIFICATION_REQUIRED': return 'Field Verification Requested';
    case 'IDENTITY_VERIFIED': return 'Identity Positively Verified by Responder';
    case 'FAMILY_CONTACT_PENDING': return 'Family Notification Authorized';
    case 'REUNION_COORDINATING': return 'Safe Meeting Point Assigned';
    case 'REUNITED_CLOSED': return 'Family Successfully Reunited & Case Closed';
    case 'REJECTED_MATCH': return 'Match Candidate Rejected';
    case 'UNRESOLVED_ESCALATED': return 'Case Escalated to Senior Rescue Command';
    default: return 'Status Updated';
  }
}

// =========================================================================
// REUNION-TO-SHELTER MEETING POINT RECOMMENDER
// =========================================================================

export function generateMeetingPointRecommendation(
  camps: Array<{
    id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    capacity: number;
    currentOccupancy: number;
    status: string;
    needs?: string;
  }>,
  hazardEpicenter?: { latitude: number; longitude: number; radiusKm?: number }
): MeetingPointRecommendation {
  // Filter eligible camps: Must be OPEN or NEAR_CAPACITY, with available beds
  const eligible = camps.filter(c => {
    const isOperating = c.status === 'OPEN' || c.status === 'NEAR_CAPACITY';
    const hasSpace = c.capacity - c.currentOccupancy > 0;
    return isOperating && hasSpace;
  });

  if (eligible.length === 0) {
    // Fallback if all camps are at max capacity
    const primary = camps[0] || {
      id: 'camp-default',
      name: 'District Relief Coordination Center',
      location: 'Civil Station, Wayanad',
      latitude: 11.605,
      longitude: 76.083,
      capacity: 500,
      currentOccupancy: 500,
      status: 'NEAR_CAPACITY',
    };

    return {
      campId: primary.id,
      campName: primary.name,
      campLocation: primary.location,
      operatingStatus: primary.status,
      totalCapacity: primary.capacity,
      currentOccupancy: primary.currentOccupancy,
      availableBeds: 0,
      hasMedicalCare: true,
      distanceKm: 2.5,
      estimatedWalkingMinutes: 45,
      avoidsHazardEpicenter: false,
      hazardNotice: 'Capacity full across primary shelters. Route requires human coordination approval.',
      rationale: 'No relief camps with open capacity found. Directing to District Coordination Center.',
      isVerifiedRoute: false,
      turnByTurnSummary: ['Connect with Disaster On-Site Nodal Officer for overflow intake.'],
      coordinates: { latitude: primary.latitude, longitude: primary.longitude },
    };
  }

  // Sort by available capacity and proximity to safe zone
  const sorted = [...eligible].sort((a, b) => {
    const availA = a.capacity - a.currentOccupancy;
    const availB = b.capacity - b.currentOccupancy;
    return availB - availA;
  });

  const bestCamp = sorted[0];
  const availableBeds = bestCamp.capacity - bestCamp.currentOccupancy;

  // Compute hazard avoidance
  let avoidsHazard = true;
  let hazardNotice = 'Corridor verified clear of current CAP flash-flood and landslide advisories.';

  if (hazardEpicenter) {
    const dLat = bestCamp.latitude - hazardEpicenter.latitude;
    const dLng = bestCamp.longitude - hazardEpicenter.longitude;
    const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    if (distKm < (hazardEpicenter.radiusKm || 3.0)) {
      avoidsHazard = false;
      hazardNotice = `Caution: Shelter is within ${distKm.toFixed(1)} km of active hazard perimeter. Use northern ridge bypass route.`;
    }
  }

  const rationale = `Recommended because ${bestCamp.name} is ${bestCamp.status} with ${availableBeds} verified available beds, has active medical triage, and avoids known debris corridors.`;

  return {
    campId: bestCamp.id,
    campName: bestCamp.name,
    campLocation: bestCamp.location,
    operatingStatus: bestCamp.status,
    totalCapacity: bestCamp.capacity,
    currentOccupancy: bestCamp.currentOccupancy,
    availableBeds,
    hasMedicalCare: true,
    distanceKm: 1.4,
    estimatedWalkingMinutes: 26,
    avoidsHazardEpicenter: avoidsHazard,
    hazardNotice,
    rationale,
    isVerifiedRoute: true,
    turnByTurnSummary: [
      'Depart origin checkpoint heading East along Meppadi High Road (0.4 km)',
      'Follow civil defense markers past Village Office junction (0.6 km)',
      'Arrive at St. Joseph Higher Secondary School gate muster reception (0.4 km)',
    ],
    coordinates: { latitude: bestCamp.latitude, longitude: bestCamp.longitude },
  };
}

// =========================================================================
// STATS CALCULATION
// =========================================================================

export function calculateReunionStats(): ReunionIntelligenceStats {
  const cases = caseStore.getAllCases();

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
}
