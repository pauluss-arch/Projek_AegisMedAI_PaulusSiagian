import 'server-only';
import db from './db';
import type { MasukanItem } from './skema';

export type ItemKatalog = MasukanItem & {
  id: string;
  dibuatPada: string;
  kategori?: string;
  dibuatOleh?: string;
  catatan?: string | null;
};

const itemAwal = [
  {
    judul: 'AI Diagnosis',
    deskripsi: 'Explore a structured differential based on entered symptoms and clinical context.',
    aktif: true,
    kategori: 'Diagnosis',
    dibuatOleh: 'Tim Medis',
    catatan: 'Modul diagnosis klinis utama berbasis gejala',
  },
  {
    judul: 'Antibiotic Stewardship',
    deskripsi: 'Review antimicrobial considerations alongside allergy and patient context.',
    aktif: true,
    kategori: 'Farmakologi',
    dibuatOleh: 'Tim Medis',
    catatan: 'Panduan antibiotik dan evaluasi alergi',
  },
  {
    judul: 'Rare Disease Explorer',
    deskripsi: 'Explore rare-disease reference information that may inform further clinical review.',
    aktif: true,
    kategori: 'Referensi',
    dibuatOleh: 'Tim Medis',
    catatan: 'Basis data referensi penyakit langka',
  },
];

function normalisasiJudul(judul: string): string {
  return judul.normalize('NFKC').trim().toLocaleLowerCase();
}

export async function judulSudahAda(judul: string): Promise<boolean> {
  const judulNormal = normalisasiJudul(judul);
  const items = await db.catalogItem.findMany();
  return items.some((item) => normalisasiJudul(item.judul) === judulNormal);
}

export async function tambahItem(
  masukan: MasukanItem,
  meta?: { kategori?: string; dibuatOleh?: string; catatan?: string | null },
): Promise<ItemKatalog> {
  if (await judulSudahAda(masukan.judul)) {
    throw new Error('Item dengan judul tersebut sudah tersedia.');
  }

  const baru = await db.catalogItem.create({
    data: {
      judul: masukan.judul,
      deskripsi: masukan.deskripsi,
      aktif: masukan.aktif,
      kategori: meta?.kategori ?? 'Clinical',
      dibuatOleh: meta?.dibuatOleh ?? 'Tim Medis',
      catatan: meta?.catatan ?? null,
    },
  });

  return {
    id: baru.id,
    judul: baru.judul,
    deskripsi: baru.deskripsi,
    aktif: baru.aktif,
    dibuatPada: baru.createdAt.toISOString(),
    kategori: baru.kategori,
    dibuatOleh: baru.dibuatOleh,
    catatan: baru.catatan,
  };
}

export async function ambilItem(): Promise<ItemKatalog[]> {
  const total = await db.catalogItem.count();
  if (total === 0) {
    for (const item of itemAwal) {
      await db.catalogItem.create({ data: item });
    }
  }

  const items = await db.catalogItem.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => ({
    id: item.id,
    judul: item.judul,
    deskripsi: item.deskripsi,
    aktif: item.aktif,
    dibuatPada: item.createdAt.toISOString(),
    kategori: item.kategori,
    dibuatOleh: item.dibuatOleh,
    catatan: item.catatan,
  }));
}

export async function ambilItemById(id: string): Promise<ItemKatalog | null> {
  const item = await db.catalogItem.findUnique({ where: { id } });
  if (!item) return null;
  return {
    id: item.id,
    judul: item.judul,
    deskripsi: item.deskripsi,
    aktif: item.aktif,
    dibuatPada: item.createdAt.toISOString(),
    kategori: item.kategori,
    dibuatOleh: item.dibuatOleh,
    catatan: item.catatan,
  };
}

export async function hapusItem(id: string): Promise<boolean> {
  const existing = await db.catalogItem.findUnique({ where: { id } });
  if (!existing) return false;
  await db.catalogItem.delete({ where: { id } });
  return true;
}
