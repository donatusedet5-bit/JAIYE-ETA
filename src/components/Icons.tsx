import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p });

export const Send = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)} stroke="none" fill="currentColor"><path d="M3.4 20.6l17.8-8a.7.7 0 0 0 0-1.2l-17.8-8a.7.7 0 0 0-1 .8L4.6 11 13 12l-8.4 1-2.2 6.8a.7.7 0 0 0 1 .8z" /></svg>;
export const Sparkle = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)} stroke="none" fill="currentColor"><path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z" /></svg>;
export const Mic = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;
export const Plus = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const Home = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
export const Calendar = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
export const Wallet = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M16 13h2" /><path d="M6 6V5a2 2 0 0 1 2-2h9" /></svg>;
export const Task = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 4V3h6v1M9 13l2 2 4-4" /></svg>;
export const Bowl = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 12h18a9 9 0 0 1-18 0z" /><path d="M8 8c0-1.5 1-2 1-3.5M12 8c0-1.5 1-2 1-3.5M16 8c0-1.5 1-2 1-3.5" /></svg>;
export const Moon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
export const Sun = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const Mail = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7l8.5 6 8.5-6" /></svg>;
export const User = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5" /></svg>;
export const Video = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="6" width="13" height="12" rx="3" /><path d="M16 10.5l5-3v9l-5-3" /></svg>;
export const Lock = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
export const Wifi = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19.5" r="1" fill="currentColor" /></svg>;
export const Share = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>;
export const Arrow = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M7 17L17 7M8 7h9v9" /></svg>;
export const Check = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const Trend = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg>;
