import { useSyncExternalStore } from 'react';

// One shared theme for every screen in the app (reads/writes <html data-theme>).
const get = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
}

export function useAppTheme() {
  const theme = useSyncExternalStore(subscribe, get);
  const toggle = () => {
    const n = get() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', n === 'dark' ? '#0B0C0F' : '#F4F5F7');
    try { localStorage.setItem('jaiye-theme', n); } catch { /* ignore */ }
  };
  return { theme, toggle };
}
