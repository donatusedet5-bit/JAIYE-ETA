import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'jaiye-theme';

function initial(): Theme {
  try { const s = localStorage.getItem(KEY); if (s === 'light' || s === 'dark') return s; } catch { /* storage blocked */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B0C0F' : '#F4F5F7');
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => {
    const n = t === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, n); } catch { /* storage blocked */ }
    return n;
  }), []);
  return { theme, toggle };
}
