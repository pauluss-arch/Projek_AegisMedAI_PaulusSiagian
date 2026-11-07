import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AeadInputError,
  AuthenticationFailedError,
  decryptAEAD,
  encryptAEAD,
  generateCsprngKey,
} from './aeadCrypto.ts';

const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const wrongKey = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

test('AES-256-GCM round-trips UTF-8 plaintext and binds supplied AAD', () => {
  const plaintext = 'Synthetic assessment: fever and cough';
  const aad = 'patient:demo-001|record:assessment-1';
  const encrypted = encryptAEAD(plaintext, key, aad);

  assert.equal(decryptAEAD(encrypted, key), plaintext);
  assert.equal(encrypted.aad, aad);
  assert.equal(Buffer.from(encrypted.iv, 'hex').length, 12);
  assert.equal(Buffer.from(encrypted.authTag, 'hex').length, 16);
});

test('generates 256-bit CSPRNG keys and distinct IVs for repeated plaintext', () => {
  const generatedKey = generateCsprngKey();
  assert.match(generatedKey, /^[0-9a-f]{64}$/);
  assert.equal(Buffer.from(generatedKey, 'hex').length, 32);

  const first = encryptAEAD('same synthetic content', key);
  const second = encryptAEAD('same synthetic content', key);
  assert.notEqual(first.iv, second.iv);
  assert.equal(first.aad, undefined);
});

test('rejects tampered ciphertext without returning plaintext', () => {
  const encrypted = encryptAEAD('synthetic clinical note', key);
  const changedCiphertext = `${encrypted.ciphertext.slice(0, -2)}${encrypted.ciphertext.endsWith('00') ? 'ff' : '00'}`;

  assert.throws(
    () => decryptAEAD({ ...encrypted, ciphertext: changedCiphertext }, key),
    AuthenticationFailedError,
  );
});

test('rejects a different valid AES-256 key', () => {
  const encrypted = encryptAEAD('synthetic prescription', key);
  assert.throws(() => decryptAEAD(encrypted, wrongKey), AuthenticationFailedError);
});

test('rejects modified AAD', () => {
  const encrypted = encryptAEAD('synthetic diagnosis', key, 'patient:demo-001');
  assert.throws(
    () => decryptAEAD({ ...encrypted, aad: 'patient:demo-002' }, key),
    AuthenticationFailedError,
  );
});

test('rejects malformed keys, ciphertext fields, and empty plaintext', () => {
  assert.throws(() => encryptAEAD('data', 'bad-key'), AeadInputError);
  assert.throws(() => encryptAEAD('', key), AeadInputError);
  assert.throws(
    () => decryptAEAD({ ciphertext: 'not-hex', iv: '00', authTag: '00' }, key),
    AeadInputError,
  );
  assert.throws(
    () => decryptAEAD({ ciphertext: 'aa', iv: '00'.repeat(12), authTag: '00'.repeat(16) }, key),
    AuthenticationFailedError,
  );
});
