import { useEffect, useRef, useState } from 'react';
import { addItem, removeItem, updateItem, useStore } from '../store';
import type { Item, Kind } from '../types';
import { guessAmount, guessIncome, guessKind } from '../guess';
import { KIND } from '../ui/bits';
import { IClose, ISend, ISpark, ITrash } from '../ui/icons';
import { symbol } from '../format';
import { Portal } from '../ui/Portal';

export type TellInit = { text?: string; kind?: Kind; at?: Date; item?: Item };

const KINDS: Kind[] = ['note', 'money', 'meeting', 'call', 'task', 'meal', 'reminder', 'sleep'];
const TIMED: Kind[] = ['meeting', 'call', 'task', 'reminder', 'meal', 'sleep'];

const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function TellSheet({ init, onClose, onSaved }: { init: TellInit; onClose: () => void; onSaved: (msg: string) => void }) {
  const editing = init.item;
  const currency = useStore(s => s.profile?.currency ?? 'NGN');
  const [text, setText] = useState(editing?.title ?? init.text ?? '');
  const [kind, setKind] = useState<Kind>(editing?.kind ?? init.kind ?? (init.text ? guessKind(init.text) : 'note'));
  const [picked, setPicked] = useState(!!(editing || init.kind));
  const [amount, setAmount] = useState<number | null>(editing?.amount != null ? Math.abs(editing.amount) : init.text ? guessAmount(init.text) : null);
  const [income, setIncome] = useState(editing?.amount != null ? editing.amount > 0 : false);
  const [when, setWhen] = useState(editing?.at ? toLocal(new Date(editing.at)) : init.at ? toLocal(init.at) : '');
  const [closing, setClosing] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) ta.current?.focus(); }, [editing]);
  useEffect(() => {
    if (picked || editing) return;
    setKind(guessKind(text));
    setIncome(guessIncome(text));
    const a = guessAmount(text); if (a) setAmount(a);
  }, [text, picked, editing]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); });

  function close() { setClosing(true); setTimeout(onClose, 220); }

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

  return (
    <Portal><div className={'jx-sheet-wrap' + (closing ? ' is-closing' : '')} onClick={close}>
      <div className="jx-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={editing ? 'Edit' : 'Tell Jaiye'}>
        <div className="jx-sheet__grab" />
        <div className="jx-sheet__head">
          <h2 className="jx-h3">{editing ? 'Edit' : 'Tell Jaiye'}</h2>
          <button className="jx-iconbtn jx-iconbtn--muted" aria-label="Close" onClick={close}><IClose size={16} /></button>
        </div>
        <div className="jx-tellbox">
          <textarea ref={ta} rows={3} value={text} maxLength={300} placeholder="Lunch with Tolu tomorrow 1pm, paid 8k for Bolt…" onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void save(); } }} />
          <div className="jx-tellbox__row">
            <span className="jx-say__spark"><ISpark size={13} /></span>
            <button className="jx-sendsm" aria-label="Save" disabled={!text.trim()} onClick={save}><ISend size={16} /></button>
          </div>
        </div>

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
      </div>
    </div></Portal>
  );
}
