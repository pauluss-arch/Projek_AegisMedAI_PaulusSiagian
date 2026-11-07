import { verifyPassword, isSlowHash } from './passwordHash.js';

/**
 * Definisi Peran dan Akun Pengguna Uji RBAC (Role-Based Access Control)
 * Menggunakan Fungsi Hash Lambat (scrypt) dan Data Sintetis Tanpa Data Pengguna Nyata.
 * 
 * Mitigasi Risiko:
 * - R01: Kebocoran Data Pribadi Pasien (PHI)
 * - R02: Manipulasi Dosis Resep (Hanya Dokter yang boleh tanda tangan)
 * - R03: Pengambilalihan Akun (Account Takeover & Brute Force Protection)
 * - T01: Spoofing (Identitas User/Dokter)
 * - T06: Elevation of Privilege (Admin/Role Escalation & IDOR)
 * - T09: Auth Brute-Force
 * Penanda: sec-0.2
 */

export type PeranPengguna = 'admin' | 'dokter' | 'apoteker' | 'pasien';

export interface AkunPenggunaUji {
  namaPengguna: string;
  peran: PeranPengguna;
  namaLengkap: string;
  pasienId?: string; // Khusus peran pasien untuk pencegahan IDOR (Hanya boleh akses rekam medis sendiri)
  passwordHash: string; // Hash lambat scrypt format $scrypt$...
}

/**
 * Akun Pengguna Uji Sintetis untuk Keperluan Verifikasi Keamanan RBAC (sec-0.2).
 * PENTING: Semua akun ini adalah akun uji sintetis dan tidak merepresentasikan data pengguna nyata rumah sakit.
 * Kata sandi demo:
 * - admin_test: "AdminSecurePass!2026"
 * - dokter_test: "DokterClinicalPass#2026"
 * - apoteker_test: "ApotekerPharmaPass@2026"
 * - pasien_test: "PasienHealthPass*2026"
 */
export const AKUN_PENGGUNA_UJI: Record<string, AkunPenggunaUji> = {
  admin_test: {
    namaPengguna: 'admin_test',
    peran: 'admin',
    namaLengkap: 'Administrator Sistem CDSS (Test)',
    passwordHash: '$scrypt$ln=15,r=8,p=1$ee7a04f51645938dc3f214862fe00a4362dfca12cd7e53e643ddea969703e239$7df0c729a71a328d3794c80e84558f601464af775880ab8e90d8677cb3251d370478e0d993f22a8d816a1e68b6ed7199b2aea90df9f14596bd0dbc5ebb8b4d0a',
  },
  dokter_test: {
    namaPengguna: 'dokter_test',
    peran: 'dokter',
    namaLengkap: 'dr. Sarah Spesialis Penyakit Dalam (Test)',
    passwordHash: '$scrypt$ln=15,r=8,p=1$24c6c3ea50df7ba9a975c459cf7bd9f4c64808ba32fc4ad82229dbca489aa476$ac4eb930a37c6f5889d9ba296ec5b7ab52ebb128e32f09ae9e2c4e4443a69044f7dc764f5f50f5bb0d10b640863a19401a4cb3f68d98d95553ad7be5b1b19934',
  },
  apoteker_test: {
    namaPengguna: 'apoteker_test',
    peran: 'apoteker',
    namaLengkap: 'Apt. Budi Farmasi Klinis (Test)',
    passwordHash: '$scrypt$ln=15,r=8,p=1$90f7540ae9a90140d8126f9e94085e03c5074e118fdf4f12706acc1adbc3bef6$265867a875cf70da6c7a1264ce79299582b112ccf7ce8bf2ce2f872ef43ca38d39a49c2ecd0f92778d56e6a1cf5a22fc77b563822dcd9a27909a64a3aea1bef2',
  },
  pasien_test: {
    namaPengguna: 'pasien_test',
    peran: 'pasien',
    namaLengkap: 'Pasien Sintetis Rekam Medis RM-2026-0101 (Test)',
    pasienId: 'RM-2026-0101',
    passwordHash: '$scrypt$ln=15,r=8,p=1$16bbc2e5f4f83a883e3902ca178a52305268ecdc4d2d9259cc49a27c1a9ebf68$cf8733e47c9cb236e35533fd833d3d4bdbef29296fab09e8a174c243e28091d6bc7502cc1115603ce62765d6347fa67ca4cf43a4cc2a7788751d8f326eb2d018',
  },
};

/**
 * Matriks Akses Peran (Access Control Matrix)
 * Menentukan operasi yang diizinkan untuk setiap peran dalam sistem CDSS AegisMed AI.
 */
export type OperasiSistem =
  | 'VIEW_PUBLIC_INFO'
  | 'VIEW_OWN_EHR'
  | 'VIEW_ALL_EHR'
  | 'RUN_AI_DIAGNOSIS'
  | 'SIGN_PRESCRIPTION'
  | 'VERIFY_ANTIBIOTIC_STEWARDSHIP'
  | 'CREATE_PATIENT_RECORD'
  | 'UPDATE_PATIENT_SAFETY'
  | 'DELETE_PATIENT_RECORD'
  | 'MANAGE_CATALOG'
  | 'MANAGE_USERS_CONFIG'
  | 'VIEW_AUDIT_LOGS';

