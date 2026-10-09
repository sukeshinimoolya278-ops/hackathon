import { PriorityFlag, Camp } from './index';

export type ReunionCaseStatus =
  | 'OPEN_REPORT'              // 1. Open Missing-Person Report
  | 'CANDIDATE_FOUND'          // 2. Candidate Match Found
  | 'AWAITING_REVIEW'          // 3. Awaiting Human Review
  | 'VERIFICATION_REQUIRED'    // 4. Additional Verification Required
  | 'IDENTITY_VERIFIED'        // 5. Identity Verified
  | 'FAMILY_CONTACT_PENDING'   // 6. Family Contact Pending
  | 'REUNION_COORDINATING'     // 7. Reunion Coordination
  | 'REUNITED_CLOSED'          // 8. Reunited / Case Closed
  | 'REJECTED_MATCH'           // 9. Rejected Match
  | 'UNRESOLVED_ESCALATED';    // 10. Unresolved / Escalated

export type RecordSourceType =
  | 'MISSING_REPORT'
  | 'SAFE_CHECKIN'
  | 'SIGHTING'
  | 'SHELTER_INTAKE'
  | 'DLE_SOS';

export type MatchReviewBand = 'HIGH_PRIORITY' | 'POSSIBLE' | 'WEAK';

export interface ReunionSourceRecord {
  id: string;
  sourceType: RecordSourceType;
  sourceReferenceCode: string;
  personName: string;
  alternativeNames: string[];
  approxAge?: number | null;
  gender?: string;
  physicalDescription?: string | null;
  medicalNeeds?: string | null;
  priorityFlag: PriorityFlag;
  lastKnownLocation?: string | null;
  currentReportedLocation?: string | null;
  campId?: string | null;
  campName?: string | null;
  reporterOrContactName?: string | null;
  reporterOrContactPhone?: string | null;
  relationshipToPerson?: string | null;
  timestamp: string;
  isVerifiedFact: boolean;
  notes?: string | null;
  privacyConsent: {
    consentGiven: boolean;
    shareLocationAllowed: boolean;
    shareContactAllowed: boolean;
  };
  rawMetadata?: Record<string, any>;
}

export interface MatchEvidenceBreakdown {
  matchScore: number; // 0 - 100
  reviewBand: MatchReviewBand;
  nameSimilarityScore: number;     // 30% weight
  ageScore: number;                // 15% weight
  geographicScore: number;         // 20% weight
  timeScore: number;               // 15% weight
  shelterScore: number;            // 10% weight
  identifyingDetailsScore: number; // 10% weight
  positiveEvidence: string[];
  conflictingEvidence: string[];
  missingEvidence: string[];
  availableSignals: string[];
  missingSignals: string[];
  whySuggested: string;
}

export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  fromStatus?: ReunionCaseStatus;
  toStatus: ReunionCaseStatus;
  actionTitle: string;
  actorName: string;
  actorRole: 'COORDINATOR' | 'RESPONDER' | 'ADMIN' | 'SYSTEM';
  notes: string;
  evidenceRef?: string;
}

export interface FamilyNotificationRecord {
  id: string;
  caseId: string;
  recipientName: string;
  recipientPhoneMasked: string;
  messagePreview: string;
  status: 'DRAFT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: string;
  sentAt?: string | null;
  dispatchedBy: string;
  channel: 'IN_APP_DISPATCH' | 'SMS_GATEWAY';
}

export interface MeetingPointRecommendation {
  campId: string;
  campName: string;
  campLocation: string;
  operatingStatus: string;
  totalCapacity: number;
  currentOccupancy: number;
  availableBeds: number;
  hasMedicalCare: boolean;
  distanceKm: number;
  estimatedWalkingMinutes: number;
  avoidsHazardEpicenter: boolean;
  hazardNotice: string;
  rationale: string;
  isVerifiedRoute: boolean;
  turnByTurnSummary: string[];
  coordinates: { latitude: number; longitude: number };
}

export interface ReunionCase {
  id: string;
  caseCode: string; // e.g. "RC-2024-8801"
  status: ReunionCaseStatus;
  missingReport: ReunionSourceRecord;
  candidateRecord?: ReunionSourceRecord | null;
  linkedSourceRecords: ReunionSourceRecord[];
  matchEvidence?: MatchEvidenceBreakdown | null;
  timeline: CaseTimelineEvent[];
  notification?: FamilyNotificationRecord | null;
  recommendedMeetingPoint?: MeetingPointRecommendation | null;
  selectedMeetingPointId?: string | null;
  meetingPointOverrideReason?: string | null;
  assignedResponder?: string | null;
  reviewerNotes?: string | null;
  verifiedAt?: string | null;
  reunitedAt?: string | null;
  closureReason?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  isDemoCase?: boolean;
}

export interface ReunionIntelligenceStats {
  openCasesCount: number;
  unreviewedCandidatesCount: number;
  awaitingVerificationCount: number;
  verifiedReunionsCount: number;
  unresolvedEscalatedCount: number;
  pendingNotificationsCount: number;
  avgMatchScore: number;
}
