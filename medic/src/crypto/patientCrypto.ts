export type EncryptedMedicalRecord = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

const AES_KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function getWebCrypto(): Crypto {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Secure browser cryptography is unavailable.');
  }

  return globalThis.crypto;
}

function normalizeHexKey(secretKeyHex: string): Uint8Array {
  const normalizedKey = secretKeyHex.trim().replace(/^0x/i, '');

  if (!/^[0-9a-fA-F]+$/.test(normalizedKey) || normalizedKey.length !== AES_KEY_BYTES * 2) {
    throw new Error('secretKeyHex must be a 64-character hex string representing a 32-byte AES-256 key.');
  }

  return hexToBytes(normalizedKey);
}

function normalizePatientName(patientName: string): string {
  return patientName.trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function createPatientPseudonym(patientName: string): Promise<string> {
  const normalizedName = normalizePatientName(patientName).normalize('NFKC');
  if (!normalizedName) throw new Error('A patient name is required to create a pseudonym.');

  const cryptoObj = getWebCrypto();
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const nameBytes = new TextEncoder().encode(normalizedName);
  const payload = new Uint8Array(salt.length + nameBytes.length);
  payload.set(salt);
  payload.set(nameBytes, salt.length);

  const digest = await cryptoObj.subtle.digest('SHA-256', toBufferSource(payload));
  const token = bytesToHex(new Uint8Array(digest)).slice(0, 8).toUpperCase();
  return `PAT-${token}-${new Date().getFullYear()}`;
}

function hexToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);

  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }

  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function toBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

// 1. Hashing Anonymization (SHA-256)
export async function hashPatientIdentity(patientName: string): Promise<string> {
  const normalizedName = normalizePatientName(patientName);
  const payload = new TextEncoder().encode(normalizedName);
  const digest = await getWebCrypto().subtle.digest('SHA-256', toBufferSource(payload));

  return bytesToHex(new Uint8Array(digest));
}

// 2. Encryption (AES-256-GCM)
export async function encryptMedicalRecord(text: string, secretKeyHex: string): Promise<EncryptedMedicalRecord> {
  const cryptoObj = getWebCrypto();
  const key = await cryptoObj.subtle.importKey(
    'raw',
    normalizeHexKey(secretKeyHex) as unknown as BufferSource,
    'AES-GCM',
    false,
    ['encrypt'],
  );
  const iv = cryptoObj.getRandomValues(new Uint8Array(IV_BYTES));
  const payload = new TextEncoder().encode(text);
  const encrypted = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv: toBufferSource(iv) }, key, toBufferSource(payload));
  const encryptedBytes = new Uint8Array(encrypted);

  return {
    ciphertext: bytesToHex(encryptedBytes.slice(0, -AUTH_TAG_BYTES)),
    iv: bytesToHex(iv),
    authTag: bytesToHex(encryptedBytes.slice(-AUTH_TAG_BYTES)),
  };
}

// 3. Decryption (AES-256-GCM)
export async function decryptMedicalRecord(
  encryptedData: EncryptedMedicalRecord,
  secretKeyHex: string,
): Promise<string> {
  if (!encryptedData || typeof encryptedData.ciphertext !== 'string' || typeof encryptedData.iv !== 'string' || typeof encryptedData.authTag !== 'string') {
    throw new Error('Invalid encryptedData payload.');
  }
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(encryptedData.ciphertext) ||
      !/^[0-9a-fA-F]{24}$/.test(encryptedData.iv) ||
      !/^[0-9a-fA-F]{32}$/.test(encryptedData.authTag)) {
    throw new Error('Encrypted record contains malformed hexadecimal data.');
  }

  const cryptoObj = getWebCrypto();
  const key = await cryptoObj.subtle.importKey(
    'raw',
    normalizeHexKey(secretKeyHex) as unknown as BufferSource,
    'AES-GCM',
    false,
    ['decrypt'],
  );
  const iv = hexToBytes(encryptedData.iv);
  const ciphertext = hexToBytes(encryptedData.ciphertext);
  const authTag = hexToBytes(encryptedData.authTag);
  const combined = new Uint8Array(ciphertext.length + authTag.length);

  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decrypted = await cryptoObj.subtle.decrypt(
    { name: 'AES-GCM', iv: toBufferSource(iv), tagLength: AUTH_TAG_BYTES * 8 },
    key,
    toBufferSource(combined),
  );

  return new TextDecoder().decode(decrypted);
}