// lib/db.ts — Singleton PrismaClient untuk Next.js + Prisma 7
// File ini HANYA boleh diimport di server (API routes, Server Actions, Server Components)
import 'server-only';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL tidak ditemukan. Pastikan file .env sudah diisi dengan benar.',
    );
  }
  // Adapter PrismaPg menghubungkan Prisma Client ke engine PostgreSQL
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Gunakan instance global yang ada jika tersedia, atau buat instance baru
const db = globalThis.prisma ?? createPrismaClient();

// Simpan ke globalThis hanya pada mode pengembangan
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

export default db;
