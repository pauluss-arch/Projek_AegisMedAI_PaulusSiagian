# Dokumen Teknis Modul 4: Next.js App Router

**Nama/NIM:** Paulus Roberto Apolos
**Repositori:** https://github.com/pauluss-arch/Projek_AegisMedAI_PaulusSiagian
**Produk:** AegisMed AI — Clinical Decision Support System  
**Versi Next.js:** `16.4.2` (berdasarkan `package.json`)  
**Mode Cache Components:** Tidak aktif pada konfigurasi yang diperiksa (`next.config.ts` berisi `const nextConfig: NextConfig = {};`)

> **Catatan status:** Dokumen ini disusun berdasarkan berkas `projek.zip` yang diperiksa. Pada snapshot tersebut, aplikasi sudah menggunakan Next.js App Router, tetapi implementasi Modul 4 belum lengkap. Karena itu, hasil pengujian yang belum dijalankan tidak ditulis seolah-olah sudah berhasil. Lengkapi bagian bukti setelah menjalankan pengujian di komputer sendiri.

## 1. Peta Rute

AegisMed AI merupakan aplikasi pendukung keputusan klinis. Rute yang direncanakan menggunakan istilah yang sesuai dengan produk, bukan contoh katalog barang pada modul.

### 1.1 Peta rute yang direncanakan

| URL | Berkas di `app/` | Jenis rute | Isi halaman |
|---|---|---|---|
| `/` | `app/page.tsx` | Statis | Halaman utama AegisMed AI yang memuat fitur diagnosis, pemeriksaan antibiotik, penjelajah penyakit langka, dan riwayat audit. |
| `/about` | `app/about/page.tsx` | Statis | Penjelasan tujuan, sasaran pengguna, fitur, dan batasan AegisMed AI. |
| `/assessments` | `app/assessments/page.tsx` | Statis | Daftar riwayat pemeriksaan yang tersedia pada browser pengguna. |
| `/assessments/[id]` | `app/assessments/[id]/page.tsx` | Dinamis | Detail pemeriksaan berdasarkan ID yang dipilih dari riwayat lokal. |

### 1.2 Rute yang ditemukan pada snapshot proyek

Berdasarkan manifest hasil build yang tersedia pada `.next/routes-manifest.json`, rute aplikasi yang tercatat adalah:

| Rute hasil build | Status pada snapshot | Keterangan |
|---|---|---|
| `/` | Tercatat | Halaman utama menggunakan `app/page.tsx`. |
| `/assessments/[id]` | Tercatat sebagai rute dinamis | Halaman detail membaca riwayat dari `localStorage`. |
| `/about` | Belum ditemukan | Perlu dibuat agar sesuai peta rute yang direncanakan. |
| `/assessments` | Belum ditemukan | Perlu dibuat sebagai halaman daftar riwayat. |

Rute internal `/_not-found` dan `/_global-error` juga muncul pada manifest Next.js, tetapi bukan rute fitur utama yang ditawarkan melalui navigasi produk.

### 1.3 Potongan rute dari keluaran build

Manifest `.next/routes-manifest.json` pada snapshot memuat rute statis `/` dan rute dinamis `/assessments/[id]`. Untuk melampirkan bukti terbaru, jalankan:

```bash
npm run build
```

Lalu salin bagian tabel rute yang ditampilkan Next.js pada terminal ke bagian ini. Keluaran build tidak dicantumkan sebagai hasil terbaru karena perintah tersebut belum dijalankan ulang saat dokumen ini disusun.

## 2. Layout, Template, dan Berkas Khusus

### 2.1 Pohon folder `app/`

Pohon di bawah menunjukkan struktur yang ditemukan dan rute tambahan yang direncanakan untuk memenuhi kebutuhan Modul 4.

```text
app/
├── layout.tsx
├── page.tsx
├── about/
│   └── page.tsx                 # perlu dibuat
├── assessments/
│   ├── page.tsx                 # perlu dibuat
│   └── [id]/
│       ├── page.tsx
│       └── not-found.tsx        # perlu ditambahkan bila memakai notFound()
├── loading.tsx                  # perlu dibuat
├── error.tsx                    # perlu dibuat; Client Component
└── not-found.tsx                # perlu dibuat untuk tampilan 404 khusus
```

`app/layout.tsx` sudah ada dan berfungsi sebagai root layout. Berkas tersebut menetapkan metadata, mengimpor `src/index.css`, serta menyediakan elemen `<html>` dan `<body>`.

