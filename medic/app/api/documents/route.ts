// app/api/documents/route.ts — REST API Handler Kompatibilitas Dokumen
import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const items = await db.catalogItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/documents] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data dokumen.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const judul = body.judul ?? body.title;
    const deskripsi = body.deskripsi ?? body.description ?? body.notes ?? 'Dokumen klinis terverifikasi';
    const kategori = body.kategori ?? body.documentType ?? body.type ?? 'Document';
    const dibuatOleh = body.dibuatOleh ?? body.uploader ?? 'Kelompok PAW';
    const catatan = body.catatan ?? body.notes ?? null;
    const aktif = body.aktif ?? true;

    if (!judul || typeof judul !== 'string' || judul.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: 'Judul minimal 3 karakter.' },
        { status: 400 },
      );
    }

    const item = await db.catalogItem.create({
      data: {
        judul: judul.trim(),
        deskripsi: typeof deskripsi === 'string' ? deskripsi.trim() : 'Deskripsi dokumen klinis.',
        aktif,
        kategori,
        dibuatOleh,
        catatan,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/documents] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan dokumen.' },
      { status: 500 },
    );
  }
}

