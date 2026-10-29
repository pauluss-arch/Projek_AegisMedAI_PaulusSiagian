import 'server-only';
import { randomUUID } from 'node:crypto';
import type { MasukanItem } from './skema';

export type ItemKatalog = MasukanItem & {
  id: string;
  dibuatPada: string;
};

declare global {
  var __aegismedItemKatalog: ItemKatalog[] | undefined;
}

const itemAwal: ItemKatalog[] = [
  {
    id: 'tool-diagnosis',
    judul: 'AI Diagnosis',
    deskripsi: 'Explore a structured differential based on entered symptoms and clinical context.',
    aktif: true,
    dibuatPada: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tool-antibiotic',
    judul: 'Antibiotic Stewardship',
    deskripsi: 'Review antimicrobial considerations alongside allergy and patient context.',
    aktif: true,
    dibuatPada: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tool-rare-disease',
    judul: 'Rare Disease Explorer',
    deskripsi: 'Explore rare-disease reference information that may inform further clinical review.',
    aktif: true,
    dibuatPada: '2026-01-01T00:00:00.000Z',
  },
];

function daftarItem(): ItemKatalog[] {
  globalThis.__aegismedItemKatalog ??= itemAwal;
  return globalThis.__aegismedItemKatalog;
}

function normalisasiJudul(judul: string): string {
  return judul.normalize('NFKC').trim().toLocaleLowerCase();
}

export function judulSudahAda(judul: string): boolean {
  const judulNormal = normalisasiJudul(judul);
  return daftarItem().some((item) => normalisasiJudul(item.judul) === judulNormal);
}

export function tambahItem(masukan: MasukanItem): ItemKatalog {
  if (judulSudahAda(masukan.judul)) {
    throw new Error('Item dengan judul tersebut sudah tersedia.');
  }

  const item: ItemKatalog = {
    ...masukan,
    id: randomUUID(),
    dibuatPada: new Date().toISOString(),
  };
  daftarItem().unshift(item);
  return item;
}

export function ambilItem(): ItemKatalog[] {
  return daftarItem().map((item) => ({ ...item }));
}
