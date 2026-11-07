import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPatientSchema,
  medicalRecordNumSchema,
  patientUpdateSchema,
} from './patient.ts';

const validPatientInput = {
  medicalRecordNum: 'RM-2026-0101',
  name: 'Jordan Lee',
  age: 42,
  gender: 'unknown',
  eGFR: 90,
  hasPenicillinAlg: false,
  diseaseName: 'Community-acquired pneumonia',
  icdCode: 'UNVERIFIED',
  matchPercentage: 68,
  isRareDisease: false,
  symptoms: 'Fever and cough with shortness of breath.',
  prescribedDrug: null,
};

test('accepts a complete patient and diagnosis payload', () => {
  assert.equal(createPatientSchema.safeParse(validPatientInput).success, true);
});

test('uses the required medical record format error message', () => {
  const result = medicalRecordNumSchema.safeParse('RM-26-0101');
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues[0]?.message,
      'Format Nomor Rekam Medis harus RM-XXXX-XXXX (contoh: RM-2026-0101).',
    );
  }
});

test('rejects invalid patient age, eGFR, and symptoms with field errors', () => {
  const result = createPatientSchema.safeParse({
    ...validPatientInput,
    age: 0,
    eGFR: 151,
    symptoms: 'short',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    assert.ok(errors.age?.length);
    assert.ok(errors.eGFR?.length);
    assert.ok(errors.symptoms?.length);
  }
});

test('requires at least one patient safety update', () => {
  const result = patientUpdateSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
  assert.equal(result.success, false);
});
