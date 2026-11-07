-- Baseline for the catalog_items table created before Prisma Migrate was introduced.
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "kategori" TEXT NOT NULL DEFAULT 'Clinical',
    "dibuatOleh" TEXT NOT NULL DEFAULT 'Tim Medis',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);
