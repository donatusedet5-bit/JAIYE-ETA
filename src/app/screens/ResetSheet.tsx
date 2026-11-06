import { useState } from 'react';
import { resetData } from '../store';
import { Sheet } from '../ui/Sheet';
import { ICheck } from '../ui/icons';

const OPTIONS = [
  { id: 'entries', title: 'Clear my entries', text: 'Deletes all your money, bills, goals, tasks, meals, sleep, habits, journal and Locker notes. Your name, photo and settings stay.' },
  { id: 'all', title: 'Start over', text: 'Clears everything above plus your setup and PIN. You set Jaiye up again. Your account stays.' },
] as const;

/** Reset from Settings: pick how much, type RESET, done. */
export default function ResetSheet({ onClose, onDone }: { onClose: () => void; onDone: (everything: boolean) => void }) {
  const [pick, setPick] = useState<'entries' | 'all'>('entries');
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ok = word.trim().toUpperCase() === 'RESET';

  async function go(close: () => void) {
    if (!ok || busy) return;
    setBusy(true); setErr('');
    try {
      await resetData(pick === 'all');
      close(); setTimeout(() => onDone(pick === 'all'), 170);
    } catch (e) {
      setErr(e instanceof Error && e.message === 'offline' ? 'You need an internet connection to reset.' : 'Couldn’t reset just now. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <Sheet title="Reset Jaiye" onClose={onClose} top>
      {close => (
        <>
          <div className="jx-resetopts" role="radiogroup" aria-label="What to reset">
            {OPTIONS.map(o => (
              <button key={o.id} type="button" role="radio" aria-checked={pick === o.id} className={'jx-resetopt' + (pick === o.id ? ' is-on' : '')} onClick={() => setPick(o.id)}>
                <span className="jx-pick__check">{pick === o.id && <ICheck size={12} />}</span>
                <b>{o.title}</b>
                <small>{o.text}</small>
              </button>
            ))}
          </div>
          <label className="jx-field jx-field--tight">
            <span>This can’t be undone. Type RESET to confirm.</span>
            <input value={word} onChange={e => setWord(e.target.value)} placeholder="RESET" autoCapitalize="characters" autoComplete="off" maxLength={10} />
          </label>
          {err && <p className="jx-msg jx-msg--err" role="alert">{err}</p>}
          <div className="jx-sheet__actions">
            <button className="jx-btn jx-btn--block jx-btn--destroy" disabled={!ok || busy} onClick={() => void go(close)}>
              {busy ? 'Resetting…' : pick === 'all' ? 'Delete everything and start over' : 'Delete all my entries'}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