`app/page.tsx` pada snapshot memakai direktif `"use client"` dan merender komponen utama dari `src/App.tsx`. Hal ini membuat fitur interaktif di dalam aplikasi dapat menggunakan state dan event, tetapi batas Client Component saat ini masih berada pada halaman utama. Jika memungkinkan, batas klien sebaiknya ditempatkan sedekat mungkin dengan komponen yang benar-benar memerlukan interaksi.

### 2.2 Perbedaan layout dan template

`layout.tsx` adalah kerangka bersama yang dipertahankan saat navigasi antarrute di dalam segmen yang sama. Karena tidak dipasang ulang pada setiap perpindahan rute, state pada Client Component yang berada di dalam layout dapat tetap bertahan.

`template.tsx` menyerupai layout, tetapi dipasang ulang ketika segmen anak berubah. Dengan demikian, state komponen di dalam template akan kembali ke kondisi awal saat template di-remount.

Pada AegisMed AI, layout cocok untuk elemen kerangka yang konsisten, seperti struktur halaman dan navigasi global. Template dapat dipakai jika sebuah segmen membutuhkan state sementara yang harus direset ketika pengguna berpindah dari daftar pemeriksaan ke detail pemeriksaan.

**Status pengujian:** Belum ada bukti tangkapan layar sebelum dan sesudah navigasi pada berkas yang diperiksa. Setelah implementasi template, tambahkan tangkapan layar yang memperlihatkan perilaku state sebelum navigasi dan setelah kembali ke halaman sebelumnya.

### 2.3 Loading, error, dan not-found

Berkas khusus yang perlu tersedia:

- `app/loading.tsx` menampilkan indikator atau pesan saat halaman sedang dimuat. Gunakan teks yang dapat dibaca pembaca layar, misalnya elemen dengan `role="status"`.
- `app/error.tsx` menangani galat pada segmen terkait. Berkas ini harus diawali `"use client"` dan menyediakan tombol untuk mencoba kembali melalui fungsi `reset`.
- `app/not-found.tsx` menampilkan pesan ketika URL tidak ditemukan.
- `app/assessments/[id]/not-found.tsx` dapat digunakan untuk tampilan khusus jika ID pemeriksaan tidak ditemukan dan halaman memanggil `notFound()`.

Bukti yang perlu ditambahkan setelah implementasi:

1. Tangkapan layar indikator loading.
2. Tangkapan layar error boundary pada mode pengembangan.
3. Tangkapan layar tampilan error pada mode produksi.
4. Tangkapan layar halaman not-found untuk ID atau URL yang tidak tersedia.

## 3. Rute Dinamis dan Validasi `params`

Rute dinamis yang digunakan pada produk adalah `/assessments/[id]`. Pada snapshot, berkas `app/assessments/[id]/page.tsx` merupakan Client Component yang menggunakan `useParams()` dari `next/navigation`. Halaman ini mencari entri pemeriksaan pada `localStorage`, kemudian menampilkan detail jika ditemukan atau pesan “Assessment not found” jika tidak ada.

Untuk mengikuti pola validasi `params` pada Server Component di Next.js App Router, implementasi rute dinamis dapat disesuaikan agar menerima `params: Promise<{ id: string }>` dan melakukan `await params`. Format ID perlu divalidasi sebelum mencari data. Karena sumber riwayat saat ini berada di `localStorage`, data tersebut tetap perlu dibaca di sisi klien; jangan mengakses `localStorage` langsung di Server Component.

Aturan validasi yang disarankan:

1. ID harus berupa string yang tidak kosong dan sesuai format ID yang benar-benar digunakan oleh `assessmentStorage`.
2. ID yang formatnya tidak sesuai harus ditolak sebelum pencarian data.
3. ID dengan format benar tetapi tidak ada dalam riwayat harus menampilkan pesan tidak ditemukan.
4. Jangan menganggap data `localStorage` tersedia di server; penyimpanan ini khusus browser.

### 3.1 Tabel pengujian URL

Jalankan aplikasi dengan `npm run dev` terlebih dahulu. Isi kolom “hasil aktual” dan “kode status” berdasarkan hasil nyata dari browser dan `curl.exe`; jangan mengisi kode status berdasarkan perkiraan.

