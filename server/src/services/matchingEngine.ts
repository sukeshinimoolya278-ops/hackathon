import { prisma } from '../prisma';
import {
  calculateNameMatchScore,
  calculateAgeScore,
  calculateGenderScore,
  calculateDescriptionScore,
} from '../utils/fuzzy';

export interface MatchResult {
  confidenceScore: number;
  matchReason: string;
  explanation: string;
  isFallback: boolean;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

/**
 * Computes location similarity score (0 to 15 points)
 */
function calculateLocationScore(loc1?: string | null, loc2?: string | null): { score: number; reason: string } {
  if (!loc1 || !loc2) {
    return { score: 5, reason: 'Location not specified in both records (+5 neutral)' };
  }
  const clean1 = loc1.toLowerCase().trim();
  const clean2 = loc2.toLowerCase().trim();

  if (clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1)) {
    return { score: 15, reason: `Exact or subset location match: "${loc1}" & "${loc2}"` };
  }

  // Token overlap (e.g. "Velachery Bus Stand" vs "Velachery Main Road")
  const tokens1 = clean1.split(/\s+/).filter(w => w.length > 2);
  const tokens2 = new Set(clean2.split(/\s+/).filter(w => w.length > 2));
  const common = tokens1.filter(t => tokens2.has(t));

  if (common.length > 0) {
    return { score: 10, reason: `Area/district overlap: ${common.join(', ')}` };
  }

  return { score: 2, reason: `Different locations: "${loc1}" vs "${loc2}"` };
}

/**
 * Evaluates match between a MissingReport and a ShelterEntry
 */
export function evaluateMissingToShelter(
  missing: {
    id: string;
    person: {
      fullName: string;
      approxAge?: number | null;
      gender: string;
      physicalDesc?: string | null;
      priorityFlag?: string | null;
      familyGroupId?: string | null;
    };
    lastSeenLocation?: string | null;
  },
  shelter: {
    id: string;
    camp: { name: string; location: string };
    person: {
      fullName: string;
      approxAge?: number | null;
      gender: string;
      physicalDesc?: string | null;
      priorityFlag?: string | null;
      familyGroupId?: string | null;
    };
  }
): MatchResult {
  const reasons: string[] = [];

  // 1. Name match (35% max)
  const nameResult = calculateNameMatchScore(missing.person.fullName, shelter.person.fullName);
  const namePoints = Math.round((nameResult.score / 100) * 35);
  reasons.push(nameResult.reason);

  // 2. Age match (15% max)
  const ageResult = calculateAgeScore(missing.person.approxAge, shelter.person.approxAge);
  reasons.push(ageResult.reason);

  // 3. Gender match (15% max)
  const genderResult = calculateGenderScore(missing.person.gender, shelter.person.gender);
  reasons.push(genderResult.reason);

  // 4. Location match (15% max)
  const locResult = calculateLocationScore(missing.lastSeenLocation, shelter.camp.location);
  reasons.push(locResult.reason);

  // 5. Family / Group overlap (15% max)
  let groupPoints = 0;
  if (
    missing.person.familyGroupId &&
    shelter.person.familyGroupId &&
    missing.person.familyGroupId === shelter.person.familyGroupId
  ) {
    groupPoints = 15;
    reasons.push('Linked to the exact same family token/group (+15)');
  } else {
    groupPoints = 5; // standard individual intake
  }

  // 6. Physical description (5% max)
  const descResult = calculateDescriptionScore(missing.person.physicalDesc, shelter.person.physicalDesc);
  if (descResult.score > 0) reasons.push(descResult.reason);

  const totalScore = Math.min(
    100,
    namePoints + ageResult.score + genderResult.score + locResult.score + groupPoints + descResult.score
  );

  // Determine priority
  let priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL';
  const flag = missing.person.priorityFlag || shelter.person.priorityFlag;
  if (flag === 'CHILD_ALONE') priority = 'URGENT';
  else if (flag === 'CRITICAL_MEDICAL' || flag === 'ELDERLY') priority = 'HIGH';
  else if (totalScore >= 80) priority = 'HIGH';

  const explanation = `Evaluated against official camp roster at ${shelter.camp.name}. Details: ${reasons.join('; ')}.`;
  const matchReason = `Direct match at ${shelter.camp.name} (${totalScore}% confidence)`;

  return {
    confidenceScore: totalScore,
    matchReason,
    explanation,
    isFallback: false,
    priority,
  };
}

