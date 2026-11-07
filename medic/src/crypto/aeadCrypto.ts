import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const ALGORITHM = 'aes-256-gcm';

export type EncryptedAeadData = {
  ciphertext: string;
  iv: string;
  authTag: string;
  aad?: string;
};

export class AeadInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AeadInputError';
  }
}

export class AuthenticationFailedError extends Error {
  constructor() {
    super('AEAD authentication failed; encrypted data was not accepted.');
    this.name = 'AuthenticationFailedError';
  }
}

function validateKey(secretKeyHex: string): Buffer {
  if (typeof secretKeyHex !== 'string' || !/^[0-9a-fA-F]{64}$/.test(secretKeyHex)) {
    throw new AeadInputError('secretKeyHex must be exactly 64 hexadecimal characters.');
  }

  const key = Buffer.from(secretKeyHex, 'hex');
  if (key.length !== KEY_BYTES) {
    throw new AeadInputError('secretKeyHex must encode a 32-byte AES-256 key.');
  }
  return key;
}

function validateText(value: string, label: string): Buffer {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AeadInputError(`${label} must be a non-empty string.`);
  }
  return Buffer.from(value, 'utf8');
}

function validateHex(value: unknown, label: string, expectedBytes?: number): Buffer {
  if (typeof value !== 'string' || value.length === 0 || !/^(?:[0-9a-fA-F]{2})+$/.test(value)) {
    throw new AeadInputError(`${label} must be a non-empty hexadecimal string.`);
  }
  const decoded = Buffer.from(value, 'hex');
  if (expectedBytes !== undefined && decoded.length !== expectedBytes) {
    throw new AeadInputError(`${label} must encode exactly ${expectedBytes} bytes.`);
  }
  return decoded;
}

export function generateCsprngKey(): string {
  return randomBytes(KEY_BYTES).toString('hex');
}

export function getAeadSecretKeyFromEnvironment(): string {
  const secretKeyHex = process.env.AEAD_SECRET_KEY;
  if (typeof secretKeyHex !== 'string') {
    throw new AeadInputError('AEAD_SECRET_KEY is not configured in the environment.');
  }
  validateKey(secretKeyHex);
  return secretKeyHex;
}

export function encryptAEAD(
  plaintext: string,
  secretKeyHex: string,
  aad?: string,
): EncryptedAeadData {
  const key = validateKey(secretKeyHex);
  const plaintextBytes = validateText(plaintext, 'plaintext');
  const aadBytes = aad === undefined ? undefined : validateText(aad, 'aad');
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });

  if (aadBytes) cipher.setAAD(aadBytes);

  const ciphertext = Buffer.concat([cipher.update(plaintextBytes), cipher.final()]);
  const result: EncryptedAeadData = {
    ciphertext: ciphertext.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
  if (aad !== undefined) result.aad = aad;
  return result;
}

export function decryptAEAD(
  encryptedData: EncryptedAeadData,
  secretKeyHex: string,
): string {
  const key = validateKey(secretKeyHex);
  if (!encryptedData || typeof encryptedData !== 'object' || Array.isArray(encryptedData)) {
    throw new AeadInputError('encryptedData must be an object.');
  }

  const ciphertext = validateHex(encryptedData.ciphertext, 'ciphertext');
  const iv = validateHex(encryptedData.iv, 'iv', IV_BYTES);
  const authTag = validateHex(encryptedData.authTag, 'authTag', AUTH_TAG_BYTES);
  const aad = encryptedData.aad;
  if (aad !== undefined && (typeof aad !== 'string' || aad.length === 0)) {
    throw new AeadInputError('aad must be a non-empty string when provided.');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
  if (aad !== undefined) decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(authTag);

  let plaintext = Buffer.alloc(0);
  try {
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  } catch {
    plaintext.fill(0);
    throw new AuthenticationFailedError();
  }
}
