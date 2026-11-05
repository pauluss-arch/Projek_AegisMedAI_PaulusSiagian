# Dokumen Teknis Modul 6 — Integrasi Basis Data, ORM Prisma 7, dan Operasi CRUD

**Nama/NIM :** Paulus Roberto Apolos Siagian / 105224020  
**Mata Kuliah :** Praktikum Pengembangan Aplikasi Web (PAW)  
**Repositori :** https://github.com/pauluss-arch/Projek_AegisMedAI_PaulusSiagian  
**Produk :** AegisMed AI — Clinical Decision Support System (CDSS)  
**Lingkungan :** Next.js 16.4.2 (App Router & Turbopack), Prisma ORM 7.10.1, PostgreSQL 17.11, Node.js v26.7.0  

---

## 1. Arsitektur dan Skema Basis Data

### 1.1 Model Data Katalog Instrumen Medis (`prisma/schema.prisma`)

Pada Milestone Modul 6 platform **AegisMed AI**, penyimpanan data katalog modul dan instrumen klinis beralih dari simulasi memori server (*in-memory mock store*) menjadi sistem basis data relasional PostgreSQL. Pengelolaan skema dan pemetaan objek relasional dilakukan menggunakan **Prisma ORM 7** dengan arsitektur Driver Adapter.

