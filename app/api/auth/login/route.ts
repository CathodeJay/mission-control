import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, CREDENTIALS, createSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (username !== CREDENTIALS.username || password !== CREDENTIALS.password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createSessionToken();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // secure: true in production — skipping for local dev
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
