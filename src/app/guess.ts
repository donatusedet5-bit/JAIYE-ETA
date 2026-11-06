// A light first guess while you type. Smart filing (Groq + rules) replaces this in the next stage.
import type { Kind } from './types';

export function guessKind(t: string): Kind {
  const s = t.toLowerCase();
  if (/\b(call|ring|phone)\b/.test(s)) return 'call';
  if (/(₦|\$|£|€|\d+(\.\d+)?\s?k\b|\bpaid\b|\bspent\b|\bbought\b|\bsalary\b|\bgot paid\b|\breceived\b)/.test(s)) return 'money';
  if (/\b(meet|meeting|review|standup|stand-up|interview|sync with|catch up)\b/.test(s)) return 'meeting';
  if (/\b(breakfast|lunch|dinner|ate|eat|cook|egusi|jollof|eba|rice|beans|amala)\b/.test(s)) return 'meal';
  if (/\b(slept|sleep|nap|woke)\b/.test(s)) return 'sleep';
  if (/\bremind\b/.test(s)) return 'reminder';
  if (/\b(buy|pay|send|fix|finish|submit|clean|book|todo|to do)\b/.test(s)) return 'task';
  return 'note';
}

/** "15k", "₦15,000", "3.2k" → 15000 / 3200 */
export function guessAmount(t: string): number | null {
  const m = t.replace(/,/g, '').match(/(?:₦|\$|£|€)?\s?(\d+(?:\.\d+)?)\s?(k|m)?\b/i);
  if (!m) return null;
  const n = Number(m[1]) * (m[2]?.toLowerCase() === 'k' ? 1e3 : m[2]?.toLowerCase() === 'm' ? 1e6 : 1);
  return n > 0 ? Math.round(n) : null;
}

export function guessIncome(t: string) {
  return /\b(salary|got paid|received|income|earned|refund)\b/i.test(t);
}
