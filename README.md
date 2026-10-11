# AegisMed AI — Clinical Decision Support System (CDSS)
> **Tugas Terintegrasi:** Pengembangan Aplikasi Web, Keamanan Komputasi dan Siber, serta Kriptografi  
> **Milestone:** v0.1 / sec-0.1

---

## 📌 1. Konsep & Deskripsi Produk

### A. Nama & Visi Produk
* **Nama Produk:** AegisMed AI
* **Kategori:** Clinical Decision Support System (CDSS) Berbasis Web
* **Visi Produk:** Menjadi asisten AI medis (*co-pilot*) di rumah sakit yang membantu dokter mendiagnosis penyakit secara presisi, mendeteksi indikasi penyakit langka, serta memberikan rekomendasi peresepan antibiotik yang tepat guna mencegah kesalahan diagnosis (*diagnostic error*) dan resistensi antimikroba (AMR).

### B. Permasalahan yang Diselesaikan
1. **Diagnostic Error (Kesalahan Diagnosis):** Tingginya risiko kesalahan diagnosis pada kasus klinis kompleks atau penyakit langka yang jarang ditemui dokter dalam praktik sehari-hari.
2. **Resistensi Antimikroba (AMR):** Peresepan antibiotik yang kurang tepat, dosis berlebih, atau ketidaksesuaian dengan fungsi organ (ginjal/hati) dan alergi pasien.
3. **Komunikasi Medis Pasien:** Kurangnya pemahaman pasien terhadap kondisi penyakitnya akibat jargon medis yang rumit.
4. **Pencocokan Gejala Bahasa Awam & Typo:** Kegagalan pencarian saat gejala dimasukkan menggunakan bahasa biasa/awam (misal: `"pusing"`, `"sakit perut"`, `"menceret"`, `"extrem headache"`) atau terdapat typo.

### C. Sasaran Pengguna
* **Dokter Umum & Dokter Spesialis:** Membantu verifikasi *differential diagnosis*, penyesuaian dosis obat, dan deteksi penyakit langka secara *real-time*[cite: 3].
* **Tenaga Farmasi / Apoteker Rumah Sakit:** Memverifikasi keamanan antibiotik, riwayat alergi, dan penyesuaian dosis organ[cite: 3].
* **Pasien Rumah Sakit:** Membaca penjelasan penyakit dan petunjuk perawatan rumah dalam bahasa yang ramah awam[cite: 3].

### D. Kontribusi Integrasi Lintas Mata Kuliah
* **Pengembangan Aplikasi Web:** Pembangunan antarmuka interaktif, komponen reusable, validasi form *client-side*, integrasi database, pencocokan sinonim/bahasa awam (*Fuzzy Natural Language Engine*), dan estetika UI bertema *Dark Navy / Cyberpunk*[cite: 1, 2, 3].
* **Keamanan Komputasi dan Siber:** Threat Modeling (STRIDE, DFD, Risk Assessment), sistem *Role-Based Access Control* (RBAC), mitigasi OWASP Top 10, dan jejak audit rekam medis[cite: 3].
* **Kriptografi:** Anonimisasi data pribadi pasien (*SHA-256 Pseudonymization*) sebelum dikirim ke AI, enkripsi rekam medis (*AES-256-GCM*), dan verifikasi integritas data[cite: 3].

---

## 🔐 2. Kebutuhan & Modul Kriptografi

### A. Tabel Kebutuhan Kriptografi
| Nama Data Sensus / Produk | Tujuan Keamanan | Algoritma / Mekanisme | Prioritas |
|---|---|---|---|
| **Identitas Pasien (Nama & NIK)** | *Confidentiality & Anonymization* | SHA-256 Pseudonymization Hashing | **High** |
| **Catatan Rekam Medis & Diagnosa AI** | *Confidentiality & Integrity* | AES-256-GCM (Authenticated Encryption) | **High** |
| **Resep Digital Antibiotik Dokter** | *Authenticity & Non-Repudiation* | HMAC-SHA256 Digital Verification | **Medium** |

### B. Rancangan Komponen Kriptografi
1. **Anonimisasi Identitas Pasien (SHA-256):**
   - **Masukan:** String Nama Asli Pasien (misal: `"Siti Rahma"`).
   - **Proses:** Hashing menggunakan SHA-256 dengan format output Heksadesimal.
   - **Keluaran:** Hash anonim sepanjang 64 karakter heksadesimal (`"PAT-8A9F-2026"`).
   - **Representasi Data:** Hex String.
2. **Enkripsi Rekam Medis (AES-256-GCM):**
   - **Masukan:** Teks Rekam Medis/Diagnosa (`Plaintext`) dan Kunci Rahasia 256-bit (`Hex`).
   - **Proses:** Enkripsi simetris AES-256-GCM dengan *Initialization Vector* (IV) 96-bit unik.
   - **Keluaran:** Objek `{ ciphertext, iv, authTag }`.
   - **Sumber Keacakan (CSPRNG):** `crypto.getRandomValues()` / `crypto.randomBytes(12)` untuk menghasilkan IV yang selalu unik dan aman secara kriptografis.

---

## 🚀 3. Fitur Utama

1. **Fuzzy Natural Language & Layman Symptom Matching:**
   - Mampu mengekstrak kata kunci medis dari masukan kalimat biasa, bahasa awam, maupun typo pasien (misal: *"extrem headache"*, *"menceret"*, *"pusing banget"*) serta mengabaikan *stop-words*[cite: 3].
