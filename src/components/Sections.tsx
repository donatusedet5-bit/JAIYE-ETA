import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reduced, useCountUp, useCycle, useInView, useScrollProgress } from '../motion';
import { AppIcon } from './Logo';
import { useCurrency, useFill } from '../currency';
import { Arrow, Bowl, Check, Mic, Moon, Plus, Share, Sparkle, Sun, Task, Wallet } from './Icons';

/** Steps through 0..n while `run`, one tick every `ms`. Restarts when `key` changes. */
function useTicker(n: number, ms: number, run: boolean, key: unknown = 0) {
  const [k, setK] = useState(0);
  useEffect(() => { setK(reduced() ? n : 0); }, [key, n]);
  useEffect(() => {
    if (!run || k >= n) return;
    const t = window.setTimeout(() => setK(x => x + 1), ms);
    return () => clearTimeout(t);
  }, [k, n, ms, run]);
  return k;
}

/* ---------- marquee of filed items ---------- */
const ROW_A = [['Paid {15000} for light', 'money', 'Money'], ['Standup at 9:30', 'meeting', 'Meeting'], ['Jollof for Sunday', 'meals', 'Meals'], ['Call mum at 8', 'call', 'Call'], ['Rent due on the 25th', 'reminder', 'Reminder'], ['Sleep by 10:30', 'sleep', 'Sleep'], ['Renew passport', 'tasks', 'Tasks']];
const ROW_B = [['Buy tomatoes and pepper', 'tasks', 'Tasks'], ['Salary came in, {850000}', 'money', 'Money'], ['Pitch with Kemi on Friday', 'meeting', 'Meeting'], ['Woke up at 6:30', 'sleep', 'Sleep'], ['Egusi on Wednesday', 'meals', 'Meals'], ['Ring Ada back', 'call', 'Call'], ['DSTV ends Monday', 'reminder', 'Reminder']];
export function Marquee() {
  const fill = useFill();
  const row = (items: string[][], rev = false) => (
    <div className={'mq__row' + (rev ? ' mq__row--rev' : '')}>
      {[...items, ...items].map(([t, k, l], i) => (
        <span className="mq__pill" key={i} aria-hidden={i >= items.length}><span>{fill(t)}</span><Arrow width={13} height={13} /><span className={'tag ' + k}>{l}</span></span>
      ))}
    </div>
  );
  return <section className="mq" aria-label="Things you can tell Jaiye">{row(ROW_A)}{row(ROW_B, true)}</section>;
}

