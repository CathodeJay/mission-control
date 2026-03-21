const SECRET = 'mission-control-secret-2026';

export const SESSION_COOKIE = 'mc_session';
export const CREDENTIALS = { username: 'jerome', password: '@lphons3' };

async function hmacHex(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(): Promise<string> {
  return hmacHex('session:jerome:mission-control');
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionToken();
  return token === expected;
}
