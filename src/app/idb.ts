// Tiny IndexedDB wrapper: two stores, 'items' (by id) and 'kv' (key → value).
const NAME = 'jaiye';
let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
}

export async function allItems<T>(): Promise<T[]> {
  const db = await open();
  return wrap(db.transaction('items').objectStore('items').getAll()) as Promise<T[]>;
}

export async function putItems(rows: unknown[]): Promise<void> {
  if (!rows.length) return;
  const db = await open();
  const tx = db.transaction('items', 'readwrite');
  const st = tx.objectStore('items');
  rows.forEach(r => st.put(r));
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await open();
  return wrap(db.transaction('kv').objectStore('kv').get(key)) as Promise<T | undefined>;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await open();
  await wrap(db.transaction('kv', 'readwrite').objectStore('kv').put(value, key));
}

export async function clearAll(): Promise<void> {
  const db = await open();
  const tx = db.transaction(['items', 'kv'], 'readwrite');
  tx.objectStore('items').clear();
  tx.objectStore('kv').clear();
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}

export async function clearItems(): Promise<void> {
  const db = await open();
  const tx = db.transaction('items', 'readwrite');
  tx.objectStore('items').clear();
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}
