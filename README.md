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
