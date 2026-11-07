import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diseases } from '../mock/diseasesData.ts';
import { matchSymptoms, normalizeSymptoms } from './symptomMatcher.ts';

test('normalizes English, Indonesian, misspelled, and conversational symptom text', () => {
  assert.match(normalizeSymptoms('Saya merasa menceret dan sakit perut'), / diarrhea abdominal pain /);
  assert.match(normalizeSymptoms('I had extrem headache with a fever'), / severe headache fever /);
  assert.match(normalizeSymptoms('pusing dan loose stool'), / headache diarrhea /);
});

test('matches normalized synonyms and tolerates a one-character typo', () => {
  const results = matchSymptoms('Saya got a very bad cough and fevr, with trouble breathing', diseases);
  assert.ok(results.some((result) => result.disease.id === 'cap'));
  assert.ok(results.every((result) => result.probability >= 18 && result.probability <= 94));
  assert.ok(results.every((result) => result.explanation.includes('not a clinical probability')));
});

test('returns no results for empty input and bounds the requested result count', () => {
  assert.deepEqual(matchSymptoms('dan dengan saya', diseases), []);
  assert.ok(matchSymptoms('fever cough chest pain', diseases, 2).length <= 2);
});
