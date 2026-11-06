import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { ShellApi } from '../Shell';
import { greeting, sameDay, startOfWeek, time } from '../format';
import { useAppTheme } from '../ui/theme';
import { AppMark } from '../ui/Mark';
import { Amount, Avatar, Empty, KIND, Tag } from '../ui/bits';
import { IArrowUR, ICal, IMoon, IPlus, ISend, ISun, ITrendDown } from '../ui/icons';

export default function Home({ api }: { api: ShellApi }) {
  const p = useStore(s => s.profile)!;
  const items = useStore(s => s.items);
  const nav = useNavigate();
  const { theme, toggle } = useAppTheme();
  const [draft, setDraft] = useState('');
  const now = new Date();

  const today = items.filter(i => i.at && sameDay(new Date(i.at), now));
  const nTasks = items.filter(i => i.kind === 'task' && !i.done && (!i.at || new Date(i.at) <= endOfDay(now))).length;
  const nMeet = today.filter(i => i.kind === 'meeting').length;
  const sub = [nTasks && `${nTasks} task${nTasks > 1 ? 's' : ''}`, nMeet && `${nMeet} meeting${nMeet > 1 ? 's' : ''} today`].filter(Boolean).join(', ') || 'Nothing due today';

  const upNext = useMemo(() => items
    .filter(i => i.at && new Date(i.at).getTime() > Date.now() - 30 * 60000 && !i.done && i.kind !== 'money')
    .sort((a, b) => a.at!.localeCompare(b.at!)).slice(0, 3), [items]);

  const week = useMemo(() => {
    const start = startOfWeek(now).getTime(), prev = start - 7 * 864e5;
    const days = Array(7).fill(0); let total = 0, last = 0;
    items.forEach(i => {
      if (i.kind !== 'money' || !i.amount || i.amount > 0 || !i.at) return;
      const t = new Date(i.at).getTime(), v = -i.amount;
      if (t >= start) { days[Math.min(6, Math.floor((t - start) / 864e5))] += v; total += v; }
      else if (t >= prev) last += v;
    });
    return { days, total, last };
  }, [items]);   // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = p.name.split(' ')[0] || 'there';
  const send = () => { api.tell({ text: draft.trim() || undefined }); setDraft(''); };

  return (
    <>
      <header className="jx-hero">
        <div className="jx-hero__bar">
          <button className="jx-hero__me" onClick={api.me} aria-label="You and settings"><Avatar size={42} ring /></button>
          <div className="jx-hero__hi">
            <b>{greeting()}, {firstName}</b>
            <small>{sub}</small>
          </div>
          <button className="jx-glass" onClick={toggle} aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>{theme === 'dark' ? <ISun size={18} /> : <IMoon size={18} />}</button>
        </div>
        <div className="jx-card jx-capture jx-rise">
          <div className="jx-capture__top">
            <h1 className="jx-h2">Your <span className="jx-soft">day,</span><br />sorted.</h1>
            <AppMark size={48} />
          </div>
          <form className="jx-capture__bar" onSubmit={e => { e.preventDefault(); send(); }}>
            <button type="button" className="jx-capture__plus" aria-label="Add" onClick={() => api.tell()}><IPlus size={17} /></button>
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Tell Jaiye anything" aria-label="Tell Jaiye anything" maxLength={300} />
            <button className="jx-sendsm" aria-label="Tell Jaiye"><ISend size={16} /></button>
          </form>
        </div>
      </header>

      <div className="jx-content">
        {p.tracks.includes('money') && (
          <button className="jx-card jx-spent jx-rise" style={{ animationDelay: '60ms' }} onClick={() => nav('/app/money')}>
            <div className="jx-spent__top">
              <span><small>Spent this week</small><b className="jx-big"><Amount n={week.total} currency={p.currency} /></b></span>
              {week.last > 0 && week.total > 0 && (
                <span className={'jx-pill ' + (week.total <= week.last ? 'jx-pill--ok' : 'jx-pill--warn')}>
                  <ITrendDown size={12} /> {Math.round(Math.abs(1 - week.total / week.last) * 100)}% {week.total <= week.last ? 'less' : 'more'}
                </span>
              )}
            </div>
            <Bars days={week.days} />
          </button>
        )}

        <div className="jx-sechead"><h2 className="jx-h3">Up next</h2><button className="jx-link jx-link--sm" onClick={() => nav('/app/calendar')}><ICal size={13} /> Calendar</button></div>
        {upNext.length ? upNext.map((i, k) => (
          <button key={i.id} className="jx-card jx-next jx-rise" style={{ animationDelay: `${100 + k * 50}ms` }} onClick={() => api.edit(i)}>
            <div className="jx-next__top"><Tag kind={i.kind} /><span className="jx-next__go"><IArrowUR size={15} /></span></div>
            <b>{i.title}</b>
            <small>{(() => { const I = KIND[i.kind].Icon; return <I size={13} />; })()} {sameDay(new Date(i.at!), now) ? 'Today' : new Date(i.at!).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}, {time(i.at!)}</small>
          </button>
        )) : (
          <Empty icon={<ICal size={20} />} title="Nothing coming up" text="Tell Jaiye about a meeting, call or task and it shows up here." />
        )}
      </div>
    </>
  );
}

function Bars({ days }: { days: number[] }) {
  const max = Math.max(...days, 1);
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <div className="jx-bars" aria-hidden="true">
      {days.map((v, i) => (
        <span key={i} className={'jx-bars__col' + (i === todayIdx ? ' is-today' : '') + (i > todayIdx ? ' is-future' : '')}>
          <i style={{ height: `${Math.max(8, (v / max) * 100)}%`, animationDelay: `${i * 40}ms` }} />
          <small>{'MTWTFSS'[i]}</small>
        </span>
      ))}
    </div>
  );
}

function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
