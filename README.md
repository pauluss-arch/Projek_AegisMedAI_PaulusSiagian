# AegisMed AI — Clinical Decision Support System (CDSS)
> **Tugas 1 (Milestone 1) - Pengembangan Aplikasi Web**  
> *Proyek Terintegrasi: Pengembangan Aplikasi Web, Keamanan Komputasi dan Siber, serta Kriptografi*

---

## 📌 1. Konsep & Deskripsi Produk

### A. Nama & Visi Produk
* **Nama Produk:** AegisMed AI
* **Kategori:** Clinical Decision Support System (CDSS) berbasis Web
* **Visi Produk:** Menjadi asisten AI medis (*co-pilot*) di rumah sakit yang membantu dokter mendiagnosis penyakit secara presisi, mendeteksi indikasi penyakit langka, serta memberikan rekomendasi peresepan antibiotik yang tepat guna mencegah kesalahan diagnosis (*diagnostic error*) dan resistensi antimikroba (AMR).

### B. Permasalahan yang Diselesaikan
1. **Diagnostic Error (Kesalahan Diagnosis):** Tingginya risiko kesalahan diagnosis pada kasus klinis kompleks atau penyakit langka yang jarang ditemui dokter dalam praktik sehari-hari.
2. **Resistensi Antimikroba (AMR):** Peresepan antibiotik yang kurang tepat, dosis berlebih, atau ketidaksesuaian dengan fungsi organ (ginjal/hati) dan alergi pasien.
3. **Komunikasi Medis Pasien:** Kurangnya pemahaman pasien terhadap kondisi penyakitnya akibat jargon medis yang rumit.

### C. Sasaran Pengguna
* **Dokter Umum & Dokter Spesialis:** Membantu verifikasi *differential diagnosis*, penyesuaian dosis obat, dan deteksi penyakit langka secara *real-time*.
* **Tenaga Farmasi / Apoteker Rumah Sakit:** Memverifikasi keamanan antibiotik, riwayat alergi, dan penyesuaian dosis organ.
* **Pasien Rumah Sakit:** Membaca penjelasan penyakit dan petunjuk perawatan rumah dalam bahasa yang ramah awam.

### D. Kontribusi Integrasi Lintas Mata Kuliah
* **Pengembangan Aplikasi Web (Milestone 1 & 2):** Pembangunan antarmuka interaktif, komponen reusable, validasi form *client-side*, integrasi database, dan API server.
* **Keamanan Komputasi dan Siber (Milestone Selanjutnya):** Sistem *Role-Based Access Control* (RBAC) untuk otorisasi dokter/admin, mitigasi serangan OWASP Top 10, dan jejak audit rekam medis.
* **Kriptografi (Milestone Selanjutnya):** Anonimisasi data pribadi pasien (*SHA-256 Pseudonymization*) sebelum dikirim ke AI, *End-to-End Encryption* (E2EE) rekam medis, dan Tanda Tangan Digital (*Digital Signature*) pada peresepan antibiotik.

---

## 🚀 2. Fitur Utama (Milestone 1)

1. **AI Diagnosis & Interactive Diagnostic Cards:**
   - Formulir input data klinis pasien dengan validasi *client-side*.
   - Kartu hasil *differential diagnosis* bertema *Dark Mode* yang dapat diklik (*clickable*) untuk membuka modal detail.
   - Penjelasan penyakit ramah pasien (non-teknis) beserta tanda bahaya (*red flags*).
2. **Smart Antibiotic Stewardship Verification:**
   - Pencocokan antibiotik teruji klinis berdasarkan patogen dan indikasi.
   - Penyesuaian dosis otomatis berdasarkan slider fungsi ginjal pasien (eGFR) dan centang alergi penisilin.
3. **Rare Disease Knowledge Explorer:**
   - Katalog dan pencarian real-time penyakit langka berbasis kode ICD-11 dan pola gejala klinis (*symptom signals*).
4. **Keamanan & Privasi Data Medis:**
   - Fitur sakelar anonimisasi nama pasien berbasis *SHA-256 Hashing* untuk mencegah kebocoran data medis.

---

## 🛠️ 3. Teknologi yang Digunakan

