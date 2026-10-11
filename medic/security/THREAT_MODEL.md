# Threat Modeling dan Analisis Risiko Produk — AegisMed AI
> **Artefak Keamanan Komputasi dan Siber (Milestone sec-0.1)**  
> **Produk:** AegisMed AI (Clinical Decision Support System / CDSS)

---

## 1. Inventaris Aset dan Data

### A. Inventaris Aset (Hardware, Software, Infrastructure)
1. **Frontend Web Client:** Aplikasi React + TypeScript + Tailwind CSS yang berjalan pada browser dokter/tenaga medis.
2. **AI Engine / LLM Service:** Service API penyedia model AI untuk analisis diagnosis & peresepan.
3. **Database Rekam Medis (EHR Database):** Penyimpan data riwayat medis pasien, hasil diagnosis, dan resep antibiotik.
4. **Auth & Identity Provider (IdP):** Layanan otentikasi dan otorisasi berbasis peran (Dokter, Apoteker, Admin).

### B. Inventaris Data (Klasifikasi Risiko)
1. **Data Pasien (PHI - Protected Health Information):** Nama, Usia, NIK, dan Riwayat Alergi (*Sangat Sensitif / Kerahasiaan Tinggi*).
2. **Data Diagnosa & Gejala Klinis:** Hasil input gejala dan prediksi AI (*Sensitif / Integritas Tinggi*).
3. **Resep Digital Antibiotik:** Data peresepan, dosis, dan tanda tangan digital dokter (*Kritis / Integritas & Non-repudiation Tinggi*).
4. **Kunci Kriptografi & Token Sesi:** Private Keys, JWT Token, dan Hash Salt (*Kritis / Kerahasiaan Mutlak*).

---

## 2. Diagram Arsitektur & Aliran Data (DFD) dengan Trust Boundary

