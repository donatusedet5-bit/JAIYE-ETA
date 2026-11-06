import { useMemo } from 'react';
import { useStore } from '../store';
import type { ShellApi } from '../Shell';
import { Amount, Count, Empty, SyncLine } from '../ui/bits';
import { IPlus, ISpark, IWallet } from '../ui/icons';
import { money } from '../format';

export default function Money({ api }: { api: ShellApi }) {
  const p = useStore(s => s.profile)!;
  const items = useStore(s => s.items);
  const hide = !!p.prefs.hideAmounts;

  const m = useMemo(() => {
    const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const list = items.filter(i => i.kind === 'money' && i.amount != null && i.at && new Date(i.at).getTime() >= start)
      .sort((a, b) => b.at!.localeCompare(a.at!));
    let spent = 0, income = 0;
    list.forEach(i => { if (i.amount! < 0) spent -= i.amount!; else income += i.amount!; });
    return { list, spent, income, saved: Math.max(0, income - spent) };
  }, [items]);

  const budget = p.monthly_budget ?? 0;
  const left = budget - m.spent;
  const pct = budget ? Math.min(100, (m.spent / budget) * 100) : 0;
  const day = new Date().getDate(), days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const onTrack = budget ? m.spent / budget <= day / days + 0.02 : true;

  return (
    <div className="jx-content jx-content--top">
      <div className="jx-titlebar">
        <div><h1 className="jx-title">Money</h1><SyncLine /></div>
        <button className="jx-roundbtn" aria-label="Write it out in Tell Jaiye" onClick={() => api.tell({ kind: 'money' })}><ISpark size={18} /></button>
      </div>

      <div className="jx-card jx-left jx-rise">
        <div className="jx-left__top"><small>{budget ? 'Left to spend' : 'Spent'}</small><span className="jx-pill jx-pill--plain">This month</span></div>
        <b className="jx-huge">{hide ? <Amount n={budget ? left : m.spent} currency={p.currency} /> : <Count value={budget ? left : m.spent} render={n => money(n, p.currency)} />}</b>
        {budget > 0 && (
          <>
            <small className="jx-left__sub">of {hide ? '•••' : money(budget, p.currency)} {m.spent > 0 && <em className={onTrack ? 'ok' : 'warn'}>{onTrack ? 'on track' : 'ahead of pace'}</em>}</small>
            <div className="jx-meter" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used"><i style={{ width: `${pct}%` }} className={left < 0 ? 'over' : ''} /></div>
          </>
        )}
      </div>

      <button className="jx-btn jx-btn--primary jx-btn--block jx-logbtn" onClick={api.money}><IPlus size={20} /> Log money</button>

      <div className="jx-boxes">
        {[{ k: 'Income', v: m.income, c: 'ok' }, { k: 'Spent', v: m.spent, c: '' }, { k: 'Saved', v: m.saved, c: 'blue' }].map((b, i) => (
          <div key={b.k} className={'jx-card jx-box jx-rise jx-box--' + (b.c || 'plain')} style={{ animationDelay: `${i * 25}ms` }}>
            <small>{b.k}</small>
            <b><Amount n={b.v} currency={p.currency} /></b>
          </div>
        ))}
      </div>

      <div className="jx-sechead"><h2 className="jx-h3">Logged this month</h2></div>
      {m.list.length ? (
        <div className="jx-card jx-list jx-rise" style={{ animationDelay: '60ms' }}>
          {m.list.map(i => (
            <button key={i.id} className="jx-li" onClick={() => api.edit(i)}>
              <span className="jx-row__icon">{i.source === 'typed' ? <ISpark size={15} /> : <IWallet size={15} />}</span>
              <span className="jx-li__txt"><b>{i.title}</b><small>{typeof i.data.category === 'string' && i.data.category !== i.title ? i.data.category + ' · ' : ''}{new Date(i.at!).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</small></span>
              <Amount n={i.amount!} currency={p.currency} sign className={'jx-li__amt' + (i.amount! > 0 ? ' is-in' : '')} />
            </button>
          ))}
        </div>
      ) : (
        <Empty icon={<IWallet size={20} />} title="No money logged yet" text="Try “Bolt to Yaba 3.2k” or “Salary 450k” in Tell Jaiye." />
      )}
    </div>
  );
}
