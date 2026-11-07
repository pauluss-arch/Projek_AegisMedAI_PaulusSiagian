import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

/**
 * Konfigurasi parameter fungsi hash lambat (Slow Hashing) berbasis scrypt (RFC 7914 / OWASP).
 * 
 * Mitigasi Risiko:
 * - R03: Pengambilalihan Akun Dokter (Account Takeover)
 * - T09: Auth Service Spoofing / Offline Brute-force & Dictionary Attack
 * Penanda: sec-0.2
 */
export interface ScryptParams {
  /** Log2 dari faktor biaya CPU/memori N (15 = 2^15 = 32768) */
  costExponent: number; // N = 1 << costExponent
  /** Ukuran blok r (8 = 1024 bytes) */
  blockSize: number;
  /** Faktor paralelisasi p (1 thread) */
  parallelization: number;
  /** Panjang salt acak dalam byte (32 bytes = 256 bits) */
  saltBytes: number;
  /** Panjang derived key hash dalam byte (64 bytes = 512 bits) */
  keyBytes: number;
}

export const DEFAULT_SCRYPT_PARAMS: ScryptParams = {
  costExponent: 15, // N = 32768
  blockSize: 8,
  parallelization: 1,
  saltBytes: 32,
  keyBytes: 64,
};

/**
 * Menghasilkan hash lambat ber-salt untuk kata sandi menggunakan scrypt CSPRNG.
 * Format keluaran modular (MCF):
 * $scrypt$ln=<costExponent>,r=<blockSize>,p=<parallelization>$<salt_hex>$<hash_hex>
 */
export function hashPassword(password: string, params: ScryptParams = DEFAULT_SCRYPT_PARAMS): string {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Kata sandi tidak boleh kosong.');
  }

  const N = 1 << params.costExponent;
  const salt = randomBytes(params.saltBytes);
  const derivedKey = scryptSync(password, salt, params.keyBytes, {
    N,
    r: params.blockSize,
    p: params.parallelization,
    maxmem: 128 * N * params.blockSize * 2,
  });

  const saltHex = salt.toString('hex');
  const hashHex = derivedKey.toString('hex');

  return `$scrypt$ln=${params.costExponent},r=${params.blockSize},p=${params.parallelization}$${saltHex}$${hashHex}`;
}

/**
 * Memverifikasi kata sandi terhadap hash lambat scrypt dengan timingSafeEqual (waktu konstan).
 * Menolak instan jika format tidak sesuai atau hash korup (fail-closed).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  // Format: ["", "scrypt", "ln=15,r=8,p=1", "<saltHex>", "<hashHex>"]
  if (parts.length !== 5 || parts[1] !== 'scrypt') {
    return false;
  }

  const paramString = parts[2];
  const saltHex = parts[3];
  const expectedHashHex = parts[4];

  // Ekstrak parameter ln, r, p
  const matchLn = paramString.match(/ln=(\d+)/);
  const matchR = paramString.match(/r=(\d+)/);
  const matchP = paramString.match(/p=(\d+)/);

  if (!matchLn || !matchR || !matchP) {
    return false;
  }

  const costExponent = parseInt(matchLn[1], 10);
  const blockSize = parseInt(matchR[1], 10);
  const parallelization = parseInt(matchP[1], 10);

  // Batas keamanan parameter untuk mencegah DoS lewat cost yang sengaja dinaikkan penyerang
  if (costExponent < 10 || costExponent > 18 || blockSize < 1 || parallelization < 1) {
    return false;
  }

  const N = 1 << costExponent;
  const salt = Buffer.from(saltHex, 'hex');
  const expectedHash = Buffer.from(expectedHashHex, 'hex');

  if (salt.length < 16 || expectedHash.length < 32) {
    return false;
  }

  try {
    const derivedKey = scryptSync(password, salt, expectedHash.length, {
      N,
      r: blockSize,
      p: parallelization,
      maxmem: 128 * N * blockSize * 2,
    });

    if (derivedKey.length !== expectedHash.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedHash);
  } catch {
    return false;
  }
}

/**
 * Memvalidasi apakah sebuah string merupakan format hash lambat scrypt yang sah.
 */
export function isSlowHash(value: string): boolean {
  if (typeof value !== 'string') return false;
  const parts = value.split('$');
  return parts.length === 5 && parts[1] === 'scrypt';
}

/**
 * Benchmark komparatif kecepatan antara fungsi hash cepat (SHA-256) vs fungsi hash lambat (scrypt).
 * Menghasilkan bukti numerik waktu komputasi tanpa membuka data nyata.
 */
export function benchmarkSlowHash(testPassword = 'TestPassword123!'): {
  scryptDurationMs: number;
  sha256DurationMs: number;
  slowdownFactor: number;
  parameters: ScryptParams;
} {
  // Ukur SHA-256 (Fast hash)
  const shaStart = performance.now();
  for (let i = 0; i < 50; i++) {
    createHash('sha256').update(testPassword).digest();
  }
  const sha256DurationMs = (performance.now() - shaStart) / 50;

  // Ukur scrypt (Slow hash)
  const scryptStart = performance.now();
  const hashed = hashPassword(testPassword);
  verifyPassword(testPassword, hashed);
  const scryptDurationMs = performance.now() - scryptStart;

  const slowdownFactor = Math.round(scryptDurationMs / (sha256DurationMs || 0.001));

  return {
    scryptDurationMs: Number(scryptDurationMs.toFixed(2)),
    sha256DurationMs: Number(sha256DurationMs.toFixed(4)),
    slowdownFactor,
    parameters: DEFAULT_SCRYPT_PARAMS,
  };
}
