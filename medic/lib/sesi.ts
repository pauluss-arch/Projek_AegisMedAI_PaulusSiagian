import 'server-only';
import { cookies } from 'next/headers';
import type { PeranPengguna } from '../security/rbacUsers';
import {
  NAMA_COOKIE_SESI,
  DURASI_SESI_DETIK,
  buatToken,
  bacaToken,
  type DataSesi,
} from '../security/sessionToken';

export { NAMA_COOKIE_SESI, DURASI_SESI_DETIK, buatToken, bacaToken, type DataSesi };

export async function bacaSesi(): Promise<DataSesi | null> {
  const token = (await cookies()).get(NAMA_COOKIE_SESI)?.value;
  if (!token) return null;
  return bacaToken(token);
}

export async function pastikanPeran(peranDiizinkan: PeranPengguna[]): Promise<DataSesi> {
  const sesi = await bacaSesi();
  if (!sesi) {
    throw new Error('OTORISASI_DITOLAK_UNAUTHENTICATED: Pengguna belum terotentikasi.');
  }
  if (!peranDiizinkan.includes(sesi.peran)) {
    throw new Error(`OTORISASI_DITOLAK_FORBIDDEN: Peran '${sesi.peran}' tidak memiliki hak akses.`);
  }
  return sesi;
}

export async function buatSesi(namaPengguna: string, peran: PeranPengguna = 'dokter', pasienId?: string): Promise<void> {
  const kedaluwarsa = Math.floor(Date.now() / 1000) + DURASI_SESI_DETIK;
  (await cookies()).set(NAMA_COOKIE_SESI, buatToken({ namaPengguna, peran, pasienId, kedaluwarsa }), {
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
