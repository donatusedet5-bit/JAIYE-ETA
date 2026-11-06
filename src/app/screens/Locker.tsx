import { useEffect, useMemo, useState } from 'react';
import { addItem, removeItem, updateItem, useStore } from '../store';
import type { ShellApi } from '../Shell';
import type { Item } from '../types';
import { Empty, SubHead } from '../ui/bits';
import { ILock, IPlus, ITrash } from '../ui/icons';
import { Field, Sheet } from '../ui/Sheet';
import { checkPin, hasPin } from '../pin';
import { PinPad, PinSetup } from './PinLock';

const bodyOf = (i: Item) => (typeof i.data.text === 'string' ? i.data.text : '');

/** Private notes. Asks for the PIN every time you open it, and locks again when you leave the app. */
export default function Locker({ api }: { api: ShellApi }) {
  const [pin, setPin] = useState(hasPin());
  const [open, setOpen] = useState(false);
  const [setup, setSetup] = useState(false);
  const [shake, setShake] = useState(0);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const fn = () => { if (document.visibilityState === 'hidden') setOpen(false); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, []);

  async function done(v: string) {
    if (await checkPin(v)) { setOpen(true); setTries(0); }
    else { setShake(s => s + 1); setTries(t => t + 1); }
  }

  if (!pin) return (
    <div className="jx-content jx-content--top">
      <SubHead title="Locker" />
      <Empty icon={<ILock size={20} />} title="Set a PIN first" text="The Locker opens only with your PIN, so you need one before you can use it." />
      <button className="jx-btn jx-btn--primary jx-btn--block" style={{ marginTop: 14 }} onClick={() => setSetup(true)}>Set a PIN</button>
      {setup && <PinSetup onClose={() => setSetup(false)} onSaved={() => { setSetup(false); setPin(true); setOpen(true); api.toast('PIN set. Jaiye asks for it when you open the app.'); }} />}
    </div>
  );

  if (!open) return (
    <div className="jx-content jx-content--top">
      <SubHead title="Locker" />
      <div className="jx-card jx-lockgate jx-rise">
        <PinPad title="Enter your PIN" sub={tries ? 'That’s not it. Try again.' : 'Your Locker is private.'} onDone={done} shake={shake} />
      </div>
    </div>
  );

  return <Notes api={api} />;
}

function Notes({ api }: { api: ShellApi }) {
  const items = useStore(s => s.items);
  const [edit, setEdit] = useState<Item | 'new' | null>(null);
  const notes = useMemo(() => items.filter(i => i.kind === 'locker').sort((a, b) => b.updated_at.localeCompare(a.updated_at)), [items]);
  return (
    <div className="jx-content jx-content--top">
      <SubHead title="Locker" action={<button className="jx-roundbtn" aria-label="New private note" onClick={() => setEdit('new')}><IPlus size={19} /></button>} />
      <p className="jx-note jx-note--top">Notes here are only shown after your PIN. Don't keep bank PINs, card numbers or passwords here.</p>
      {notes.length ? (
        <div className="jx-card jx-list jx-rise">
          {notes.map(n => (
            <button key={n.id} className="jx-li" onClick={() => setEdit(n)}>
              <span className="jx-row__icon"><ILock size={15} /></span>
              <span className="jx-li__txt"><b>{n.title}</b><small>{bodyOf(n).split('\n')[0] || 'No details'}</small></span>
            </button>
          ))}
        </div>
      ) : (
        <Empty icon={<ILock size={20} />} title="Nothing in your Locker" text="Keep private things here: a gift list, a plan, notes you don't want on the main screens." />
      )}
      {edit && <NoteSheet note={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={msg => { setEdit(null); api.toast(msg); }} />}
    </div>
  );
}

function NoteSheet({ note, onClose, onSaved }: { note: Item | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [text, setText] = useState(note ? bodyOf(note) : '');
  async function save(close: () => void) {
    if (!title.trim()) return;
    const data = { ...(note?.data ?? {}), text: text.slice(0, 4000) };
    if (note) await updateItem(note.id, { title: title.trim(), data });
    else await addItem({ kind: 'locker', title: title.trim(), data });
    close(); setTimeout(() => onSaved('Saved to your Locker'), 170);
  }
  return (
    <Sheet title={note ? 'Private note' : 'New private note'} onClose={onClose} tall>
      {close => (
        <>
          <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Gift ideas for Mum" autoFocus={!note} />
          <textarea className="jx-textarea" value={text} onChange={e => setText(e.target.value)} maxLength={4000} placeholder="Details" aria-label="Details" />
          <div className="jx-sheet__actions">
            {note && <button className="jx-btn jx-btn--danger" aria-label="Delete note" onClick={async () => { await removeItem(note.id); close(); setTimeout(() => onSaved('Note deleted'), 170); }}><ITrash size={18} /></button>}
            <button className="jx-btn jx-btn--primary jx-btn--block" disabled={!title.trim()} onClick={() => void save(close)}>Save</button>
          </div>
        </>
      )}
    </Sheet>
  );
}
