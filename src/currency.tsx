import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** Supported currencies. `perUnit` = naira per 1 unit, used only to show sample amounts on the site. */
export const CURRENCIES = [
  { code: 'NGN', country: 'Nigeria', flag: '🇳🇬', locale: 'en-NG', perUnit: 1 },
  { code: 'GHS', country: 'Ghana', flag: '🇬🇭', locale: 'en-GH', perUnit: 125 },
  { code: 'KES', country: 'Kenya', flag: '🇰🇪', locale: 'en-KE', perUnit: 11.6 },
  { code: 'ZAR', country: 'South Africa', flag: '🇿🇦', locale: 'en-ZA', perUnit: 83 },
  { code: 'XOF', country: 'West Africa (CFA)', flag: '🇸🇳', locale: 'fr-SN', perUnit: 2.6 },
  { code: 'EGP', country: 'Egypt', flag: '🇪🇬', locale: 'en-EG', perUnit: 31 },
  { code: 'USD', country: 'United States', flag: '🇺🇸', locale: 'en-US', perUnit: 1500 },
  { code: 'GBP', country: 'United Kingdom', flag: '🇬🇧', locale: 'en-GB', perUnit: 1950 },
  { code: 'EUR', country: 'Europe (Euro)', flag: '🇪🇺', locale: 'en-IE', perUnit: 1700 },
  { code: 'CAD', country: 'Canada', flag: '🇨🇦', locale: 'en-CA', perUnit: 1080 },
  { code: 'AED', country: 'United Arab Emirates', flag: '🇦🇪', locale: 'en-AE', perUnit: 408 },
  { code: 'INR', country: 'India', flag: '🇮🇳', locale: 'en-IN', perUnit: 17.5 },
] as const;
export type Currency = (typeof CURRENCIES)[number];
type Code = Currency['code'];

const KEY = 'jaiye-currency';
const TZ: Record<string, Code> = {
  'Africa/Lagos': 'NGN', 'Africa/Accra': 'GHS', 'Africa/Nairobi': 'KES', 'Africa/Johannesburg': 'ZAR', 'Africa/Dakar': 'XOF', 'Africa/Abidjan': 'XOF',
  'Africa/Cairo': 'EGP', 'Europe/London': 'GBP', 'America/Toronto': 'CAD', 'America/Vancouver': 'CAD', 'Asia/Dubai': 'AED', 'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR',
};
function guess(): Code {
  try { const s = localStorage.getItem(KEY); if (s && CURRENCIES.some(c => c.code === s)) return s as Code; } catch { /* storage blocked */ }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (TZ[tz]) return TZ[tz];
  if (tz.startsWith('America/')) return 'USD';
  if (tz.startsWith('Europe/')) return 'EUR';
  return 'NGN';
}

/** Round to a friendly number so converted samples don't look like 43.87. */
function friendly(v: number) {
  if (v === 0) return 0;
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.abs(v))) - 1));
  return Math.round(v / mag) * mag;
}

type Ctx = { cur: Currency; setCode: (c: Code) => void; money: (naira: number, compact?: boolean) => string; symbol: string };
const CurrencyCtx = createContext<Ctx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<Code>('NGN');
  useEffect(() => { setCodeState(guess()); }, []);
  const setCode = useCallback((c: Code) => { setCodeState(c); try { localStorage.setItem(KEY, c); } catch { /* storage blocked */ } }, []);
  const value = useMemo<Ctx>(() => {
    const cur = CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
    const fmt = (compact: boolean) => new Intl.NumberFormat(cur.locale, { style: 'currency', currency: cur.code, maximumFractionDigits: compact ? 1 : 0, notation: compact ? 'compact' : 'standard', currencyDisplay: 'narrowSymbol' });
    const money = (naira: number, compact = false) => fmt(compact).format(cur.perUnit === 1 ? naira : friendly(naira / cur.perUnit));
    const symbol = fmt(false).formatToParts(0).find(p => p.type === 'currency')?.value ?? cur.code;
    return { cur, setCode, money, symbol };
  }, [code, setCode]);
  return <CurrencyCtx.Provider value={value}>{children}</CurrencyCtx.Provider>;
}

export function useCurrency() {
  const c = useContext(CurrencyCtx);
  if (!c) throw new Error('useCurrency needs <CurrencyProvider>');
  return c;
}

/** Nav button + dropdown for picking a country / currency. */
export function CurrencyPicker() {
  const { cur, setCode } = useCurrency();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!(e.target as HTMLElement).closest('.cur')) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className={'cur' + (open ? ' is-open' : '')}>
      <button className="cur__btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`Currency: ${cur.code}. Change country`} onClick={() => setOpen(o => !o)}>
        <span className="cur__flag" aria-hidden="true">{cur.flag}</span><span className="cur__code">{cur.code}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <ul className="cur__list" role="listbox" aria-label="Country and currency">
        {CURRENCIES.map(c => (
          <li key={c.code} role="option" aria-selected={c.code === cur.code}>
            <button className={c.code === cur.code ? 'is-on' : ''} onClick={() => { setCode(c.code); setOpen(false); }}>
              <span className="cur__flag" aria-hidden="true">{c.flag}</span><span className="cur__name">{c.country}</span><span className="cur__c">{c.code}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Replaces {12345} tokens (naira) in a string with short amounts in the chosen currency. */
export function useFill() {
  const { money } = useCurrency();
  return (t: string) => t.replace(/\{(\d+)\}/g, (_, n) => money(Number(n), true));
}