Model data utama didefinisikan pada berkas [`prisma/schema.prisma`](file:///d:/nyoba%20coding/Pemograman%20web/projek/medic/prisma/schema.prisma):

```prisma
// prisma/schema.prisma
// Model untuk katalog instrumen klinis AegisMed AI (Clinical Catalog Items)
// Prisma 7 + PostgreSQL

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ─────────────────────────────────────────────────────────
// Model utama: Item katalog instrumen klinis
// ─────────────────────────────────────────────────────────
model CatalogItem {
  id          String   @id @default(cuid())  // ID unik alfanumerik aman URL
  judul       String                          // Nama/Judul instrumen medis atau modul diagnosis
  deskripsi   String                          // Deskripsi indikasi atau petunjuk klinis
  aktif       Boolean  @default(true)        // Status keaktifan: aktif (true) | non-aktif (false)
  kategori    String   @default("Clinical")  // Kategori instrumen: Diagnosis, Farmakologi, Referensi, dll.
  dibuatOleh  String   @default("Tim Medis") // Praktisi / dokter pengunggah instrumen
  catatan     String?                         // Catatan instruksi klinis khusus (opsional/nullable)

  createdAt   DateTime @default(now())       // Timestamp pencatatan awal
  updatedAt   DateTime @updatedAt            // Timestamp pembaruan data terakhir

  @@map("catalog_items")                      // Pemetaan nama tabel pada PostgreSQL
}
```

### 1.2 Tabel Spesifikasi Atribut Basis Data

| Nama Kolom Fisik | Tipe Data Prisma | Tipe Data PostgreSQL | Atribut / Konstrain | Keterangan Fungsional |
|---|---|---|---|---|
| `id` | `String` | `text` / `varchar` | `@id`, `@default(cuid())` | Kunci primer (*Primary Key*) berbasis CUID untuk mencegah tebakan urutan ID (*enumeration attack*). |
| `judul` | `String` | `text` | Wajib (*NOT NULL*) | Nama modul klinis atau judul instrumen diagnosis diferensial. |
| `deskripsi` | `String` | `text` | Wajib (*NOT NULL*) | Uraian indikasi, algoritma, atau batasan penggunaan klinis. |
| `aktif` | `Boolean` | `bool` / `boolean` | `@default(true)` | Status operasional instrumen (apakah aktif digunakan dokter atau dinonaktifkan sementara). |
| `kategori` | `String` | `text` | `@default("Clinical")` | Klasifikasi instrumen medis (`Diagnosis`, `Farmakologi`, `Referensi`, `ICU & Kritis`). |
| `dibuatOleh` | `String` | `text` | `@default("Tim Medis")` | Identitas tenaga medis atau staf pengunggah modul. |
| `catatan` | `String?` | `text` | Opsional (*NULLABLE*) | Catatan teknis atau instruksi khusus penanganan medis. |
| `createdAt` | `DateTime` | `timestamp(3)` | `@default(now())` | Waktu instrumen didaftarkan pertama kali ke sistem basis data. |
| `updatedAt` | `DateTime` | `timestamp(3)` | `@updatedAt` | Waktu rekaman mengalami modifikasi atribut data terakhir. |

---

## 2. Konfigurasi Prisma 7 dan Koneksi Singleton

### 2.1 Konfigurasi Terpusat Prisma 7 (`prisma.config.ts`)

Prisma versi 7 memperkenalkan arsitektur konfigurasi modern: direktif `url` tidak lagi dideklarasikan di dalam blok `datasource` berkas `schema.prisma`. Seluruh konfigurasi koneksi dipindahkan ke berkas konfigurasi TypeScript [`prisma.config.ts`](file:///d:/nyoba%20coding/Pemograman%20web/projek/medic/prisma.config.ts) dengan dukungan pemuatan variabel lingkungan `.env`:

```typescript
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
```

### 2.2 Pola Singleton PrismaClient (`lib/db.ts`)

Pada lingkungan pengembangan Next.js (*Turbopack / Fast Refresh*), setiap perubahan kode memicu evaluasi ulang modul server. Jika instance `PrismaClient` dibuat secara instansiasi langsung berulang kali, kumpulan koneksi (*connection pool*) ke PostgreSQL akan cepat habis (*connection pool exhaustion*).

Untuk mencegah kebocoran koneksi, diimplementasikan pola **Global Singleton** pada [`lib/db.ts`](file:///d:/nyoba%20coding/Pemograman%20web/projek/medic/lib/db.ts) dengan isolasi `server-only`:

```typescript
// lib/db.ts — Singleton PrismaClient untuk Next.js + Prisma 7
// File ini HANYA boleh diimport di server (API routes, Server Actions, Server Components)
import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tidak ditemukan. Pastikan file .env sudah diisi dengan benar."
    );
  }
  // Adapter PrismaPg menghubungkan Prisma Client ke engine PostgreSQL secara native
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Gunakan instance global yang ada jika tersedia, atau buat instance baru
const db = globalThis.prisma ?? createPrismaClient();

// Simpan ke globalThis hanya pada mode pengembangan
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

export default db;
```

---

## 3. Implementasi Operasi CRUD (API Route Handlers)

Siklus hidup data instrumen klinis diimplementasikan melalui arsitektur RESTful Route Handlers pada endpoint `/api/catalog` (serta rute kompatibilitas `/api/documents`).

### 3.1 Read Koleksi dan Create Item (`app/api/catalog/route.ts`)

Berkas [`app/api/catalog/route.ts`](file:///d:/nyoba%20coding/Pemograman%20web/projek/medic/app/api/catalog/route.ts) menangani:
1. **`GET` (Read All):** Mengambil seluruh item katalog yang diurutkan dari yang terbaru (`createdAt: "desc"`).
2. **`POST` (Create):** Menerima payload JSON, memvalidasi integritas masukan menggunakan skema Zod `skemaApiItem`, melakukan validasi semantik keunikan judul, dan mengeksekusi mutasi baris baru di PostgreSQL via Prisma.

```typescript
// ── GET /api/catalog — Ambil semua item katalog ─────────────────────────────
export async function GET() {
  try {
    const items = await db.catalogItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/catalog] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data katalog dari database." },
      { status: 500 }
    );
  }
}

// ── POST /api/catalog — Buat item katalog baru ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = skemaApiItem.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Data tidak valid.", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { judul, deskripsi, aktif, kategori, dibuatOleh, catatan } = parsed.data;

    // Validasi semantik: judul unik (case-insensitive)
    const duplicate = await db.catalogItem.findFirst({
      where: { judul: { equals: judul, mode: "insensitive" } },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "Judul item sudah terdaftar dalam katalog." },
        { status: 409 }
      );
    }

    const item = await db.catalogItem.create({
      data: {
        judul,
        deskripsi,
        aktif: aktif ?? true,
        kategori: kategori ?? "Clinical",
        dibuatOleh: dibuatOleh ?? "Tim Medis",
        catatan: catatan ?? null,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/catalog] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan item ke database." },
      { status: 500 }
    );
  }
}
```

### 3.2 Read Detail dan Delete Item (`app/api/catalog/[id]/route.ts`)

Berkas [`app/api/catalog/[id]/route.ts`](file:///d:/nyoba%20coding/Pemograman%20web/projek/medic/app/api/catalog/[id]/route.ts) mengelola operasi berbasis parameter dinamis ID instrumen:
1. **`GET` (Read One):** Mengambil rekaman tunggal menggunakan klausa `findUnique({ where: { id } })`.
2. **`DELETE` (Delete):** Memeriksa keberadaan rekaman, lalu mengeksekusi penghapusan baris pada PostgreSQL.

```typescript
// ── GET /api/catalog/[id] — Ambil satu item ─────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const item = await db.catalogItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, message: "Item katalog tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Gagal mengambil detail item." }, { status: 500 });
  }
}

// ── DELETE /api/catalog/[id] — Hapus item ────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const existing = await db.catalogItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Item katalog tidak ditemukan." }, { status: 404 });
    }

    await db.catalogItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Item katalog berhasil dihapus dari database." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Gagal menghapus item dari database." }, { status: 500 });
  }
}
```

---

## 4. Integrasi Antarmuka Pengguna (Frontend Integration)

### 4.1 Formulir Tambah Instrumen Klinis (`app/catalog/item-form.tsx`)

Pada formulir penambahan modul klinis, masukan pengguna diverifikasi dan diteruskan ke Server Action:
* **Alur Kirim & Validasi:** Klien memproses submit melalui `useActionState(simpanItem)`. Server Action memvalidasi field via Zod dan mengeksekusi fungsi `tambahItem()` di [`lib/data.ts`](file:///d:/nyoba%20coding/Pemograman%20web/projek/medic/lib/data.ts) yang menyimpan data secara asinkron ke PostgreSQL menggunakan `db.catalogItem.create()`.
* **Umpan Balik:** Jika validasi gagal, form merender pesan galat per-field di bawah input dan mempertahankan isi field. Jika berhasil, form memicu `revalidatePath('/catalog')` dan mengalihkan ke tampilan katalog terbaru.

### 4.2 Halaman Repositori Katalog (`app/catalog/page.tsx`)

Halaman katalog instrumen klinis terhubung langsung dengan basis data PostgreSQL:
* **Penyajian Data Dinamis:** Komponen server `CatalogPage` mengeksekusi `await ambilItem()` yang mengambil data riil dari PostgreSQL menggunakan `db.catalogItem.findMany({ orderBy: { createdAt: 'desc' } })`.
* **Penanda Sumber Data:** Header daftar menampilkan indikator jumlah item aktif yang terhubung langsung ke basis data (*"X items (PostgreSQL)"*).
* **Fitur Hapus Interaktif:** Pada setiap kartu instrumen klinis, disediakan tombol aksi interaktif *"🗑️ Hapus"*. Tombol ini memicu Server Action `hapusItemAction` yang mengeksekusi `db.catalogItem.delete()` dan secara otomatis memperbarui tampilan daftar seketika tanpa perlu memuat ulang seluruh halaman (*no full page reload*).

---

## 5. Bukti Uji dan Verifikasi Basis Data

### 5.1 Tabel Pengujian Fungsionalitas CRUD

Pengujian dilakukan menggunakan antarmuka HTTP REST (`Invoke-RestMethod` / `curl`) terhadap server Next.js 16 yang terhubung ke PostgreSQL:

| Operasi | Metode HTTP | URL Endpoint / Aksi | Payload / Parameter | Status HTTP | Hasil yang Diperoleh | Status Uji |
|:---:|:---:|---|---|:---:|---|:---:|
| **Create** | `POST` | `/api/catalog` | `{"judul": "Sepsis Early Warning Algorithm", "deskripsi": "Algoritma pemantauan tanda vital real-time deteksi syok septik", "aktif": true, "kategori": "ICU & Kritis", "dibuatOleh": "dr. Paulus Roberto", "catatan": "Test data Modul 6 Prisma 7"}` | `201 Created` | Data tersimpan di PostgreSQL dengan ID CUID acak `cmw3oy38i00008kv3bpk0skfc` dan timestamp `now()`. | **LULUS** |
| **Read (All)** | `GET` | `/api/catalog` | Tidak ada | `200 OK` | Mengembalikan array JSON daftar instrumen klinis terurut terbaru dari tabel `catalog_items`. | **LULUS** |
| **Read (ID)** | `GET` | `/api/catalog/cmw3oy38i...` | Parameter path `id` | `200 OK` | Mengembalikan objek data detail instrumen klinis yang sesuai. | **LULUS** |
| **Delete** | `DELETE` | `/api/catalog/cmw3oy38i...` | Parameter path `id` | `200 OK` | Baris data berhasil dihapus permanen dari tabel PostgreSQL. | **LULUS** |
| **Validasi Gagal** | `POST` | `/api/catalog` | `{"judul": "AB"}` (panjang < 3 karakter) | `400 Bad Request` | Permintaan ditolak Zod sebelum menyentuh koneksi database. | **LULUS** |
| **Validasi Semantik** | `POST` | `/api/catalog` | Judul sama dengan yang sudah ada | `409 Conflict` | Ditolak oleh pemeriksaan keunikan judul di level server. | **LULUS** |

### 5.2 Bukti Visualisasi Prisma Studio

Verifikasi basis data PostgreSQL dilakukan melalui antarmuka visual **Prisma Studio** (`npx prisma studio` pada port 51212):

#### A. Tampilan Data Tabel Instrumen Klinis (`catalog_items`)

Pada antarmuka Prisma Studio Table View (`http://localhost:51212/#schema=public&table=catalog_items&view=table`):
* Record tersimpan memiliki struktur:
  * `id`: `cmw3oy38i00008kv3bpk0skfc` (Primary Key CUID)
  * `judul`: `"Sepsis Early Warning Algorithm"`
  * `deskripsi`: `"Algoritma pemantauan tanda vital real-time deteksi syok septik"`
  * `aktif`: `true`
  * `kategori`: `"ICU & Kritis"`
  * `dibuatOleh`: `"dr. Paulus Roberto"`
  * `catatan`: `"Test data Modul 6 Prisma 7"`
  * `createdAt`: `2026-11-05 22:19:04.676`
  * `updatedAt`: `2026-11-05 22:19:04.676`

#### B. Visualizer Skema Tabel PostgreSQL

Struktur kolom tabel `catalog_items` pada Prisma Studio Visualizer memetakan tipe data basis data secara presisi:
* `id` : `text` (Primary Key)
* `judul` : `text`
* `deskripsi` : `text`
* `aktif` : `bool`
* `kategori` : `text`
* `dibuatOleh` : `text`
* `catatan` : `text` (Nullable)
* `createdAt` : `timestamp(3)`
* `updatedAt` : `timestamp(3)`

---

## 6. Keputusan Teknis

### 6.1 Prisma 7 Driver Adapter (`@prisma/adapter-pg`) vs Prisma Engine Klasik
Pada arsitektur Prisma 7, mesin query berbasis Rust binary monolitik digantikan oleh arsitektur modular berbasis **Driver Adapter** (`@prisma/adapter-pg`). 
* **Efisiensi Memori & Kecepatan:** Driver Adapter berjalan langsung pada runtime JavaScript/Node.js menggunakan protokol native PostgreSQL tanpa overhead proses terpisah (child process IPC).
* **Kompatibilitas Turbopack:** Memungkinkan Next.js 16 App Router dan Turbopack mengompilasi bundel server secara instan tanpa masalah pemuatan biner platform spesifik.

### 6.2 Pemisahan URL ke `prisma.config.ts` Dibanding Deklarasi di `schema.prisma`
Prisma 7 sengaja menghapus dukungan `url = env("DATABASE_URL")` di dalam berkas `.prisma` agar:
* Skema Prisma murni menjadi representasi definisi struktur model data (*declarative schema*) tanpa tercampur konfigurasi infrastruktur lingkungan.
* Konfigurasi koneksi di `prisma.config.ts` dapat memanfaatkan logika kondisional dinamis TypeScript (misalnya: membaca koneksi replika baca, pooling connection, atau failover cluster).

---

## 7. Kendala Teknis dan Penyelesaian

Selama implementasi integrasi basis data Prisma 7 dan PostgreSQL pada proyek AegisMed AI, ditemukan empat kendala teknis nyata beserta solusinya:

1. **Galat Kapasitas Disk Penuh (*Disk Full Error ENOSPC* pada Drive C:):**
   * *Kendala:* Eksekusi `npm install` gagal dengan kode galat `ENOSPC: no space left on device, write` karena ruang kosong partisi C: mencapai 0 MB akibat akumulasi cache berkas sementara.
   * *Penyelesaian:* Melakukan pembersihan cache npm (`npm cache clean --force`), menghapus data sementara, serta mengalokasikan kluster database PostgreSQL ke drive sekunder D: (`D:\pg_medic`) yang memiliki ruang bebas lebih dari 230 GB.

2. **Galat Validasi Deklarasi `url` pada Prisma 7 (`Error code: P1012`):**
   * *Kendala:* Saat pertama kali mengeksekusi `npx prisma generate`, muncul galat:  
     `The datasource property 'url' is no longer supported in schema files.`
   * *Penyelesaian:* Menghapus deklarasi `url = env("DATABASE_URL")` dari blok `datasource db` di `prisma/schema.prisma` dan memindahkannya ke dalam blok `datasource: { url: env("DATABASE_URL") }` pada berkas `prisma.config.ts`.

3. **Pemblokiran Skrip Instalasi Otomatis Mesin Prisma (*Blocked Install Scripts*):**
   * *Kendala:* Mekanisme keamanan npm memblokir script postinstall `@prisma/engines` sehingga binary engine schema tidak terunduh otomatis.
   * *Penyelesaian:* Menambahkan konfigurasi eksplisit `allowScripts` untuk `prisma@7.10.1` dan `@prisma/engines@7.10.1` pada `package.json`, lalu menjalankan `npm rebuild` untuk memastikan mesin CLI terinstal sempurna.

4. **Konflik Middleware `proxy.ts` terhadap Rute REST API:**
   * *Kendala:* Permintaan HTTP ke endpoint `/api/catalog` dialihkan otomatis (HTTP 307/308 Redirect) ke halaman `/masuk` karena matcher proxy menangkap seluruh rute secara global.
   * *Penyelesaian:* Memperbarui matcher pada `proxy.ts` menjadi `matcher: ['/((?!api|masuk|_next/static|_next/image|favicon.ico).*)']` agar rute REST API dapat diakses secara langsung oleh klien HTTP tanpa mengorbankan proteksi halaman antarmuka.

---

## 8. Catatan Pemanfaatan AI

* **Alat AI yang Digunakan :**  
  Antigravity Coding Assistant (Google DeepMind Agentic Assistant) — Gemini 3.8 Flash (High).

* **Perintah Utama (*Prompts*):**
  1. *"Implementasikan tahap awal koneksi Prisma 7 + PostgreSQL untuk fitur CRUD di halaman katalog instrumen klinis AegisMed AI secara simpel dan terintegrasi."*
  2. *"Identifikasi dan perbaiki kendala disk space ENOSPC serta konfigurasi Driver Adapter PostgreSQL Prisma 7."*
  3. *"Susun dokumen teknis laporan praktikum Modul 6 lengkap yang mencakup arsitektur skema, singleton pattern, API CRUD, dan bukti verifikasi pengujian."*

* **Komponen yang Dihasilkan / Dibantu AI:**
  * Penulisan skema deklaratif model `CatalogItem` pada `prisma/schema.prisma`.
  * Konfigurasi terpusat Prisma 7 pada `prisma.config.ts` dan singleton `lib/db.ts`.
  * Rute API Handler `app/api/catalog/route.ts` dan `app/api/catalog/[id]/route.ts`.
  * Integrasi data persisten PostgreSQL ke `lib/data.ts` dan antarmuka `app/catalog/page.tsx` dengan fitur tombol hapus.
  * Penyusunan laporan teknis Modul 6 ini secara komprehensif, presisi, dan akurat.

* **Metode Verifikasi Hasil AI:**
  1. **Pemeriksaan Tipe Statis:** Menjalankan `npx tsc --noEmit` — status **Lolos (Exit Code 0, 0 error)**.
  2. **Pengujian Unit Otomatis:** Menjalankan `npm test` — seluruh **8 pengujian unit kriptografi dan normalisasi lolos**.
  3. **Verifikasi CLI Basis Data:** Menjalankan `npx prisma db push` untuk memastikan sinkronisasi tabel database PostgreSQL `aegismed_db` berhasil tanpa kesalahan skema.
  4. **Pengujian Integrasi HTTP:** Menguji endpoint API menggunakan skrip HTTP (`Invoke-RestMethod`) untuk memastikan status `201 Created` pada `POST`, `200 OK` pada `GET` dan `DELETE`, `400 Bad Request` pada validasi gagal, serta `409 Conflict` pada duplikasi judul semantik.
  5. **Verifikasi Kompilasi Produksi:** Menjalankan `npm run build` — Next.js 16.4.2 berhasil mengompilasi rute statis, dinamis, dan API handlers dengan mulus.

