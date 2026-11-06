import { useMemo, useState } from 'react';
import { addItem, removeItem, saveProfile, updateItem, useStore } from '../store';
import type { ShellApi } from '../Shell';
import type { Item } from '../types';
import { Amount, Count, Empty, SyncLine } from '../ui/bits';
import { ICheck, IPlus, IReceipt, ISpark, ITarget, ITrash, IWallet } from '../ui/icons';
import { money, ordinal } from '../format';
import { CATEGORIES } from './MoneySheet';
import { Field, Sheet, commas, num } from '../ui/Sheet';

type Tab = 'overview' | 'bills' | 'goals';
const SPEND_CATS = CATEGORIES.filter(c => c !== 'Salary');
const CAT_COLOR: Record<string, string> = {
  Food: 'var(--tag-meals-fg)', Transport: 'var(--tag-call-fg)', Bills: 'var(--tag-tasks-fg)', 'Data & airtime': 'var(--tag-meeting-fg)',
  Shopping: 'var(--tag-reminder-fg)', Fun: 'var(--tag-sleep-fg)', Other: 'var(--text-soft)',
};
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const catOf = (i: Item) => (typeof i.data.category === 'string' && i.data.category) || 'Other';

export default function Money({ api }: { api: ShellApi }) {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <div className="jx-content jx-content--top">
      <div className="jx-titlebar">
        <div><h1 className="jx-title">Money</h1><SyncLine /></div>
        <button className="jx-roundbtn" aria-label="Write it out in Tell Jaiye" onClick={() => api.tell({ kind: 'money' })}><ISpark size={18} /></button>
      </div>
      <div className="jx-seg jx-seg--full" role="tablist">
        {([['overview', 'This month'], ['bills', 'Bills'], ['goals', 'Goals']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div key={tab} className="jx-fadein">
        {tab === 'overview' && <Overview api={api} />}
        {tab === 'bills' && <Bills api={api} />}
        {tab === 'goals' && <Goals api={api} />}
      </div>
    </div>
  );
}

/* ---------- this month ---------- */
function Overview({ api }: { api: ShellApi }) {
  const p = useStore(s => s.profile)!;
  const items = useStore(s => s.items);
  const hide = !!p.prefs.hideAmounts;
  const [budgets, setBudgets] = useState(false);

  const m = useMemo(() => {
    const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const list = items.filter(i => i.kind === 'money' && i.amount != null && i.at && new Date(i.at).getTime() >= start)
      .sort((a, b) => b.at!.localeCompare(a.at!));
    let spent = 0, income = 0;
    const byCat: Record<string, number> = {};
    list.forEach(i => {
      if (i.amount! < 0) { spent -= i.amount!; byCat[catOf(i)] = (byCat[catOf(i)] ?? 0) - i.amount!; }
      else income += i.amount!;
    });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return { list, spent, income, saved: Math.max(0, income - spent), cats };
  }, [items]);

  const caps = p.prefs.budgets ?? {};
  const budget = p.monthly_budget ?? 0;
  const left = budget - m.spent;
  const pct = budget ? Math.min(100, (m.spent / budget) * 100) : 0;
  const day = new Date().getDate(), days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const onTrack = budget ? m.spent / budget <= day / days + 0.02 : true;
  const hasIncome = m.income > 0;
  const balance = m.income - m.spent;
  const big = hasIncome ? balance : budget ? left : m.spent;
  const usedPct = hasIncome ? Math.min(100, (m.spent / m.income) * 100) : 0;
  const monthName = new Date().toLocaleDateString('en', { month: 'long' });
  const [income, setIncome] = useState(false);
  // categories with a limit but no spending yet still show, so the limit is visible
  const rows = [...m.cats, ...Object.keys(caps).filter(c => caps[c] > 0 && !m.cats.some(([k]) => k === c)).map(c => [c, 0] as [string, number])];

  return (
    <>
      <div className="jx-card jx-left jx-rise">
        <div className="jx-left__top">
          <small>{hasIncome ? 'Left this month' : budget ? 'Left to spend' : 'Spent'}</small>
          {hasIncome ? <button className="jx-pill jx-pill--plain jx-pill--btn" onClick={() => setIncome(true)}>Edit income</button> : <span className="jx-pill jx-pill--plain">This month</span>}
        </div>
        <b className={'jx-huge' + (hasIncome && balance < 0 ? ' is-neg' : '')}>{hide ? <Amount n={big} currency={p.currency} /> : <Count value={big} render={n => money(n, p.currency)} />}</b>
        {hasIncome ? (
          <>
            <small className="jx-left__sub">
              {balance < 0
                ? <em className="warn"><span>Spent <Amount n={-balance} currency={p.currency} /> more than came in</span></em>
                : <span><Amount n={m.income} currency={p.currency} /> in · <Amount n={m.spent} currency={p.currency} /> spent</span>}
            </small>
            <div className="jx-meter" role="progressbar" aria-valuenow={Math.round(usedPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Income spent"><i style={{ width: `${usedPct}%` }} className={balance < 0 ? 'over' : ''} /></div>
            {budget > 0 && <small className="jx-left__sub jx-left__sub--2">Budget: {left >= 0 ? <><Amount n={left} currency={p.currency} /> left of <Amount n={budget} currency={p.currency} /></> : <em className="warn">over by <Amount n={-left} currency={p.currency} /></em>}</small>}
          </>
        ) : budget > 0 ? (
          <>
            <small className="jx-left__sub">of {hide ? '•••' : money(budget, p.currency)} {m.spent > 0 && <em className={onTrack ? 'ok' : 'warn'}>{onTrack ? 'on track' : 'ahead of pace'}</em>}</small>
            <div className="jx-meter" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used"><i style={{ width: `${pct}%` }} className={left < 0 ? 'over' : ''} /></div>
          </>
        ) : null}
        {!hasIncome && <button className="jx-link jx-link--sm jx-left__cta" onClick={() => setIncome(true)}><IPlus size={15} /> Add your income for {monthName}</button>}
      </div>

      <button className="jx-btn jx-btn--primary jx-btn--block jx-logbtn" onClick={api.money}><IPlus size={20} /> Log money</button>

      <div className="jx-boxes">
        {[{ k: 'Income', v: m.income, c: 'ok', go: () => setIncome(true) }, { k: 'Spent', v: m.spent, c: '', go: api.money }, { k: 'Saved', v: m.saved, c: 'blue' }].map((b, i) => (
          <button key={b.k} type="button" disabled={!b.go} onClick={b.go} className={'jx-card jx-box jx-rise jx-box--' + (b.c || 'plain')} style={{ animationDelay: `${i * 25}ms` }} aria-label={b.k === 'Income' ? 'Income this month, tap to edit' : undefined}>
            <small>{b.k}{b.k === 'Income' && <em>Edit</em>}</small>
            <b><Amount n={b.v} currency={p.currency} /></b>
          </button>
        ))}
      </div>

      <div className="jx-sechead"><h2 className="jx-h3">Where it went</h2><button className="jx-link jx-link--sm" onClick={() => setBudgets(true)}>{Object.values(caps).some(v => v > 0) ? 'Edit limits' : 'Set limits'}</button></div>
      {rows.length ? (
        <div className="jx-card jx-where jx-rise" style={{ animationDelay: '40ms' }}>
          {m.spent > 0 && (
            <div className="jx-stackbar" aria-hidden="true">
              {m.cats.map(([c, v]) => <i key={c} style={{ flexGrow: v, background: CAT_COLOR[c] ?? 'var(--text-soft)' }} />)}
            </div>
          )}
          {rows.map(([c, v]) => {
            const cap = caps[c] ?? 0, over = cap > 0 && v > cap;
            return (
              <div key={c} className="jx-where__row">
                <span className="jx-where__dot" style={{ background: CAT_COLOR[c] ?? 'var(--text-soft)' }} />
                <span className="jx-where__txt">
                  <b>{c}</b>
                  <small className={over ? 'is-over' : ''}>
                    {cap > 0
                      ? (over ? <>Over by <Amount n={v - cap} currency={p.currency} /></> : <><Amount n={cap - v} currency={p.currency} /> left of <Amount n={cap} currency={p.currency} /></>)
                      : m.spent > 0 ? `${Math.round((v / m.spent) * 100)}% of spending` : 'Nothing yet'}
                  </small>
                  {cap > 0 && <span className="jx-meter jx-meter--thin"><i style={{ width: `${Math.min(100, (v / cap) * 100)}%` }} className={over ? 'over' : ''} /></span>}
                </span>
                <Amount n={v} currency={p.currency} className="jx-li__amt" />
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={<IWallet size={20} />} title="Nothing spent yet" text="Spending shows here by category: food, transport, data and the rest." />
      )}

      <div className="jx-sechead"><h2 className="jx-h3">Logged this month</h2></div>
      {m.list.length ? (
        <div className="jx-card jx-list jx-rise" style={{ animationDelay: '60ms' }}>
          {m.list.map(i => (
            <button key={i.id} className="jx-li" onClick={() => (i.data.monthIncome ? setIncome(true) : api.edit(i))}>
              <span className="jx-row__icon">{i.source === 'typed' ? <ISpark size={15} /> : <IWallet size={15} />}</span>
              <span className="jx-li__txt"><b>{i.title}</b><small>{catOf(i) !== i.title ? catOf(i) + ' · ' : ''}{new Date(i.at!).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</small></span>
              <Amount n={i.amount!} currency={p.currency} sign className={'jx-li__amt' + (i.amount! > 0 ? ' is-in' : '')} />
            </button>
          ))}
        </div>
      ) : (
        <Empty icon={<IWallet size={20} />} title="No money logged yet" text="Try “Bolt to Yaba 3.2k” or “Salary 450k” in Tell Jaiye." />
      )}

      {income && <IncomeSheet onClose={() => setIncome(false)} onSaved={msg => { setIncome(false); api.toast(msg); }} />}
      {budgets && <BudgetSheet onClose={() => setBudgets(false)} onSaved={() => { setBudgets(false); api.toast('Limits saved'); }} />}
    </>
  );
}

/** The month's income in one place. It's saved as one income entry for the month, so everything you spend comes off it. */
function IncomeSheet({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const p = useStore(s => s.profile)!;
  const items = useStore(s => s.items);
  const key = monthKey();
  const prevKey = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return monthKey(d); })();
  const mine = items.find(i => i.kind === 'money' && i.data.monthIncome === key);
  const last = items.find(i => i.kind === 'money' && i.data.monthIncome === prevKey);
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const other = items.filter(i => i.kind === 'money' && (i.amount ?? 0) > 0 && !i.data.monthIncome && i.at && new Date(i.at) >= start);
  const otherSum = other.reduce((a, i) => a + (i.amount ?? 0), 0);
  const [v, setV] = useState(mine?.amount ? commas(String(mine.amount)) : last?.amount ? commas(String(last.amount)) : '');
  const month = new Date().toLocaleDateString('en', { month: 'long' });

  async function save(close: () => void) {
    const n = num(v);
    if (mine && !n) await removeItem(mine.id);
    else if (mine) await updateItem(mine.id, { amount: n });
    else if (n) await addItem({ kind: 'money', title: `Income for ${month}`, amount: n, currency: p.currency, at: start.toISOString(), data: { category: 'Salary', monthIncome: key } });
    close(); setTimeout(() => onSaved(n ? `${month} income set to ${money(n, p.currency)}` : `${month} income cleared`), 170);
  }
  return (
    <Sheet title={`Income for ${month}`} onClose={onClose}>
      {close => (
        <>
          <Field label={`How much comes in this month (${p.currency})`} value={v} onChange={x => setV(commas(x))} inputMode="numeric" placeholder="e.g. 450,000" autoFocus />
          {!mine && last?.amount ? <p className="jx-note">Filled in from last month. Change it if this month is different.</p> : null}
          <p className="jx-note">Everything you log as spent comes off this. {otherSum > 0 && <>You also logged {money(otherSum, p.currency)} of other income this month, which is added on top.</>}</p>
          <div className="jx-sheet__actions"><button className="jx-btn jx-btn--primary jx-btn--block" disabled={!num(v) && !mine} onClick={() => void save(close)}>{num(v) ? 'Save income' : 'Clear income'}</button></div>
        </>
      )}
    </Sheet>
  );
}

function BudgetSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const p = useStore(s => s.profile)!;
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(SPEND_CATS.map(c => [c, p.prefs.budgets?.[c] ? commas(String(p.prefs.budgets[c])) : ''])));
  const [total, setTotal] = useState(p.monthly_budget ? commas(String(p.monthly_budget)) : '');
  const sum = SPEND_CATS.reduce((a, c) => a + num(v[c] ?? ''), 0);
  async function save(close: () => void) {
    const budgets = Object.fromEntries(SPEND_CATS.filter(c => num(v[c] ?? '') > 0).map(c => [c, num(v[c])]));
    await saveProfile({ monthly_budget: num(total) || null, prefs: { ...p.prefs, budgets } });
    close(); setTimeout(onSaved, 170);
  }
  return (
    <Sheet title="Monthly limits" onClose={onClose} tall>
      {close => (
        <>
          <Field label={`Whole month (${p.currency})`} value={total} onChange={x => setTotal(commas(x))} inputMode="numeric" placeholder="e.g. 250,000" />
          <p className="jx-note">Set a limit for the categories you want to watch. Leave the rest empty.</p>
          <div className="jx-limits">
            {SPEND_CATS.map(c => (
              <label key={c} className="jx-limit">
                <span className="jx-where__dot" style={{ background: CAT_COLOR[c] }} />
                <b>{c}</b>
                <input inputMode="numeric" value={v[c] ?? ''} placeholder="No limit" aria-label={`${c} limit`} onChange={e => setV(x => ({ ...x, [c]: commas(e.target.value) }))} />
              </label>
            ))}
          </div>
          {sum > 0 && <p className="jx-note">Category limits add up to {money(sum, p.currency)}{num(total) && sum > num(total) ? ', more than the whole-month limit.' : '.'}</p>}
          <div className="jx-sheet__actions"><button className="jx-btn jx-btn--primary jx-btn--block" onClick={() => void save(close)}>Save limits</button></div>
        </>
      )}
    </Sheet>
  );
}

/* ---------- bills ---------- */
function billState(b: Item, now = new Date()) {
  const dueDay = Math.min(Number(b.data.dueDay ?? 1), new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
  const paid = Array.isArray(b.data.paid) && (b.data.paid as string[]).includes(monthKey(now));
  const diff = dueDay - now.getDate();
  return { dueDay, paid, diff };
}

function Bills({ api }: { api: ShellApi }) {
  const p = useStore(s => s.profile)!;
  const items = useStore(s => s.items);
  const [edit, setEdit] = useState<Item | 'new' | null>(null);
  const bills = useMemo(() => items.filter(i => i.kind === 'bill')
    .map(b => ({ b, ...billState(b) }))
    .sort((x, y) => Number(x.paid) - Number(y.paid) || x.diff - y.diff), [items]);
  const due = bills.filter(x => !x.paid).reduce((a, x) => a + (x.b.amount ?? 0), 0);
  const total = bills.reduce((a, x) => a + (x.b.amount ?? 0), 0);

  async function toggle(b: Item, paid: boolean) {
    const key = monthKey();
    const list = Array.isArray(b.data.paid) ? (b.data.paid as string[]) : [];
    if (!paid) {
      await updateItem(b.id, { data: { ...b.data, paid: [...list.filter(k => k !== key), key].slice(-24) } });
      await addItem({ kind: 'money', title: b.title, amount: -(b.amount ?? 0), currency: p.currency, at: new Date().toISOString(), data: { category: 'Bills', billId: b.id, month: key } });
      api.toast(`${b.title} paid · added to spending`);
    } else {
      await updateItem(b.id, { data: { ...b.data, paid: list.filter(k => k !== key) } });
      const log = items.find(i => i.kind === 'money' && i.data.billId === b.id && i.data.month === key);
      if (log) await removeItem(log.id);
      api.toast(`${b.title} marked unpaid`);
    }
  }

  return (
    <>
      {bills.length > 0 && (
        <div className="jx-card jx-left jx-rise">
          <div className="jx-left__top"><small>Still to pay this month</small><span className={'jx-pill ' + (due ? 'jx-pill--plain' : 'jx-pill--ok')}>{due ? `${bills.filter(x => !x.paid).length} of ${bills.length} left` : 'All paid'}</span></div>
          <b className="jx-huge"><Amount n={due} currency={p.currency} /></b>
          <div className="jx-meter" role="progressbar" aria-label="Bills paid" aria-valuenow={total ? Math.round(((total - due) / total) * 100) : 0} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${total ? ((total - due) / total) * 100 : 0}%` }} /></div>
        </div>
      )}
      <button className="jx-btn jx-btn--primary jx-btn--block jx-logbtn" onClick={() => setEdit('new')}><IPlus size={20} /> Add a bill</button>
      {bills.length ? (
        <div className="jx-card jx-list jx-rise" style={{ animationDelay: '30ms', marginTop: 12 }}>
          {bills.map(({ b, paid, diff, dueDay }) => (
            <div key={b.id} className={'jx-li jx-bill' + (paid ? ' is-done' : '')}>
              <button className="jx-check" role="checkbox" aria-checked={paid} aria-label={paid ? `Mark ${b.title} unpaid` : `Mark ${b.title} paid`} onClick={() => void toggle(b, paid)}><ICheck size={14} /></button>
              <button className="jx-li__txt jx-li__tap" onClick={() => setEdit(b)}>
                <b>{b.title}</b>
                <small className={!paid && diff < 0 ? 'is-over' : !paid && diff <= 3 ? 'is-soon' : ''}>
                  {paid ? 'Paid this month' : diff < 0 ? `Overdue by ${-diff} day${diff === -1 ? '' : 's'}` : diff === 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : `Due on the ${ordinal(dueDay)} · in ${diff} days`}
                </small>
              </button>
              <Amount n={b.amount ?? 0} currency={p.currency} className="jx-li__amt" />
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={<IReceipt size={20} />} title="No bills yet" text="Add rent, DSTV, data or school fees. Tick them off each month and they count as spending." />
      )}
      {edit && <BillSheet bill={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={msg => { setEdit(null); api.toast(msg); }} />}
    </>
  );
}

function BillSheet({ bill, onClose, onSaved }: { bill: Item | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const currency = useStore(s => s.profile?.currency ?? 'NGN');
  const [name, setName] = useState(bill?.title ?? '');
  const [amt, setAmt] = useState(bill?.amount ? commas(String(bill.amount)) : '');
  const [due, setDue] = useState(String(bill?.data.dueDay ?? new Date().getDate()));
  const ok = name.trim() && num(amt) > 0 && Number(due) >= 1 && Number(due) <= 31;
  async function save(close: () => void) {
    if (!ok) return;
    const dueDay = Math.round(Number(due));
    if (bill) await updateItem(bill.id, { title: name.trim(), amount: num(amt), data: { ...bill.data, dueDay } });
    else await addItem({ kind: 'bill', title: name.trim(), amount: num(amt), currency, data: { dueDay, repeat: 'monthly', paid: [] } });
    close(); setTimeout(() => onSaved(bill ? 'Bill updated' : `${name.trim()} added · due on the ${ordinal(dueDay)}`), 170);
  }
  return (
    <Sheet title={bill ? 'Edit bill' : 'New bill'} onClose={onClose}>
      {close => (
        <>
          <Field label="What is it" value={name} onChange={setName} placeholder="Rent, DSTV, data…" autoFocus={!bill} />
          <Field label={`Amount each month (${currency})`} value={amt} onChange={x => setAmt(commas(x))} inputMode="numeric" placeholder="e.g. 15,000" />
          <Field label="Due on day of the month" value={due} onChange={x => setDue(x.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="1 to 31" />
          <div className="jx-sheet__actions">
            {bill && <button className="jx-btn jx-btn--danger" aria-label="Remove bill" onClick={async () => { await removeItem(bill.id); close(); setTimeout(() => onSaved('Bill removed'), 170); }}><ITrash size={18} /></button>}
            <button className="jx-btn jx-btn--primary jx-btn--block" disabled={!ok} onClick={() => void save(close)}>{bill ? 'Save' : 'Add bill'}</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ---------- goals ---------- */
function Goals({ api }: { api: ShellApi }) {
  const p = useStore(s => s.profile)!;
  const items = useStore(s => s.items);
  const [edit, setEdit] = useState<Item | 'new' | null>(null);
  const [topup, setTopup] = useState<Item | null>(null);
  const goals = useMemo(() => items.filter(i => i.kind === 'goal').sort((a, b) => a.created_at.localeCompare(b.created_at)), [items]);
  return (
    <>
      <button className="jx-btn jx-btn--primary jx-btn--block jx-logbtn" onClick={() => setEdit('new')}><IPlus size={20} /> New goal</button>
      {goals.length ? (
        <div className="jx-goals">
          {goals.map((g, n) => {
            const target = g.amount ?? 0, saved = Number(g.data.saved ?? 0), pct = target ? Math.min(100, (saved / target) * 100) : 0;
            const by = typeof g.data.by === 'string' && g.data.by ? new Date(g.data.by + 'T12:00') : null;
            const months = by ? Math.max(1, (by.getFullYear() - new Date().getFullYear()) * 12 + by.getMonth() - new Date().getMonth()) : 0;
            const perMonth = by && saved < target ? Math.ceil((target - saved) / months) : 0;
            return (
              <div key={g.id} className="jx-card jx-goal jx-rise" style={{ animationDelay: `${n * 25}ms` }}>
                <button className="jx-goal__top" onClick={() => setEdit(g)}>
                  <span className="jx-row__icon jx-tag--money"><ITarget size={16} /></span>
                  <span className="jx-li__txt"><b>{g.title}</b><small>{by ? `By ${by.toLocaleDateString('en', { month: 'short', year: 'numeric' })}` : 'No date set'}</small></span>
                  <b className="jx-goal__pct">{Math.round(pct)}%</b>
                </button>
                <div className="jx-meter"><i style={{ width: `${pct}%` }} /></div>
                <div className="jx-goal__foot">
                  <small><Amount n={saved} currency={p.currency} /> of <Amount n={target} currency={p.currency} />{perMonth > 0 && <> · <Amount n={perMonth} currency={p.currency} /> a month to make it</>}{saved >= target && target > 0 && ' · done'}</small>
                  <button className="jx-btn jx-btn--ghost jx-btn--sm" onClick={() => setTopup(g)}><IPlus size={15} /> Add</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={<ITarget size={20} />} title="No goals yet" text="Saving for rent, a phone or a trip? Set the amount and Jaiye tracks how close you are." />
      )}
      {edit && <GoalSheet goal={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={msg => { setEdit(null); api.toast(msg); }} />}
      {topup && <TopupSheet goal={topup} onClose={() => setTopup(null)} onSaved={msg => { setTopup(null); api.toast(msg); }} />}
    </>
  );
}

function GoalSheet({ goal, onClose, onSaved }: { goal: Item | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const currency = useStore(s => s.profile?.currency ?? 'NGN');
  const [name, setName] = useState(goal?.title ?? '');
  const [target, setTarget] = useState(goal?.amount ? commas(String(goal.amount)) : '');
  const [saved, setSaved] = useState(goal?.data.saved ? commas(String(goal.data.saved)) : '');
  const [by, setBy] = useState(typeof goal?.data.by === 'string' ? goal.data.by : '');
  const ok = name.trim() && num(target) > 0;
  async function save(close: () => void) {
    if (!ok) return;
    const data = { ...(goal?.data ?? {}), saved: num(saved), by: by || null };
    if (goal) await updateItem(goal.id, { title: name.trim(), amount: num(target), data });
    else await addItem({ kind: 'goal', title: name.trim(), amount: num(target), currency, data });
    close(); setTimeout(() => onSaved(goal ? 'Goal updated' : 'Goal added'), 170);
  }
  return (
    <Sheet title={goal ? 'Edit goal' : 'New goal'} onClose={onClose}>
      {close => (
        <>
          <Field label="Saving for" value={name} onChange={setName} placeholder="New phone, rent, Christmas…" autoFocus={!goal} />
          <Field label={`Target (${currency})`} value={target} onChange={x => setTarget(commas(x))} inputMode="numeric" placeholder="e.g. 500,000" />
          <Field label="Saved so far" value={saved} onChange={x => setSaved(commas(x))} inputMode="numeric" placeholder="0" />
          <Field label="By when (optional)" type="date" value={by} onChange={setBy} />
          <div className="jx-sheet__actions">
            {goal && <button className="jx-btn jx-btn--danger" aria-label="Remove goal" onClick={async () => { await removeItem(goal.id); close(); setTimeout(() => onSaved('Goal removed'), 170); }}><ITrash size={18} /></button>}
            <button className="jx-btn jx-btn--primary jx-btn--block" disabled={!ok} onClick={() => void save(close)}>{goal ? 'Save' : 'Add goal'}</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function TopupSheet({ goal, onClose, onSaved }: { goal: Item; onClose: () => void; onSaved: (msg: string) => void }) {
  const currency = useStore(s => s.profile?.currency ?? 'NGN');
  const [amt, setAmt] = useState('');
  const [out, setOut] = useState(false);
  const saved = Number(goal.data.saved ?? 0);
  async function save(close: () => void) {
    const n = num(amt); if (!n) return;
    const next = Math.max(0, saved + (out ? -n : n));
    await updateItem(goal.id, { data: { ...goal.data, saved: next } });
    close(); setTimeout(() => onSaved(`${goal.title}: ${money(next, currency)} saved`), 170);
  }
  return (
    <Sheet title={goal.title} onClose={onClose}>
      {close => (
        <>
          <span className="jx-seg jx-seg--lg">
            <button className={!out ? 'is-on' : ''} onClick={() => setOut(false)}>Put in</button>
            <button className={out ? 'is-on' : ''} onClick={() => setOut(true)}>Take out</button>
          </span>
          <Field label={`Amount (${currency})`} value={amt} onChange={x => setAmt(commas(x))} inputMode="numeric" placeholder="e.g. 20,000" autoFocus />
          <p className="jx-note">This only tracks the goal. It doesn't count as spending.</p>
          <div className="jx-sheet__actions"><button className="jx-btn jx-btn--primary jx-btn--block" disabled={!num(amt)} onClick={() => void save(close)}>{out ? 'Take out' : 'Add to goal'}</button></div>
        </>
      )}
    </Sheet>
  );
}
