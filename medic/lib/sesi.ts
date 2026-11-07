import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const NAMA_COOKIE_SESI = 'aegismed_session';
const DURASI_SESI_DETIK = 28_800;
const RAHASIA_SESI_DEMO = process.env.NODE_ENV === 'production' ? undefined : randomBytes(32).toString('hex');

type DataSesi = {
  namaPengguna: string;
  kedaluwarsa: number;
};

function rahasiaSesi(): string {
  const rahasia = process.env.SESSION_SECRET ?? RAHASIA_SESI_DEMO;
  if (!rahasia || Buffer.byteLength(rahasia) < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 bytes.');
  }
  return rahasia;
}

function tandaTangan(payload: string): Buffer {
  return createHmac('sha256', rahasiaSesi()).update(payload).digest();
}

function buatToken(data: DataSesi): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${tandaTangan(payload).toString('base64url')}`;
}

function bacaToken(token: string): DataSesi | null {
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
      return { namaPengguna: data.namaPengguna, kedaluwarsa: data.kedaluwarsa };
    }
  } catch {
    return null;
  }

  return null;
}

export async function bacaSesi(): Promise<{ namaPengguna: string } | null> {
  const token = (await cookies()).get(NAMA_COOKIE_SESI)?.value;
  if (!token) return null;
  const data = bacaToken(token);
  return data ? { namaPengguna: data.namaPengguna } : null;
}

export async function buatSesi(namaPengguna: string): Promise<void> {
  const kedaluwarsa = Math.floor(Date.now() / 1000) + DURASI_SESI_DETIK;
  (await cookies()).set(NAMA_COOKIE_SESI, buatToken({ namaPengguna, kedaluwarsa }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURASI_SESI_DETIK,
  });
}

export async function hapusSesi(): Promise<void> {
  (await cookies()).delete(NAMA_COOKIE_SESI);
}
