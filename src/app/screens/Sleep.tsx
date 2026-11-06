import { useMemo, useState } from 'react';
import { addItem, removeItem, updateItem, useStore } from '../store';
import type { ShellApi } from '../Shell';
import type { Item } from '../types';
import { Empty, SubHead, dayKey } from '../ui/bits';
import { IBed, IPlus, ITrash } from '../ui/icons';
import { Sheet } from '../ui/Sheet';
import { hm12, time } from '../format';

const QUALITY = ['Rough', 'Okay', 'Good'] as const;
const hrs = (ms: number) => { const m = Math.round(ms / 60000); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; };
const short = (ms: number) => { const m = Math.round(ms / 60000); return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`; };
const mins = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** A night: when they went to bed, when they woke (if known), and how long that was. */
function night(i: Item) {
  const bed = new Date(i.at!);
  const wake = typeof i.data.wake === 'string' ? new Date(i.data.wake) : null;
  return { i, bed, wake, ms: wake ? wake.getTime() - bed.getTime() : 0, quality: i.data.quality as string | undefined };
}

export default function Sleep({ api }: { api: ShellApi }) {
  const p = useStore(s => s.profile)!;
  const items = useStore(s => s.items);
  const [edit, setEdit] = useState<Item | 'new' | null>(null);

  const nights = useMemo(() => items.filter(i => i.kind === 'sleep' && i.at).map(night).sort((a, b) => b.bed.getTime() - a.bed.getTime()), [items]);
  const target = ((mins(p.wake_time) - mins(p.bed_time) + 1440) % 1440) * 60000;   // e.g. 23:00 → 07:00 = 8h
  const last = nights.find(n => n.ms > 0);

  // last 7 mornings, oldest first; a night counts for the day you woke up
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - k));
    const n = nights.find(x => x.wake && dayKey(x.wake) === dayKey(d));
    return { d, ms: n?.ms ?? 0, today: k === 6 };
  });
  const logged = week.filter(w => w.ms > 0);
  const avg = logged.length ? logged.reduce((a, w) => a + w.ms, 0) / logged.length : 0;
  const top = Math.max(target, ...week.map(w => w.ms), 1);

  return (
    <div className="jx-content jx-content--top">
      <SubHead title="Sleep" action={<button className="jx-roundbtn" aria-label="Log a night" onClick={() => setEdit('new')}><IPlus size={19} /></button>} />

      {last ? (
        <div className="jx-card jx-left jx-rise">
          <div className="jx-left__top"><small>Last night</small><span className="jx-pill jx-pill--plain">Aim {short(target)}</span></div>
          <b className="jx-huge">{hrs(last.ms)}</b>
          <small className="jx-left__sub">{time(last.bed.toISOString())} to {time(last.wake!.toISOString())}{last.quality && ` · ${last.quality}`}</small>
          <div className="jx-meter" role="progressbar" aria-label="Sleep against your aim" aria-valuenow={Math.round((last.ms / target) * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.min(100, (last.ms / target) * 100)}%` }} /></div>
        </div>
      ) : null}

      <button className="jx-btn jx-btn--primary jx-btn--block jx-logbtn" onClick={() => setEdit('new')}><IBed size={20} /> Log last night</button>

      {logged.length > 0 && (
        <div className="jx-card jx-rise" style={{ animationDelay: '30ms', marginTop: 12, padding: 16 }}>
          <div className="jx-left__top"><small>This week</small><small>Average <b>{hrs(avg)}</b></small></div>
          <div className="jx-bars">
            {week.map(w => (
              <div key={w.d.toDateString()} className={'jx-bars__col' + (w.today ? ' is-today' : '') + (w.ms ? '' : ' is-future')}>
                <i style={{ height: `${Math.max(6, (w.ms / top) * 100)}%` }} title={w.ms ? hrs(w.ms) : 'Not logged'} />
                <small>{w.d.toLocaleDateString('en', { weekday: 'narrow' })}</small>
              </div>
            ))}
          </div>
          <p className="jx-note">Your usual is bed at {hm12(p.bed_time)}, up at {hm12(p.wake_time)}. Change it in your profile.</p>
        </div>
      )}

      <div className="jx-sechead"><h2 className="jx-h3">Nights</h2></div>
      {nights.length ? (
        <div className="jx-card jx-list jx-rise" style={{ animationDelay: '50ms' }}>
          {nights.slice(0, 30).map(n => (
            <button key={n.i.id} className="jx-li" onClick={() => setEdit(n.i)}>
              <span className="jx-row__icon jx-tag--sleep"><IBed size={15} /></span>
              <span className="jx-li__txt">
                <b>{(n.wake ?? n.bed).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}</b>
                <small>{n.wake ? `${time(n.bed.toISOString())} to ${time(n.wake.toISOString())}` : `Bed at ${time(n.bed.toISOString())}`}{n.quality ? ` · ${n.quality}` : ''}</small>
              </span>
              <b className="jx-li__amt">{n.ms > 0 ? hrs(n.ms) : '—'}</b>
            </button>
          ))}
        </div>
      ) : (
        <Empty icon={<IBed size={20} />} title="No nights logged" text="Each morning, log when you slept and woke. Jaiye shows your week and how close you are to your aim." />
      )}

      {edit && <SleepSheet night={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={msg => { setEdit(null); api.toast(msg); }} />}
    </div>
  );
}

