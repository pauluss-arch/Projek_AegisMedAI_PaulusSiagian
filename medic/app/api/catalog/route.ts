// app/api/catalog/route.ts — REST API Handler untuk Koleksi Katalog
import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';
import { skemaApiItem } from '../../../lib/skema';
import { requireApiSession } from '../../../lib/api-auth';
import { readJsonBody } from '../../../lib/api-json';

// ── GET /api/catalog — Ambil semua item katalog ─────────────────────────────
export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

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
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  try {
    const body = await readJsonBody(request);
    if (!body.success) return body.response;

    const parsed = skemaApiItem.safeParse(body.data);
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
