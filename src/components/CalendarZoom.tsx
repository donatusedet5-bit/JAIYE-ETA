import { useEffect, useState } from 'react';

type Level = 'month' | 'week' | 'day';
const ORDER: Level[] = ['month', 'week', 'day'];
const COL: Record<string, string> = { money: 'var(--chart-1)', meals: 'var(--chart-2)', tasks: 'var(--chart-3)', call: 'var(--chart-4)', meeting: '#8B6CF0' };
const MARKS: Record<number, string[]> = { 3: ['money'], 5: ['meeting', 'money'], 6: ['meeting'], 8: ['meals'], 10: ['tasks'], 12: ['call'], 15: ['meals'], 17: ['meeting'], 19: ['tasks'], 22: ['meals'], 25: ['money'], 26: ['meeting', 'call'], 29: ['meals'], 30: ['money'] };

/** Pinch-zoom teaser: the calendar zooms Month → Week → Day on a loop. Tap to zoom yourself. */
export function CalendarZoom() {
  const [lvl, setLvl] = useState<Level>('month');
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => setLvl(ORDER[(ORDER.indexOf(lvl) + 1) % 3]), 2600);
    return () => clearTimeout(t);
  }, [lvl, auto]);
  const pick = (l: Level) => { setAuto(false); setLvl(l); };
  const days = Array.from({ length: 42 }, (_, i) => i - 5); // Mon-first grid; 1 Nov 2026 is a Sunday

  return (
    <div className="cz">
      <div className="cz__seg" role="tablist" aria-label="Zoom level">
        {ORDER.map(l => <button key={l} role="tab" aria-selected={lvl === l} className={lvl === l ? 'is-on' : ''} onClick={() => pick(l)}>{l[0].toUpperCase() + l.slice(1)}</button>)}
      </div>
      <div className="cz__stage" data-level={lvl}>
        <div className="cz__month">
          {['M','T','W','T','F','S','S'].map((d, i) => <span key={'h' + i} className="cz__dow">{d}</span>)}
          {days.map(d => (
            <span key={d} className={'cz__d' + (d === 5 ? ' is-today' : '') + (d < 1 || d > 30 ? ' is-out' : '')}>
              <i>{d < 1 ? 31 + d : d > 30 ? d - 30 : d}</i>
              <em>{(MARKS[d] || []).map((k, j) => <b key={j} style={{ background: COL[k] }} />)}</em>
            </span>
          ))}
        </div>
        <div className="cz__week">
          {[2,3,4,5,6,7,8].map(d => (
            <div key={d} className={'cz__wd' + (d === 5 ? ' is-today' : '')}>
              <span>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d - 2]}</span><b>{d}</b>
              {d === 5 && <><i style={{ top: '30%', height: '14%', background: 'var(--tag-meeting-bg)', borderColor: '#8B6CF0' }} /><i style={{ top: '58%', height: '10%', background: 'var(--tag-call-bg)', borderColor: 'var(--chart-4)' }} /></>}
              {d === 3 && <i style={{ top: '40%', height: '12%', background: 'var(--tag-money-bg)', borderColor: 'var(--chart-1)' }} />}
              {d === 6 && <i style={{ top: '22%', height: '18%', background: 'var(--tag-meeting-bg)', borderColor: '#8B6CF0' }} />}
              {d === 8 && <i style={{ top: '18%', height: '16%', background: 'var(--tag-meals-bg)', borderColor: 'var(--chart-2)' }} />}
            </div>
          ))}
        </div>
        <div className="cz__day">
          {[['9:30', 'Team standup', 'meeting'], ['1:00', 'Lunch, efo riro', 'meals'], ['3:00', 'Design review', 'meeting'], ['5:30', 'Call Ada', 'call'], ['8:00', 'Pay electricity', 'tasks']].map(([t, n, k]) => (
            <div key={t} className="cz__item"><span>{t}</span><div><b>{n}</b><span className={'tag ' + k}>{k[0].toUpperCase() + k.slice(1)}</span></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
