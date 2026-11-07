// app/api/catalog/[id]/route.ts — REST API Handler untuk Item Spesifik
import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';
import { requireApiSession } from '../../../../lib/api-auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ── GET /api/catalog/[id] — Ambil satu item ─────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const item = await db.catalogItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item katalog tidak ditemukan.' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: item }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/catalog/[id]] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil detail item.' },
      { status: 500 },
    );
  }
}

// ── DELETE /api/catalog/[id] — Hapus item ────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const existing = await db.catalogItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Item katalog tidak ditemukan.' },
        { status: 404 },
      );
    }

    await db.catalogItem.delete({ where: { id } });
    return NextResponse.json(
      { success: true, message: 'Item katalog berhasil dihapus dari database.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('[DELETE /api/catalog/[id]] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus item dari database.' },
      { status: 500 },
    );
  }
}
