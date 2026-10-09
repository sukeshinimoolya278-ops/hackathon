import { describe, it, expect } from 'vitest';
import {
  calculateNameMatchScore,
  calculateAgeScore,
  calculateGenderScore,
  normalizeTransliteration,
  soundex,
} from '../src/utils/fuzzy';
import {
  evaluateMissingToShelter,
  evaluateMissingToSighting,
} from '../src/services/matchingEngine';

describe('Fuzzy Matching & Transliteration Engine', () => {
  it('should normalize South Asian transliterations correctly', () => {
    expect(normalizeTransliteration('Priyah')).toBe('priya');
    expect(normalizeTransliteration('Laxmi')).toBe('laksmi');
    expect(normalizeTransliteration('Karthick')).toBe('kartik');
  });

  it('should produce identical soundex codes for phonetically similar names', () => {
    const s1 = soundex('Robert');
    const s2 = soundex('Rupert');
    expect(s1).toBe(s2);
  });

  it('should award high score for exact match and transliterated variants', () => {
    const exact = calculateNameMatchScore('Karthik Raja', 'Karthik Raja');
    expect(exact.score).toBe(100);

    const variant = calculateNameMatchScore('Priya Sharma', 'Priyah Sharma');
    expect(variant.score).toBeGreaterThanOrEqual(90);

    const swapped = calculateNameMatchScore('Karthik Raja', 'Raja Karthik');
    expect(swapped.score).toBeGreaterThanOrEqual(85);
  });

  it('should calculate age proximity scores accurately', () => {
    expect(calculateAgeScore(25, 25).score).toBe(15);
    expect(calculateAgeScore(25, 27).score).toBe(12);
    expect(calculateAgeScore(25, 30).score).toBe(8);
    expect(calculateAgeScore(25, 55).score).toBe(0);
    expect(calculateAgeScore(null, 25).score).toBe(7); // Neutral fallback
  });

  it('should calculate gender match scores accurately', () => {
    expect(calculateGenderScore('FEMALE', 'FEMALE').score).toBe(15);
    expect(calculateGenderScore('FEMALE', 'MALE').score).toBe(0);
    expect(calculateGenderScore('FEMALE', 'UNKNOWN').score).toBe(7);
  });
});

describe('Relational Matching Engine', () => {
  it('should evaluate missing-to-shelter match with high confidence on similar attributes', () => {
    const missing = {
      id: 'mis-1',
      person: {
        fullName: 'Murugan Selvam',
        approxAge: 42,
        gender: 'MALE',
        physicalDesc: 'Tall, black mustache, wearing blue shirt',
        priorityFlag: 'NONE',
        familyGroupId: 'fam-1',
      },
      lastSeenLocation: 'Velachery Bus Stand',
    };

    const shelter = {
      id: 'shl-1',
      camp: {
        name: 'Loyola College Relief Shelter',
        location: 'Loyola College, Nungambakkam',
      },
      person: {
        fullName: 'Murugesh Selvam',
        approxAge: 43,
        gender: 'MALE',
        physicalDesc: 'Wearing blue checked shirt',
        priorityFlag: 'NONE',
        familyGroupId: 'fam-1',
      },
    };

    const result = evaluateMissingToShelter(missing, shelter);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(70);
    expect(result.explanation).toContain('Loyola College Relief Shelter');
    expect(result.explanation).toContain('Linked to the exact same family token/group');
  });

  it('should flag CHILD_ALONE as URGENT priority', () => {
    const missing = {
      id: 'mis-child',
      person: {
        fullName: 'Aarav Kumar',
        approxAge: 7,
        gender: 'MALE',
        physicalDesc: 'Red backpack',
        priorityFlag: 'CHILD_ALONE',
        familyGroupId: null,
      },
      lastSeenLocation: 'Anna Nagar',
    };

    const shelter = {
      id: 'shl-child',
      camp: {
        name: 'St. Thomas Relief Camp',
        location: 'Anna Nagar West',
      },
      person: {
        fullName: 'Arav Kumar',
        approxAge: 7,
        gender: 'MALE',
        physicalDesc: 'Red bag',
        priorityFlag: 'CHILD_ALONE',
        familyGroupId: null,
      },
    };

    const result = evaluateMissingToShelter(missing, shelter);
    expect(result.priority).toBe('URGENT');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(80);
  });

  it('should generate fallback lead when sighting reports heading towards Shelter B', () => {
    const missing = {
      id: 'mis-fallback',
      person: {
        fullName: 'Meenakshi Sundaram',
        approxAge: 58,
        gender: 'FEMALE',
        physicalDesc: 'Green saree',
        priorityFlag: 'ELDERLY',
      },
      lastSeenLocation: 'Madipakkam Lake',
    };

    const sighting = {
      id: 'sgt-fallback',
      sightedName: 'Meenakshi Amma',
      approxAge: 60,
      gender: 'FEMALE',
      sightingLocation: 'Madipakkam High Road',
      directionHeading: 'Evacuation bus heading towards St. Thomas Community Hall Shelter',
      notes: 'Wearing green saree with family members',
    };

    const result = evaluateMissingToSighting(missing, sighting);
    expect(result.isFallback).toBe(true);
    expect(result.explanation).toContain('heading towards');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(65);
    expect(result.priority).toBe('HIGH');
  });
});
