'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { tambahItem, judulSudahAda } from '../../lib/data';
import { skemaItem, type MasukanItem } from '../../lib/skema';
import type { StatusForm } from '../../lib/status-form';
import { bacaSesi, hapusSesi } from '../../lib/sesi';

function nilaiForm(formData: FormData): Record<string, string> {
  const nilai = Object.fromEntries(
    [...formData.entries()]
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([kunci, isi]) => [kunci, isi]),
  );
  if (!('aktif' in nilai)) nilai.aktif = 'false';
  return nilai;
}

export async function simpanItem(_statusSebelumnya: StatusForm, formData: FormData): Promise<StatusForm> {
  if (!(await bacaSesi())) {
    return { pesan: 'Sesi tidak ditemukan. Silakan masuk kembali.' };
  }

  const nilai = nilaiForm(formData);
  const hasil = skemaItem.safeParse(Object.fromEntries(formData.entries()));
  if (!hasil.success) {
    const galat = z.flattenError(hasil.error);
    return { galat: galat.fieldErrors, pesan: galat.formErrors[0] ?? 'Periksa kembali data yang dimasukkan.', nilai };
  }

  const masukan: MasukanItem = hasil.data;
  if (judulSudahAda(masukan.judul)) {
    return {
      galat: { judul: ['Judul item sudah tersedia. Gunakan judul yang berbeda.'] },
      pesan: 'Item tidak dapat disimpan karena judul sudah digunakan.',
      nilai,
    };
  }

  try {
    tambahItem(masukan);
  } catch (error) {
    return {
      pesan: error instanceof Error ? error.message : 'Item gagal disimpan.',
      nilai,
    };
  }

  revalidatePath('/catalog');
  redirect('/catalog');
}

export async function keluar(): Promise<void> {
  await hapusSesi();
  redirect('/masuk');
}
