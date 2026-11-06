// Local-first store. Everything is saved on the phone first (IndexedDB), then synced
// to Supabase when there's a connection. Last write wins; the server clock orders changes.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { allItems, clearAll, clearItems, kvGet, kvSet, putItems } from './idb';
import type { Item, Profile, SyncState } from './types';

type Local = Item & { _rev?: number };   // _rev > 0 means "changed here, not synced yet"

type State = {
  userId: string | null;
  ready: boolean;
  items: Local[];
  profile: Profile | null;
  avatar: string | null;     // data URL cached on the device
  sync: SyncState;
};

let state: State = { userId: null, ready: false, items: [], profile: null, avatar: null, sync: { status: 'idle', pending: 0, lastSync: null } };
const byId = new Map<string, Local>();
let profileRev = 0;
let avatarPending: string | null = null;
let revSeq = 1;
const subs = new Set<() => void>();

function emit(patch: Partial<State>) {
  state = { ...state, ...patch };
  subs.forEach(f => f());
}
function pendingCount() {
  let n = 0;
  byId.forEach(i => { if (i._rev) n++; });
  return n + (profileRev ? 1 : 0) + (avatarPending ? 1 : 0);
}
function publishItems() {
  const items = [...byId.values()].filter(i => !i.deleted);
  emit({ items, sync: { ...state.sync, pending: pendingCount() } });
}

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => pick(state));
}
export const getState = () => state;

export function blankProfile(id: string): Profile {
  return {
    id, name: '', avatar_path: null, country: null, currency: 'NGN',
    tracks: ['money', 'meetings', 'meals', 'tasks', 'sleep'], wake_time: '06:30', bed_time: '22:30',
    monthly_budget: null, payday: null, meal_prep_day: null,
    prefs: { ...DEFAULT_PREFS },
    onboarded_at: null,
  };
}
const DEFAULT_PREFS = { meetingAlerts: true, bedtimeReminder: true, morningBriefing: true, briefingTime: '07:00', hideAmounts: false };

/* ---------- boot ---------- */
export async function loadFor(userId: string) {
  const owner = await kvGet<string>('owner');
  if (owner && owner !== userId) await clearAll();   // a different person signed in on this phone
  await kvSet('owner', userId);
  byId.clear();
  (await allItems<Local>()).forEach(i => byId.set(i.id, i));
  const profile = (await kvGet<Profile>('profile')) ?? null;
  profileRev = (await kvGet<number>('profileRev')) ?? 0;
  avatarPending = (await kvGet<string>('avatarPending')) ?? null;
  const avatar = (await kvGet<string>('avatar')) ?? null;
  const cursor = (await kvGet<number>('lastSync')) ?? null;
  emit({ userId, profile, avatar, ready: !!profile, sync: { ...state.sync, lastSync: cursor } });
  publishItems();
  await sync();
  if (!state.profile) emit({ profile: blankProfile(userId) });
  emit({ ready: true });
}

export async function signOutAndWipe() {
  await supabase.auth.signOut().catch(() => {});
  await clearAll();
  byId.clear(); profileRev = 0; avatarPending = null;
  try { localStorage.removeItem('jaiye-pin'); } catch { /* ignore */ }
  emit({ userId: null, ready: false, items: [], profile: null, avatar: null, sync: { status: 'idle', pending: 0, lastSync: null } });
}

/** Wipe this person's entries everywhere (and with `everything`, their setup too, so onboarding runs again). Needs a connection. */
export async function resetData(everything: boolean) {
  if (!navigator.onLine) throw new Error('offline');
  await sync();                                   // let anything in flight land first, so it can't come back after
  const { error } = await supabase.rpc('reset_my_data', { everything });
  if (error) throw error;
  byId.clear();
  await clearItems();
  await kvSet('lastSync', 0);
  try { localStorage.removeItem('jaiye-last-cat'); } catch { /* ignore */ }
  if (everything && state.profile) {
    const profile: Profile = { ...state.profile, onboarded_at: null, monthly_budget: null, payday: null, meal_prep_day: null, prefs: { ...DEFAULT_PREFS } };
    profileRev = 0;
    await kvSet('profile', profile); await kvSet('profileRev', 0);
    try { localStorage.removeItem('jaiye-pin'); } catch { /* ignore */ }
    emit({ profile });
  }
  publishItems();
}

/* ---------- local writes ---------- */
const nowIso = () => new Date().toISOString();

export async function addItem(p: Partial<Item> & Pick<Item, 'kind' | 'title'>) {
  const item: Local = {
    id: crypto.randomUUID(), amount: null, currency: state.profile?.currency ?? null, at: null, done: false,
    source: 'typed', raw: null, data: {}, deleted: false, created_at: nowIso(), updated_at: nowIso(), ...p, _rev: revSeq++,
  };
  byId.set(item.id, item);
  publishItems();
  await putItems([item]);
  soon();
  return item;
}

export async function updateItem(id: string, patch: Partial<Item>) {
  const cur = byId.get(id);
  if (!cur) return;
  const next: Local = { ...cur, ...patch, updated_at: nowIso(), _rev: revSeq++ };
  byId.set(id, next);
  publishItems();
  await putItems([next]);
  soon();
}

export const removeItem = (id: string) => updateItem(id, { deleted: true });

