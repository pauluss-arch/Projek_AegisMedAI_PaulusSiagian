// app/api/documents/[id]/route.ts — REST API Handler Detail & Hapus Dokumen
import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const item = await db.catalogItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, message: 'Dokumen tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/documents/[id]] Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil dokumen.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const existing = await db.catalogItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Dokumen tidak ditemukan.' }, { status: 404 });
    }

    await db.catalogItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Dokumen berhasil dihapus.' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/documents/[id]] Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus dokumen.' }, { status: 500 });
  }
}

