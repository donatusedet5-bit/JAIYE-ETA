import { useMemo, useState } from 'react';
import { addItem, removeItem, updateItem, useStore } from '../store';
import type { ShellApi } from '../Shell';
import type { Item } from '../types';
import { Empty, SubHead, dayKey } from '../ui/bits';
import { ICheck, IFlame, IHabit, IPlus, ITrash } from '../ui/icons';

const daysOf = (h: Item) => (Array.isArray(h.data.days) ? (h.data.days as string[]) : []);

/** Days in a row ending today, or ending yesterday if today isn't ticked yet. */
function streak(days: string[]) {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export default function Habits({ api }: { api: ShellApi }) {
  const items = useStore(s => s.items);
  const [v, setV] = useState('');
  const [editing, setEditing] = useState(false);
  const habits = useMemo(() => items.filter(i => i.kind === 'habit').sort((a, b) => a.created_at.localeCompare(b.created_at)), [items]);
  const today = dayKey(new Date());
  const week = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - (6 - k)); return d; });
  const doneToday = habits.filter(h => daysOf(h).includes(today)).length;

  async function tick(h: Item, key: string) {
    const days = daysOf(h);
    const on = days.includes(key);
    await updateItem(h.id, { data: { ...h.data, days: on ? days.filter(x => x !== key) : [...days, key].sort().slice(-400) } });
    if (!on && key === today) { const s = streak([...days, key]); if (s > 1) api.toast(`${h.title}: ${s} days in a row`); }
  }

  return (
    <div className="jx-content jx-content--top">
      <SubHead title="Habits" action={habits.length ? <button className="jx-link jx-link--sm" onClick={() => setEditing(e => !e)}>{editing ? 'Done' : 'Edit'}</button> : undefined} />

      {habits.length > 0 && (
        <div className="jx-card jx-left jx-rise">
          <div className="jx-left__top"><small>Today</small><span className="jx-pill jx-pill--plain">{new Date().toLocaleDateString('en', { weekday: 'long' })}</span></div>
          <b className="jx-huge">{doneToday} of {habits.length}</b>
          <div className="jx-meter" role="progressbar" aria-label="Habits done today" aria-valuenow={Math.round((doneToday / habits.length) * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${(doneToday / habits.length) * 100}%` }} /></div>
        </div>
      )}

      <form className="jx-addrow" style={{ marginTop: 12 }} onSubmit={async e => { e.preventDefault(); const t = v.trim(); if (!t) return; setV(''); await addItem({ kind: 'habit', title: t, data: { days: [] } }); }}>
        <input value={v} onChange={e => setV(e.target.value)} placeholder="Add a habit, like “Drink water”" maxLength={60} aria-label="New habit" />
        <button className="jx-sendsm" aria-label="Add habit" disabled={!v.trim()}><IPlus size={16} /></button>
      </form>

      {habits.length ? (
        <div className="jx-habits">
          {habits.map((h, n) => {
            const days = daysOf(h), on = days.includes(today), s = streak(days);
            return (
              <div key={h.id} className={'jx-card jx-habit jx-rise' + (on ? ' is-done' : '')} style={{ animationDelay: `${n * 25}ms` }}>
                <div className="jx-habit__top">
                  <button className="jx-check" role="checkbox" aria-checked={on} aria-label={on ? `Untick ${h.title} for today` : `Tick ${h.title} for today`} onClick={() => void tick(h, today)}><ICheck size={14} /></button>
                  <span className="jx-li__txt"><b>{h.title}</b><small>{s ? <><IFlame size={12} /> {s} day{s === 1 ? '' : 's'} in a row</> : 'Start today'}</small></span>
                  {editing && <button className="jx-iconbtn jx-iconbtn--muted" aria-label={`Remove ${h.title}`} onClick={() => void removeItem(h.id)}><ITrash size={16} /></button>}
                </div>
                <div className="jx-habit__week">
                  {week.map(d => {
                    const k = dayKey(d), hit = days.includes(k);
                    return (
                      <button key={k} className={'jx-habit__day' + (hit ? ' is-on' : '') + (k === today ? ' is-today' : '')} aria-pressed={hit} aria-label={`${h.title} on ${d.toLocaleDateString('en', { weekday: 'long' })}`} onClick={() => void tick(h, k)}>
                        <small>{d.toLocaleDateString('en', { weekday: 'narrow' })}</small><i />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={<IHabit size={20} />} title="No habits yet" text="Add one or two small things you want to do every day. Tick them off and watch the streak grow." />
      )}
    </div>
  );
}
