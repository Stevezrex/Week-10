// In memory stand in for the Blobs store, same method names and results.
// Set delay to add latency per operation. ops and maxInflight count the traffic.
export function memoryStore() {
  const m = new Map();
  let etag = 0;
  const s = { delay: 0, ops: { get: 0, set: 0, list: 0, del: 0 }, inflight: 0, maxInflight: 0 };
  const run = async (kind, fn) => {
    s.ops[kind]++;
    s.maxInflight = Math.max(s.maxInflight, ++s.inflight);
    if (s.delay) await new Promise((r) => setTimeout(r, s.delay));
    try { return fn(); } finally { s.inflight--; }
  };
  return Object.assign(s, {
    get: (key) => run('get', () => (m.has(key) ? JSON.parse(m.get(key)) : null)),
    setJSON: (key, data, opts = {}) => run('set', () => {
      if (opts.onlyIfNew && m.has(key)) return { modified: false };
      m.set(key, JSON.stringify(data));
      return { modified: true, etag: String(++etag) };
    }),
    list: ({ prefix = '' } = {}) => run('list', () => ({ blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key, etag: '1' })), directories: [] })),
    delete: (key) => run('del', () => { m.delete(key); }),
    reset() { s.ops = { get: 0, set: 0, list: 0, del: 0 }; s.maxInflight = 0; },
    _dump: () => m,
  });
}
