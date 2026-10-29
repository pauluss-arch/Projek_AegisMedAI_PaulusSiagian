import { NextResponse, type NextRequest } from 'next/server';

const NAMA_COOKIE_SESI = 'aegismed_session';

export function proxy(request: NextRequest) {
  if (request.cookies.has(NAMA_COOKIE_SESI)) {
    return NextResponse.next();
  }

  const tujuanMasuk = new URL('/masuk', request.url);
  return NextResponse.redirect(tujuanMasuk);
}

export const config = {
  matcher: ['/((?!masuk|_next/static|_next/image|favicon.ico).*)'],
};
