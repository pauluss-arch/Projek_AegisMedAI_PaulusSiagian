import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL tidak ditemukan. Pastikan file .env sudah diisi dengan benar.',
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    // Modul 7: tampilkan setiap query SQL di terminal.
    // Hapus "query" setelah praktikum agar log tidak terlalu ramai.
    log: ['query', 'warn', 'error'],
  });
}

const existing = globalThis.prisma;
const isCurrent = Boolean(
  existing &&
  'diseaseCatalogItem' in existing &&
  'patient' in existing &&
  'diagnosisRecord' in existing
);

export const prisma = isCurrent ? existing! : createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;