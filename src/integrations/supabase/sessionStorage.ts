// IndexedDB-backed storage adapter for Supabase auth session.
// Safari/iPadOS may clear localStorage ("Prevent Cross-Site Tracking" / 7-day
// rule / low-storage cleanup). IndexedDB survives this much better.
// We write to BOTH IndexedDB and localStorage so synchronous reads (Supabase
// uses async getItem, but other code paths may read localStorage directly)
// still work, and we have a fast in-memory mirror.

const DB_NAME = 'puravida-auth-db';
const STORE = 'kv';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

function lsGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // quota / privacy mode — ignore
  }
}
function lsDel(key: string) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const hybridAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const fromIdb = await idbGet(key);
    if (fromIdb) {
      // keep localStorage warm as fallback
      if (lsGet(key) !== fromIdb) lsSet(key, fromIdb);
      return fromIdb;
    }
    const fromLs = lsGet(key);
    if (fromLs) {
      // backfill IDB so next time we read from the more durable store
      void idbSet(key, fromLs);
      return fromLs;
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    lsSet(key, value);
    await idbSet(key, value);
  },
  async removeItem(key: string): Promise<void> {
    lsDel(key);
    await idbDel(key);
  },
};
