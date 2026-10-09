import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNameSimilarity,
  calculateAgeCompatibility,
  calculateGeographicConsistency,
  calculateTimeConsistency,
  evaluateMatchEvidence,
  canTransitionStatus,
  transitionCaseStatus,
  generateMeetingPointRecommendation,
  caseStore,
} from '../src/services/reunionIntelligenceEngine';
import { ReunionCase, ReunionSourceRecord } from '../src/types/reunionIntelligence';

describe('Verified Reunion Intelligence Matching Algorithm', () => {
  it('should award 100% for exact name match', () => {
    const res = calculateNameSimilarity('Arjun Kumar', 'Arjun Kumar');
    expect(res.score).toBe(100);
    expect(res.reason).toContain('Exact name match');
  });

  it('should detect minor spelling differences via Levenshtein edit distance', () => {
    // "Arjun Kumar" vs "Arjun Kumra" (1 edit distance: 'ar' vs 'ra')
    const res = calculateNameSimilarity('Arjun Kumar', 'Arjun Kumra');
    expect(res.score).toBeGreaterThanOrEqual(88);
    expect(res.reason).toContain('Minor spelling variation');
  });

  it('should normalize South Asian transliterations', () => {
    // "Karthick" vs "Kartik", "Laxmi" vs "Lakshmi"
    const res = calculateNameSimilarity('Karthick Raja', 'Kartik Raja');
    expect(res.score).toBeGreaterThanOrEqual(90);
  });

  it('should evaluate age compatibility and penalize extreme conflict', () => {
    const exactAge = calculateAgeCompatibility(30, 30);
    expect(exactAge.score).toBe(100);
    expect(exactAge.isConflicting).toBe(false);

    const closeAge = calculateAgeCompatibility(30, 29);
    expect(closeAge.score).toBe(90);
    expect(closeAge.isConflicting).toBe(false);

    const conflictingAge = calculateAgeCompatibility(30, 75);
    expect(conflictingAge.score).toBe(0);
    expect(conflictingAge.isConflicting).toBe(true);

    const missingAge = calculateAgeCompatibility(null, 30);
    expect(missingAge.score).toBe(50); // adaptive neutral
    expect(missingAge.isAvailable).toBe(false);
  });

  it('should evaluate geographic consistency and handle missing locations adaptively', () => {
    const exactLoc = calculateGeographicConsistency('Meppadi Town', 'Meppadi Town');
    expect(exactLoc.score).toBe(100);

    const tokenOverlap = calculateGeographicConsistency('Meppadi Bus Stop', 'Meppadi Town Relief Center');
    expect(tokenOverlap.score).toBe(80);

    const missingLoc = calculateGeographicConsistency(null, 'Meppadi');
    expect(missingLoc.score).toBe(50);
    expect(missingLoc.isAvailable).toBe(false);

    const conflictingLoc = calculateGeographicConsistency('Chennai Marina Beach', 'Wayanad Meppadi');
    expect(conflictingLoc.score).toBe(25);
    expect(conflictingLoc.isConflicting).toBe(true);
  });

  it('should evaluate chronological sequence plausibility', () => {
    // Check-in at 10:15 AM after last contact at 08:30 AM
    const res = calculateTimeConsistency(
      '2026-10-08T08:30:00.000Z',
      '2026-10-08T10:15:00.000Z'
    );
    expect(res.score).toBe(100);
    expect(res.isConflicting).toBe(false);
  });

  it('should produce an explainable MatchEvidenceBreakdown with review bands', () => {
    const missing: ReunionSourceRecord = {
      id: 'm1',
      sourceType: 'MISSING_REPORT',
      sourceReferenceCode: 'MIS-101',
      personName: 'Arjun Kumar',
      alternativeNames: [],
      approxAge: 30,
      gender: 'MALE',
      physicalDescription: 'Blue shirt, dark jeans',
      medicalNeeds: 'Mild asthma',
      priorityFlag: 'NONE',
      lastKnownLocation: 'Meppadi',
      currentReportedLocation: null,
      timestamp: '2026-10-08T08:30:00.000Z',
      isVerifiedFact: false,
      privacyConsent: { consentGiven: true, shareLocationAllowed: true, shareContactAllowed: true },
    };

    const candidate: ReunionSourceRecord = {
      id: 'c1',
      sourceType: 'SAFE_CHECKIN',
      sourceReferenceCode: 'CHK-202',
      personName: 'Arjun Kumra',
      alternativeNames: [],
      approxAge: 29,
      gender: 'MALE',
      physicalDescription: 'Blue shirt, safe',
      medicalNeeds: null,
      priorityFlag: 'NONE',
      lastKnownLocation: null,
      currentReportedLocation: 'St. Joseph Relief Camp, Meppadi',
      campId: 'camp-1',
      campName: 'St. Joseph Relief Camp',
      timestamp: '2026-10-08T10:15:00.000Z',
      isVerifiedFact: true,
      privacyConsent: { consentGiven: true, shareLocationAllowed: true, shareContactAllowed: true },
    };

    const evidence = evaluateMatchEvidence(missing, candidate);

    // Score should be high (80+)
    expect(evidence.matchScore).toBeGreaterThanOrEqual(80);
    expect(evidence.reviewBand).toBe('HIGH_PRIORITY');
    expect(evidence.positiveEvidence.length).toBeGreaterThanOrEqual(3);
    expect(evidence.conflictingEvidence.length).toBeGreaterThanOrEqual(1); // notes the spelling/age variance
    expect(evidence.whySuggested).toBeDefined();
  });
});

