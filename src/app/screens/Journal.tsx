import { useMemo, useState } from 'react';
import { addItem, removeItem, updateItem, useStore } from '../store';
import type { ShellApi } from '../Shell';
import type { Item } from '../types';
import { Empty, SubHead, dayKey } from '../ui/bits';
import { IBook, IPen, ITrash } from '../ui/icons';
import { Sheet } from '../ui/Sheet';
import { time } from '../format';

export const MOODS = [
  { id: 'great', label: 'Great', tone: 'call' },
  { id: 'good', label: 'Good', tone: 'money' },
  { id: 'okay', label: 'Okay', tone: 'meals' },
  { id: 'low', label: 'Low', tone: 'sleep' },
  { id: 'rough', label: 'Rough', tone: 'tasks' },
] as const;
const moodOf = (i: Item) => MOODS.find(m => m.id === i.data.mood);
const textOf = (i: Item) => (typeof i.data.text === 'string' ? i.data.text : i.title);

export default function Journal({ api }: { api: ShellApi }) {
  const items = useStore(s => s.items);
  const [edit, setEdit] = useState<{ item?: Item; mood?: string } | null>(null);
  const entries = useMemo(() => items.filter(i => i.kind === 'journal').sort((a, b) => (b.at ?? b.created_at).localeCompare(a.at ?? a.created_at)), [items]);
  const wroteToday = entries.some(e => dayKey(new Date(e.at ?? e.created_at)) === dayKey(new Date()));
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - k));
    const e = entries.find(x => dayKey(new Date(x.at ?? x.created_at)) === dayKey(d) && moodOf(x));
    return { d, mood: e ? moodOf(e) : undefined };
  });

  return (
    <div className="jx-content jx-content--top">
      <SubHead title="Journal" action={<button className="jx-roundbtn" aria-label="Write an entry" onClick={() => setEdit({})}><IPen size={18} /></button>} />

      {!wroteToday && (
        <div className="jx-card jx-prompt jx-rise">
          <b>How was today?</b>
          <div className="jx-chips">
            {MOODS.map(m => <button key={m.id} className="jx-kchip" onClick={() => setEdit({ mood: m.id })}>{m.label}</button>)}
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="jx-card jx-moodweek jx-rise" style={{ animationDelay: '25ms' }} aria-label="Moods this week">
          {week.map(w => (
            <span key={w.d.toDateString()} className="jx-moodweek__day">
              <i style={w.mood ? { background: `var(--tag-${w.mood.tone}-fg)` } : undefined} title={w.mood?.label ?? 'No entry'} />
              <small>{w.d.toLocaleDateString('en', { weekday: 'narrow' })}</small>
            </span>
          ))}
        </div>
      )}

      {entries.length ? (
        <div className="jx-entries">
          {entries.slice(0, 60).map((e, n) => {
            const m = moodOf(e), when = new Date(e.at ?? e.created_at);
            return (
              <button key={e.id} className="jx-card jx-entry jx-rise" style={{ animationDelay: `${Math.min(n, 6) * 20 + 40}ms` }} onClick={() => setEdit({ item: e })}>
                <span className="jx-entry__top">
                  <small>{when.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })} · {time(when.toISOString())}</small>
                  {m && <span className={`jx-tag jx-tag--${m.tone}`}>{m.label}</span>}
                </span>
                <span className="jx-entry__txt">{textOf(e)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <Empty icon={<IBook size={20} />} title="Nothing written yet" text="A line or two a day is enough. What happened, how you felt, what you want to remember." />
      )}

      {edit && <EntrySheet item={edit.item} mood={edit.mood} onClose={() => setEdit(null)} onSaved={msg => { setEdit(null); api.toast(msg); }} />}
    </div>
  );
}

function EntrySheet({ item, mood: m0, onClose, onSaved }: { item?: Item; mood?: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const [text, setText] = useState(item ? textOf(item) : '');
  const [mood, setMood] = useState<string | undefined>((item?.data.mood as string | undefined) ?? m0);
  const ok = text.trim().length > 0 || !!mood;
  async function save(close: () => void) {
    if (!ok) return;
    const body = text.trim();
    const title = (body.split('\n')[0] || MOODS.find(x => x.id === mood)?.label || 'Entry').slice(0, 80);
    const data = { ...(item?.data ?? {}), text: body.slice(0, 4000), mood: mood ?? null };
    if (item) await updateItem(item.id, { title, data });
    else await addItem({ kind: 'journal', title, at: new Date().toISOString(), data });
    close(); setTimeout(() => onSaved(item ? 'Entry saved' : 'Added to your journal'), 170);
  }
  return (
    <Sheet title={item ? new Date(item.at ?? item.created_at).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Today'} onClose={onClose} tall>
      {close => (
        <>
          <div className="jx-chips" role="radiogroup" aria-label="Mood">
            {MOODS.map(x => <button key={x.id} role="radio" aria-checked={mood === x.id} className={'jx-kchip' + (mood === x.id ? ` is-on jx-tag--${x.tone}` : '')} onClick={() => setMood(v => v === x.id ? undefined : x.id)}>{x.label}</button>)}
          </div>
          <textarea className="jx-textarea" value={text} onChange={e => setText(e.target.value)} maxLength={4000} placeholder="What happened today?" aria-label="Journal entry" autoFocus={!item} />
          <p className="jx-note">Only you can see your journal.</p>
          <div className="jx-sheet__actions">
            {item && <button className="jx-btn jx-btn--danger" aria-label="Delete entry" onClick={async () => { await removeItem(item.id); close(); setTimeout(() => onSaved('Entry deleted'), 170); }}><ITrash size={18} /></button>}
            <button className="jx-btn jx-btn--primary jx-btn--block" disabled={!ok} onClick={() => void save(close)}>Save</button>
          </div>
        </>
      )}
    </Sheet>
  );
}
