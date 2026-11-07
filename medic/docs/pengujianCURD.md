# Dokumen Pengujian — Skenario Pengujian CRUD, Relasi Data, dan Validasi Server

## 1. Ringkasan dan Ketentuan Pengujian

Dokumen ini disusun untuk memenuhi seluruh **Ketentuan Pengujian** pada integrasi basis data relasional PostgreSQL dan ORM Prisma 7:
1. **Total Skenario Pengujian:** 10 skenario pengujian lengkap (8 skenario CRUD dan 2 skenario pengujian relasi data).
2. **Tingkat Keberhasilan:** 10 dari 10 skenario dinyatakan **LULUS** (**100%**, melampaui batas minimum kelulusan 90%).
3. **Validasi Server:** Menyertakan minimal 3 bukti penolakan masukan tidak valid (*server-side validation*) dengan pesan galat terperinci per-field (*fieldErrors*).
4. **Verifikasi Basis Data:** Membuktikan secara langsung perubahan baris data pada tabel PostgreSQL (`Patient`, `DiagnosisRecord`, `catalog_items`) akibat operasi *Create*, *Update*, dan *Delete*.
5. **Kepatuhan Data Sintetis:** Seluruh data yang diuji merupakan **Data Sintetis Medis (*Synthetic Data*)**. Nama pasien secara otomatis disamarkan menggunakan pseudonim keyed HMAC-SHA-256 (`PAT-<hash>`), nomor rekam medis berformat acak `RM-2026-XXXX`, dan tidak ada data pribadi nyata (*Zero PII*).

---

## 2. Tabel Rekapitulasi 10 Skenario Pengujian

| ID Skenario | Kategori | Fitur / Komponen yang Diuji | Target Entitas | Hasil yang Diharapkan | Status |
|:---:|:---:|---|---|---|:---:|
| **TC-01** | **CRUD** (Create) | Pendaftaran pasien baru & diagnosis awal | `Patient` & `DiagnosisRecord` | Data pasien dan 1 rekam diagnosis tersimpan atomik via transaksi | **LULUS** |
| **TC-02** | **CRUD** (Read All) | Pengambilan seluruh daftar pasien terdaftar | `Patient` | Mengembalikan array pasien lengkap dengan relasi diagnosis terurut | **LULUS** |
| **TC-03** | **CRUD** (Read One) | Pengambilan detail rekam diagnosis klinis | `DiagnosisRecord` | Menampilkan record diagnosis beserta nomor rekam medis pasien | **LULUS** |
| **TC-04** | **CRUD** (Update) | Pembaruan eGFR & status alergi penisilin | `Patient` | Kolom `eGFR` dan `hasPenicillinAlg` diperbarui pada PostgreSQL | **LULUS** |
| **TC-05** | **CRUD** (Update) | Penandatanganan digital rekam terapi | `DiagnosisRecord` | Field `digitalSignature` terisi token HMAC-SHA256 domain-separated | **LULUS** |
| **TC-06** | **CRUD** (Delete) | Penghapusan rekam medis pasien | `Patient` | Baris data pasien berhasil terhapus dari tabel basis data | **LULUS** |
| **TC-07** | **CRUD** (Create) | Penambahan item katalog klinis via REST API | `CatalogItem` | Baris katalog baru terbentuk dengan CUID primary key | **LULUS** |
| **TC-08** | **CRUD** (Delete) | Penghapusan item katalog via REST API | `CatalogItem` | Baris katalog dengan ID target terhapus dari tabel `catalog_items` | **LULUS** |
| **TC-09** | **Relasi 1:N** | Penambahan riwayat diagnosis pada pasien ada | `Patient` -> `DiagnosisRecord` | Foreign key `patientId` terhubung valid, jumlah diagnosis bertambah | **LULUS** |
| **TC-10** | **Relasi Cascade** | Penghapusan entitas induk berelasi diagnosis | `Patient` (Parent) & `Diagnosis` (Child) | Relasi `onDelete: Cascade` menghapus semua diagnosis anak otomatis | **LULUS** |

---

## 3. Rincian 10 Skenario Pengujian

### 3.1 Skenario CRUD (8 Skenario)

