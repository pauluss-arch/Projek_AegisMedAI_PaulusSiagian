// lib/db.ts — Re-export singleton PrismaClient untuk Next.js + Prisma 7
// File ini HANYA boleh diimport di server (API routes, Server Actions, Server Components)
import 'server-only';
import { prisma } from './prisma';

const db = prisma;

export default db;
export { prisma };
