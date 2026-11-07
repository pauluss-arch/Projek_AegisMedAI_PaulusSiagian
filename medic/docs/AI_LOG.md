Dokumen ini mencatat penggunaan bantuan kecerdasan buatan (AI) dalam perencanaan, perancangan antarmuka, serta penyusunan modul kriptografi proyek AegisMed AI.

##  Rincian Penggunaan AI
* **Model AI yang Digunakan:** Gemini / Claude / ChatGPT
* **Tujuan Penggunaan:**
  1. Menganalisis konsep produk *Clinical Decision Support System (CDSS)* medis.
  2. Menyusun rancangan antarmuka bertema *Dark Mode Aesthetic* berbasis React, TypeScript, dan Tailwind CSS.
  3. Merancang modul kriptografi dasar (AES-256-GCM, SHA-256, CSPRNG) dan 4 skenario uji otomatis.

##  Pernyataan Keamanan & Tanggung Jawab
- **Tidak ada kunci rahasia (*secret keys*), token API, password, atau data pribadi pasien nyata** yang dimasukkan ke dalam prompt AI maupun repositori GitHub.
- Seluruh data pasien yang digunakan dalam pengujian dan contoh aplikasi merupakan **Data Sintetis (Mock Data)**.
- Mahasiswa bertanggung jawab penuh terhadap pemahaman, kebenaran, dan validasi seluruh kode yang dikumpulkan.

## Pembaruan Milestone sec-0.1 (Threat Modeling)
* **Tanggal:** 11 Oktober 2026
* **Model AI:** Gemini
* **Tujuan Penggunaan:** Merancang Threat Modeling STRIDE, DFD dengan Trust Boundary, serta analisis 5 risiko prioritas untuk produk AegisMed AI.
* **Pernyataan Keamanan:** Tidak ada kredensial, token privat, atau data medis pasien asli yang diunggah. Seluruh data yang dianalisis bersifat sintetis.

## Pembaruan: Modul AEAD AES-256-GCM
* **Tanggal:** 7 November 2026
* **AI Tool:** Copilot SDK in VS Code
* **Tujuan:** Mengimplementasikan enkripsi terautentikasi AES-256-GCM untuk data sintetis, validasi payload, AAD, serta pengujian negatif fail-closed.
* **Ringkasan prompt:** Membuat modul AEAD Node.js, test round-trip dan tampering, ADR keputusan kriptografi, dan log penggunaan AI.
* **Bagian yang dibuat/diperbarui:** `src/crypto/aeadCrypto.ts`, `src/crypto/aeadCrypto.test.ts`, `KEPUTUSAN.md`, dan bagian pembaruan dokumen ini.
* **Verifikasi:** `npm test`, `npx tsc --noEmit`, dan `npm run build`.
* **Pernyataan keamanan:** Perubahan ini tidak menambahkan private key, token, password, secret, atau data pasien nyata ke repositori. Key fixture dan plaintext pengujian bersifat sintetis; deployment key harus disediakan di luar Git melalui environment/secret manager.