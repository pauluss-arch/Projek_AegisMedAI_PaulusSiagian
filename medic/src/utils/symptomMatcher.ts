import type { DiseaseRecord, MatchResult } from '../types';

const synonyms: ReadonlyArray<readonly [string, string]> = [
  ['extrem headache', 'severe headache'],
  ['extreme headache', 'severe headache'],
  ['bad headache', 'severe headache'],
  ['sakit kepala', 'headache'],
  ['head pain', 'headache'],
  ['sakit perut', 'abdominal pain'],
  ['perut sakit', 'abdominal pain'],
  ['stomach ache', 'abdominal pain'],
  ['tummy ache', 'abdominal pain'],
  ['loose stool', 'diarrhea'],
  ['loose stools', 'diarrhea'],
  ['menceret', 'diarrhea'],
  ['mencret', 'diarrhea'],
  ['watery stool', 'diarrhea'],
  ['high temperature', 'fever'],
  ['shortness of breath', 'dyspnea'],
  ['trouble breathing', 'dyspnea'],
  ['difficulty breathing', 'dyspnea'],
  ['painful urination', 'dysuria'],
  ['burning urination', 'dysuria'],
  ['sakit saat kencing', 'dysuria'],
  ['frequent urination', 'urinary frequency'],
  ['susah bernapas', 'dyspnea'],
  ['sesak napas', 'dyspnea'],
  ['demam', 'fever'],
  ['batuk', 'cough'],
  ['pusing kepala', 'headache'],
  ['pusing', 'headache'],
  ['dizzy', 'dizziness'],
];

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'been', 'but', 'by', 'dan', 'deh', 'dengan',
  'feels', 'for', 'got', 'had', 'has', 'have', 'i', 'in', 'is', 'it', 'merasa',
  'of', 'on', 'or', 'saya', 'sudah', 'the', 'to', 'very', 'was', 'with', 'yang',
]);

function cleanText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeSymptoms(value: string): string {
  let normalized = ` ${cleanText(value)} `;
  for (const [phrase, replacement] of [...synonyms].sort((a, b) => b[0].length - a[0].length)) {
    normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'g'), replacement);
  }
  const tokens = normalized.trim().split(/\s+/).filter((token) => !stopWords.has(token));
  return ` ${tokens.join(' ')} `;
}

function tokenDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > 1) return 2;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function phraseMatches(query: string, signal: string): boolean {
  const normalizedSignal = normalizeSymptoms(signal).trim();
  if (query.includes(` ${normalizedSignal} `)) return true;
  const queryTokens = query.trim().split(/\s+/);
  const signalTokens = normalizedSignal.split(/\s+/).filter((token) => !stopWords.has(token));
  const meaningful = signalTokens.filter((token) => token.length > 3);
  if (!meaningful.length) return signalTokens.some((token) => queryTokens.includes(token));
  const overlap = meaningful.filter((term) => queryTokens.some((token) => token === term || (term.length > 4 && tokenDistance(term, token) === 1)));
  return overlap.length >= Math.min(2, meaningful.length);
}

export function matchSymptoms(
  value: string,
  records: readonly DiseaseRecord[],
  limit = 8,
): MatchResult[] {
  const normalized = normalizeSymptoms(value);
  if (!normalized.trim()) return [];

  return records.map((disease) => {
    const matchedSignals = disease.keywords.filter((signal) => phraseMatches(normalized, signal));
    if (!matchedSignals.length) return null;
    const coverage = matchedSignals.length / Math.max(1, Math.min(4, disease.keywords.length));
    const probability = Math.min(94, Math.max(18, Math.round(24 + coverage * 58 + Math.min(matchedSignals.length, 3) * 3)));
    return {
      disease,
      probability,
      matchedSignals: matchedSignals.slice(0, 5),
      explanation: `Heuristic text overlap matched ${matchedSignals.length} symptom signal${matchedSignals.length === 1 ? '' : 's'}. This is not a clinical probability.`,
    };
  })
    .filter((item): item is MatchResult => item !== null)
    .sort((left, right) => right.probability - left.probability || right.matchedSignals.length - left.matchedSignals.length)
    .slice(0, Math.max(0, limit));
}
