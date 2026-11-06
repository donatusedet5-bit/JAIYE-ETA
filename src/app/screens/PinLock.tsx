import { useEffect, useState } from 'react';
import { checkPin, setPin } from '../pin';
import { signOutAndWipe } from '../store';
import { Avatar } from '../ui/bits';
import { IClose } from '../ui/icons';
import { Portal } from '../ui/Portal';

const LEN = 4;

export function PinPad({ title, sub, onDone, shake }: { title: string; sub?: string; onDone: (pin: string) => void; shake?: number }) {
  const [v, setV] = useState('');
  useEffect(() => { if (shake) setV(''); }, [shake]);
  useEffect(() => {
    if (v.length === LEN) { const t = setTimeout(() => { onDone(v); setV(''); }, 120); return () => clearTimeout(t); }
  }, [v, onDone]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setV(x => (x + e.key).slice(0, LEN));
      if (e.key === 'Backspace') setV(x => x.slice(0, -1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <div className="jx-pin">
      <h2 className="jx-h2">{title}</h2>
      {sub && <p className="jx-sub">{sub}</p>}
      <div className={'jx-pin__dots' + (shake ? ' is-shake' : '')} key={shake} aria-label={`${v.length} of ${LEN} digits`}>
        {Array.from({ length: LEN }, (_, i) => <i key={i} className={i < v.length ? 'on' : ''} />)}
      </div>
      <div className="jx-pin__keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => k === '' ? <span key={i} /> : (
          <button key={i} type="button" aria-label={k === '⌫' ? 'Delete' : k} onClick={() => setV(x => k === '⌫' ? x.slice(0, -1) : (x + k).slice(0, LEN))}>{k}</button>
        ))}
      </div>
    </div>
  );
}

export default function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [shake, setShake] = useState(0);
  const [tries, setTries] = useState(0);
  async function done(pin: string) {
    if (await checkPin(pin)) onUnlock();
    else { setShake(s => s + 1); setTries(t => t + 1); }
  }
  return (
    <div className="jx-screen jx-lock">
      <div className="jx-lock__top"><Avatar size={64} /></div>
      <PinPad title="Enter your PIN" sub={tries ? 'That’s not it. Try again.' : undefined} onDone={done} shake={shake} />
      {tries >= 3 && (
        <button className="jx-link" onClick={() => { if (confirm('Forgot your PIN? You’ll log in again with your email and password. Anything not yet synced on this phone will be lost.')) void signOutAndWipe(); }}>
          Forgot PIN? Log in again
        </button>
      )}
    </div>
  );
}

export function PinSetup({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [first, setFirst] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  async function done(pin: string) {
    if (!first) { setFirst(pin); return; }
    if (pin === first) { await setPin(pin); onSaved(); }
    else { setFirst(null); setShake(s => s + 1); }
  }
  return (
    <Portal><div className="jx-sheet-wrap jx-sheet-wrap--top" onClick={e => { e.stopPropagation(); onClose(); }}>
      <div className="jx-sheet jx-sheet--tall" onClick={e => e.stopPropagation()} role="dialog" aria-label="Set a PIN">
        <div className="jx-sheet__grab" />
        <div className="jx-sheet__head"><span /><button className="jx-iconbtn jx-iconbtn--muted" aria-label="Close" onClick={onClose}><IClose size={16} /></button></div>
        <PinPad key={first ? 'b' : 'a'} title={first ? 'Type it again' : 'Pick a 4-digit PIN'} sub={shake && !first ? 'They didn’t match. Start again.' : 'Jaiye asks for it when you open the app.'} onDone={done} shake={shake} />
      </div>
    </div></Portal>
  );
}
