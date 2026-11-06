import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Kind } from '../types';
import { IHabit, IMeal, INote, IPhone, IBed, IBell, ITasks, IVideo, IWallet, ISync, IOffline } from './icons';
import { useStore } from '../store';
import { money } from '../format';

export const KIND: Record<Kind, { label: string; tag: string; Icon: (p: { size?: number }) => ReactNode }> = {
  money: { label: 'Money', tag: 'money', Icon: IWallet },
  meeting: { label: 'Meeting', tag: 'meeting', Icon: IVideo },
  call: { label: 'Call', tag: 'call', Icon: IPhone },
  meal: { label: 'Meals', tag: 'meals', Icon: IMeal },
  task: { label: 'Task', tag: 'tasks', Icon: ITasks },
  sleep: { label: 'Sleep', tag: 'sleep', Icon: IBed },
  reminder: { label: 'Reminder', tag: 'reminder', Icon: IBell },
  note: { label: 'Note', tag: 'note', Icon: INote },
  habit: { label: 'Habit', tag: 'meals', Icon: IHabit },
  grocery: { label: 'Grocery', tag: 'meals', Icon: IMeal },
  pantry: { label: 'Pantry', tag: 'meals', Icon: IMeal },
};

export function Tag({ kind, children }: { kind: Kind; children?: ReactNode }) {
  return <span className={`jx-tag jx-tag--${KIND[kind].tag}`}>{children ?? KIND[kind].label}</span>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={'jx-switch' + (on ? ' is-on' : '')} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export function Avatar({ size = 40, ring = false }: { size?: number; ring?: boolean }) {
  const avatar = useStore(s => s.avatar);
  const name = useStore(s => s.profile?.name ?? '');
  return (
    <span className={'jx-avatar' + (ring ? ' jx-avatar--ring' : '')} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {avatar ? <img src={avatar} alt="" /> : (name.trim()[0] ?? 'J').toUpperCase()}
    </span>
  );
}

export function SyncLine() {
  const s = useStore(st => st.sync);
  const label = s.status === 'offline' ? (s.pending ? `Offline · ${s.pending} to sync` : 'Offline · saved on this phone')
    : s.status === 'syncing' ? 'Syncing…'
    : s.status === 'error' ? (s.pending ? `${s.pending} waiting to sync` : 'Sync paused')
    : s.pending ? `${s.pending} to sync` : 'Synced';
  return (
    <span className={'jx-sync' + (s.status === 'syncing' ? ' is-spin' : '')}>
      {s.status === 'offline' ? <IOffline size={13} /> : <ISync size={13} />}{label}
    </span>
  );
}

/** Animated number, counts from the previous value. */
export function Count({ value, render }: { value: number; render: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); from.current = value; return; }
    const a = from.current, b = value, t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3);
      setShown(a + (b - a) * e);
      if (k < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{render(Math.round(shown))}</>;
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="jx-empty jx-rise">
      <span className="jx-empty__icon">{icon}</span>
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}

/** A money amount that respects "Hide amounts". Tap to peek for a few seconds. */
export function Amount({ n, currency, sign, className }: { n: number; currency: string; sign?: boolean; className?: string }) {
  const hide = useStore(s => !!s.profile?.prefs.hideAmounts);
  const [peek, setPeek] = useState(false);
  useEffect(() => { if (!peek) return; const t = setTimeout(() => setPeek(false), 4000); return () => clearTimeout(t); }, [peek]);
  const text = money(n, currency, { sign });
  if (!hide || peek) return <span className={className}>{text}</span>;
  return (
    <button type="button" className={'jx-hidden ' + (className ?? '')} onClick={e => { e.stopPropagation(); setPeek(true); }} aria-label="Show amount">
      {text.replace(/[\d,.]+/, '•••••')}
    </button>
  );
}
