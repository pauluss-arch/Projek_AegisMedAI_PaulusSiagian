// app/api/catalog/route.ts — REST API Handler untuk Koleksi Katalog
import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';
import { skemaApiItem } from '../../../lib/skema';

// ── GET /api/catalog — Ambil semua item katalog ─────────────────────────────
export async function GET() {
  try {
    const items = await db.catalogItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/catalog] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data katalog dari database.' },
      { status: 500 },
    );
  }
}

// ── POST /api/catalog — Buat item katalog baru ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const sesi = await (await import('../../../lib/sesi')).bacaSesi();
    if (!sesi) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak (401 Unauthorized): Sesi autentikasi diperlukan.' },
        { status: 401 },
      );
    }
    if (sesi.peran !== 'admin') {
      return NextResponse.json(
        { success: false, message: `Akses ditolak (403 Forbidden): Peran '${sesi.peran}' tidak berwenang menambah item katalog.` },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = skemaApiItem.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Data tidak valid.', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { judul, deskripsi, aktif, kategori, dibuatOleh, catatan } = parsed.data;

    // Cek validasi semantik keunikan judul
    const duplicate = await db.catalogItem.findFirst({
      where: { judul: { equals: judul, mode: 'insensitive' } },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: 'Judul item sudah terdaftar dalam katalog.' },
        { status: 409 },
      );
    }

    const item = await db.catalogItem.create({
      data: {
        judul,
        deskripsi,
        aktif: aktif ?? true,
        kategori: kategori ?? 'Clinical',
        dibuatOleh: dibuatOleh ?? 'Tim Medis',
        catatan: catatan ?? null,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/catalog] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan item ke database.' },
      { status: 500 },
    );
  }
}

