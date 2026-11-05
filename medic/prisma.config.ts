// prisma.config.ts — Konfigurasi Terpusat Prisma 7
// PENTING: import ini harus pertama agar .env terbaca oleh Prisma CLI
import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Lokasi berkas skema deklaratif Prisma
  schema: "prisma/schema.prisma",

  // URL database PostgreSQL untuk CLI (prisma db push, prisma migrate, prisma studio)
  datasource: {
    url: env("DATABASE_URL"),
  },
});
