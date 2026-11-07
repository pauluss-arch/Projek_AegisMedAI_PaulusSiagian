'use server';

import { redirect } from 'next/navigation';
import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { skemaMasuk } from '../../lib/skema';
import type { StatusForm } from '../../lib/status-form';
import { buatSesi } from '../../lib/sesi';

function nilaiPengguna(formData: FormData): Record<string, string> {
  const namaPengguna = formData.get('namaPengguna');
  return typeof namaPengguna === 'string' ? { namaPengguna } : {};
}

function samaAman(nilai: string, rahasia: string): boolean {
  const hashNilai = createHash('sha256').update(nilai).digest();
  const hashRahasia = createHash('sha256').update(rahasia).digest();
  return timingSafeEqual(hashNilai, hashRahasia);
}

export async function masuk(_statusSebelumnya: StatusForm, formData: FormData): Promise<StatusForm> {
  const nilai = nilaiPengguna(formData);
  const hasil = skemaMasuk.safeParse(Object.fromEntries(formData.entries()));
  if (!hasil.success) {
    const galat = z.flattenError(hasil.error);
    return { galat: galat.fieldErrors, pesan: galat.formErrors[0] ?? 'Periksa kembali data masuk.', nilai };
  }

  if (process.env.NODE_ENV === 'production') {
    const namaTerkonfigurasi = process.env.MEDIC_LOGIN_USERNAME;
    const sandiTerkonfigurasi = process.env.MEDIC_LOGIN_PASSWORD;
    if (!namaTerkonfigurasi || !sandiTerkonfigurasi) {
      return { pesan: 'Login produksi belum dikonfigurasi.', nilai };
    }

    if (!samaAman(hasil.data.namaPengguna, namaTerkonfigurasi) || !samaAman(hasil.data.kataSandi, sandiTerkonfigurasi)) {
      return { galat: { kataSandi: ['Nama pengguna atau kata sandi tidak valid.'] }, pesan: 'Kredensial tidak valid.', nilai };
    }
  }

  try {
    await buatSesi(hasil.data.namaPengguna);
  } catch (error) {
    return {
      pesan: error instanceof Error ? error.message : 'Sesi tidak dapat dibuat.',
      nilai,
    };
  }

  redirect('/catalog');
}
