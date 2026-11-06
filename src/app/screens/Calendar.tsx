import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { ShellApi } from '../Shell';
import { DAYS, sameDay, startOfDay, startOfWeek, time } from '../format';
import { Empty, KIND, SyncLine, Tag } from '../ui/bits';
import { IBack, ICal, IChevron, IPlus } from '../ui/icons';

export default function Calendar({ api }: { api: ShellApi }) {
  const items = useStore(s => s.items);
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const today = new Date();

  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const busy = useMemo(() => new Set(items.filter(i => i.at && i.kind !== 'money').map(i => startOfDay(new Date(i.at!)).getTime())), [items]);
  const list = useMemo(() => items.filter(i => i.at && i.kind !== 'money' && sameDay(new Date(i.at), day)).sort((a, b) => a.at!.localeCompare(b.at!)), [items, day]);
  const nowIdx = sameDay(day, today) ? list.findIndex(i => new Date(i.at!) > today) : -2;

  const shift = (n: number) => { const w = new Date(weekStart); w.setDate(w.getDate() + n * 7); setWeekStart(w); const d = new Date(day); d.setDate(d.getDate() + n * 7); setDay(d); };

  return (
    <div className="jx-content jx-content--top">
      <div className="jx-titlebar">
        <div><h1 className="jx-title">{sameDay(day, today) ? DAYS[day.getDay()] : day.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })}</h1><SyncLine /></div>
        <button className="jx-roundbtn" aria-label="Add to this day" onClick={() => { const d = new Date(day); d.setHours(Math.max(today.getHours() + 1, 9), 0, 0, 0); api.tell({ kind: 'meeting', at: d }); }}><IPlus size={19} /></button>
      </div>

      <div className="jx-week">
        <button className="jx-week__nav" aria-label="Previous week" onClick={() => shift(-1)}><IBack size={16} /></button>
        {week.map(d => {
          const on = sameDay(d, day), isToday = sameDay(d, today);
          return (
            <button key={d.toISOString()} className={'jx-week__day' + (on ? ' is-on' : '') + (isToday ? ' is-today' : '')} onClick={() => setDay(startOfDay(d))} aria-pressed={on} aria-label={d.toDateString()}>
              <small>{d.toLocaleDateString('en', { weekday: 'short' })}</small>
              <b>{d.getDate()}</b>
              <i className={busy.has(startOfDay(d).getTime()) ? 'on' : ''} />
            </button>
          );
        })}
        <button className="jx-week__nav" aria-label="Next week" onClick={() => shift(1)}><IChevron size={16} /></button>
      </div>

      <div className="jx-timeline" key={day.toISOString()}>
        {list.length ? list.map((i, k) => (
          <div key={i.id}>
            {k === nowIdx && <NowLine />}
            <div className="jx-slot jx-rise" style={{ animationDelay: `${k * 40}ms` }}>
              <span className="jx-slot__time">{time(i.at!).replace(' ', ' ')}</span>
              <button className={'jx-card jx-slot__card' + (i.done || (sameDay(day, today) && new Date(i.at!) < today && i.kind !== 'task') ? ' is-past' : '')} onClick={() => api.edit(i)}>
                <span className="jx-row__icon">{(() => { const I = KIND[i.kind].Icon; return <I size={16} />; })()}</span>
                <b>{i.title}</b>
                <Tag kind={i.kind} />
              </button>
            </div>
          </div>
        )) : <Empty icon={<ICal size={20} />} title="A free day" text="Nothing planned. Tap + or tell Jaiye to add something." />}
        {nowIdx === -1 && list.length > 0 && <NowLine />}
      </div>
    </div>
  );
}

function NowLine() {
  return <div className="jx-now" aria-label="Now"><span>{time(new Date().toISOString())}</span><i /></div>;
}
