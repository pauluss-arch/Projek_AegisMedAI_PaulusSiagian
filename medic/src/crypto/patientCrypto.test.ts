import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPatientPseudonym,
  decryptMedicalRecord,
  encryptMedicalRecord,
  hashPatientIdentity,
} from './patientCrypto.ts';

const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const wrongKey = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

test('SHA-256 hashes equivalent normalized names consistently', async () => {
  assert.equal(await hashPatientIdentity('Siti Rahma'), await hashPatientIdentity(' siti   rahma '));
  assert.match(await hashPatientIdentity('Siti Rahma'), /^[a-f0-9]{64}$/);
});

test('pseudonymization returns an opaque identifier and varies with random salt', async () => {
  const first = await createPatientPseudonym('Siti Rahma');
  const second = await createPatientPseudonym('Siti Rahma');
  assert.match(first, /^PAT-[A-F0-9]{8}-\d{4}$/);
  assert.notEqual(first, second);
  assert.ok(!first.includes('Siti'));
});

test('AES-256-GCM round-trips UTF-8 medical text and uses fresh IVs', async () => {
  const message = 'Demo record: symptoms and assessment';
  const encrypted = await encryptMedicalRecord(message, key);
  const encryptedAgain = await encryptMedicalRecord(message, key);

  assert.equal(await decryptMedicalRecord(encrypted, key), message);
  assert.notEqual(encrypted.iv, encryptedAgain.iv);
  assert.equal(encrypted.authTag.length, 32);
});

test('AES-GCM rejects a wrong key and tampered ciphertext', async () => {
  const encrypted = await encryptMedicalRecord('Do not alter this record', key);
  await assert.rejects(() => decryptMedicalRecord(encrypted, wrongKey));

  const replacement = encrypted.ciphertext.endsWith('00') ? 'ff' : '00';
  const tampered = { ...encrypted, ciphertext: `${encrypted.ciphertext.slice(0, -2)}${replacement}` };
  await assert.rejects(() => decryptMedicalRecord(tampered, key));
});

test('key and encrypted payload validation fail closed', async () => {
  await assert.rejects(() => encryptMedicalRecord('record', 'not-a-key'), /64-character hex/);
  await assert.rejects(
    () => decryptMedicalRecord({ ciphertext: 'not-hex', iv: '00', authTag: '00' }, key),
    /malformed hexadecimal/,
  );
});
