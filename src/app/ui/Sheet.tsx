import { useEffect, useState, type ReactNode } from 'react';
import { Portal } from './Portal';
import { IClose } from './icons';

/** Plain bottom sheet with a title and a close button. `children` gets a close() so a save can animate out. */
export function Sheet({ title, onClose, children, tall, top }: { title: string; onClose: () => void; children: (close: () => void) => ReactNode; tall?: boolean; top?: boolean }) {
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(onClose, 160); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  return (
    <Portal><div className={'jx-sheet-wrap' + (top ? ' jx-sheet-wrap--top' : '') + (closing ? ' is-closing' : '')} onClick={e => { e.stopPropagation(); close(); }}>
      <div className={'jx-sheet' + (tall ? ' jx-sheet--tall' : '')} onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="jx-sheet__grab" />
        <div className="jx-sheet__head">
          <h2 className="jx-h3">{title}</h2>
          <button className="jx-iconbtn jx-iconbtn--muted" aria-label="Close" onClick={close}><IClose size={16} /></button>
        </div>
        {children(close)}
      </div>
    </div></Portal>
  );
}

/** Text or number field in the app's field style. */
export function Field({ label, value, onChange, type = 'text', placeholder, inputMode, max, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
  inputMode?: 'numeric' | 'decimal' | 'text'; max?: number; autoFocus?: boolean;
}) {
  return (
    <label className="jx-field jx-field--tight">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} inputMode={inputMode} maxLength={max ?? 80} autoFocus={autoFocus} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

/** Digits only, for amounts. "3.2k" style is for Tell Jaiye; here we keep it simple. */
export const digits = (v: string) => v.replace(/[^\d]/g, '').slice(0, 12);
export const num = (v: string) => Number(digits(v) || '0');
export const commas = (v: string) => { const d = digits(v); return d ? Number(d).toLocaleString('en') : ''; };
