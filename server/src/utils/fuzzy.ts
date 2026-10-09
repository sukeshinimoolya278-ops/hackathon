/**
 * Fuzzy & Phonetic Matching Utilities for ReunitePath
 * Optimized for multicultural & South Asian transliteration variants
 * (e.g., Tamil, Hindi, Malayalam, Telugu names written in English)
 */

export function normalizeTransliteration(input: string): string {
  if (!input) return '';
  let str = input.toLowerCase().trim();

  // Normalize common phonetic equivalences in South Asian English transliteration
  str = str
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/bh/g, 'b')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 's')
    .replace(/zh/g, 'l') // Tamil 'zh' to 'l'
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ou/g, 'u')
    .replace(/ai/g, 'ay')
    .replace(/aa/g, 'a')
    .replace(/ii/g, 'i')
    .replace(/uu/g, 'u')
    .replace(/w/g, 'v')
    .replace(/x/g, 'ks')
    .replace(/ck/g, 'k')
    .replace(/h\b/g, '') // Trailing silent 'h' (e.g. Priyah -> Priya)
    .replace(/[^a-z0-9\s]/g, ''); // strip punctuation

  return str.trim();
}

/**
 * Standard American Soundex algorithm with fallback
 */
export function soundex(name: string): string {
  if (!name) return '0000';
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return '0000';

  const firstLetter = clean[0];
  const codes: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };

  let soundexCode = firstLetter;
  let prevCode = codes[firstLetter] || '0';

  for (let i = 1; i < clean.length; i++) {
    const char = clean[i];
    const code = codes[char] || '0';

    if (code !== '0' && code !== prevCode) {
      soundexCode += code;
    }
    prevCode = code;

    if (soundexCode.length === 4) break;
  }

  return (soundexCode + '0000').slice(0, 4);
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Levenshtein-based similarity score (0.0 to 1.0)
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Jaro-Winkler similarity (0.0 to 1.0)
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const l1 = s1.length;
  const l2 = s2.length;
  const matchDistance = Math.floor(Math.max(l1, l2) / 2) - 1;

  const s1Matches = new Array(l1).fill(false);
  const s2Matches = new Array(l2).fill(false);

  let matches = 0;
  for (let i = 0; i < l1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, l2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < l1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / l1 + matches / l2 + (matches - transpositions / 2) / matches) / 3.0;

  // Winkler prefix boost
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(l1, l2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1.0 - jaro);
}

/**
 * Comprehensive Name Match Score (0 to 100)
 * Uses transliteration normalization, token reordering, Soundex, and Jaro-Winkler
 */
export function calculateNameMatchScore(name1: string, name2: string): { score: number; reason: string } {
  if (!name1 || !name2) return { score: 0, reason: 'Missing name' };

  const raw1 = name1.trim().toLowerCase();
  const raw2 = name2.trim().toLowerCase();

  if (raw1 === raw2) {
    return { score: 100, reason: 'Exact name match' };
  }

  const norm1 = normalizeTransliteration(name1);
  const norm2 = normalizeTransliteration(name2);

  if (norm1 === norm2) {
    return { score: 96, reason: 'Exact match after transliteration normalization' };
  }

  // Token-level comparison (e.g. "Karthik Raja" vs "Raja Karthik")
  const tokens1 = norm1.split(/\s+/).filter(Boolean);
  const tokens2 = norm2.split(/\s+/).filter(Boolean);

  const tokens1Sorted = [...tokens1].sort().join(' ');
  const tokens2Sorted = [...tokens2].sort().join(' ');
  if (tokens1Sorted === tokens2Sorted) {
    return { score: 92, reason: 'Matching name tokens with different order' };
  }

  // Jaro-Winkler + Levenshtein on normalized names
  const jw = jaroWinklerSimilarity(norm1, norm2);
  const lev = levenshteinSimilarity(norm1, norm2);
  const avgSimilarity = (jw * 0.6) + (lev * 0.4);

  // Soundex comparison
  const soundex1 = soundex(norm1);
  const soundex2 = soundex(norm2);
  const soundexMatch = soundex1 === soundex2;

  let finalScore = Math.round(avgSimilarity * 85);
  if (soundexMatch) {
    finalScore = Math.min(100, finalScore + 15);
  }

  let reason = `Fuzzy name similarity of ${finalScore}%`;
  if (soundexMatch) {
    reason += ` (phonetic match: ${soundex1})`;
  }

  return { score: finalScore, reason };
}

/**
 * Age proximity score (0 to 15 points)
 */
export function calculateAgeScore(age1?: number | null, age2?: number | null): { score: number; reason: string } {
  if (age1 == null || age2 == null) {
    return { score: 7, reason: 'Age not specified on one or both records (+7 fallback)' };
  }

  const diff = Math.abs(age1 - age2);
  if (diff === 0) {
    return { score: 15, reason: `Exact age match (${age1} yrs)` };
  }
  if (diff <= 2) {
    return { score: 12, reason: `Age within 2 years (${age1} vs ${age2})` };
  }
  if (diff <= 5) {
    return { score: 8, reason: `Age within 5 years (${age1} vs ${age2})` };
  }
  if (diff <= 10) {
    return { score: 4, reason: `Approximate age range (${age1} vs ${age2})` };
  }
  return { score: 0, reason: `Age mismatch (${age1} vs ${age2})` };
}

/**
 * Gender match score (0 to 15 points)
 */
export function calculateGenderScore(gender1: string, gender2: string): { score: number; reason: string } {
  const g1 = gender1.toUpperCase();
  const g2 = gender2.toUpperCase();

  if (g1 === 'UNKNOWN' || g2 === 'UNKNOWN') {
    return { score: 7, reason: 'Gender unknown in one record (+7 fallback)' };
  }
  if (g1 === g2) {
    return { score: 15, reason: `Gender match (${g1})` };
  }
  return { score: 0, reason: `Gender mismatch (${g1} vs ${g2})` };
}

/**
 * Physical description token overlap (0 to 5 points)
 */
export function calculateDescriptionScore(desc1?: string | null, desc2?: string | null): { score: number; reason: string } {
  if (!desc1 || !desc2) {
    return { score: 0, reason: 'No physical description compared' };
  }

  const stopWords = new Set(['a', 'the', 'is', 'wearing', 'has', 'with', 'and', 'in', 'on', 'of', 'tall', 'short', 'blue', 'shirt', 'pants']);
  const words1 = desc1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const words2 = new Set(desc2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)));

  const matched = words1.filter(w => words2.has(w));
  if (matched.length >= 2) {
    return { score: 5, reason: `Matching description features: ${matched.slice(0, 3).join(', ')}` };
  }
  if (matched.length === 1) {
    return { score: 3, reason: `Partial feature match: ${matched[0]}` };
  }

  return { score: 0, reason: 'No distinct physical description overlap' };
}