/* ---------- 3 steps with a line that fills as you scroll ---------- */
export function Steps() {
  const [ref, p] = useScrollProgress<HTMLOListElement>();
  const steps = [
    { i: <Mic />, t: 'Say it', d: 'Type or speak, the way you talk.' },
    { i: <Sparkle />, t: 'Jaiye reads it', d: 'It finds the amount, time, place and person.' },
    { i: <Check />, t: 'It’s filed', d: 'Tagged, saved, and a reminder set.' },
  ];
  return (
    <ol className="steps3" ref={ref} style={{ ['--p' as string]: p }}>
      <div className="steps3__line" aria-hidden="true"><span /></div>
      {steps.map((s, k) => (
        <li key={s.t} className={'steps3__item' + (p > k * 0.22 + 0.05 ? ' is-on' : '')}>
          <span className="steps3__ico">{s.i}</span>
          <b>{s.t}</b><p>{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

/* ---------- count-up stats ---------- */
function Stat({ to, prefix = '', label, run }: { to: number; prefix?: string; label: string; run: boolean }) {
  const v = useCountUp(to, run);
  return <div className="stat"><b>{prefix}{v}</b><span>{label}</span></div>;
}
export function Stats() {
  const { symbol } = useCurrency();
  const [ref, run] = useInView<HTMLDivElement>(0.4);
  return (
    <div className="stats" ref={ref}>
      <Stat to={1} label="box for everything" run={run} />
      <Stat to={7} label="smart tags" run={run} />
      <Stat to={3} label="Google apps synced" run={run} />
      <Stat to={0} prefix={symbol} label="to use it" run={run} />
    </div>
  );
}

/* ---------- feature showcase: auto-advancing tabs ---------- */
function MoneyVis({ run }: { run: boolean }) {
  const { money } = useCurrency();
  const k = useTicker(2, 500, run);
  const cats = [['Food', 34, 'var(--chart-2)'], ['Transport', 22, 'var(--chart-1)'], ['Bills', 26, 'var(--chart-3)'], ['Fun', 18, 'var(--chart-4)']] as const;
  return (
    <div className="vis vis--money">
      <div className="vmo__boxes">
        <div className="mp__box is-in"><small>Income</small><b>{money(850000)}</b></div>
        <div className="mp__box"><small>Spent</small><b>{money(412300)}</b></div>
        <div className="mp__box"><small>Saved</small><b>{money(120000)}</b></div>
      </div>
      <div className="vmo__stack">{cats.map(([n, w, c]) => <span key={n} style={{ width: k > 0 ? `${w}%` : '0%', background: c }} />)}</div>
      <div className="vmo__legend">{cats.map(([n, w, c]) => <span key={n}><i style={{ background: c }} />{n} <b>{w}%</b></span>)}</div>
      <div className={'vmo__alert' + (k > 1 ? ' is-on' : '')}><Wallet width={18} height={18} /><span>Bolt, {money(3200)}</span><span className="tag money">Money</span><small>From your bank alert</small></div>
    </div>
  );
}
function MealsVis({ run }: { run: boolean }) {
  const grocery = ['Tomatoes', 'Pepper', 'Egusi', 'Palm oil', 'Rice'];
  const k = useTicker(grocery.length, 550, run);
  const days = [['Mon', 'Yam and egg'], ['Tue', 'Efo riro'], ['Wed', 'Egusi and eba'], ['Thu', 'Fried rice'], ['Fri', 'Suya night'], ['Sat', 'Pepper soup'], ['Sun', 'Jollof']];
  return (
    <div className="vis">
      <div className="vm__week">{days.map(([d, m], i) => <div key={d} className={'vm__day' + (i === 3 ? ' is-today' : '')}><small>{d}</small><span>{m}</span></div>)}</div>
      <div className="vm__list"><b>Grocery list</b>{grocery.map((g, i) => <div key={g} className={'vm__g' + (i < k ? ' is-done' : '')}><span className="vm__box"><Check width={12} height={12} /></span>{g}</div>)}</div>
    </div>
  );
}
function SleepVis({ run }: { run: boolean }) {
  const k = useTicker(2, 300, run);
  const week = [6.5, 7.2, 5.8, 7.8, 7.1, 8.2, 7.6];
  return (
    <div className="vis">
      <div className="vs__ring">
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" className="vs__track" /><circle cx="60" cy="60" r="50" className="vs__arc" pathLength={1} style={{ strokeDashoffset: k > 0 ? 0.04 : 1 }} /></svg>
        <div><b>7h 40m</b><small>last night</small></div>
      </div>
      <div className="vs__side">
        <div className="vs__row"><Sun width={18} height={18} /><span>Woke up</span><b>6:30 AM</b></div>
        <div className="vs__row"><Moon width={18} height={18} /><span>Bedtime</span><b>10:30 PM</b></div>
        <div className="vs__bars">{week.map((h, i) => <span key={i} style={{ height: k > 0 ? `${h * 10}%` : '4%', transitionDelay: `${i * 60}ms` }} />)}</div>
        <div className={'vs__toast' + (k > 1 ? ' is-on' : '')}><Moon width={15} height={15} /> Wind down in 30 minutes</div>
      </div>
    </div>
  );
}
function TasksVis({ run }: { run: boolean }) {
  const tasks = [['Send invoice to Kemi', '9:00'], ['Call the landlord', '11:30'], ['Pay electricity', '2:00'], ['Gym, 45 minutes', '6:00']];
  const habits = [['Drink water', 5], ['Read 10 pages', 6], ['No sugar', 3]] as const;
  const k = useTicker(7, 380, run);
  return (
    <div className="vis">
      <div className="vt__list">
        <b>Today</b>
        {tasks.map(([t, time], i) => <div key={t} className={'vt__t' + (i < Math.min(k, 3) ? ' is-done' : '')}><span className="vm__box"><Check width={12} height={12} /></span><span>{t}</span><small>{time}</small></div>)}
      </div>
      <div className="vt__habits">
        {habits.map(([h, n]) => (
          <div key={h} className="vt__h"><span>{h}</span><div>{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < Math.min(n, k) ? 'is-on' : ''} />)}</div></div>
        ))}
      </div>
    </div>
  );
}
const TABS = [
  { k: 'money', l: 'Money', i: <Wallet width={16} height={16} />, h: 'See where every naira goes.' },
  { k: 'meals', l: 'Meals', i: <Bowl width={16} height={16} />, h: 'Plan the week. The list writes itself.' },
  { k: 'sleep', l: 'Sleep', i: <Moon width={16} height={16} />, h: 'Wake up, tap once. Bedtime handled.' },
  { k: 'tasks', l: 'Tasks and habits', i: <Task width={16} height={16} />, h: 'Today in order. Streaks that stick.' },
];
export function Showcase() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [paused, setPaused] = useState(false);
  const [i, setI] = useCycle(TABS.length, 5200, inView && !paused);
  const t = TABS[i];
  return (
    <div className="show" ref={ref}>
      <div className="show__tabs" role="tablist" aria-label="Features">
        {TABS.map((x, k) => (
          <button key={x.k} role="tab" aria-selected={k === i} className={'show__tab' + (k === i ? ' is-on' : '')} onClick={() => { setPaused(true); setI(k); }}>
            {x.i}{x.l}{k === i && inView && !paused && <span className="show__bar" key={'b' + i} />}
          </button>
        ))}
      </div>
      <div className="show__stage spot" role="tabpanel">
        <h3 className="show__h" key={'h' + t.k}>{t.k === 'money' ? 'See where every coin goes.' : t.h}</h3>
        <div className="show__vis" key={'v' + t.k}>
          {t.k === 'money' && <MoneyVis run={inView} />}
          {t.k === 'meals' && <MealsVis run={inView} />}
          {t.k === 'sleep' && <SleepVis run={inView} />}
          {t.k === 'tasks' && <TasksVis run={inView} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- a day with Jaiye: scroll-linked timeline ---------- */
const DAY = [
  ['6:30', 'Wake-up logged', 'sleep', 'Sleep'],
  ['7:00', 'Morning brief: 4 tasks, 2 meetings', 'reminder', 'Brief'],
  ['9:30', 'Standup on Google Meet', 'meeting', 'Meeting'],
  ['1:15', 'Lunch, {4500}, from your bank alert', 'money', 'Money'],
  ['5:00', 'Call Ada', 'call', 'Call'],
  ['8:00', 'Buy tomatoes on the way home', 'tasks', 'Tasks'],
  ['10:30', 'Time for bed', 'sleep', 'Sleep'],
];
export function DayTimeline() {
  const fill = useFill();
  const [ref, p] = useScrollProgress<HTMLOListElement>();
  return (
    <ol className="day" ref={ref} style={{ ['--p' as string]: p }}>
      <div className="day__line" aria-hidden="true"><span /></div>
      {DAY.map(([time, text, k, l], n) => (
        <li key={time} className={'day__item' + (p > n / DAY.length * 0.9 ? ' is-on' : '')}>
          <time>{time}</time>
          <span className="day__dot" />
          <div className="day__card"><span>{fill(text)}</span><span className={'tag ' + k}>{l}</span></div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- FAQ ---------- */
const FAQ = [
  ['Is Jaiye free?', 'Yes. The app is free, and the AI runs on a free tier.'],
  ['Does it work on iPhone?', 'Yes. Add it to your Home Screen from Safari and it opens full screen, like any other app.'],
  ['Is my data private?', 'Your data stays in your own account. The AI doesn’t train on what you type, and you can lock the app with a PIN.'],
  ['Does it work without data?', 'Yes. Add things offline and they sync when you’re back online.'],
  ['Can it read my bank alerts?', 'Only if you connect Gmail. Jaiye then reads bank alerts and invites, nothing else, and never sends email.'],
  ['Can I use my voice?', 'Yes. Tap the mic and say it. Jaiye turns it into text and files it.'],
  ['Can I use my own currency?', 'Yes. Jaiye works with naira, cedi, shilling, rand, CFA, pound, dollar, euro, dirham, rupee and more. Pick your country at the top of this page, or in the app when you set up.'],
];
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq" data-reveal>
      {FAQ.map(([q, a], k) => (
        <div key={q} className={'faq__item' + (open === k ? ' is-open' : '')}>
          <button className="faq__q" aria-expanded={open === k} onClick={() => setOpen(open === k ? -1 : k)}>{q}<span className="faq__plus"><Plus width={18} height={18} /></span></button>
          <div className="faq__a"><p>{a}</p></div>
        </div>
      ))}
    </div>
  );
}

/* ---------- install guide ---------- */
type Plat = 'iphone' | 'android' | 'computer';
type BIPEvent = Event & { prompt: () => Promise<void> };
const URL_TEXT = 'jaiye-eta.vercel.app';
const GUIDE: Record<Plat, { t: string; d: string; scene: string }[]> = {
  iphone: [
    { t: 'Open Jaiye in Safari', d: 'Use Safari on your iPhone and go to ' + URL_TEXT + '.', scene: 'page' },
    { t: 'Tap the Share button', d: 'The square with an arrow pointing up, in the bar at the bottom.', scene: 'share' },
    { t: 'Tap “Add to Home Screen”', d: 'Scroll down the list if you don’t see it straight away.', scene: 'sheet' },
    { t: 'Tap “Add”', d: 'Top right corner. You can rename it first if you like.', scene: 'confirm' },
    { t: 'Open Jaiye from your Home Screen', d: 'It opens full screen. Allow notifications so reminders reach you.', scene: 'home' },
  ],
  android: [
    { t: 'Open Jaiye in Chrome', d: 'Use Chrome on your phone and go to ' + URL_TEXT + '.', scene: 'page' },
    { t: 'Tap the menu', d: 'The three dots in the top right corner.', scene: 'dots' },
    { t: 'Tap “Install app”', d: 'On some phones it says “Add to Home screen”.', scene: 'menu' },
    { t: 'Tap “Install”', d: 'Jaiye is added to your Home screen and app drawer.', scene: 'confirm' },
    { t: 'Open Jaiye', d: 'Tap the icon and allow notifications for reminders.', scene: 'home' },
  ],
  computer: [
    { t: 'Open Jaiye in Chrome or Edge', d: 'Go to ' + URL_TEXT + ' on your laptop.', scene: 'page' },
    { t: 'Click the install icon', d: 'A small screen with a down arrow, at the right end of the address bar.', scene: 'dl' },
    { t: 'Click “Install”', d: 'Confirm in the little box that opens.', scene: 'pop' },
    { t: 'Jaiye opens in its own window', d: 'Pin it to your taskbar or dock to keep it handy.', scene: 'win' },
  ],
};
function detect(): Plat {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/.test(ua)) return 'android';
  return /Mobi/.test(ua) ? 'android' : 'computer';
}

function PhoneScene({ plat, scene }: { plat: Plat; scene: string }) {
  if (plat === 'computer') {
    return (
      <div className="ip ip--comp" aria-hidden="true">
        <div className="ip__screen">
          {scene === 'win' ? (
            <div className="ip__home ip__home--comp"><div className="ip__win"><div className="ip__wbar"><i /><i /><i /> Jaiye</div><div className="ip__wbody"><AppIcon size={30} /> Your day is ready</div></div></div>
          ) : (
            <>
              <div className="ip__bar"><span className="ip__url">{URL_TEXT}</span><span className={'ip__dl' + (scene === 'dl' ? ' is-hot' : '')}>⤓</span></div>
              <div className="ip__page"><AppIcon size={48} /><b>Jaiye</b><span>Enjoy life. Jaiye keeps track.</span></div>
              {scene === 'pop' && <div className="ip__pop"><AppIcon size={26} /><span>Install app?</span><span className="is-hot">Install</span></div>}
            </>
          )}
        </div>
      </div>
    );
  }
  const ios = plat === 'iphone';
  return (
    <div className="ip" aria-hidden="true">
      <div className="ip__screen">
        {scene === 'home' ? (
          <div className="ip__home">
            <div className="ip__grid">{Array.from({ length: 11 }, (_, i) => <i key={i} />)}<span className="ip__new"><AppIcon size={44} /><small>Jaiye</small></span></div>
          </div>
        ) : (
          <>
            <div className="ip__bar"><span className="ip__url">{URL_TEXT}</span>{!ios && <span className={'ip__dots' + (scene === 'dots' ? ' is-hot' : '')}>⋮</span>}</div>
            <div className="ip__page"><AppIcon size={56} /><b>Jaiye</b><span>Enjoy life. Jaiye keeps track.</span></div>
            {ios && <div className="ip__safari"><span /><span /><span className={'ip__share' + (scene === 'share' ? ' is-hot' : '')}><Share width={20} height={20} /></span><span /><span /></div>}
            {!ios && scene === 'menu' && <div className="ip__menu"><span>New tab</span><span>Bookmarks</span><span className="is-hot">Install app</span><span>Share</span></div>}
            {ios && scene === 'sheet' && <div className="ip__sheet"><span>Copy</span><span>Add Bookmark</span><span className="is-hot"><Plus width={16} height={16} /> Add to Home Screen</span></div>}
            {scene === 'confirm' && (
              <div className="ip__sheet">
                <div className="ip__confirm"><AppIcon size={36} /><div><b>Jaiye</b><small>{URL_TEXT}</small></div><span className="is-hot">{ios ? 'Add' : 'Install'}</span></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function Install() {
  const [plat, setPlat] = useState<Plat>('iphone');
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => { setPlat(detect()); }, []);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setBip(e as BIPEvent); };
    const done = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', on); window.addEventListener('appinstalled', done);
    if (matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done); };
  }, []);
  const steps = GUIDE[plat];
  useEffect(() => { setStep(0); }, [plat]);
  useEffect(() => {
    if (!inView || !auto || reduced()) return;
    const t = window.setTimeout(() => setStep(s => (s + 1) % steps.length), 2800);
    return () => clearTimeout(t);
  }, [step, inView, auto, steps.length]);
  const pickPlat = (p: Plat) => { setPlat(p); setAuto(true); };

  return (
    <div className="inst" ref={ref}>
      <div>
        <span className="eyebrow"><Sparkle width={14} height={14} /> Install</span>
        <h2 className="h2">Put Jaiye on <span>your phone.</span></h2>
        <p className="lead">No app store needed. It takes about 20 seconds.</p>
        <div className="inst__tabs" role="tablist" aria-label="Your device">
          {(['iphone', 'android', 'computer'] as Plat[]).map(p => (
            <button key={p} role="tab" aria-selected={plat === p} className={plat === p ? 'is-on' : ''} onClick={() => pickPlat(p)}>{p === 'iphone' ? 'iPhone' : p === 'android' ? 'Android' : 'Computer'}</button>
          ))}
        </div>
        <ol className="inst__steps">
          {steps.map((s, k) => (
            <li key={plat + s.t} className={k === step ? 'is-on' : k < step ? 'is-done' : ''}>
              <button onClick={() => { setAuto(false); setStep(k); }}>
                <span className="inst__n">{k < step ? <Check width={14} height={14} /> : k + 1}</span>
                <span><b>{s.t}</b><small>{s.d}</small></span>
              </button>
            </li>
          ))}
        </ol>
        {installed ? <p className="inst__ok"><Check width={16} height={16} /> Jaiye is installed on this device.</p>
          : bip ? <button className="btn magnet" onClick={async () => { await bip.prompt(); setBip(null); }}>Install Jaiye now</button>
          : plat === 'iphone' ? <p className="inst__ok" style={{ color: 'var(--text-2)' }}>Tip: on iPhone it must be Safari. Reminders work once Jaiye is on your Home Screen.</p> : null}
      </div>
      <div className="inst__vis" key={plat + step}><PhoneScene plat={plat} scene={steps[step].scene} /></div>
    </div>
  );
}

/* ---------- final call to action ---------- */
export function FinalCta() {
  return (
    <section className="cta" data-reveal>
      <div className="cta__rings" aria-hidden="true"><i /><i /><i /></div>
      <div className="cta__in">
        <AppIcon size={72} animate />
        <h2 className="h2">Less sorting. <span>More enjoying.</span></h2>
        <p className="lead" style={{ color: 'rgba(255,255,255,.86)' }}>Jaiye means “enjoy life”. Let it keep track, so you don’t have to.</p>
        <div className="hero__cta"><Link to="/app" className="btn btn--white magnet">Start with Jaiye</Link><a href="#install" className="btn btn--ghost magnet">How to install</a></div>
      </div>
    </section>
  );
}
