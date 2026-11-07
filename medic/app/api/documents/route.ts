// app/api/documents/route.ts — REST API Handler Kompatibilitas Dokumen
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '../../../lib/db';
import { requireApiSession } from '../../../lib/api-auth';
import { readJsonBody } from '../../../lib/api-json';

const documentSchema = z.object({
  judul: z.string().trim().min(3, 'Judul minimal 3 karakter.').max(100),
  deskripsi: z.string().trim().min(10, 'Deskripsi minimal 10 karakter.').max(1000),
  aktif: z.boolean(),
  kategori: z.string().trim().min(1).max(100),
  dibuatOleh: z.string().trim().min(1).max(100),
  catatan: z.string().trim().max(1000).nullable(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function GET() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

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
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  try {
    const bodyResult = await readJsonBody(request);
    if (!bodyResult.success) return bodyResult.response;
    if (!isRecord(bodyResult.data)) {
      return NextResponse.json(
        { success: false, message: 'Request body must be a JSON object.' },
        { status: 400 },
      );
    }

    const body = bodyResult.data;
    const input = documentSchema.safeParse({
      judul: 'judul' in body ? body.judul : 'title' in body ? body.title : undefined,
      deskripsi: 'deskripsi' in body
        ? body.deskripsi
        : 'description' in body
          ? body.description
          : 'notes' in body
            ? body.notes
            : 'Dokumen klinis terverifikasi',
      aktif: 'aktif' in body ? body.aktif : true,
      kategori: 'kategori' in body
        ? body.kategori
        : 'documentType' in body
          ? body.documentType
          : 'type' in body
            ? body.type
            : 'Document',
      dibuatOleh: 'dibuatOleh' in body ? body.dibuatOleh : 'uploader' in body ? body.uploader : 'Kelompok PAW',
      catatan: 'catatan' in body ? body.catatan : 'notes' in body ? body.notes : null,
    });
    if (!input.success) {
      return NextResponse.json(
        { success: false, message: 'Document data is invalid.', errors: input.error.flatten() },
        { status: 400 },
      );
    }

    const { judul, deskripsi, aktif, kategori, dibuatOleh, catatan } = input.data;
    const item = await db.catalogItem.create({
      data: {
        judul,
        deskripsi,
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
