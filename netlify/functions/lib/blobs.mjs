import { getStore } from '@netlify/blobs';

let cached;

// Tests set globalThis.__W10_STORE__ to an in memory stand in.
export function store() {
  if (globalThis.__W10_STORE__) return globalThis.__W10_STORE__;
  cached ||= getStore({ name: 'w10', consistency: 'strong' });
  return cached;
}

export const getJSON = (key) => store().get(key, { type: 'json' });
export const setJSON = (key, data, opts) => store().setJSON(key, data, opts);
export const listKeys = async (prefix) => {
  const { blobs } = await store().list({ prefix });
  return blobs.map((b) => b.key);
};
export const delKey = (key) => store().delete(key);

// Run fn over items in parallel batches. Keeps Blob reads bounded during an export.
export async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}