/**
 * Evaluates match between a MissingReport and a Sighting (Eyewitness report)
 */
export function evaluateMissingToSighting(
  missing: {
    id: string;
    person: {
      fullName: string;
      approxAge?: number | null;
      gender: string;
      physicalDesc?: string | null;
      priorityFlag?: string | null;
    };
    lastSeenLocation?: string | null;
  },
  sighting: {
    id: string;
    sightedName?: string | null;
    approxAge?: number | null;
    gender: string;
    sightingLocation: string;
    directionHeading?: string | null;
    notes?: string | null;
  }
): MatchResult {
  const reasons: string[] = [];

  // Name match (35%)
  const nameResult = calculateNameMatchScore(missing.person.fullName, sighting.sightedName || '');
  const namePoints = Math.round((nameResult.score / 100) * 35);
  reasons.push(nameResult.reason);

  // Age match (15%)
  const ageResult = calculateAgeScore(missing.person.approxAge, sighting.approxAge);
  reasons.push(ageResult.reason);

  // Gender match (15%)
  const genderResult = calculateGenderScore(missing.person.gender, sighting.gender);
  reasons.push(genderResult.reason);

  // Location match (15%)
  const locResult = calculateLocationScore(missing.lastSeenLocation, sighting.sightingLocation);
  reasons.push(locResult.reason);

  // Group / Heading fallback bonus (15%)
  let groupPoints = 5;
  let isFallback = false;
  if (sighting.directionHeading && sighting.directionHeading.toLowerCase().includes('shelter')) {
    isFallback = true;
    groupPoints = 12;
    reasons.push(`Witness observed person heading towards: "${sighting.directionHeading}"`);
  }

  // Description / Notes (5%)
  const descResult = calculateDescriptionScore(missing.person.physicalDesc, sighting.notes);
  if (descResult.score > 0) reasons.push(descResult.reason);

  const totalScore = Math.min(
    100,
    namePoints + ageResult.score + genderResult.score + locResult.score + groupPoints + descResult.score
  );

  let priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL';
  if (missing.person.priorityFlag === 'CHILD_ALONE') priority = 'URGENT';
  else if (missing.person.priorityFlag === 'CRITICAL_MEDICAL' || missing.person.priorityFlag === 'ELDERLY') priority = 'HIGH';
  else if (totalScore >= 75) priority = 'HIGH';

  const explanation = isFallback
    ? `Eyewitness sighting near ${sighting.sightingLocation}. ${reasons.join('; ')}.`
    : `Eyewitness sighting report. ${reasons.join('; ')}.`;

  const matchReason = isFallback
    ? `Eyewitness saw person heading towards ${sighting.directionHeading || 'shelter'}`
    : `Eyewitness sighting near ${sighting.sightingLocation} (${totalScore}% confidence)`;

  return {
    confidenceScore: totalScore,
    matchReason,
    explanation,
    isFallback,
    priority,
  };
}

/**
 * Service to run matching engine across active database records
 */
