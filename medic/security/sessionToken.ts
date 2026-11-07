import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { PeranPengguna } from './rbacUsers.js';

export const NAMA_COOKIE_SESI = 'aegismed_session';
export const DURASI_SESI_DETIK = 28_800;
const RAHASIA_SESI_DEMO = process.env.NODE_ENV === 'production' ? undefined : randomBytes(32).toString('hex');

export type DataSesi = {
  namaPengguna: string;
  peran: PeranPengguna;
  pasienId?: string;
  kedaluwarsa: number;
};

export function rahasiaSesi(): string {
  const rahasia = process.env.SESSION_SECRET ?? RAHASIA_SESI_DEMO;
  if (!rahasia || Buffer.byteLength(rahasia) < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 bytes.');
  }
  return rahasia;
}

export function tandaTangan(payload: string): Buffer {
  return createHmac('sha256', rahasiaSesi()).update(payload).digest();
}

export function buatToken(data: DataSesi): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${tandaTangan(payload).toString('base64url')}`;
}

export function bacaToken(token: string): DataSesi | null {
  const [payload, encodedSignature, ...extra] = token.split('.');
  if (!payload || !encodedSignature || extra.length > 0) return null;

  const receivedSignature = Buffer.from(encodedSignature, 'base64url');
  const expectedSignature = tandaTangan(payload);
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) {
    return null;
  }

  try {
    const data: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      typeof data === 'object'
      && data !== null
      && 'namaPengguna' in data
      && typeof data.namaPengguna === 'string'
      && 'kedaluwarsa' in data
      && typeof data.kedaluwarsa === 'number'
      && data.kedaluwarsa > Math.floor(Date.now() / 1000)
    ) {
      const d = data as Record<string, unknown>;
      const validRoles: PeranPengguna[] = ['admin', 'dokter', 'apoteker', 'pasien'];
      const peran: PeranPengguna = typeof d.peran === 'string' && validRoles.includes(d.peran as PeranPengguna)
        ? (d.peran as PeranPengguna)
        : 'dokter';
      const pasienId = typeof d.pasienId === 'string' ? d.pasienId : undefined;
      return { namaPengguna: data.namaPengguna, peran, pasienId, kedaluwarsa: data.kedaluwarsa };
    }
  } catch {
    return null;
  }

  return null;
}
