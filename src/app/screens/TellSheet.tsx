import { useEffect, useRef, useState } from 'react';
import { addItem, removeItem, updateItem, useStore } from '../store';
import type { Item, Kind } from '../types';
import { guessAmount, guessIncome, guessKind } from '../guess';
import { CATS, capture, toLocal as toLocalAi, transcribe, type Capture, type Draft } from '../ai';
import { KIND } from '../ui/bits';
import { IClose, IMic, ISend, ISpark, ITrash } from '../ui/icons';
import { symbol, time } from '../format';
import { Portal } from '../ui/Portal';

export type TellInit = { text?: string; kind?: Kind; at?: Date; item?: Item };

const KINDS: Kind[] = ['note', 'money', 'meeting', 'call', 'task', 'meal', 'reminder', 'sleep'];
const TIMED: Kind[] = ['meeting', 'call', 'task', 'reminder', 'meal', 'sleep'];

const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function TellSheet({ init, onClose, onSaved }: { init: TellInit; onClose: () => void; onSaved: (msg: string) => void }) {
  const editing = init.item;
  const smart = !editing && !init.kind;      // plain "Tell Jaiye": AI capture with a review card
  const currency = useStore(s => s.profile?.currency ?? 'NGN');
  const [text, setText] = useState(editing?.title ?? init.text ?? '');
  const [kind, setKind] = useState<Kind>(editing?.kind ?? init.kind ?? (init.text ? guessKind(init.text) : 'note'));
  const [picked, setPicked] = useState(!!(editing || init.kind));
  const [amount, setAmount] = useState<number | null>(editing?.amount != null ? Math.abs(editing.amount) : init.text ? guessAmount(init.text) : null);
  const [income, setIncome] = useState(editing?.amount != null ? editing.amount > 0 : false);
  const [when, setWhen] = useState(editing?.at ? toLocal(new Date(editing.at)) : init.at ? toLocal(init.at) : '');
  const [closing, setClosing] = useState(false);
  const [found, setFound] = useState<Capture | null>(null);
  const [busy, setBusy] = useState<'' | 'reading' | 'listening' | 'hearing'>('');
  const [note, setNote] = useState('');
  const [voiced, setVoiced] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const mic = useRecorder();
  const micTapRef = useRef<() => void>(() => {});

  useEffect(() => { if (!editing) ta.current?.focus(); }, [editing]);
  useEffect(() => { if (smart && init.text?.trim()) void read(init.text); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (smart || picked || editing) return;
    setKind(guessKind(text));
    setIncome(guessIncome(text));
    const a = guessAmount(text); if (a) setAmount(a);
  }, [text, picked, editing, smart]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); });

  function close() { mic.cancel(); setClosing(true); setTimeout(onClose, 160); }

  async function read(t = text, force = false) {
    if (!t.trim() || (busy && !force)) return;
    setBusy('reading'); setNote('');
    const c = await capture(t, currency);
    setBusy('');
    if (!c.items.length) { setNote('Couldn’t find anything to file. Try adding a little more.'); return; }
    setFound(c);
    if (c.via === 'rules' && navigator.onLine) setNote('Filed with quick rules — check the details.');
    if (!navigator.onLine) setNote('You’re offline, so Jaiye used quick rules. Check the details.');
  }

  async function micTap() {
    if (mic.recording()) {
      setBusy('hearing');
      try {
        const blob = await mic.stop();
        const heard = blob ? await transcribe(blob) : '';
        setBusy('');
        if (!heard) { setNote('Didn’t catch that. Try again a little closer to the phone.'); return; }
        const next = (text.trim() ? text.trim() + ', ' : '') + heard;
        setText(next); setVoiced(true);
        await read(next, true);
      } catch {
        setBusy(''); setNote('Voice needs a connection right now. You can type instead.');
      }
      return;
    }
    if (!navigator.onLine) { setNote('Voice needs a connection. You can type instead.'); return; }
    setNote('');
    const ok = await mic.start(() => micTapRef.current());
    if (ok) setBusy('listening');
    else setNote('Allow the microphone for Jaiye in your phone settings, or type instead.');
  }

  micTapRef.current = () => { void micTap(); };

  async function saveAll() {
    if (!found) return;
    const nowIso = new Date().toISOString();
    for (const d of found.items) {
      const money = d.kind === 'money';
      await addItem({
        kind: d.kind, title: d.title.trim() || 'Note', currency,
        amount: money && d.amount ? (d.income ? d.amount : -d.amount) : null,
        at: d.when ? new Date(d.when).toISOString() : money ? nowIso : null,
        raw: text.trim(), source: voiced ? 'voice' : 'typed',
        data: { via: found.via, ...(money && d.category ? { category: d.category } : {}) },
      });
    }
    const n = found.items.length;
    onSaved(n === 1 ? `Filed under ${KIND[found.items[0].kind].label}` : `Filed ${n} things`);
  }

  async function save() {
    const title = text.trim();
    if (!title) return;
    const at = TIMED.includes(kind) && when ? new Date(when).toISOString() : kind === 'money' ? (editing?.at ?? new Date().toISOString()) : (when ? new Date(when).toISOString() : null);
    const amt = kind === 'money' && amount ? (income ? amount : -amount) : null;
    if (editing) {
      await updateItem(editing.id, { title, kind, amount: amt, at });
      onSaved('Saved');
    } else {
      await addItem({ title, kind, amount: amt, at, raw: title, currency });
      onSaved(`Filed under ${KIND[kind].label}`);
    }
  }

  async function del() {
    if (!editing) return;
    await removeItem(editing.id);
    onSaved('Deleted');
  }

  const setDraft = (i: number, patch: Partial<Draft>) => setFound(f => f && { ...f, items: f.items.map((d, k) => (k === i ? { ...d, ...patch } : d)) });
  const dropDraft = (i: number) => setFound(f => (f && f.items.length > 1 ? { ...f, items: f.items.filter((_, k) => k !== i) } : null));

  return (
    <Portal><div className={'jx-sheet-wrap' + (closing ? ' is-closing' : '')} onClick={close}>
      <div className="jx-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={editing ? 'Edit' : 'Tell Jaiye'}>
        <div className="jx-sheet__grab" />
        <div className="jx-sheet__head">
          <h2 className="jx-h3">{editing ? 'Edit' : 'Tell Jaiye'}</h2>
          <button className="jx-iconbtn jx-iconbtn--muted" aria-label="Close" onClick={close}><IClose size={16} /></button>
        </div>

        {!(smart && found) && (
          <div className={'jx-tellbox' + (busy === 'listening' ? ' is-listening' : '')}>
            <textarea ref={ta} rows={3} value={text} maxLength={300} readOnly={busy === 'listening' || busy === 'hearing'}
              placeholder={busy === 'listening' ? 'Listening…' : 'Lunch with Tolu tomorrow 1pm, paid 8k for Bolt…'}
              onChange={e => { setText(e.target.value); setNote(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void (smart ? read() : save()); } }} />
            <div className="jx-tellbox__row">
              {smart ? (
                <button type="button" className={'jx-mic' + (busy === 'listening' ? ' is-on' : '')} onClick={micTap} disabled={busy === 'reading' || busy === 'hearing' || !mic.supported}
                  aria-label={busy === 'listening' ? 'Stop and use what I said' : 'Speak instead'}>
                  <IMic size={16} />{busy === 'listening' && <span>{mic.seconds}s · tap to stop</span>}
                </button>
              ) : <span className="jx-say__spark"><ISpark size={13} /></span>}
              {busy === 'reading' || busy === 'hearing'
                ? <span className="jx-reading"><i /><i /><i />{busy === 'hearing' ? 'Writing it down' : 'Reading'}</span>
                : <button className="jx-sendsm" aria-label={smart ? 'File it' : 'Save'} disabled={!text.trim() || busy === 'listening'} onClick={() => (smart ? read() : save())}><ISend size={16} /></button>}
            </div>
          </div>
        )}

        {note && <p className="jx-note jx-note--tell" role="status">{note}</p>}

        {smart && found && (
          <div className="jx-found">
            <p className="jx-label"><ISpark size={12} /> Found {found.items.length} {found.items.length === 1 ? 'thing' : 'things'}</p>
            <p className="jx-found__said">“{text.trim()}”</p>
            {found.items.map((d, i) => (
              <div key={i} className="jx-card jx-found__item" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="jx-found__top">
                  <span className={`jx-found__kind jx-tag--${KIND[d.kind].tag}`}>
                    <select value={d.kind} onChange={e => setDraft(i, { kind: e.target.value as Kind })} aria-label="Type">
                      {KINDS.concat(d.kind === 'habit' ? ['habit'] : []).map(k => <option key={k} value={k}>{KIND[k].label}</option>)}
                    </select>
                  </span>
                  <button className="jx-found__x" aria-label={`Remove ${d.title}`} onClick={() => dropDraft(i)}><IClose size={13} /></button>
                </div>
                <input className="jx-found__title" value={d.title} maxLength={120} onChange={e => setDraft(i, { title: e.target.value })} aria-label="Title" />
                {d.kind === 'money' && (
                  <div className="jx-found__row">
                    <span className="jx-amount"><i>{symbol(currency)}</i><input inputMode="numeric" placeholder="0" aria-label="Amount"
                      value={d.amount ? d.amount.toLocaleString('en') : ''} onChange={e => { const n = Number(e.target.value.replace(/[^\d]/g, '')); setDraft(i, { amount: n ? Math.min(n, 1e12) : null }); }} /></span>
                    <span className="jx-seg">
                      <button className={!d.income ? 'is-on' : ''} onClick={() => setDraft(i, { income: false })}>Spent</button>
                      <button className={d.income ? 'is-on' : ''} onClick={() => setDraft(i, { income: true, category: d.category ?? 'Salary' })}>Income</button>
                    </span>
                  </div>
                )}
                {d.kind === 'money' && (
                  <div className="jx-found__cats" role="radiogroup" aria-label="Category">
                    {CATS.map(c => <button key={c} role="radio" aria-checked={d.category === c} className={'jx-mini' + (d.category === c ? ' is-on' : '')} onClick={() => setDraft(i, { category: c })}>{c}</button>)}
                  </div>
                )}
                {TIMED.includes(d.kind) && (
                  <div className="jx-found__row">
                    <span className="jx-found__when">{d.when ? whenLabel(d.when) : 'No time'}</span>
                    <input type="datetime-local" value={d.when ?? ''} onChange={e => setDraft(i, { when: e.target.value || null })} aria-label="When" />
                  </div>
                )}
              </div>
            ))}
            <div className="jx-sheet__actions">
              <button className="jx-btn jx-btn--primary" onClick={saveAll}>{found.items.length === 1 ? 'Save it' : `Save all ${found.items.length}`}</button>
              <button className="jx-btn jx-btn--ghost" onClick={() => { setFound(null); setNote(''); setTimeout(() => ta.current?.focus(), 0); }}>Edit</button>
            </div>
          </div>
        )}

        {!smart && (
          <>
            <p className="jx-label"><ISpark size={12} /> {picked || editing ? 'Filed as' : 'Looks like'}</p>
            <div className="jx-chips" role="radiogroup" aria-label="Type">
              {KINDS.map(k => (
                <button key={k} role="radio" aria-checked={kind === k} className={'jx-kchip' + (kind === k ? ` is-on jx-tag--${KIND[k].tag}` : '')} onClick={() => { setKind(k); setPicked(true); }}>{KIND[k].label}</button>
              ))}
            </div>

            {kind === 'money' && (
              <div className="jx-group jx-rise">
                <div className="jx-row">
                  <span className="jx-row__label">Amount</span>
                  <span className="jx-row__val"><span className="jx-amount"><i>{symbol(currency)}</i><input inputMode="numeric" placeholder="0" aria-label="Amount"
                    value={amount ? amount.toLocaleString('en') : ''} onChange={e => { const n = Number(e.target.value.replace(/[^\d]/g, '')); setAmount(n ? Math.min(n, 1e12) : null); setPicked(true); }} /></span></span>
                </div>
                <div className="jx-row">
                  <span className="jx-row__label">Type</span>
                  <span className="jx-row__val"><span className="jx-seg">
                    <button className={!income ? 'is-on' : ''} onClick={() => setIncome(false)}>Spent</button>
                    <button className={income ? 'is-on' : ''} onClick={() => setIncome(true)}>Income</button>
                  </span></span>
                </div>
              </div>
            )}
            {TIMED.includes(kind) && (
              <div className="jx-group jx-rise">
                <div className="jx-row">
                  <span className="jx-row__label">When</span>
                  <span className="jx-row__val"><input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} aria-label="When" /></span>
                </div>
              </div>
            )}

            <div className="jx-sheet__actions">
              <button className="jx-btn jx-btn--primary" disabled={!text.trim()} onClick={save}>{editing ? 'Save' : 'Save it'}</button>
              {editing && <button className="jx-btn jx-btn--ghost jx-btn--danger" onClick={del} aria-label="Delete"><ITrash size={17} /></button>}
            </div>
          </>
        )}
      </div>
    </div></Portal>
  );
}