```text
[ DOKTER / USER ] 
       │ (1. Input Gejala / Akses Resep)
       ▼
┌─────────────────────────────────────────────────────────┐
│ TRUST BOUNDARY 1: Browser / Public Network              │
│                                                         │
│  [ React Frontend (AegisMed AI) ]                       │
│    │                                                    │
│    ├── (2. Anonymization SHA-256) ──> [ Anonymizer ]    │
└────┼────────────────────────────────────────────────────┘
     │ (3. HTTPS / TLS 1.3 encrypted REST API)
     ▼
┌─────────────────────────────────────────────────────────┐
│ TRUST BOUNDARY 2: Hospital Internal Network / Backend   │
│                                                         │
│  [ API Gateway / Backend Server ]                       │
│    │                                                    │
│    ├── (4. Query AI) ──────> [ AI Diagnostic Engine ]   │
│    │                                                    │
│    ├── (5. Encrypted Store) ─> [ EHR Database ]         │
│    │                                                    │
│    └── (6. Verification) ───> [ Auth / IdP Service ]    │
└─────────────────────────────────────────────────────────┘

# **3. Iden�fikasi Ancaman STRIDE (10 Ancaman Minimal)** 

**T01 | Frontend User | Spoofing** 

Penyerang memalsukan iden�tas atau sesi dokter untuk masuk dan mengakses sistem CDSS. 

**T02 | API Request | Tampering** 

Penyerang mengubah data gejala pasien di tengah jalan (Man-in-the-Middle) sebelum dikirim ke mesin AI. 

# **T03 | Rekam Medis / EHR | Repudia�on** 

Dokter membantah telah mengeluarkan resep an�bio�k berlebih yang memicu komplikasi pada pasien. 

# **T04 | AI Diagnos�c Engine | Informa�on Disclosure** 

Data iden�tas pribadi pasien (PHI) bocor ke pihak ke�ga atau server AI eksternal tanpa proses anonimisasi. 

# **T05 | API Gateway | Denial of Service** 

Penyerang membombardir API dengan permintaan masif (DDoS) sehingga dokter �dak dapat mengakses fungsi diagnosis saat kondisi darurat. 

**T06 | Database Server | Eleva�on of Privilege** 

Penyerang memanfaatkan celah SQL Injec�on atau IDOR untuk mendapatkan hak akses sebagai Admin Sistem. 

# **T07 | Local Storage / Session | Informa�on Disclosure** 

Token JWT atau data pasien tersimpan di Unencrypted Browser Storage dan dicuri melalui serangan Cross-Site Scrip�ng (XSS). 

# **T08 | Digital Signature | Tampering** 

Dosis an�bio�k yang telah ditandatangani digital oleh dokter diubah oleh pihak tak berwenang sebelum diterima oleh pihak apotek. 

**T09 | Auth Service | Spoofing** 

Serangan brute-force pada kata sandi akun dokter yang �dak dilengkapi dengan fitur Mul�Factor Authen�ca�on (MFA). 

# **T10 | System Logs | Repudia�on** 

Log ak�vitas sistem dihapus oleh penyerang untuk menghilangkan jejak audit peretasan. 

# **4. Penilaian Risiko & 5 Risiko Prioritas** 

_Metode Penilaian Risiko: Kemungkinan (1-5) x Dampak (1-5) = Skor Risiko (1-25)_ 

**1. Kebocoran Data Pribadi Pasien (PHI) ke Server AI Eksternal** 

- Kemungkinan: 4 (Tinggi) 

- Dampak: 5 (Kri�s) 

- Skor Risiko: 20 (Kri�s) 

- Jus�fikasi: AegisMed AI mengirimkan deskripsi gejala ke LLM; jika nama pasien �dak dihash, terjadi pelanggaran UU PDP/HIPAA. 

# **2. Manipulasi Dosis An�bio�k pada Resep Digital** 

- Kemungkinan: 3 (Sedang) 

- Dampak: 5 (Kri�s) 

- Skor Risiko: 15 (Tinggi) 

- Jus�fikasi: Kesalahan dosis an�bio�k akibat manipulasi data dapat membahayakan nyawa pasien dan memicu resistensi bakteri. 

# **3. Pengambilalihan Akun Dokter (Account Takeover)** 

- Kemungkinan: 3 (Sedang) 

- Dampak: 4 (Tinggi) 

- Skor Risiko: 12 (Tinggi) 

- Jus�fikasi: Akses ilegal ke akun dokter memungkinkan pihak luar melihat seluruh rekam medis dan menerbitkan resep palsu. 

# **4. Serangan Denial of Service (DoS) pada Sistem CDSS** 

- Kemungkinan: 3 (Sedang) 

- Dampak: 4 (Tinggi) 

- Skor Risiko: 12 (Tinggi) 

- Jus�fikasi: Ke�ka sistem down, dokter di IGD kehilangan akses verifikasi diagnosis penyakit langka secara real-�me. 

# **5. Eksekusi Script Jahat (XSS) pada Input Gejala Klinis** 

- Kemungkinan: 4 (Tinggi) 

- Dampak: 3 (Sedang) 

- Skor Risiko: 12 (Tinggi) 

- Jus�fikasi: Input teks gejala dari dokter dapat disisipi payload XSS jika �dak disanitasi dengan benar pada antarmuka React. 

# **5. Rencana Kontrol Keamanan (Mi�gasi Risiko Prioritas)** 

# **1. Kontrol Kebocoran PHI (R01)** 

- Rencana Kontrol: Menerapkan modul SHA-256 Pseudonymiza�on di sisi client sebelum data dikirim ke API / AI Engine. 

- Rencana Demonstrasi: Menunjukkan sakelar Anonymiza�on Toggle pada UI yang mengubah nama "Si� Rahma" menjadi "PAT-SHA256-8A9F" sebelum permintaan dikirim. 

# **2. Kontrol Manipulasi Dosis Resep (R02)** 

- Rencana Kontrol: Menerapkan HMAC-SHA256 Digital Signature dan Enkripsi simetris AES-256-GCM pada objek resep. 

- Rencana Demonstrasi: Melakukan verifikasi Integrity Check saat resep dibuka; jika payload diubah 1 karakter saja, sistem otoma�s menolak resep. 

# **3. Kontrol Account Takeover (R03)** 

- Rencana Kontrol: Pembatasan masa berlaku JWT Token (Short-lived token), HTTP-only Secure Cookies, dan simulasi Mul�-Factor Authen�ca�on (MFA). 

- Rencana Demonstrasi: Pengujian penolakan akses saat token kedaluwarsa atau ke�ka ada percobaan login tanpa MFA. 

# **4. Kontrol Serangan DoS (R04)** 

- Rencana Kontrol: Penerapan Rate Limi�ng pada API Gateway (maksimal 100 request/menit per IP) dan caching lokal untuk data penyakit langka. 

- Rencana Demonstrasi: Pengujian pengiriman request berulang secara cepat hingga server mengembalikan status 429 Too Many Requests. 

# **5. Kontrol Serangan XSS (R05)** 

- Rencana Kontrol: Sanitasi input ketat pada form React menggunakan library DOMPurify dan penerapan Content Security Policy (CSP) pada HTTP Header. 

- Rencana Demonstrasi: Memasukkan string <script>alert('XSS')</script> pada kolom gejala; aplikasi secara otoma�s meng-escape karakter menjadi teks aman. 

