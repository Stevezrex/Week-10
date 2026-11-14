export class NetworkError extends Error {}

async function post(path, body, opts = {}) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      keepalive: !!opts.keepalive,
      body: JSON.stringify(body),
    });
  } catch {
    throw new NetworkError('network');
  }
  let data = null;
  try { data = await res.json(); } catch { /* not json */ }
  return { ok: res.ok, status: res.status, data: data || {} };
}

export const learner = (action, extra = {}, opts) => post('/api/learner', { action, ...extra }, opts);

export async function assessor(action, extra = {}) {
  return post('/api/assessor', { action, ...extra });
}

export async function assessorFile(extra) {
  let res;
  try {
    res = await fetch('/api/assessor', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'export', ...extra }),
    });
  } catch {
    throw new NetworkError('network');
  }
  if (!res.ok) return { ok: false, status: res.status };
  const cd = res.headers.get('content-disposition') || '';
  const name = (cd.match(/filename="([^"]+)"/) || [])[1] || 'week10-export';
  return { ok: true, blob: await res.blob(), name };
}
