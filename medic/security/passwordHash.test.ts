import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  isSlowHash,
  benchmarkSlowHash,
  DEFAULT_SCRYPT_PARAMS,
} from './passwordHash.js';

test('sec-0.2 / R03: hashPassword produces modular scrypt hash with expected format', () => {
  const password = 'DokterSpesialis2026!';
  const hash = hashPassword(password);

  assert.equal(isSlowHash(hash), true);
  const parts = hash.split('$');
  assert.equal(parts.length, 5);
  assert.equal(parts[1], 'scrypt');
  assert.equal(parts[2], `ln=${DEFAULT_SCRYPT_PARAMS.costExponent},r=${DEFAULT_SCRYPT_PARAMS.blockSize},p=${DEFAULT_SCRYPT_PARAMS.parallelization}`);
  // Salt should be 32 bytes (64 hex characters)
  assert.equal(parts[3].length, 64);
  // Derived key should be 64 bytes (128 hex characters)
  assert.equal(parts[4].length, 128);
});

test('sec-0.2 / R03 / T09: verifyPassword accepts correct password and rejects incorrect password', () => {
  const correctPassword = 'PasswordRahasia#123';
  const wrongPassword = 'WrongPassword#999';
  const hash = hashPassword(correctPassword);

  assert.equal(verifyPassword(correctPassword, hash), true, 'Correct password must verify');
  assert.equal(verifyPassword(wrongPassword, hash), false, 'Incorrect password must be rejected');
  assert.equal(verifyPassword('', hash), false, 'Empty password must be rejected');
});

test('sec-0.2 / R03: CSPRNG salting ensures distinct hashes for identical passwords', () => {
  const password = 'SamePasswordRepeated';
  const hash1 = hashPassword(password);
  const hash2 = hashPassword(password);

  assert.notEqual(hash1, hash2, 'Two hashes of the same password must have different salts');
  assert.equal(verifyPassword(password, hash1), true);
  assert.equal(verifyPassword(password, hash2), true);
});

test('sec-0.2 / R03: verifyPassword fails closed on malformed or tampered hash formats', () => {
  const password = 'SecurePassword2026';
  const validHash = hashPassword(password);

  // Tamper ciphertext
  const tamperedHash = validHash.slice(0, -4) + 'abcd';
  assert.equal(verifyPassword(password, tamperedHash), false);

  // Malformed structure
  assert.equal(verifyPassword(password, 'plain_md5_hash'), false);
  assert.equal(verifyPassword(password, '$sha256$somehash'), false);
  assert.equal(verifyPassword(password, '$scrypt$invalidparams$salt$hash'), false);
  assert.equal(verifyPassword(password, ''), false);
});

test('sec-0.2 / R03: benchmark proves slow hash latency significantly exceeds fast hash (SHA-256)', () => {
  const benchmark = benchmarkSlowHash('SyntheticBenchPass!2026');

  // scrypt must take at least 10ms (typically 30-150ms depending on CPU), while SHA-256 takes < 0.05ms
  assert.ok(benchmark.scryptDurationMs > 5, `scrypt duration (${benchmark.scryptDurationMs}ms) must demonstrate computational cost`);
  assert.ok(benchmark.slowdownFactor > 100, `scrypt must be at least 100x slower than raw SHA-256 (actual: ${benchmark.slowdownFactor}x)`);

  // Verify parameters
  assert.equal(benchmark.parameters.costExponent, 15); // N = 32768
  assert.equal(benchmark.parameters.blockSize, 8);
  assert.equal(benchmark.parameters.parallelization, 1);
});
