import { useEffect, useRef, useState } from 'react';

export const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Adds .is-in to every [data-reveal] element once it scrolls into view. */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** True once the element has been on screen. */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold });
    io.observe(el); return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** Counts from 0 to `to` once `run` is true. */
export function useCountUp(to: number, run: boolean, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (reduced()) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return v;
}

/** 0 → 1 as the element travels through the viewport. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect(); const vh = window.innerHeight;
      setP(Math.max(0, Math.min(1, (vh * 0.75 - r.top) / (r.height + vh * 0.25))));
    }); };
    on(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return [ref, p] as const;
}

/** Pointer-driven 3D tilt; writes --rx / --ry on the element. */
export function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el || reduced() || !matchMedia('(hover: hover)').matches) return;
    const host = el.parentElement ?? el;
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`); el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
      el.style.setProperty('--px', `${(x * 24).toFixed(1)}px`); el.style.setProperty('--py', `${(y * 24).toFixed(1)}px`);
    };
    const leave = () => { ['--rx', '--ry', '--px', '--py'].forEach(k => el.style.setProperty(k, '0')); };
    host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
    return () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); };
  }, [max]);
  return ref;
}

/** Cards follow the pointer with a soft spotlight (sets --mx/--my on .spot elements). */
export function useSpotlight() {
  useEffect(() => {
    if (!matchMedia('(hover: hover)').matches) return;
    const on = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.spot'); if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`); card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', on);
    return () => document.removeEventListener('pointermove', on);
  }, []);
}

/** Buttons with .magnet drift toward the pointer. */
export function useMagnet() {
  useEffect(() => {
    if (reduced() || !matchMedia('(hover: hover)').matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.magnet'));
    const fns = els.map(el => {
      const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.25}px`; };
      const leave = () => { el.style.translate = '0 0'; };
      el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
      return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
    });
    return () => fns.forEach(f => f());
  }, []);
}

/** Cycles an index every `ms` while `run` is true. */
export function useCycle(n: number, ms: number, run = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!run || reduced()) return;
    const t = window.setTimeout(() => setI(x => (x + 1) % n), ms);
    return () => clearTimeout(t);
  }, [i, n, ms, run]);
  return [i, setI] as const;
}
