import { z } from 'zod';

export const skemaItem = z.object({
  judul: z.string().trim().min(3, 'Judul harus berisi minimal 3 karakter.').max(100, 'Judul maksimal 100 karakter.'),
  deskripsi: z.string().trim().min(10, 'Deskripsi harus berisi minimal 10 karakter.').max(1000, 'Deskripsi maksimal 1000 karakter.'),
  aktif: z.stringbool().default(false),
});

export type MasukanItem = z.infer<typeof skemaItem>;

export const skemaMasuk = z.object({
  namaPengguna: z.string().trim().min(1, 'Nama pengguna wajib diisi.').max(100, 'Nama pengguna terlalu panjang.'),
  kataSandi: z.string().min(1, 'Kata sandi wajib diisi.').max(128, 'Kata sandi terlalu panjang.'),
});
