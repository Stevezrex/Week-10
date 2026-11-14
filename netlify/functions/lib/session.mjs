import { createHmac, timingSafeEqual, createHash } from 'node:crypto';

const COOKIE = 'w10s';
const b64 = (buf) => Buffer.from(buf).toString('base64url');

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET is not set');
  return s;
}

const sign = (body) => createHmac('sha256', secret()).update(body).digest();

export function makeCookie(payload, maxAgeSeconds) {
  const body = b64(JSON.stringify({ ...payload, e: Date.now() + maxAgeSeconds * 1000 }));
  const value = `${body}.${b64(sign(body))}`;
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Strict`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export function readSession(req) {
  const header = req.headers.get('cookie') || '';
  const m = header.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!m) return null;
  const [body, sig] = m.slice(COOKIE.length + 1).split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  let given;
  try { given = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.e > Date.now() ? p : null;
  } catch { return null; }
}

export function sameSecret(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