function SleepSheet({ night: item, onClose, onSaved }: { night: Item | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const p = useStore(s => s.profile)!;
  const n = item ? night(item) : null;
  const [bed, setBed] = useState(n ? hm(n.bed) : p.bed_time);
  const [wake, setWake] = useState(n?.wake ? hm(n.wake) : hm(new Date()) < p.wake_time ? hm(new Date()) : p.wake_time);
  const [quality, setQuality] = useState<string | undefined>(n?.quality);

  // the night ends on the morning you woke: that day (or the one already saved); bed is the evening before if it's later on the clock
  const wokeOn = n?.wake ?? new Date();
  const wakeAt = new Date(wokeOn); wakeAt.setHours(+wake.slice(0, 2), +wake.slice(3), 0, 0);
  const bedAt = new Date(wakeAt); bedAt.setHours(+bed.slice(0, 2), +bed.slice(3), 0, 0);
  if (bedAt >= wakeAt) bedAt.setDate(bedAt.getDate() - 1);
  const ms = wakeAt.getTime() - bedAt.getTime();

  async function save(close: () => void) {
    const data = { ...(item?.data ?? {}), wake: wakeAt.toISOString(), quality: quality ?? null };
    if (item) await updateItem(item.id, { at: bedAt.toISOString(), data });
    else await addItem({ kind: 'sleep', title: 'Sleep', at: bedAt.toISOString(), data, done: true });
    close(); setTimeout(() => onSaved(`${hrs(ms)} of sleep logged`), 170);
  }
  return (
    <Sheet title={item ? 'Edit night' : 'Last night'} onClose={onClose}>
      {close => (
        <>
          <div className="jx-twofield">
            <label className="jx-field jx-field--tight"><span>Went to bed</span><input type="time" value={bed} onChange={e => e.target.value && setBed(e.target.value)} /></label>
            <label className="jx-field jx-field--tight"><span>Woke up</span><input type="time" value={wake} onChange={e => e.target.value && setWake(e.target.value)} /></label>
          </div>
          <p className="jx-note jx-note--big">That's <b>{hrs(ms)}</b> of sleep.</p>
          <div className="jx-label">How did you sleep?</div>
          <div className="jx-chips">
            {QUALITY.map(q => <button key={q} className={'jx-kchip' + (quality === q ? ' is-on jx-tag--sleep' : '')} aria-pressed={quality === q} onClick={() => setQuality(x => x === q ? undefined : q)}>{q}</button>)}
          </div>
          <div className="jx-sheet__actions">
            {item && <button className="jx-btn jx-btn--danger" aria-label="Remove night" onClick={async () => { await removeItem(item.id); close(); setTimeout(() => onSaved('Night removed'), 170); }}><ITrash size={18} /></button>}
            <button className="jx-btn jx-btn--primary jx-btn--block" disabled={ms <= 0 || ms > 20 * 3600000} onClick={() => void save(close)}>{item ? 'Save' : 'Save night'}</button>
          </div>
        </>
      )}
    </Sheet>
  );
}
