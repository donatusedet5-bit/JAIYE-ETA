export type Country = { code: string; name: string; currency: string; flag: string };

export const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', flag: '🇸🇳' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', flag: '🇮🇪' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
];

const TZ: Record<string, string> = {
  'Africa/Lagos': 'NG', 'Africa/Accra': 'GH', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA',
  'Africa/Abidjan': 'CI', 'Africa/Dakar': 'SN', 'Africa/Cairo': 'EG', 'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Asia/Dubai': 'AE', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA',
};

/** Best first guess: the currency picked on the landing page, then the time zone. */
export function guessCountry(): Country {
  try {
    const raw = (localStorage.getItem('jaiye-currency') ?? '').replace(/"/g, '');
    const hit = COUNTRIES.find(c => c.currency === raw);
    if (hit) {
      const tzc = COUNTRIES.find(c => c.code === TZ[Intl.DateTimeFormat().resolvedOptions().timeZone]);
      return tzc && tzc.currency === raw ? tzc : hit;
    }
  } catch { /* ignore */ }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz.startsWith('America/') && !TZ[tz]) return COUNTRIES.find(c => c.code === 'US')!;
  return COUNTRIES.find(c => c.code === TZ[tz]) ?? COUNTRIES[0];
}

const fmts = new Map<string, Intl.NumberFormat>();
export function money(n: number, currency = 'NGN', opts: { sign?: boolean } = {}) {
  const key = currency;
  if (!fmts.has(key)) fmts.set(key, new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }));
  const s = fmts.get(key)!.format(Math.abs(n));
  return (opts.sign ? (n < 0 ? '−' : '+') : n < 0 ? '−' : '') + s;
}

export function symbol(currency: string) {
  return (new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(p => p.type === 'currency')?.value) ?? currency;
}

export const time = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
export const hm12 = (hm: string) => { const [h, m] = hm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }); };

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function startOfWeek(d: Date) { const x = startOfDay(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }
export function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
export const ordinal = (n: number) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
