// Device PIN. Only a salted PBKDF2 hash is kept, on this phone only.
const KEY = 'jaiye-pin';
const LOCK_AFTER = 60_000;   // lock again after a minute away

type Saved = { salt: string; hash: string };

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 150_000, hash: 'SHA-256' }, key, 256);
  return b64(new Uint8Array(bits));
}

function read(): Saved | null {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) as Saved : null; } catch { return null; }
}

export const hasPin = () => !!read();

export async function setPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt);
  localStorage.setItem(KEY, JSON.stringify({ salt: b64(salt), hash }));
}

export function clearPin() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

export async function checkPin(pin: string) {
  const s = read();
  if (!s) return true;
  return (await derive(pin, unb64(s.salt))) === s.hash;
}

let hiddenAt = 0;
export function watchLock(onLock: () => void) {
  const fn = () => {
    if (document.visibilityState === 'hidden') hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > LOCK_AFTER && hasPin()) onLock();
  };
  document.addEventListener('visibilitychange', fn);
  return () => document.removeEventListener('visibilitychange', fn);
}