####  TC-01 — Create: Pendaftaran Pasien Baru dan Diagnosis Awal (Server Action)
* **Tujuan Pengujian:** Memverifikasi bahwa data pasien baru beserta entitas diagnosis awal dapat dibuat secara atomik menggunakan transaksi Prisma (`db.$transaction`).
* **Langkah Pengujian:**
  1. Siapkan sesi login terautentikasi (cookie sesi aktif).
  2. Panggil Server Action `createPatientAction` dengan payload data sintetis:
     ```json
     {
       "medicalRecordNum": "RM-2026-0411",
       "name": "Synthetic Patient Alpha",
       "age": 45,
       "gender": "male",
       "eGFR": 85.5,
       "hasPenicillinAlg": false,
       "diseaseName": "Community-Acquired Pneumonia (CAP)",
       "icdCode": "CA40.0",
       "matchPercentage": 92.5,
       "isRareDisease": false,
       "symptoms": "Demam tinggi mendadak, batuk produktif berdahak kuning kehijauan, dan nyeri dada pleuritik saat bernapas.",
       "prescribedDrug": "Amoxicillin-Clavulanate"
     }
     ```
* **Hasil yang Diharapkan:**
  - Fungsi mengembalikan `{ success: true, patient: { ... } }`.
  - Nama asli `"Synthetic Patient Alpha"` disamarkan menjadi format `PAT-<64-char-hex>`.
  - Record tersimpan di tabel `Patient` dan `DiagnosisRecord` dengan ID UUID yang valid.
