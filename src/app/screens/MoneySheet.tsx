import { useEffect, useState } from 'react';
import { addItem, useStore } from '../store';
import { money, symbol } from '../format';
import { Portal } from '../ui/Portal';
import { IClose } from '../ui/icons';

export const CATEGORIES = ['Food', 'Transport', 'Bills', 'Data & airtime', 'Shopping', 'Fun', 'Salary', 'Other'] as const;
export type Category = typeof CATEGORIES[number];
const LAST = 'jaiye-last-cat';
const lastCat = (): Category => { try { const v = localStorage.getItem(LAST); return (CATEGORIES as readonly string[]).includes(v ?? '') ? v as Category : 'Food'; } catch { return 'Food'; } };

/** Quick money logging: opens straight on the number pad. */
export default function MoneySheet({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const currency = useStore(s => s.profile?.currency ?? 'NGN');
  const [digits, setDigits] = useState('');
  const [income, setIncome] = useState(false);
  const [cat, setCat] = useState<Category>(lastCat);
  const [note, setNote] = useState('');
  const [closing, setClosing] = useState(false);
  const amount = Number(digits || '0');

  const close = () => { setClosing(true); setTimeout(onClose, 160); };
  const press = (k: string) => setDigits(d => k === 'del' ? d.slice(0, -1) : k === '000' ? (d ? (d + '000').slice(0, 12) : d) : (d === '' && k === '0' ? d : (d + k).slice(0, 12)));
  const flip = (v: boolean) => { setIncome(v); if (v && cat !== 'Salary') setCat('Salary'); if (!v && cat === 'Salary') setCat(lastCat() === 'Salary' ? 'Food' : lastCat()); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') void save();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  async function save() {
    if (!amount) return;
    try { localStorage.setItem(LAST, cat); } catch { /* ignore */ }
    const signed = income ? amount : -amount;
    onSaved(`${income ? 'Income' : 'Spent'} ${money(amount, currency)} · ${cat}`);   // confirm first, save right after
    await addItem({ kind: 'money', title: note.trim() || cat, amount: signed, at: new Date().toISOString(), currency, data: { category: cat } });
  }

  return (
    <Portal><div className={'jx-sheet-wrap' + (closing ? ' is-closing' : '')} onClick={close}>
      <div className="jx-sheet jx-msheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="Log money">
        <div className="jx-sheet__grab" />
        <div className="jx-sheet__head">
          <span className="jx-seg jx-seg--lg">
            <button className={!income ? 'is-on' : ''} onClick={() => flip(false)}>Spent</button>
            <button className={income ? 'is-on' : ''} onClick={() => flip(true)}>Income</button>
          </span>
          <button className="jx-iconbtn jx-iconbtn--muted" aria-label="Close" onClick={close}><IClose size={16} /></button>
        </div>

        <div className={'jx-msheet__amt' + (income ? ' is-in' : '') + (amount ? '' : ' is-empty')} aria-live="polite">
          <i>{income ? '+' : '−'}{symbol(currency)}</i>{amount ? amount.toLocaleString('en') : '0'}
        </div>

        <div className="jx-msheet__cats" role="radiogroup" aria-label="Category">
          {CATEGORIES.map(c => (
            <button key={c} role="radio" aria-checked={cat === c} className={'jx-kchip' + (cat === c ? ' is-on jx-tag--money' : '')} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        <input className="jx-msheet__note" value={note} maxLength={120} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" aria-label="Note" />

        <div className="jx-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map(k => (
            <button key={k} type="button" onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k}>{k === 'del' ? '⌫' : k}</button>
          ))}
        </div>
        <button className="jx-btn jx-btn--primary jx-btn--block" disabled={!amount} onClick={save}>
          {amount ? `Save ${money(amount, currency)}` : 'Type an amount'}
        </button>
      </div>
    </div></Portal>
  );
}
