import { NextResponse } from 'next/server';

// Cheap edge gate: no session cookie -> /login. The API still verifies the JWT on every request,
// so this is a UX redirect, not the security boundary.
export function middleware(req) {
  const hasSession = req.cookies.has('token');
  const onLogin = req.nextUrl.pathname.startsWith('/login');
  if (!hasSession && !onLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (hasSession && onLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
