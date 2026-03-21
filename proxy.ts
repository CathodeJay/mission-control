import { NextRequest, NextResponse } from 'next/server';

// Auth temporarily disabled — re-enable in Phase 2
export async function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