function whenLabel(local: string) {
  const d = new Date(local), today = toLocalAi(new Date()).slice(0, 10), tmr = toLocalAi(new Date(Date.now() + 864e5)).slice(0, 10);
  const day = local.slice(0, 10) === today ? 'Today' : local.slice(0, 10) === tmr ? 'Tomorrow' : d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${time(d.toISOString())}`;
}

/** Microphone recording that works on iPhone (audio/mp4) and Android/desktop (webm). */
function useRecorder() {
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const [seconds, setSeconds] = useState(0);
  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

  async function start(onLimit: () => void) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks.current = [];
      r.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      r.start(250);
      rec.current = r;
      setSeconds(0);
      const t0 = Date.now();
      timer.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        setSeconds(s);
        if (s >= 60) onLimit();
      }, 250);
      return true;
    } catch { return false; }
  }

  function stop(): Promise<Blob | null> {
    clearInterval(timer.current);
    const r = rec.current; rec.current = null;
    if (!r) return Promise.resolve(null);
    return new Promise(res => {
      r.onstop = () => {
        r.stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
        res(blob.size > 1200 ? blob : null);
      };
      r.stop();
    });
  }

  function cancel() {
    clearInterval(timer.current);
    const r = rec.current; rec.current = null;
    if (r) { r.onstop = () => r.stream.getTracks().forEach(t => t.stop()); try { r.stop(); } catch { /* already stopped */ } }
  }

  useEffect(() => () => cancel(), []);   // eslint-disable-line react-hooks/exhaustive-deps
  return { start, stop, cancel, seconds, supported, recording: () => rec.current !== null };
}
