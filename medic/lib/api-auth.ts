import 'server-only';
import { NextResponse } from 'next/server';
import { bacaSesi } from './sesi';

export async function requireApiSession(): Promise<NextResponse | null> {
  if (await bacaSesi()) return null;

  return NextResponse.json(
    { success: false, message: 'A valid session is required.' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  );
}