* **Framework Utama:** React 18+ (Vite)
* **Bahasa Pemrograman:** TypeScript
* **Styling & UI:** Tailwind CSS (Dark Mode Aesthetic / Medical Cyberpunk)
* **Aksesibilitas (a11y):** HTML5 Semantik, atribut ARIA (`aria-invalid`), label eksplisit `htmlFor`, dan kontras warna WCAG 2.1 AA.

---

## 📁 4. Struktur Folder Proyek

```text
aegismed-ai/
├── src/
│   ├── App.tsx          # Aplikasi utama & integrasi 3 Halaman/Tab
│   ├── main.tsx         # Entry point aplikasi
│   └── index.css        # Tailwind CSS imports & global styles
├── public/              # Aset statis
├── index.html           # Berkas HTML utama
├── README.md            # Dokumentasi utama proyek
├── package.json         # Dependensi dan skrip proyek
└── vite.config.ts       # Konfigurasi Vite


## 🔐 Modul Kriptografi produk (Tugas Kriptografi)

### 📋 1. Tabel Kebutuhan Kriptografi
| Nama Data Sensus / Produk | Tujuan Keamanan | Algoritma / Mekanisme | Prioritas |
|---|---|---|---|
| **Identitas Pasien (Nama & NIK)** | *Confidentiality & Anonymization* | SHA-256 Pseudonymization Hashing | **High** |
| **Catatan Rekam Medis & Diagnosa AI** | *Confidentiality & Integrity* | AES-256-GCM (Authenticated Encryption) | **High** |
| **Resep Digital Antibiotik Dokter** | *Authenticity & Non-Repudiation* | HMAC-SHA256 Digital Verification | **Medium** |

---

### 📐 2. Rancangan Komponen Kriptografi
1. **Anonimisasi Identitas Pasien (SHA-256):**
   - **Masukan:** String Nama Asli Pasien (misal: `"Siti Rahma"`).
   - **Proses:** Hashing menggunakan SHA-256 dengan format output Heksa desimal.
   - **Keluaran:** Hash anonim sepanjang 64 karakter heksadesimal (`"PAT-SHA256-..."`).
   - **Representasi Data:** Hex String.

2. **Enkripsi Rekam Medis (AES-256-GCM):**
   - **Masukan:** Teks Rekam Medis/Diagnosa (`Plaintext`) dan Kunci Rahasia 256-bit (`Hex`).
   - **Proses:** Enkripsi simetris AES-256-GCM dengan *Initialization Vector* (IV) 96-bit unik.
   - **Keluaran:** Objek `{ ciphertext, iv, authTag }`.
   - **Sumber Keacakan (CSPRNG):** `crypto.randomBytes(12)` untuk menghasilkan IV yang selalu unik dan aman secara kriptografis.

---

### 🧪 3. Skenario Uji Otomatis (Unit Testing)

Terdapat **4 skenario uji otomatis** di berkas `src/crypto/patientCrypto.test.ts`:

1. **Uji Positif 1 (Consistency Test):** Memastikan fungsi *hash* SHA-256 menghasilkan nilai terenkripsi yang konsisten untuk input nama pasien yang sama. (**BERHASIL**)
2. **Uji Positif 2 (Reversibility Test):** Memastikan proses Enkripsi AES-256-GCM dan Dekripsi dengan kunci yang benar mengembalikan rekam medis asli tanpa ada data terdistorsi. (**BERHASIL**)
3. **Uji Positif 3 (CSPRNG Randomness Test):** Memastikan dua proses enkripsi berurutan dengan teks yang sama menghasilkan *Initialization Vector* (IV) dan *ciphertext* yang berbeda (mencegah *replay attack*). (**BERHASIL**)
4. **Uji Negatif / Edge Case (Security Failure Test):** Memastikan proses dekripsi dengan kunci rahasia (*Secret Key*) yang salah **Gagal (Throws Error)** dan menolak mengekspos data rekam medis pasien. (**BERHASIL**)

#### Cara Menjalankan Uji Otomatis:
Jalankan perintah berikut di terminal Anda:
```bash
npm run test:crypto
# atau menggunakan node/ts-node langsung:
npx tsx src/crypto/patientCrypto.test.ts