export class MatchingEngineService {
  /**
   * Run matching when a new MissingReport is logged
   */
  static async matchForMissingReport(missingReportId: string): Promise<void> {
    const missing = await prisma.missingReport.findUnique({
      where: { id: missingReportId },
      include: { person: true },
    });
    if (!missing) return;

    // 1. Search against official Shelter Entries
    const shelterEntries = await prisma.shelterEntry.findMany({
      where: { disasterId: missing.disasterId, status: { not: 'REUNITED' } },
      include: {
        person: true,
        camp: true,
      },
    });

    for (const shelter of shelterEntries) {
      const match = evaluateMissingToShelter(missing, shelter);

      if (match.confidenceScore >= 50) {
        // Upsert Lead
        await prisma.lead.upsert({
          where: {
            id: `lead-${missing.id}-${shelter.id}`,
          },
          create: {
            id: `lead-${missing.id}-${shelter.id}`,
            disasterId: missing.disasterId,
            missingReportId: missing.id,
            shelterEntryId: shelter.id,
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            isFallback: match.isFallback,
            priority: match.priority,
            status: 'PENDING',
          },
          update: {
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            priority: match.priority,
          },
        });
      }
    }

    // 2. Search against Eyewitness Sightings
    const sightings = await prisma.sighting.findMany({
      where: { disasterId: missing.disasterId },
    });

    for (const sighting of sightings) {
      const match = evaluateMissingToSighting(missing, sighting);

      if (match.confidenceScore >= 45) {
        await prisma.lead.upsert({
          where: {
            id: `lead-${missing.id}-${sighting.id}`,
          },
          create: {
            id: `lead-${missing.id}-${sighting.id}`,
            disasterId: missing.disasterId,
            missingReportId: missing.id,
            sightingId: sighting.id,
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            isFallback: match.isFallback,
            priority: match.priority,
            status: 'PENDING',
          },
          update: {
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            priority: match.priority,
          },
        });
      }
    }
  }

  /**
   * Run matching when a new ShelterEntry is logged by camp volunteer
   */
  static async matchForShelterEntry(shelterEntryId: string): Promise<void> {
    const shelter = await prisma.shelterEntry.findUnique({
      where: { id: shelterEntryId },
      include: { person: true, camp: true },
    });
    if (!shelter) return;

    const missingReports = await prisma.missingReport.findMany({
      where: { disasterId: shelter.disasterId, status: { not: 'VERIFIED_SAFE' } },
      include: { person: true },
    });

    for (const missing of missingReports) {
      const match = evaluateMissingToShelter(missing, shelter);

      if (match.confidenceScore >= 50) {
        await prisma.lead.upsert({
          where: {
            id: `lead-${missing.id}-${shelter.id}`,
          },
          create: {
            id: `lead-${missing.id}-${shelter.id}`,
            disasterId: shelter.disasterId,
            missingReportId: missing.id,
            shelterEntryId: shelter.id,
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            isFallback: match.isFallback,
            priority: match.priority,
            status: 'PENDING',
          },
          update: {
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            priority: match.priority,
          },
        });
      }
    }
  }

  /**
   * Run matching when a new Eyewitness Sighting is reported
   */
  static async matchForSighting(sightingId: string): Promise<void> {
    const sighting = await prisma.sighting.findUnique({
      where: { id: sightingId },
    });
    if (!sighting) return;

    const missingReports = await prisma.missingReport.findMany({
      where: { disasterId: sighting.disasterId, status: { not: 'VERIFIED_SAFE' } },
      include: { person: true },
    });

    for (const missing of missingReports) {
      const match = evaluateMissingToSighting(missing, sighting);

      if (match.confidenceScore >= 45) {
        await prisma.lead.upsert({
          where: {
            id: `lead-${missing.id}-${sighting.id}`,
          },
          create: {
            id: `lead-${missing.id}-${sighting.id}`,
            disasterId: sighting.disasterId,
            missingReportId: missing.id,
            sightingId: sighting.id,
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            isFallback: match.isFallback,
            priority: match.priority,
            status: 'PENDING',
          },
          update: {
            confidenceScore: match.confidenceScore,
            matchReason: match.matchReason,
            explanation: match.explanation,
            priority: match.priority,
          },
        });
      }
    }
  }
}
