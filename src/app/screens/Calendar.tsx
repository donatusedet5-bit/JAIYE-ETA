import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import type { ShellApi } from '../Shell';
import type { Item } from '../types';
import { DAYS, sameDay, startOfDay, startOfWeek, time } from '../format';
import { Empty, KIND, SyncLine, Tag, UNTIMED } from '../ui/bits';
import { ICal, IPlus } from '../ui/icons';

type View = 'month' | 'week' | 'day';
const VIEWS: View[] = ['month', 'week', 'day'];
const H0 = 6, H1 = 24, ROW = 44;   // week grid: 6am to midnight

export default function Calendar({ api }: { api: ShellApi }) {
  const items = useStore(s => s.items);
  const [view, setView] = useState<View>('day');
  const [cur, setCur] = useState(() => startOfDay(new Date()));
  const today = new Date();
  const timed = useMemo(() => items.filter(i => i.at && !UNTIMED.includes(i.kind)), [items]);

  const shift = (n: number) => setCur(c => {
    const d = new Date(c);
    if (view === 'month') { d.setDate(1); d.setMonth(d.getMonth() + n); }
    else d.setDate(d.getDate() + (view === 'week' ? 7 : 1) * n);
    return d;
  });
  const zoom = (dir: 1 | -1) => setView(v => VIEWS[Math.min(2, Math.max(0, VIEWS.indexOf(v) + dir))]);
  const openDay = (d: Date) => { setCur(startOfDay(d)); setView('day'); };

  // Gestures: one finger swipes to the next/previous period, two fingers pinch between views.
  const g = useRef<{ x: number; y: number; d: number; done: boolean } | null>(null);
  const dist = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onTouchStart = (e: React.TouchEvent) => { g.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, d: e.touches.length > 1 ? dist(e.touches) : 0, done: false }; };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = g.current; if (!s || s.done || e.touches.length < 2) return;
    if (!s.d) { s.d = dist(e.touches); return; }
    const r = dist(e.touches) / s.d;
    if (r > 1.25) { zoom(1); s.done = true; } else if (r < 0.8) { zoom(-1); s.done = true; }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = g.current; g.current = null; if (!s || s.done || s.d) return;
    const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 55 && Math.abs(dy) < 45) shift(dx < 0 ? 1 : -1);
  };
  const onWheel = (e: React.WheelEvent) => { if (e.ctrlKey && Math.abs(e.deltaY) > 4) zoom(e.deltaY < 0 ? 1 : -1); };

  const title = view === 'month' ? cur.toLocaleDateString('en', { month: 'long', year: cur.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
    : view === 'week' ? weekLabel(cur)
    : sameDay(cur, today) ? DAYS[cur.getDay()] : cur.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' });
  const isNow = view === 'month' ? cur.getMonth() === today.getMonth() && cur.getFullYear() === today.getFullYear()
    : view === 'week' ? sameDay(startOfWeek(cur), startOfWeek(today)) : sameDay(cur, today);

  return (
    <div className="jx-content jx-content--top jx-cal" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onWheel={onWheel}>
      <div className="jx-titlebar">
        <div><h1 className="jx-title">{title}</h1><SyncLine /></div>
        <div className="jx-titlebar__acts">
          {!isNow && <button className="jx-pill jx-pill--today" onClick={() => setCur(startOfDay(new Date()))}>Today</button>}
          <button className="jx-roundbtn" aria-label="Add to this day" onClick={() => { const d = new Date(cur); d.setHours(Math.max(today.getHours() + 1, 9), 0, 0, 0); api.tell({ kind: 'meeting', at: d }); }}><IPlus size={19} /></button>
        </div>
      </div>

      <div className="jx-seg jx-seg--full" role="tablist" aria-label="Calendar view">
        {VIEWS.map(v => <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'is-on' : ''} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
      </div>

      <div key={view + cur.toDateString()} className="jx-fadein">
        {view === 'month' && <Month cur={cur} items={timed} onPick={openDay} />}
        {view === 'week' && <Week cur={cur} items={timed} onPick={openDay} onItem={api.edit} />}
        {view === 'day' && <Day cur={cur} items={timed} onItem={api.edit} />}
      </div>
      <p className="jx-hint">Swipe to move · pinch to zoom</p>
    </div>
  );
}

function weekLabel(d: Date) {
  const s = startOfWeek(d), e = new Date(s); e.setDate(e.getDate() + 6);
  const m = (x: Date) => x.toLocaleDateString('en', { month: 'short' });
  return s.getMonth() === e.getMonth() ? `${s.getDate()}–${e.getDate()} ${m(e)}` : `${s.getDate()} ${m(s)} – ${e.getDate()} ${m(e)}`;
}

/* ---------- month: dots per day ---------- */
function Month({ cur, items, onPick }: { cur: Date; items: Item[]; onPick: (d: Date) => void }) {
  const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const rows = cells[35].getMonth() !== cur.getMonth() ? 5 : 6;
  const byDay = useMemo(() => {
    const m = new Map<string, Item[]>();
    items.forEach(i => { const k = new Date(i.at!).toDateString(); m.set(k, [...(m.get(k) ?? []), i]); });
    return m;
  }, [items]);
  const today = new Date();
  return (
    <div className="jx-card jx-month">
      <div className="jx-month__head">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="jx-month__grid">
        {cells.slice(0, rows * 7).map(d => {
          const list = byDay.get(d.toDateString()) ?? [];
          const kinds = [...new Set(list.map(i => KIND[i.kind].tag))].slice(0, 3);
          return (
            <button key={d.toISOString()} className={'jx-month__cell' + (d.getMonth() !== cur.getMonth() ? ' is-out' : '') + (sameDay(d, today) ? ' is-today' : '')} onClick={() => onPick(d)} aria-label={`${d.toDateString()}, ${list.length} things`}>
              <b>{d.getDate()}</b>
              <span className="jx-dots3">{kinds.map(k => <i key={k} style={{ background: `var(--tag-${k}-fg)` }} />)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- week: time blocks ---------- */
function Week({ cur, items, onPick, onItem }: { cur: Date; items: Item[]; onPick: (d: Date) => void; onItem: (i: Item) => void }) {
  const start = startOfWeek(cur);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const now = new Date();
  const top = (d: Date) => Math.max(0, (d.getHours() + d.getMinutes() / 60 - H0)) * ROW;
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { if (body.current) body.current.scrollTop = Math.max(0, top(new Date()) - ROW * 2); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="jx-card jx-week2">
      <div className="jx-week2__head">
        <span />
        {days.map(d => (
          <button key={d.toISOString()} className={sameDay(d, now) ? 'is-today' : ''} onClick={() => onPick(d)}>
            <small>{d.toLocaleDateString('en', { weekday: 'narrow' })}</small><b>{d.getDate()}</b>
          </button>
        ))}
      </div>
      <div className="jx-week2__body" ref={body}>
        <div className="jx-week2__grid" style={{ height: (H1 - H0) * ROW }}>
        <div className="jx-week2__hours">{Array.from({ length: H1 - H0 }, (_, h) => <span key={h} style={{ top: h * ROW }}>{fmtHour(h + H0)}</span>)}</div>
        {days.map((d, di) => (
          <div key={di} className="jx-week2__col">
            {items.filter(i => sameDay(new Date(i.at!), d)).map(i => (
              <button key={i.id} className={`jx-week2__ev jx-tag--${KIND[i.kind].tag}`} style={{ top: top(new Date(i.at!)) }} onClick={() => onItem(i)} title={i.title}>
                {i.title}
              </button>
            ))}
            {sameDay(d, now) && now.getHours() >= H0 && <i className="jx-week2__now" style={{ top: top(now) }} />}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
const fmtHour = (h: number) => h === 12 ? '12p' : h === 0 || h === 24 ? '12a' : h > 12 ? `${h - 12}p` : `${h}a`;

/* ---------- day: timeline with the now line ---------- */
function Day({ cur, items, onItem }: { cur: Date; items: Item[]; onItem: (i: Item) => void }) {
  const today = new Date();
  const list = items.filter(i => sameDay(new Date(i.at!), cur)).sort((a, b) => a.at!.localeCompare(b.at!));
  const nowIdx = sameDay(cur, today) ? list.findIndex(i => new Date(i.at!) > today) : -2;
  if (!list.length) return <Empty icon={<ICal size={20} />} title="A free day" text="Nothing planned. Tap + or tell Jaiye to add something." />;
  return (
    <div className="jx-timeline">
      {list.map((i, k) => (
        <div key={i.id}>
          {k === nowIdx && <NowLine />}
          <div className="jx-slot jx-rise" style={{ animationDelay: `${Math.min(k, 6) * 20}ms` }}>
            <span className="jx-slot__time">{time(i.at!).replace(' ', ' ')}</span>
            <button className={'jx-card jx-slot__card' + (i.done || (sameDay(cur, today) && new Date(i.at!) < today && i.kind !== 'task') ? ' is-past' : '')} onClick={() => onItem(i)}>
              <span className="jx-row__icon">{(() => { const I = KIND[i.kind].Icon; return <I size={16} />; })()}</span>
              <b>{i.title}</b>
              <Tag kind={i.kind} />
            </button>
          </div>
        </div>
      ))}
      {nowIdx === -1 && <NowLine />}
    </div>
  );
}

function NowLine() {
  return <div className="jx-now" aria-label="Now"><span>{time(new Date().toISOString())}</span><i /></div>;
}