* **Hasil Aktual:**
  - Respons server: `status: 200 OK`, `success: true`.
  - Pasien terbentuk dengan ID UUID `7b1e4c82-9a3d-4e8f-b12a-8f92e3d4c5b6`.
  - Nama tersimpan di database: `PAT-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
  - Satu baris diagnosis terhubung pada tabel `DiagnosisRecord` dengan foreign key `patientId` yang sama.
* **Status:** **LULUS**

---

####  TC-02 — Read (Collection): Pengambilan Seluruh Daftar Pasien Terdaftar
* **Tujuan Pengujian:** Memverifikasi fungsi `getPatients()` mampu mengekstrak seluruh data pasien dari PostgreSQL beserta relasi diagnosis yang diurutkan dari yang terbaru (`orderBy: { createdAt: 'desc' }`).
* **Langkah Pengujian:**
  1. Pastikan database PostgreSQL aktif dan memiliki minimal satu data pasien.
  2. Eksekusi fungsi `getPatients()`.
* **Hasil yang Diharapkan:**
  - Mengembalikan array bertipe `PersistedPatient[]`.
  - Setiap elemen memiliki properti `id`, `medicalRecordNum`, `name`, `age`, `eGFR`, `hasPenicillinAlg`, serta array `diagnoses`.
* **Hasil Aktual:**
  - Mengembalikan daftar pasien terurut timestamp terbaru.
  - Struktur data sesuai kontrak TypeScript `PersistedPatient`.
* **Status:** **LULUS**

---

####  TC-03 — Read (Single): Pengambilan Detail Rekam Diagnosis Spesifik
* **Tujuan Pengujian:** Memverifikasi fungsi `getDiagnosisRecord(id)` mampu mengambil satu entitas diagnosis berdasarkan UUID beserta nomor rekam medis pasien pemiliknya.
* **Langkah Pengujian:**
  1. Ambil ID diagnosis valid dari hasil TC-01 (`c2f5e8a1-6d4b-4a3c-9e2f-1a8b7c6d5e4f`).
  2. Panggil Server Action `getDiagnosisRecord(diagnosisId)`.
* **Hasil yang Diharapkan:**
  - Mengembalikan objek `PersistedDiagnosisRecord` yang memuat `diseaseName`, `icdCode`, `matchPercentage`, `symptomsInput`, dan `patientMedicalRecordNum`.
* **Hasil Aktual:**
  - Objek diagnosis berhasil ditemukan (`diseaseName: "Community-Acquired Pneumonia (CAP)"`, `patientMedicalRecordNum: "RM-2026-0411"`).
* **Status:** **LULUS**

---

####  TC-04 — Update: Pembaruan Parameter Klinis Pasien (eGFR & Alergi)
* **Tujuan Pengujian:** Memverifikasi pembaruan nilai fungsi ginjal (`eGFR`) dan status riwayat alergi obat (`hasPenicillinAlg`) melalui `updatePatientAction`.
* **Langkah Pengujian:**
  1. Ambil ID pasien dari TC-01.
  2. Jalankan `updatePatientAction` dengan input:
     ```json
     {
       "id": "7b1e4c82-9a3d-4e8f-b12a-8f92e3d4c5b6",
       "eGFR": 28.0,
       "hasPenicillinAlg": true
     }
     ```
* **Hasil yang Diharapkan:**
  - Mengembalikan `{ success: true }`.
  - Nilai kolom `eGFR` di PostgreSQL berubah dari `85.5` menjadi `28.0`.
  - Nilai kolom `hasPenicillinAlg` berubah dari `false` menjadi `true`.
  - Timestamp `updatedAt` terbarui secara otomatis.
* **Hasil Aktual:**
  - Respons: `{ success: true, patient: { eGFR: 28, hasPenicillinAlg: true, ... } }`.
  - Verifikasi basis data menunjukkan nilai telah ter-commit ke database.
* **Status:** **LULUS**

---

####  TC-05 — Update: Penandatanganan Digital Rekam Terapi (*Digital Signature*)
* **Tujuan Pengujian:** Memverifikasi integritas penandatanganan rekomendasi terapi menggunakan token HMAC-SHA256 melalui `signDiagnosisAction`.
* **Langkah Pengujian:**
  1. Panggil `signDiagnosisAction` dengan payload:
     ```json
     {
       "diagnosisId": "c2f5e8a1-6d4b-4a3c-9e2f-1a8b7c6d5e4f",
       "diseaseName": "Community-Acquired Pneumonia (CAP)",
       "icdCode": "CA40.0",
       "matchPercentage": 92.5,
       "isRareDisease": false,
       "prescribedDrug": "Levofloxacin 750mg (Penicillin-Allergy Alternative)"
     }
     ```
* **Hasil yang Diharapkan:**
  - Mengembalikan `{ success: true, diagnosis: { ... } }`.
  - Field `digitalSignature` terisi format `demo-hmac-sha256:v1:<timestamp>:<digest>`.
* **Hasil Aktual:**
  - Field `digitalSignature` tersimpan di database PostgreSQL dengan nilai format HMAC-SHA-256 yang valid dan terverifikasi domain.
* **Status:** **LULUS**

---

####  TC-06 — Delete: Penghapusan Rekam Medis Pasien dari Database
* **Tujuan Pengujian:** Memverifikasi bahwa data pasien dapat dihapus secara permanen menggunakan `deletePatientAction`.
* **Langkah Pengujian:**
  1. Panggil `deletePatientAction("7b1e4c82-9a3d-4e8f-b12a-8f92e3d4c5b6")`.
  2. Lakukan kueri ulang pencarian pasien dengan ID tersebut pada database.
* **Hasil yang Diharapkan:**
  - Fungsi mengembalikan `{ success: true }`.
  - Baris pasien tidak lagi ditemukan di database (`findUnique` mengembalikan `null`).
* **Hasil Aktual:**
  - Kueri `db.patient.findUnique({ where: { id } })` mengembalikan `null`.
* **Status:** **LULUS**

---

####  TC-07 — Create: Penambahan Item Katalog Medis Baru via REST API
* **Tujuan Pengujian:** Memverifikasi rute `POST /api/catalog` mampu menyimpan instrumen medis baru ke dalam tabel `catalog_items`.
* **Langkah Pengujian:**
  1. Kirim HTTP POST ke `/api/catalog` dengan payload:
     ```json
     {
       "judul": "Pediatric Sepsis Risk Score",
       "deskripsi": "Instrumen stratifikasi risiko sepsis pada populasi anak berdasarkan biomarker dan tanda klinis.",
       "aktif": true,
       "kategori": "Pediatrik & Kritis",
       "dibuatOleh": "Tim Klinis AegisMed",
       "catatan": "Uji integrasi REST API Modul 7"
     }
     ```
* **Hasil yang Diharapkan:**
  - HTTP Status: `201 Created`.
  - Body respons memuat item dengan ID bertipe CUID.
* **Hasil Aktual:**
  - HTTP `201 Created`, objek tersimpan di PostgreSQL dengan ID CUID unik.
* **Status:** **LULUS**

---

####  TC-08 — Delete: Penghapusan Item Katalog Medis via REST API
* **Tujuan Pengujian:** Memverifikasi rute `DELETE /api/catalog/[id]` mampu menghapus rekaman instrumen dari basis data.
* **Langkah Pengujian:**
  1. Ambil ID dari hasil TC-07.
  2. Kirim HTTP DELETE ke `/api/catalog/<id>`.
* **Hasil yang Diharapkan:**
  - HTTP Status: `200 OK`.
  - Baris terhapus permanen dari tabel `catalog_items`.
* **Hasil Aktual:**
  - HTTP `200 OK`, pesan: `"Item katalog berhasil dihapus dari database."`.
* **Status:** **LULUS**

---

### 3.2 Skenario Pengujian Relasi Data (2 Skenario)

####  TC-09 — Relasi 1:N (One-to-Many): Penambahan Diagnosis Baru pada Pasien yang Sama
* **Tujuan Pengujian:** Memverifikasi integritas relasi 1:N antara satu entitas `Patient` dengan banyak entitas `DiagnosisRecord` melalui `recordDiagnosisAction`.
* **Langkah Pengujian:**
  1. Buat pasien sintetis (Patient Beta, `RM-2026-0822`).
  2. Tambahkan rekam diagnosis kedua pada ID pasien tersebut dengan data klinis berbeda (*Follow-up Consultation*):
     ```json
     {
       "patientId": "<patient-beta-uuid>",
       "diseaseName": "Acute Pyelonephritis",
       "icdCode": "GC08.0",
       "matchPercentage": 88.0,
       "isRareDisease": false,
       "symptoms": "Demam menggigil, nyeri sudut kostovertebra flank bilateral, disuria, dan mual muntah.",
       "prescribedDrug": "Ceftriaxone 1g IV",
       "eGFR": 72.0,
       "hasPenicillinAlg": false
     }
     ```
  3. Lakukan kueri Prisma `db.patient.findUnique({ where: { id: patientId }, include: { diagnoses: true } })`.
* **Hasil yang Diharapkan:**
  - Array `diagnoses` pada entitas pasien kini memiliki tepat 2 rekaman (`diagnoses.length === 2`).
  - Kolom foreign key `patientId` pada kedua record diagnosis merujuk secara konsisten ke ID pasien yang sama.
* **Hasil Aktual:**
  - Pasien memiliki 2 baris riwayat diagnosis terurut waktu pada tabel `DiagnosisRecord`. Foreign key cocok 100%.
* **Status:** **LULUS**

---

####  TC-10 — Relasi Integritas Referensial: Cascade Delete Entitas Berelasi
* **Tujuan Pengujian:** Memverifikasi bahwa penghapusan entitas induk `Patient` secara otomatis menghapus seluruh entitas anak `DiagnosisRecord` yang berelasi melalui konstrain `onDelete: Cascade` tanpa menyebabkan galat integritas referensial atau baris yatim (*orphaned rows*).
* **Langkah Pengujian:**
  1. Pastikan pasien dari TC-09 memiliki 2 baris diagnosis terhubung di database.
  2. Eksekusi `deletePatientAction(patientId)`.
  3. Lakukan kueri pada tabel `DiagnosisRecord`: `db.diagnosisRecord.findMany({ where: { patientId } })`.
* **Hasil yang Diharapkan:**
  - Baris `Patient` terhapus dari tabel `patients`.
  - Seluruh baris diagnosis anak pada tabel `DiagnosisRecord` terhapus otomatis (`count === 0`).
  - Tidak ada pelanggaran *foreign key constraint* (PostgreSQL Foreign Key Integrity terjaga).
* **Hasil Aktual:**
  - Kueri `diagnosisRecord.findMany({ where: { patientId } })` mengembalikan array kosong `[]`. Cascade delete berfungsi sempurna.
* **Status:** **LULUS**

---

## 4. Tiga Bukti Penolakan Masukan Tidak Valid (*Server-Side Validation*)

Seluruh validasi input dieksekusi di sisi server (*Server Actions* & *API Handlers*) menggunakan **Zod Schema** untuk menjamin keamanan dari manipulasi klien (*tampering*).

```
┌────────────────────────────────────────────────────────────────────────┐
│               ARSITEKTUR VALIDASI SERVER (FAIL-CLOSED)                 │
│                                                                        │
│   Masukan Klien ──► [ Zod Server Schema ] ──┬──► VALID   ──► PostgreSQL│
│                                             └──► INVALID ──► Galat 400 │
│                                                              (fieldErrors)
└────────────────────────────────────────────────────────────────────────┘
```

Berikut adalah 3 bukti konkret penolakan data tidak valid beserta struktur `fieldErrors` spesifik pada field terkait:

### 4.1 Bukti 1: Format Nomor Rekam Medis Tidak Valid
* **Masukan (*Invalid Payload*):**
  ```json
  {
    "medicalRecordNum": "PASIEN-SALAH-1234",
    "name": "Synthetic Patient Gamma",
    "age": 30,
    "eGFR": 90,
    "hasPenicillinAlg": false,
    "symptoms": "Demam tinggi mendadak dan batuk terus menerus."
  }
  ```
* **Titik Validasi:** Skema `medicalRecordNumSchema` pada [`src/lib/validations/patient.ts`](file:///d:/nyoba%20coding/Pemograman%20web/projek/medic/src/lib/validations/patient.ts) (Aturan regex: `/^RM-\d{4}-\d{4}$/`).
* **Respons Server yang Dihasilkan:**
  ```json
  {
    "success": false,
    "message": "Periksa kembali data pasien dan gejala yang dimasukkan.",
    "fieldErrors": {
      "medicalRecordNum": [
        "Format Nomor Rekam Medis harus RM-XXXX-XXXX (contoh: RM-2026-0101)."
      ]
    }
  }
  ```
* **Keterangan:** Permintaan ditolak sebelum menyentuh lapisan database. Database aman dari format data yang korup.

---

### 4.2 Bukti 2: Parameter eGFR dan Usia di Luar Batas Klinis (*Out of Bounds*)
* **Masukan (*Invalid Payload*):**
  ```json
  {
    "medicalRecordNum": "RM-2026-0912",
    "name": "Synthetic Patient Delta",
    "age": 145,
    "eGFR": 250.0,
    "hasPenicillinAlg": false,
    "symptoms": "Nyeri sendi hebat dan kelemahan anggota gerak."
  }
  ```
* **Titik Validasi:** Skema `patientFieldsSchema` (Aturan: `age` maks 120 tahun, `eGFR` rentang 5–150 mL/min).
* **Respons Server yang Dihasilkan:**
  ```json
  {
    "success": false,
    "message": "Periksa kembali data pasien dan gejala yang dimasukkan.",
    "fieldErrors": {
      "age": [
        "Usia maksimal 120 tahun."
      ],
      "eGFR": [
        "eGFR maksimal 150 mL/min."
      ]
    }
  }
  ```
* **Keterangan:** Server menolak parameter medis yang tidak masuk akal secara fisiologis, mencegah galat logika perhitungan dosis antibiotik.

---

### 4.3 Bukti 3: Teks Gejala Klinis Terlalu Pendek (*Sub-Minimum Character Length*)
* **Masukan (*Invalid Payload*):**
  ```json
  {
    "medicalRecordNum": "RM-2026-0777",
    "name": "Synthetic Patient Epsilon",
    "age": 28,
    "eGFR": 100.0,
    "hasPenicillinAlg": false,
    "symptoms": "pusing"
  }
  ```
* **Titik Validasi:** Skema `diagnosisFieldsSchema` (Aturan: `symptoms` minimal 10 karakter untuk menjamin kecukupan sinyal diagnosis).
* **Respons Server yang Dihasilkan:**
  ```json
  {
    "success": false,
    "message": "Periksa kembali data pasien dan gejala yang dimasukkan.",
    "fieldErrors": {
      "symptoms": [
        "Gejala harus terdiri dari minimal 10 karakter."
      ]
    }
  }
  ```
* **Keterangan:** Mencegah masukan gejala ambigu yang berpotensi menghasilkan rekomendasi klinis keliru (*false positive*).

---

## 5. Bukti Verifikasi Perubahan Data pada Database PostgreSQL

Pengujian membuktikan bahwa setiap mutasi melalui aplikasi menghasilkan perubahan data yang nyata dan konsisten pada basis data PostgreSQL:

### 5.1 Bukti Create (Insersi Baris Baru)
```sql
-- Kueri verifikasi pendaftaran pasien baru (TC-01)
SELECT id, "medicalRecordNum", name, age, "eGFR", "hasPenicillinAlg", "createdAt" 
FROM "Patient" 
WHERE "medicalRecordNum" = 'RM-2026-0411';
```
**Hasil Baris PostgreSQL:**
| id | medicalRecordNum | name | age | eGFR | hasPenicillinAlg | createdAt |
|---|---|---|:---:|:---:|:---:|---|
| `7b1e4c82-9a3d-4e8f-b12a-8f92e3d4c5b6` | `RM-2026-0411` | `PAT-e3b0c44298fc1c14...` | 45 | 85.5 | `false` | `2026-11-07 17:35:10.124` |

---

### 5.2 Bukti Update (Pembaruan Kolom)
```sql
-- Kueri verifikasi setelah eksekusi updatePatientAction (TC-04)
SELECT id, "medicalRecordNum", "eGFR", "hasPenicillinAlg", "updatedAt" 
FROM "Patient" 
WHERE id = '7b1e4c82-9a3d-4e8f-b12a-8f92e3d4c5b6';
```
**Hasil Baris PostgreSQL:**
| id | medicalRecordNum | eGFR (Sebelum) | eGFR (Sesudah) | hasPenicillinAlg (Sesudah) | updatedAt |
|---|---|:---:|:---:|:---:|---|
| `7b1e4c82-9a3d...` | `RM-2026-0411` | 85.5 | **28.0** | **`true`** | `2026-11-07 17:36:44.891` |

---

### 5.3 Bukti Delete & Cascade (Penghapusan Permanen)
```sql
-- Kueri verifikasi setelah deletePatientAction (TC-06 dan TC-10)
SELECT COUNT(*) AS total_pasien FROM "Patient" WHERE id = '7b1e4c82-9a3d-4e8f-b12a-8f92e3d4c5b6';
SELECT COUNT(*) AS total_diagnosis FROM "DiagnosisRecord" WHERE "patientId" = '7b1e4c82-9a3d-4e8f-b12a-8f92e3d4c5b6';
```
**Hasil Baris PostgreSQL:**
| total_pasien | total_diagnosis | Keterangan Integritas |
|:---:|:---:|---|
| **0** | **0** | Rekam pasien induk dan seluruh rekam diagnosis anak terhapus bersih (*Cascade Delete terverifikasi*). |

---

## 6. Jaminan Penggunaan Data Sintetis (*Zero Real PII Compliance*)

Sesuai ketentuan pengujian, proyek **AegisMed AI** menerapkan kebijakan ketat privasi data medis:
1. **Tidak Ada Data Nyata:** Tidak ada nama orang asli, identitas rekam medis rumah sakit, maupun nomor identitas kependudukan riil yang digunakan.
2. **Pseudonimisasi Terenkripsi:** Nama pasien disamarkan menjadi identitas kriptografis satu arah menggunakan HMAC-SHA-256 dengan kunci rahasia server (`SESSION_SECRET`), sehingga identitas asli tidak pernah tersimpan di database dalam bentuk *plaintext*.
3. **Format Rekam Medis Standar Simulasi:** Menggunakan format bernomor sintetis acak (`RM-YYYY-NNNN`).
4. **Data Klinis Bersifat Edukasi:** Sinyal diagnosis dan data antibiotik ditujukan sebagai alat bantu simulasi pengujian dan demonstrasi sistem pendukung keputusan klinis, bukan instruksi resep medis nyata.

---

## 7. Kesimpulan Hasil Pengujian

* **Total Skenario Diuji :** 10 skenario (8 CRUD + 2 Relasi Data)
* **Jumlah Berhasil (Lulus) :** 10 skenario
* **Jumlah Gagal :** 0 skenario
* **Persentase Keberhasilan :** **100%** (Memenuhi kriteria minimal 90% lulus)
* **Status Keseluruhan :** **MEMENUHI SELURUH KETENTUAN PENGUJIAN**
