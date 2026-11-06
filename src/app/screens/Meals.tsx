import { useMemo, useState } from 'react';
import { addItem, removeItem, updateItem, useStore } from '../store';
import type { ShellApi } from '../Shell';
import type { Item } from '../types';
import { sameDay, startOfDay } from '../format';
import { Empty, SyncLine } from '../ui/bits';
import { IBox, ICart, ICheck, IMeal, IPlus, ITrash } from '../ui/icons';

type Tab = 'plan' | 'grocery' | 'pantry';
const SLOTS = [{ id: 'breakfast', label: 'Breakfast', h: 8 }, { id: 'lunch', label: 'Lunch', h: 13 }, { id: 'dinner', label: 'Dinner', h: 19 }] as const;

export default function Meals({ api }: { api: ShellApi }) {
  const [tab, setTab] = useState<Tab>('plan');
  return (
    <div className="jx-content jx-content--top">
      <div className="jx-titlebar">
        <div><h1 className="jx-title">Meals</h1><SyncLine /></div>
        <button className="jx-roundbtn" aria-label="Log a meal" onClick={() => api.tell({ kind: 'meal', at: new Date() })}><IPlus size={19} /></button>
      </div>
      <div className="jx-seg jx-seg--full" role="tablist">
        {([['plan', 'Week plan'], ['grocery', 'Grocery'], ['pantry', 'Pantry']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div key={tab} className="jx-fadein">
        {tab === 'plan' && <Plan />}
        {tab === 'grocery' && <Grocery />}
        {tab === 'pantry' && <Pantry />}
      </div>
    </div>
  );
}

/* ---------- week plan ---------- */
function Plan() {
  const items = useStore(s => s.items);
  const [editing, setEditing] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => { const d = startOfDay(new Date()); d.setDate(d.getDate() + i); return d; });
  const planned = useMemo(() => items.filter(i => i.kind === 'meal' && i.at), [items]);
  const find = (d: Date, slot: string) => planned.find(i => sameDay(new Date(i.at!), d) && (i.data.slot === slot || (!i.data.slot && slotFor(new Date(i.at!)) === slot)));

  async function save(d: Date, slot: typeof SLOTS[number], text: string, cur?: Item) {
    setEditing(null);
    const t = text.trim();
    if (cur && !t) { await removeItem(cur.id); return; }
    if (!t) return;
    if (cur) { await updateItem(cur.id, { title: t }); return; }
    const at = new Date(d); at.setHours(slot.h, 0, 0, 0);
    await addItem({ kind: 'meal', title: t, at: at.toISOString(), data: { slot: slot.id, plan: true } });
  }

  return (
    <div className="jx-plan">
      {days.map((d, di) => (
        <div key={d.toISOString()} className="jx-card jx-plan__day jx-rise" style={{ animationDelay: `${Math.min(di, 4) * 20}ms` }}>
          <b className="jx-plan__date">{di === 0 ? 'Today' : di === 1 ? 'Tomorrow' : d.toLocaleDateString('en', { weekday: 'long' })}<small>{d.toLocaleDateString('en', { day: 'numeric', month: 'short' })}</small></b>
          {SLOTS.map(slot => {
            const cur = find(d, slot.id), key = d.toDateString() + slot.id;
            return (
              <div key={slot.id} className="jx-plan__slot">
                <span className="jx-plan__label">{slot.label}</span>
                {editing === key ? (
                  <input autoFocus defaultValue={cur?.title ?? ''} maxLength={80} placeholder="e.g. Jollof and chicken" aria-label={`${slot.label} on ${d.toDateString()}`}
                    onBlur={e => save(d, slot, e.target.value, cur)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(null); }} />
                ) : (
                  <button className={'jx-plan__meal' + (cur ? '' : ' is-empty')} onClick={() => setEditing(key)}>{cur?.title ?? 'Plan a meal'}</button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
const slotFor = (d: Date) => d.getHours() < 11 ? 'breakfast' : d.getHours() < 16 ? 'lunch' : 'dinner';

/* ---------- shared add row ---------- */
function AddRow({ placeholder, onAdd, qty }: { placeholder: string; onAdd: (t: string, q: number) => void; qty?: boolean }) {
  const [v, setV] = useState('');
  const [q, setQ] = useState(1);
  return (
    <form className="jx-addrow" onSubmit={e => { e.preventDefault(); if (v.trim()) { onAdd(v.trim(), q); setV(''); setQ(1); } }}>
      <input value={v} onChange={e => setV(e.target.value)} placeholder={placeholder} maxLength={80} aria-label={placeholder} />
      {qty && <span className="jx-qty"><button type="button" aria-label="Less" onClick={() => setQ(x => Math.max(1, x - 1))}>−</button><b>{q}</b><button type="button" aria-label="More" onClick={() => setQ(x => Math.min(99, x + 1))}>+</button></span>}
      <button className="jx-sendsm" aria-label="Add" disabled={!v.trim()}><IPlus size={16} /></button>
    </form>
  );
}

/* ---------- grocery ---------- */
function Grocery() {
  const items = useStore(s => s.items);
  const list = useMemo(() => items.filter(i => i.kind === 'grocery').sort((a, b) => Number(a.done) - Number(b.done) || b.created_at.localeCompare(a.created_at)), [items]);
  const done = list.filter(i => i.done);
  return (
    <>
      <AddRow placeholder="Add to the list" onAdd={t => addItem({ kind: 'grocery', title: t })} />
      {list.length ? (
        <div className="jx-card jx-list">
          {list.map(i => (
            <div key={i.id} className={'jx-li jx-task' + (i.done ? ' is-done' : '')}>
              <button className="jx-check" role="checkbox" aria-checked={i.done} aria-label={i.done ? 'Not bought' : 'Bought'} onClick={() => updateItem(i.id, { done: !i.done })}><ICheck size={13} /></button>
              <span className="jx-li__txt"><b>{i.title}</b></span>
              {i.done && <button className="jx-link jx-link--sm" onClick={async () => { await addItem({ kind: 'pantry', title: i.title, data: { qty: 1 } }); await removeItem(i.id); }}>To pantry</button>}
            </div>
          ))}
        </div>
      ) : <Empty icon={<ICart size={20} />} title="List is empty" text="Add what you need to buy. Tick things off at the market." />}
      {done.length > 0 && <button className="jx-link jx-link--center" onClick={() => done.forEach(i => void removeItem(i.id))}>Clear {done.length} bought</button>}
    </>
  );
}

/* ---------- pantry ---------- */
function Pantry() {
  const items = useStore(s => s.items);
  const list = useMemo(() => items.filter(i => i.kind === 'pantry').sort((a, b) => a.title.localeCompare(b.title)), [items]);
  const qty = (i: Item) => Number(i.data.qty ?? 1);
  return (
    <>
      <AddRow placeholder="What's in the kitchen?" qty onAdd={(t, q) => addItem({ kind: 'pantry', title: t, data: { qty: q } })} />
      {list.length ? (
        <div className="jx-card jx-list">
          {list.map(i => (
            <div key={i.id} className={'jx-li' + (qty(i) <= 1 ? ' is-low' : '')}>
              <span className="jx-row__icon"><IBox size={15} /></span>
              <span className="jx-li__txt"><b>{i.title}</b>{qty(i) <= 1 && <small>Running low</small>}</span>
              <span className="jx-qty">
                <button aria-label={`One less ${i.title}`} onClick={() => qty(i) <= 1 ? removeItem(i.id) : updateItem(i.id, { data: { ...i.data, qty: qty(i) - 1 } })}>{qty(i) <= 1 ? <ITrash size={13} /> : '−'}</button>
                <b>{qty(i)}</b>
                <button aria-label={`One more ${i.title}`} onClick={() => updateItem(i.id, { data: { ...i.data, qty: Math.min(99, qty(i) + 1) } })}>+</button>
              </span>
            </div>
          ))}
        </div>
      ) : <Empty icon={<IMeal size={20} />} title="Pantry is empty" text="Add what you have at home. Bought groceries can move here in one tap." />}
      {list.some(i => qty(i) <= 1) && (
        <button className="jx-link jx-link--center" onClick={() => list.filter(i => qty(i) <= 1).forEach(i => void addItem({ kind: 'grocery', title: i.title }))}>Add low items to grocery list</button>
      )}
    </>
  );
}
