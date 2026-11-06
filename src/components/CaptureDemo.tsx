import { useEffect, useRef, useState } from 'react';
import { Send, Sparkle } from './Icons';
import { useCurrency } from '../currency';

const SENTENCE = 'Lunch with Tolu tomorrow 1pm, paid 8k for Bolt';
// spans that Jaiye "recognises" as the text is typed
const HITS = [
  { from: 0, to: 15, cls: 'hit-blue' },
  { from: 16, to: 28, cls: 'hit-blue' },
  { from: 30, to: SENTENCE.length, cls: 'hit-coral' },
];

/** Looping demo: a sentence types itself, recognised parts light up, then two filled-in cards slide in. */
export function CaptureDemo() {
  const { money } = useCurrency();
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'found' | 'hold'>('typing');
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(SENTENCE.length); setPhase('found'); return; }
    let t: number;
    if (phase === 'typing') {
      if (n < SENTENCE.length) t = window.setTimeout(() => setN(n + 1), n === 0 ? 500 : 38);
      else t = window.setTimeout(() => setPhase('found'), 350);
    } else if (phase === 'found') {
      t = window.setTimeout(() => setPhase('hold'), 3800);
    } else {
      t = window.setTimeout(() => { setN(0); setPhase('typing'); }, 400);
    }
    return () => clearTimeout(t);
  }, [n, phase, visible]);

  const parts: { text: string; cls?: string }[] = [];
  let i = 0;
  for (const h of HITS) {
    if (i < h.from) parts.push({ text: SENTENCE.slice(i, Math.min(h.from, n)) });
    if (n > h.from) parts.push({ text: SENTENCE.slice(h.from, Math.min(h.to, n)), cls: n >= h.to ? h.cls : undefined });
    i = h.to;
  }
  const found = phase !== 'typing';

  return (
    <div className="demo" ref={ref}>
      <div className="demo__sheet">
        <div className="demo__head"><b>Tell Jaiye</b></div>
        <div className={'demo__input' + (found ? ' is-done' : '')}>
          <p aria-live="off">{parts.map((p, k) => <span key={k} className={p.cls}>{p.text}</span>)}<span className="caret" /></p>
          <div className="demo__tools">
            <span className="demo__spark"><Sparkle width={14} height={14} /></span>
            <span className="demo__send"><Send width={14} height={14} /></span>
          </div>
        </div>
        <div className={'demo__found' + (found ? ' is-on' : '')}><Sparkle width={13} height={13} /> Found 2 things</div>
        <div className={'demo__card' + (found ? ' is-on' : '')} style={{ transitionDelay: '80ms' }}>
          <div className="demo__row"><span className="tag meeting">Meeting</span><small>Google Calendar</small></div>
          <div className="demo__kv"><span>Lunch with Tolu</span><b>Fri, 1:00 PM</b></div>
        </div>
        <div className={'demo__card' + (found ? ' is-on' : '')} style={{ transitionDelay: '200ms' }}>
          <div className="demo__row"><span className="tag money">Money</span><small>Expense</small></div>
          <div className="demo__kv"><span>Transport, Bolt</span><b>{money(8000)}</b></div>
        </div>
      </div>
    </div>
  );
}