export async function saveProfile(patch: Partial<Profile>) {
  const base = state.profile ?? blankProfile(state.userId!);
  const profile = { ...base, ...patch, prefs: { ...base.prefs, ...(patch.prefs ?? {}) } };
  profileRev = revSeq++;
  emit({ profile });
  publishItems();
  await kvSet('profile', profile);
  await kvSet('profileRev', profileRev);
  soon();
}

export async function setAvatar(dataUrl: string) {
  avatarPending = dataUrl;
  emit({ avatar: dataUrl });
  publishItems();
  await kvSet('avatar', dataUrl);
  await kvSet('avatarPending', dataUrl);
  soon();
}

/* ---------- sync ---------- */
let timer: number | undefined;
function soon() { clearTimeout(timer); timer = window.setTimeout(() => { void sync(); }, 700); }

let running: Promise<void> | null = null;
let again = false;
export function sync(): Promise<void> {
  if (running) { again = true; return running; }
  running = (async () => {
    try { do { again = false; await syncOnce(); } while (again); }
    finally { running = null; }
  })();
  return running;
}

const COLS = 'id,kind,title,amount,currency,at,done,source,raw,data,deleted,created_at,updated_at';

async function syncOnce() {
  const uid = state.userId;
  if (!uid) return;
  if (!navigator.onLine) { emit({ sync: { ...state.sync, status: 'offline', pending: pendingCount() } }); return; }
  emit({ sync: { ...state.sync, status: 'syncing' } });
  try {
    // 1. photo
    if (avatarPending) {
      const sent = avatarPending;
      const blob = await (await fetch(sent)).blob();
      const path = `${uid}/avatar.webp`;
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: blob.type });
      if (error) throw error;
      if (avatarPending === sent) { avatarPending = null; await kvSet('avatarPending', null); }
      if (state.profile && state.profile.avatar_path !== path) await saveProfile({ avatar_path: path });
    }

    // 2. profile
    if (profileRev && state.profile) {
      const sentRev = profileRev;
      const { id: _id, updated_at: _u, ...body } = state.profile;
      const { error } = await supabase.from('profiles').upsert({ id: uid, ...body });
      if (error) throw error;
      if (profileRev === sentRev) { profileRev = 0; await kvSet('profileRev', 0); }
    }
    if (!profileRev) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) throw error;
      if (data) {
        const p = { ...data, prefs: { ...DEFAULT_PREFS, ...(data.prefs ?? {}) }, monthly_budget: data.monthly_budget == null ? null : Number(data.monthly_budget), wake_time: String(data.wake_time).slice(0, 5), bed_time: String(data.bed_time).slice(0, 5) } as Profile;
        emit({ profile: p });
        await kvSet('profile', p);
        if (p.avatar_path && !state.avatar) {
          const dl = await supabase.storage.from('avatars').download(p.avatar_path);
          if (dl.data) { const url = await blobToDataUrl(dl.data); emit({ avatar: url }); await kvSet('avatar', url); }
        }
      }
    }

    // 3. push changed items
    const dirty = [...byId.values()].filter(i => i._rev);
    for (let k = 0; k < dirty.length; k += 100) {
      const batch = dirty.slice(k, k + 100);
      const rows = batch.map(({ _rev, updated_at, ...r }) => ({ ...r, amount: r.amount, user_id: uid }));
      const { data, error } = await supabase.from('items').upsert(rows).select(COLS);
      if (error) throw error;
      const back: Local[] = [];
      (data ?? []).forEach(row => {
        const sent = batch.find(b => b.id === row.id);
        const cur = byId.get(row.id);
        if (cur && sent && cur._rev === sent._rev) { const clean = norm(row); byId.set(clean.id, clean); back.push(clean); }
      });
      await putItems(back);
    }

    // 4. pull changes from other devices (small overlap so nothing slips between clocks)
    const last = (await kvGet<number>('lastSync')) ?? 0;
    const since = new Date(Math.max(0, last - 60_000)).toISOString();
    let newest = last;
    for (let page = 0; page < 20; page++) {
      const { data, error } = await supabase.from('items').select(COLS).gt('updated_at', since).order('updated_at').range(page * 500, page * 500 + 499);
      if (error) throw error;
      const rows = (data ?? []).map(norm);
      const take = rows.filter(r => !byId.get(r.id)?._rev);   // local unsynced edits win until pushed
      take.forEach(r => byId.set(r.id, r));
      await putItems(take);
      rows.forEach(r => { newest = Math.max(newest, Date.parse(r.updated_at)); });
      if (rows.length < 500) break;
    }
    await kvSet('lastSync', newest);
    publishItems();
    emit({ sync: { status: 'idle', pending: pendingCount(), lastSync: Date.now() } });
  } catch (e) {
    const offline = !navigator.onLine || (e instanceof TypeError);
    emit({ sync: { ...state.sync, status: offline ? 'offline' : 'error', pending: pendingCount() } });
    if (!offline) console.warn('[jaiye sync]', e);
  }
}

function norm(r: Record<string, unknown>): Local {
  return { ...(r as unknown as Item), amount: r.amount == null ? null : Number(r.amount) };
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => rej(fr.error); fr.readAsDataURL(b); });
}

/* keep in sync while the app is open */
let wired = false;
export function wireSync() {
  if (wired) return; wired = true;
  window.addEventListener('online', () => void sync());
  window.addEventListener('offline', () => emit({ sync: { ...state.sync, status: 'offline' } }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void sync(); });
  window.setInterval(() => { if (document.visibilityState === 'visible') void sync(); }, 60_000);
}
