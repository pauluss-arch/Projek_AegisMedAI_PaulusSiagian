import assert from 'node:assert/strict';
import test from 'node:test';
import { createPatientSchema, medicalRecordNumSchema, signDiagnosisSchema } from './patient.ts';

const validPatient = {
  medicalRecordNum: 'RM-2026-0101',
  name: 'Jordan Lee',
  age: 42,
  gender: 'unknown',
  eGFR: 90,
  hasPenicillinAlg: false,
  diseaseName: 'Demo assessment',
  icdCode: 'UNVERIFIED',
  matchPercentage: 50,
  isRareDisease: false,
  symptoms: 'Fever and a productive cough for two days.',
  prescribedDrug: null,
};

test('accepts a valid patient and initial diagnosis', () => {
  assert.equal(createPatientSchema.safeParse(validPatient).success, true);
});

test('returns the required medical-record-number format message', () => {
  const result = medicalRecordNumSchema.safeParse('RM-26-101');
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues[0]?.message,
      'Format Nomor Rekam Medis harus RM-XXXX-XXXX (contoh: RM-2026-0101).',
    );
  }
});

test('enforces patient age, eGFR, and symptoms bounds', () => {
  const result = createPatientSchema.safeParse({
    ...validPatient,
    age: 121,
    eGFR: 151,
    symptoms: 'short',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      result.error.issues.map((issue) => issue.path[0]),
      ['age', 'eGFR', 'symptoms'],
    );
  }
});

test('validates demo-signature inputs and rejects invalid diagnosis identifiers', () => {
  const validSignatureInput = {
    diagnosisId: '00000000-0000-4000-8000-000000000001',
    diseaseName: 'Demo assessment',
    icdCode: 'UNVERIFIED',
    matchPercentage: 50,
    isRareDisease: false,
    prescribedDrug: null,
  };
  assert.equal(signDiagnosisSchema.safeParse(validSignatureInput).success, true);
  assert.equal(signDiagnosisSchema.safeParse({ ...validSignatureInput, diagnosisId: 'invalid' }).success, false);
});