export const MATRIKS_AKSES: Record<OperasiSistem, {
  namaAksi: string;
  peranDiizinkan: PeranPengguna[];
  risikoTerkait: string;
  keterangan: string;
}> = {
  VIEW_PUBLIC_INFO: {
    namaAksi: 'Melihat Halaman Publik (/about, /masuk, /)',
    peranDiizinkan: ['admin', 'dokter', 'apoteker', 'pasien'],
    risikoTerkait: 'Informasi Umum',
    keterangan: 'Dapat diakses oleh publik dan seluruh peran terotentikasi.',
  },
  VIEW_OWN_EHR: {
    namaAksi: 'Melihat Rekam Medis Pasien Sendiri (/assessments/[id])',
    peranDiizinkan: ['pasien', 'dokter', 'apoteker', 'admin'],
    risikoTerkait: 'R01 (Kebocoran PHI), T06 (IDOR)',
    keterangan: 'Pasien hanya dapat membaca rekam medis miliknya sendiri berdasarkan id sesi token.',
  },
  VIEW_ALL_EHR: {
    namaAksi: 'Melihat Semua Rekam Medis Pasien (/assessments)',
    peranDiizinkan: ['dokter', 'apoteker', 'admin'],
    risikoTerkait: 'R01 (Kebocoran PHI), T06 (IDOR)',
    keterangan: 'Pasien dilarang melihat daftar pasien lain untuk mencegah kebocoran PHI.',
  },
  RUN_AI_DIAGNOSIS: {
    namaAksi: 'Menjalankan Analisis Gejala & Diagnosis AI (Differential Diagnosis)',
    peranDiizinkan: ['dokter'],
    risikoTerkait: 'R01 (Informed Decision), T01 (Spoofing Dokter)',
    keterangan: 'Hanya dokter berlisensi yang berwenang mengevaluasi diagnosa AI.',
  },
  SIGN_PRESCRIPTION: {
    namaAksi: 'Menandatangani Resep Digital Antibiotik (Digital Signature)',
    peranDiizinkan: ['dokter'],
    risikoTerkait: 'R02 (Manipulasi Dosis), T03 (Repudiation), T08 (Tampering)',
    keterangan: 'Hanya dokter yang berwenang menerbitkan dan menandatangani resep.',
  },
  VERIFY_ANTIBIOTIC_STEWARDSHIP: {
    namaAksi: 'Verifikasi Keamanan Antibiotik, eGFR, dan Alergi Pasien',
    peranDiizinkan: ['dokter', 'apoteker'],
    risikoTerkait: 'R02 (AMR / Kesalahan Dosis)',
    keterangan: 'Dokter dan Apoteker memverifikasi dosis dan keamanan ginjal/alergi.',
  },
  CREATE_PATIENT_RECORD: {
    namaAksi: 'Mendaftarkan Rekam Medis Pasien Baru ke Database',
    peranDiizinkan: ['dokter', 'admin'],
    risikoTerkait: 'R01 (PHI), T02 (Tampering)',
    keterangan: 'Entri data klinis awal pasien.',
  },
  UPDATE_PATIENT_SAFETY: {
    namaAksi: 'Memperbarui Konteks Keamanan (eGFR & Alergi Pasien)',
    peranDiizinkan: ['dokter', 'apoteker', 'admin'],
    risikoTerkait: 'R02 (AMR), T02 (Tampering Data Klinis)',
    keterangan: 'Penyesuaian konteks fungsi organ dan alergi.',
  },
  DELETE_PATIENT_RECORD: {
    namaAksi: 'Menghapus Rekam Medis Pasien dari Database',
    peranDiizinkan: ['admin'],
    risikoTerkait: 'R01, T06 (Elevation of Privilege), T10 (Log/Record Deletion)',
    keterangan: 'Hanya administrator yang memiliki wewenang retensi data pasien.',
  },
  MANAGE_CATALOG: {
    namaAksi: 'Menambah / Menghapus Item Katalog Klinis (/catalog)',
    peranDiizinkan: ['admin'],
    risikoTerkait: 'T02 (Katalog Tampering), T06 (Privilege Escalation)',
    keterangan: 'Hanya admin yang boleh memodifikasi katalog instrumen sistem.',
  },
  MANAGE_USERS_CONFIG: {
    namaAksi: 'Mengelola Akun Pengguna, Peran, dan Kunci Sistem',
    peranDiizinkan: ['admin'],
    risikoTerkait: 'T06 (Privilege Escalation), R03 (Account Takeover)',
    keterangan: 'Manajemen hak akses dan konfigurasi terpusat sistem.',
  },
  VIEW_AUDIT_LOGS: {
    namaAksi: 'Melihat Jejak Audit Sistem & Kriptografi',
    peranDiizinkan: ['admin', 'dokter'],
    risikoTerkait: 'T10 (Repudiation), T03 (Jejak Forensik)',
    keterangan: 'Inspeksi jejak transaksi dan rekaman keamanan.',
  },
};

/**
 * Memeriksa apakah suatu peran memiliki izin untuk suatu operasi.
 */
export function periksaIzinAkses(peran: PeranPengguna | undefined | null, operasi: OperasiSistem): boolean {
  if (!peran) return false;
  const aturan = MATRIKS_AKSES[operasi];
  if (!aturan) return false;
  return aturan.peranDiizinkan.includes(peran);
}

/**
 * Otentikasi pengguna berdasarkan nama pengguna dan kata sandi menggunakan slow hash.
 */
export function otentikasiPenggunaUji(namaPengguna: string, kataSandi: string): AkunPenggunaUji | null {
  const akun = AKUN_PENGGUNA_UJI[namaPengguna];
  if (!akun) {
    return null;
  }

  // Wajib verifikasi dengan fungsi hash lambat scrypt
  if (!isSlowHash(akun.passwordHash)) {
    return null;
  }

  const cocok = verifyPassword(kataSandi, akun.passwordHash);
  if (!cocok) {
    return null;
  }

  return akun;
}
