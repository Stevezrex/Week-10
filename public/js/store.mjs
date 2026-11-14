// Local IndexedDB copy and the autosave queue.
const DB = 'w10';
const STORE = 'kv';

function open() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no idb'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  try {
    const db = await open();
    return await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const r = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      t.onerror = () => reject(t.error);
    });
  } catch {
    return undefined;
  }
}

export const localKey = (email, n) => `${email}/${n}`;
export const saveLocal = (key, value) => tx('readwrite', (s) => s.put(value, key));
export const loadLocal = (key) => tx('readonly', (s) => s.get(key));
export const clearLocal = (key) => tx('readwrite', (s) => s.delete(key));

/*
 Autosave queue. The server save runs 10 seconds after the last change and when a screen is left.
 A failed save stays queued. The next change, leaving the screen, or the signal returning sends it.
 No timer retries a failed save.
*/
export function createSaver(send, onStatus = () => {}) {
  let timer = null;
  let dirty = false;
  let busy = false;
  let version = 0;

  async function run(keepalive = false) {
    clearTimeout(timer);
    timer = null;
    if (!dirty || busy) return;
    busy = true;
    const sent = version;
    onStatus('saving');
    try {
      const ok = await send({ keepalive });
      if (!ok) throw new Error('save failed');
      if (sent === version) { dirty = false; onStatus('saved'); }
    } catch {
      onStatus('failed');
    } finally {
      busy = false;
    }
  }

  return {
    changed() {
      version++;
      dirty = true;
      onStatus('pending');
      clearTimeout(timer);
      timer = setTimeout(() => run(), 10000);
    },
    flush: (keepalive = false) => run(keepalive),
    markDirty() { version++; dirty = true; },
    isDirty: () => dirty,
    stop() { clearTimeout(timer); timer = null; dirty = false; },
  };
}