| URL uji | Hasil yang diharapkan | Hasil aktual | Kode status |
|---|---|---|---|
| `/` | Halaman utama AegisMed AI tampil | Belum diuji ulang | Belum dicatat |
| `/assessments/ID_VALID` | Detail tampil jika ID ada di riwayat browser | Belum diuji ulang; perlu data riwayat yang sesuai | Belum dicatat |
| `/assessments/id-tidak-ada` | Pesan pemeriksaan tidak ditemukan | Belum diuji ulang | Belum dicatat |
| `/url-tidak-tersedia` | Halaman not-found | Berkas not-found khusus belum diverifikasi | Belum dicatat |

Contoh pemeriksaan HTTP di Windows PowerShell:

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3000/
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3000/assessments/id-tidak-ada
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3000/url-tidak-tersedia
```

Respons aktual dapat berbeda jika rute belum dibuat, jika ID memerlukan data di `localStorage`, atau jika respons sudah mulai dikirim sebelum tampilan not-found diputuskan. Catat hasil yang benar-benar muncul.

## 4. Pembagian Server dan Client Components

Di Next.js App Router, `layout.tsx` dan `page.tsx` secara bawaan adalah Server Components kecuali diberi `"use client"`. Client Components digunakan untuk state, event handler, hook React, dan API browser seperti `localStorage`.

### 4.1 Tabel pembagian komponen pada snapshot proyek

| Komponen/berkas | Jenis pada snapshot | Alasan teknis |
|---|---|---|
| `app/layout.tsx` | Server Component | Tidak memiliki `"use client"`; menetapkan metadata, stylesheet, dan root HTML. |
| `app/page.tsx` | Client Component | Memiliki `"use client"` dan merender `src/App.tsx`, yang memuat fitur interaktif. |
| `app/assessments/[id]/page.tsx` | Client Component | Memakai `useState`, `useEffect`, `useParams`, dan `localStorage`. |
| `src/App.tsx` | Client Component melalui impor dari `app/page.tsx` | Mengatur interaksi utama dan pemilihan fitur aplikasi. |
| `src/features/PatientDiagnosis.tsx` | Client Component melalui pohon impor halaman utama | Fitur diagnosis menerima masukan pengguna dan memperbarui tampilan hasil. |
| `src/features/AntibioticChecker.tsx` | Client Component melalui pohon impor halaman utama | Menggunakan kontrol interaktif untuk pemeriksaan antibiotik. |
| `src/features/RareExplorer.tsx` | Client Component melalui pohon impor halaman utama | Mendukung pencarian dan interaksi penjelajah penyakit langka. |
| `src/features/AuditHistory.tsx` | Client Component melalui pohon impor halaman utama | Menampilkan riwayat dan berinteraksi dengan penyimpanan browser. |
| `src/components/Layout/Navbar.tsx` | Perlu verifikasi dari isi berkas | Periksa apakah berkas menggunakan hook, event handler, atau API browser sebelum menentukan batas komponen. |
| `src/mock/diseasesData.ts` | Modul data TypeScript | Berisi data simulasi penyakit; tidak otomatis menjadi komponen. Jika diimpor oleh Client Component, data yang diimpor dapat masuk ke bundel klien. |
| `src/utils/assessmentStorage.ts` | Modul utilitas | Menangani penyimpanan riwayat; fungsi yang mengakses `localStorage` hanya boleh dipanggil di browser. |
| `src/crypto/patientCrypto.ts` | Modul utilitas kriptografi | Periksa setiap penggunaan API browser/server sebelum menentukan tempat pemanggilan dan batas keamanan. |

Jenis komponen untuk berkas fitur di atas ditentukan berdasarkan pohon impor dari `app/page.tsx`, bukan karena setiap berkas harus memiliki direktif `"use client"` sendiri. Direktif tersebut membentuk batas modul, sehingga dependensi yang diimpor oleh Client Component dapat masuk ke bundel klien.

### 4.2 `server-only`

Pada snapshot, belum ditemukan modul data server khusus yang menggunakan `import "server-only"`. Data penyakit berada di `src/mock/diseasesData.ts`, sedangkan riwayat pemeriksaan memakai `localStorage`. Jika nanti ada modul yang berisi kueri basis data atau rahasia server, tempatkan modul tersebut pada sisi server dan tambahkan `import "server-only"`.

Jangan mengimpor modul server-only dari Client Component. Setelah menambahkan modul server-only, lakukan uji impor sementara dari Client Component dan catat pesan galat yang muncul; hapus kembali impor uji setelah selesai.

**Status pengujian:** Uji batas `server-only` belum tercatat pada snapshot yang diperiksa.

## 5. Verifikasi

`package.json` pada snapshot memiliki skrip `dev`, `build`, `test`, dan `start`. Skrip `lint` belum didefinisikan pada `package.json` yang diperiksa, sehingga `npm run lint` tidak boleh dinyatakan berhasil sebelum skrip tersebut ditambahkan.

Jalankan perintah berikut di folder proyek `medic/`:

```bash
npx tsc --noEmit
npm test
npm run build
```

Jika tugas meminta `npm run lint`, tambahkan konfigurasi dan skrip lint yang sesuai dengan versi Next.js yang digunakan, kemudian jalankan perintahnya.

| Pemeriksaan | Hasil pada dokumen ini | Bukti yang harus dilampirkan |
|---|---|---|
| `npx tsc --noEmit` | Belum dijalankan ulang | Salinan keluaran terminal |
| `npm test` | Belum dijalankan ulang | Salinan keluaran tes |
| `npm run lint` | Skrip belum terlihat pada `package.json` snapshot | Tambahkan skrip lint, jalankan, dan lampirkan hasil; atau jelaskan bahwa belum tersedia |
| `npm run build` | Manifest `.next` yang tersedia mencatat `/` dan `/assessments/[id]`; build belum dijalankan ulang saat dokumen dibuat | Keluaran build terbaru beserta tabel rutenya |
| Pull request | Tidak dapat dipastikan dari isi kode saja | Tautan pull request dan status merge di GitHub |

Setelah seluruh rute dan berkas khusus selesai dibuat, jalankan ulang pemeriksaan dan perbarui tabel berdasarkan hasil aktual. Hapus rute uji sementara jika dibuat khusus untuk demonstrasi, sesuai instruksi modul.

## 6. Kendala dan Penyelesaian

| Kendala/temuan | Dampak | Penyelesaian |
|---|---|---|
| Snapshot hanya mencatat rute `/` dan `/assessments/[id]` | Belum memenuhi rancangan minimal empat rute | Tambahkan rute `/about` dan `/assessments`, lalu verifikasi melalui build. |
| Halaman detail pemeriksaan memakai `useParams()` pada Client Component | Bisa membaca parameter, tetapi belum mendemonstrasikan pola `params: Promise` pada Server Component yang dibahas modul | Pertahankan akses `localStorage` di sisi klien; bila arsitektur diubah, pisahkan validasi parameter di server dan pembacaan riwayat di klien. |
| Berkas `loading.tsx`, `error.tsx`, dan `not-found.tsx` khusus belum ditemukan pada struktur sumber | Tampilan loading/error/404 khusus belum terbukti | Tambahkan berkas khusus sesuai aturan App Router dan uji setiap keadaan. |
| Skrip `lint` tidak ada pada `package.json` yang diperiksa | Perintah `npm run lint` belum dapat dijadikan bukti verifikasi | Tambahkan konfigurasi lint yang sesuai atau catat statusnya dengan jujur. |
| Riwayat pemeriksaan tersimpan pada `localStorage` | Data tidak tersedia pada render server dan bergantung pada browser yang digunakan | Akses penyimpanan hanya di Client Component atau hook efek; tampilkan keadaan loading dan data tidak ditemukan dengan jelas. |

## 7. Catatan Pemanfaatan AI

**Alat:** ChatGPT.  
**Perintah utama:** Membaca Modul 4 Praktikum PAW 2026 dan memeriksa berkas proyek AegisMed AI yang diberikan, kemudian menyusun draf `docs/praktikum/modul-04.md`.  
**Bagian yang digunakan:** Kerangka dokumen teknis, pemetaan rute, penjelasan layout/template, validasi rute dinamis, pembagian Server dan Client Components, serta daftar verifikasi dan kendala.  
**Cara verifikasi:** Cocokkan semua keterangan dengan kode sumber; jalankan `npx tsc --noEmit`, `npm test`, dan `npm run build`; uji URL melalui browser dan `curl.exe`; tambahkan tangkapan layar serta keluaran terminal dari hasil pengujian nyata.  
**Tanggung jawab:** Dokumen ini merupakan draf yang perlu diverifikasi dan dilengkapi mahasiswa. Tidak ada hasil pengujian atau tangkapan layar yang dinyatakan berhasil tanpa bukti aktual.

