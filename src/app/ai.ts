// Smart capture: one sentence → several filed items.
// Online: the jaiye-ai Edge Function (Groq). Offline, no key yet, or slow: keyword rules on the phone.
import { supabase } from './supabase';
import { guessAmount, guessIncome, guessKind } from './guess';
import type { Kind } from './types';

export type Draft = {
  kind: Kind;
  title: string;
  amount: number | null;      // whole units, always positive here
  income: boolean;
  category: string | null;
  when: string | null;        // local "YYYY-MM-DDTHH:MM"
};
export type Capture = { items: Draft[]; via: 'ai' | 'rules' };

export const CATS = ['Food', 'Transport', 'Bills', 'Data & airtime', 'Shopping', 'Fun', 'Salary', 'Other'];
const KINDS: Kind[] = ['money', 'meeting', 'call', 'meal', 'task', 'sleep', 'reminder', 'note', 'habit'];

const pad = (n: number) => String(n).padStart(2, '0');
export const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

export async function capture(text: string, currency: string): Promise<Capture> {
  const t = text.trim();
  if (!t) return { items: [], via: 'rules' };
  if (navigator.onLine) {
    try {
      const now = new Date();
      const { data, error } = await withTimeout(supabase.functions.invoke('jaiye-ai', {
        body: { action: 'parse', text: t, local: toLocal(now), weekday: now.toLocaleDateString('en', { weekday: 'long' }), currency },
      }), 9000);
      if (!error && data && Array.isArray(data.items) && data.items.length) {
        const items: Draft[] = data.items.map((i: Record<string, unknown>) => ({
          kind: KINDS.includes(i.kind as Kind) ? i.kind as Kind : 'note',
          title: String(i.title ?? '').slice(0, 120),
          amount: typeof i.amount === 'number' ? i.amount : null,
          income: i.direction === 'income',
          category: typeof i.category === 'string' ? i.category : null,
          when: typeof i.when === 'string' ? i.when : null,
        })).filter((i: Draft) => i.title);
        if (items.length) return { items, via: 'ai' };
      }
    } catch { /* fall through to rules */ }
  }
  return { items: rules(t), via: 'rules' };
}

/** Voice → text through Whisper. Returns '' if it couldn't hear anything. */
export async function transcribe(blob: Blob): Promise<string> {
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  const fd = new FormData();
  fd.append('file', blob, `voice.${ext}`);
  const { data, error } = await withTimeout(supabase.functions.invoke('jaiye-ai', { body: fd }), 20000);
  if (error) throw error;
  return String(data?.text ?? '').trim();
}

/* ---------- offline rules ---------- */
const SPLIT = /\s*(?:[,;]|\.\s+|\bthen\b|\balso\b|\band\s+(?=(?:call|pay|buy|meet|remind|send|book|cook|fix|text|ring|get)\b))\s*/i;
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function rules(text: string): Draft[] {
  return text.split(SPLIT).map(s => s.trim()).filter(s => s.length > 1).slice(0, 8).map(seg => {
    const kind = guessKind(seg);
    const amount = kind === 'money' ? guessAmount(seg) : null;
    const income = kind === 'money' && guessIncome(seg);
    return { kind, title: cap(cleanTitle(seg, kind)), amount, income, category: kind === 'money' ? guessCat(seg, income) : null, when: parseWhen(seg) };
  });
}

function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function cleanTitle(s: string, kind: Kind) {
  let t = s.replace(/\b(tomorrow|today|tonight)\b/gi, '').replace(/\b(on\s+)?(mon|tues?|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?\b/gi, '')
    .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, '').replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/gi, '');
  if (kind === 'money') t = t.replace(/(₦|\$|£|€)?\s?\d[\d,]*(\.\d+)?\s?(k|m)?\b/gi, '').replace(/\b(paid|spent|bought|for)\b/gi, ' ');
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t || s.trim();
}

function guessCat(s: string, income: boolean) {
  const x = s.toLowerCase();
  if (income) return 'Salary';
  if (/bolt|uber|taxi|bus|fuel|petrol|keke|okada|transport/.test(x)) return 'Transport';
  if (/light|nepa|electric|rent|water|bill|dstv|gotv/.test(x)) return 'Bills';
  if (/data|airtime|mtn|airtel|glo|9mobile/.test(x)) return 'Data & airtime';
  if (/food|lunch|dinner|breakfast|rice|egusi|jollof|suya|eat|shawarma|chicken/.test(x)) return 'Food';
  if (/cinema|movie|club|party|fun|game/.test(x)) return 'Fun';
  if (/shop|bought|clothes|shoe|market/.test(x)) return 'Shopping';
  return 'Other';
}

export function parseWhen(s: string, now = new Date()): string | null {
  const x = s.toLowerCase();
  const d = new Date(now); let dayHit = false;
  if (/\btomorrow\b/.test(x)) { d.setDate(d.getDate() + 1); dayHit = true; }
  else if (/\btoday\b|\btonight\b/.test(x)) dayHit = true;
  else {
    const i = DAYS.findIndex(n => new RegExp(`\\b${n.slice(0, 3)}(${n.slice(3)})?\\b`).test(x));
    if (i >= 0) { const diff = (i - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + diff); dayHit = true; }
  }
  const m = x.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) || x.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/);
  if (!m && !dayHit) return null;
  let h = 9, min = 0;
  if (m) {
    h = Number(m[1]); min = Number(m[2] ?? 0);
    const ap = m[3];
    if (ap === 'pm' && h < 12) h += 12; else if (ap === 'am' && h === 12) h = 0; else if (!ap && h >= 1 && h <= 6) h += 12;
    if (h > 23 || min > 59) return null;
  } else if (/\btonight\b/.test(x)) h = 20;
  d.setHours(h, min, 0, 0);
  return toLocal(d);
}