2. **AI Diagnosis & Interactive Diagnostic Cards:**
   - Kartu hasil *differential diagnosis* bertema *Dark Mode* yang dapat diklik (*clickable*) untuk membuka modal detail[cite: 1, 3].
   - Penjelasan penyakit ramah pasien (non-teknis) beserta tanda bahaya (*red flags*)[cite: 3].
3. **Smart Antibiotic Stewardship Verification:**
   - Pencocokan antibiotik teruji klinis berdasarkan patogen dan indikasi[cite: 3].
   - Penyesuaian dosis otomatis berdasarkan slider fungsi ginjal pasien (eGFR) dan centang alergi penisilin/sulfa[cite: 3].
4. **Rare Disease Knowledge Explorer (Tab 3):**
   - Katalog dan pencarian real-time 12+ penyakit langka berbasis kode ICD-11 dan pola gejala klinis (*symptom signals*)[cite: 3].
5. **PDF Export / Print-Ready Medical Report Generator:**
   - Menyediakan fungsi cetak/ekspor resume medis lengkap dengan identitas terenkripsi dan status tanda tangan digital[cite: 3].
6. **Audit History Log & LocalStorage Sync (Tab 4):**
   - Merekam riwayat evaluasi diagnostik yang tersinkronisasi otomatis dengan `localStorage` browser agar data tidak hilang saat *refresh*[cite: 3].
7. **Visual Match Score Analytics Bar:**
   - Bilah grafik progresi visual untuk persentase probabilitas hasil diagnosis[cite: 3].
8. **Quick Clinical Presets:**
   - Tombol satu-klik untuk memuat skenario klinis langsung (misal: *"Load CAP Pneumonia"*, *"Load UTI"*, *"Load Rare Fabry Crisis"*)[cite: 3].

---

## 🛠️ 4. Teknologi yang Digunakan

* **Framework Utama:** React 18+ (Vite)
* **Bahasa Pemrograman:** TypeScript
* **Styling & UI:** Tailwind CSS (Dark Mode Aesthetic / Medical Cyberpunk)[cite: 1, 2]
* **Aksesibilitas (a11y):** HTML5 Semantik, atribut ARIA (`aria-invalid`), label eksplisit `htmlFor`, dan kontras warna WCAG 2.1 AA[cite: 3].
* **Kriptografi:** Web Crypto API / Node `crypto` (SHA-256, AES-256-GCM)[cite: 3].

---

## 📁 5. Struktur Folder Proyek & Mock Data (Persiapan Database MS2)

Mock data disimpan secara terstruktur di `src/mock/diseasesData.ts` sebagai simulasi database sebelum integrasi backend pada Milestone 2[cite: 3]:

```text
medic/
├── dist/                        # Hasil build produksi aplikasi
├── docs/                        # Dokumentasi pendukung & bukti audit
│   └── lighthouse.png           # Bukti pengujian aksesibilitas Lighthouse
├── security/                    # Artefak Keamanan Komputasi dan Siber
│   └── THREAT_MODEL.md          # Threat Modeling STRIDE, DFD, & Risk Assessment (sec-0.1)
├── src/                         # Source code utama aplikasi
│   ├── components/              # Komponen UI Reusable (Button, Card, Badge, Modal, Input)
│   │   └── Layout/              # Navbar & Sidebar
│   ├── crypto/                  # Modul & Unit Testing Kriptografi
│   │   ├── patientCrypto.ts     # Implementasi SHA-256, AES-256-GCM, & CSPRNG
│   │   └── patientCrypto.test.ts# Skenario Uji Otomatis (Unit Test + Negative Test)
│   ├── mock/                    # Data sintetis / mock data (Persiapan MS2)
│   │   └── diseasesData.ts      # Database penyakit ICD-11 & dosis antibiotik
│   ├── pages/                   # Halaman/Tab tampilan utama
│   │   ├── PatientDiagnosis.tsx
│   │   ├── AntibioticChecker.tsx
│   │   ├── RareExplorer.tsx
│   │   └── AuditHistory.tsx
│   ├── utils/                   # Fuzzy Natural Language Symptom Matcher
│   ├── App.tsx                  # Root Application Component
│   ├── index.css                # Custom scrollbar styling & Tailwind imports
│   └── main.tsx                 # Entry point React
├── public/                      # Aset statis publik
├── README.md                    # Dokumentasi utama proyek
├── package.json                 # Dependensi & skrip proyek
└── vite.config.ts               # Konfigurasi Vite
```

# 💻 6. Petunjuk Menjalankan Proyek & Pengujian

## A. Menjalankan Aplikasi Web

1. **Masuk ke folder proyek:**

   ```bash
   cd medic
   ```

2. **Install dependensi:**

   ```bash
   npm install
   ```

3. **Jalankan development server:**

   ```bash
   npm run dev
   ```

4. **Akses di Browser:** Buka `http://localhost:5173`.

## B. Menjalankan Uji Otomatis Kriptografi (Unit Test)

Jalankan perintah berikut untuk mengeksekusi skenario uji otomatis:

```bash
npx tsx src/crypto/patientCrypto.test.ts
```

---

# 🧪 7. Laporan Pengujian Aksesibilitas (Lighthouse A11y Audit)

- **Halaman yang Diuji:** `http://localhost:5173/` (Dashboard Utama AegisMed AI)
- **Mode Pengujian:** Navigation (Default)
- **Perangkat Diemulasikan:** Desktop & Mobile (375px, 768px, 1440px)
- **Versi Browser:** Google Chrome v124+
- **Skor Lighthouse Accessibility:** **94 / 100** (Memenuhi kriteria min. 85)

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
   - **Masukan:** String Nama Asli Pasien (misal: `"paulus siagian"`).
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
```