describe('Reunion Case Workflow State Machine', () => {
  it('should allow valid sequential transitions', () => {
    expect(canTransitionStatus('OPEN_REPORT', 'CANDIDATE_FOUND')).toBe(true);
    expect(canTransitionStatus('CANDIDATE_FOUND', 'AWAITING_REVIEW')).toBe(true);
    expect(canTransitionStatus('AWAITING_REVIEW', 'IDENTITY_VERIFIED')).toBe(true);
    expect(canTransitionStatus('IDENTITY_VERIFIED', 'FAMILY_CONTACT_PENDING')).toBe(true);
    expect(canTransitionStatus('FAMILY_CONTACT_PENDING', 'REUNION_COORDINATING')).toBe(true);
    expect(canTransitionStatus('REUNION_COORDINATING', 'REUNITED_CLOSED')).toBe(true);
  });

  it('should reject invalid state transitions', () => {
    // Cannot jump from OPEN_REPORT directly to REUNITED_CLOSED
    expect(canTransitionStatus('OPEN_REPORT', 'REUNITED_CLOSED')).toBe(false);
    // Cannot jump from CANDIDATE_FOUND directly to REUNITED_CLOSED without human review
    expect(canTransitionStatus('CANDIDATE_FOUND', 'REUNITED_CLOSED')).toBe(false);
    // Terminal state has no transitions
    expect(canTransitionStatus('REUNITED_CLOSED', 'OPEN_REPORT')).toBe(false);
  });

  it('should throw an error on attempting illegal transition', () => {
    const testCase: ReunionCase = {
      id: 'test-case-1',
      caseCode: 'RC-TEST-1',
      status: 'OPEN_REPORT',
      missingReport: {
        id: 'm1',
        sourceType: 'MISSING_REPORT',
        sourceReferenceCode: 'MIS-1',
        personName: 'Test Person',
        alternativeNames: [],
        priorityFlag: 'NONE',
        timestamp: new Date().toISOString(),
        isVerifiedFact: false,
        privacyConsent: { consentGiven: true, shareLocationAllowed: true, shareContactAllowed: true },
      },
      linkedSourceRecords: [],
      timeline: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => {
      transitionCaseStatus(
        testCase,
        'REUNITED_CLOSED',
        'Coordinator',
        'COORDINATOR',
        'Premature closing'
      );
    }).toThrow(/Invalid state transition/);
  });

  it('should enforce reviewer notes when verifying identity or rejecting match', () => {
    const testCase: ReunionCase = {
      id: 'test-case-2',
      caseCode: 'RC-TEST-2',
      status: 'AWAITING_REVIEW',
      missingReport: {
        id: 'm2',
        sourceType: 'MISSING_REPORT',
        sourceReferenceCode: 'MIS-2',
        personName: 'Test Person',
        alternativeNames: [],
        priorityFlag: 'NONE',
        timestamp: new Date().toISOString(),
        isVerifiedFact: false,
        privacyConsent: { consentGiven: true, shareLocationAllowed: true, shareContactAllowed: true },
      },
      linkedSourceRecords: [],
      timeline: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => {
      transitionCaseStatus(
        testCase,
        'IDENTITY_VERIFIED',
        'Coordinator',
        'COORDINATOR',
        '' // Empty notes
      );
    }).toThrow(/Reviewer notes are mandatory/);
  });
});

describe('Hazard-Aware Meeting Point Recommendation', () => {
  it('should select shelter with available capacity and avoid full shelters', () => {
    const camps = [
      {
        id: 'camp-full',
        name: 'Full Relief Shelter',
        location: 'Zone 1',
        latitude: 11.55,
        longitude: 76.12,
        capacity: 400,
        currentOccupancy: 400, // 0 beds left
        status: 'FULL',
      },
      {
        id: 'camp-open',
        name: 'Open St. Joseph Shelter',
        location: 'Zone 2',
        latitude: 11.56,
        longitude: 76.13,
        capacity: 500,
        currentOccupancy: 300, // 200 beds left
        status: 'OPEN',
      },
    ];

    const recommendation = generateMeetingPointRecommendation(camps);
    expect(recommendation.campId).toBe('camp-open');
    expect(recommendation.availableBeds).toBe(200);
    expect(recommendation.isVerifiedRoute).toBe(true);
  });
});

describe('DLE Mesh SOS Packet Deduplication', () => {
  it('should deduplicate repeated SOS packets', () => {
    caseStore.markSosProcessed('sos-packet-uuid-101');
    expect(caseStore.isSosProcessed('sos-packet-uuid-101')).toBe(true);
    expect(caseStore.isSosProcessed('sos-packet-uuid-new')).toBe(false);
  });
});
