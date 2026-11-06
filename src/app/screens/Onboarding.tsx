import { useRef, useState } from 'react';
import { saveProfile, setAvatar, useStore } from '../store';
import { COUNTRIES, DAYS, guessCountry, hm12, ordinal, symbol } from '../format';
import type { Profile, Track } from '../types';
import { AppMark } from '../ui/Mark';
import { Toggle } from '../ui/bits';
import { IBack, IBed, ICal, ICamera, ICheck, IHabit, IMail, IMeal, IPhone, IPlus, ISun, ITasks, IUser, IWallet } from '../ui/icons';
import { hasPin, clearPin } from '../pin';
import { PinSetup } from './PinLock';

const STEPS = 5;

export default function Onboarding() {
  const saved = useStore(s => s.profile)!;
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [p, setP] = useState<Profile>(() => {
    if (saved.country) return saved;
    const c = guessCountry();
    return { ...saved, country: c.code, currency: c.currency };
  });
  const set = (patch: Partial<Profile>) => setP(x => ({ ...x, ...patch, prefs: { ...x.prefs, ...(patch.prefs ?? {}) } }));

  const go = async (to: number) => {
    setDir(to > step ? 1 : -1);
    await saveProfile(p);
    if (to > STEPS) { await saveProfile({ ...p, onboarded_at: new Date().toISOString() }); return; }
    setStep(to);
  };

  const canGo = step !== 1 || p.name.trim().length > 0;
  const cta = step === 2 ? `Continue with ${p.tracks.length}` : step === STEPS ? 'Finish setup' : 'Continue';

  return (
    <div className="jx-screen jx-onb">
      <div className="jx-onb__body">
        <div className="jx-topbar">
          <button className="jx-iconbtn" aria-label="Back" onClick={() => go(step - 1)} disabled={step === 1} style={{ visibility: step === 1 ? 'hidden' : 'visible' }}><IBack size={18} /></button>
          <div className="jx-progress" aria-label={`Step ${step} of ${STEPS}`}>{Array.from({ length: STEPS }, (_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</div>
          <span className="jx-stepno">{step} of {STEPS}</span>
        </div>
        <div className={'jx-step ' + (dir > 0 ? 'jx-step--fwd' : 'jx-step--back')} key={step}>
          {step === 1 && <About p={p} set={set} />}
          {step === 2 && <Tracks p={p} set={set} />}
          {step === 3 && <Rhythm p={p} set={set} />}
          {step === 4 && <Connect />}
          {step === 5 && <Private p={p} set={set} />}
        </div>
      </div>
      <div className="jx-onb__foot">
        <button className="jx-btn jx-btn--primary jx-btn--block" disabled={!canGo} onClick={() => go(step + 1)}>{cta}</button>
      </div>
    </div>
  );
}

type SP = { p: Profile; set: (x: Partial<Profile>) => void };

function About({ p, set }: SP) {
  const avatar = useStore(s => s.avatar);
  const file = useRef<HTMLInputElement>(null);
  async function pick(f: File | undefined) {
    if (!f) return;
    const url = await squareWebp(f, 320);
    await setAvatar(url);
  }
  return (
    <>
      <h1 className="jx-h1">What should we <span className="jx-soft">call</span> you?</h1>
      <button type="button" className="jx-photo" onClick={() => file.current?.click()} aria-label={avatar ? 'Change your photo' : 'Add your photo'}>
        <span className={'jx-photo__ring' + (avatar ? ' has' : '')}>{avatar ? <img src={avatar} alt="" /> : <ICamera size={24} />}</span>
        <span className="jx-photo__plus"><IPlus size={14} /></span>
      </button>
      <button type="button" className="jx-link jx-link--center" onClick={() => file.current?.click()}>{avatar ? 'Change photo' : 'Add your photo'}</button>
      <input ref={file} type="file" accept="image/*" hidden onChange={e => pick(e.target.files?.[0])} />
      <label className="jx-field">
        <span>Your name</span>
        <input value={p.name} maxLength={60} autoComplete="given-name" onChange={e => set({ name: e.target.value })} placeholder="Jaiye" autoFocus />
      </label>
      <label className="jx-field">
        <span>Where you live</span>
        <span className="jx-select">
          <select value={p.country ?? ''} onChange={e => { const c = COUNTRIES.find(x => x.code === e.target.value)!; set({ country: c.code, currency: c.currency }); }}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <b>{symbol(p.currency)} {p.currency}</b>
        </span>
      </label>
    </>
  );
}

const TRACKS: { id: Track; label: string; Icon: (x: { size?: number }) => React.ReactNode; tag: string }[] = [
  { id: 'money', label: 'Money', Icon: IWallet, tag: 'money' },
  { id: 'meetings', label: 'Meetings', Icon: ICal, tag: 'meeting' },
  { id: 'meals', label: 'Meals', Icon: IMeal, tag: 'meals' },
  { id: 'tasks', label: 'Tasks', Icon: ITasks, tag: 'tasks' },
  { id: 'sleep', label: 'Sleep', Icon: IBed, tag: 'sleep' },
  { id: 'habits', label: 'Habits', Icon: IHabit, tag: 'reminder' },
];

function Tracks({ p, set }: SP) {
  const toggle = (id: Track) => set({ tracks: p.tracks.includes(id) ? p.tracks.filter(t => t !== id) : [...p.tracks, id] });
  return (
    <>
      <h1 className="jx-h1">What should Jaiye <span className="jx-soft">keep track</span> of?</h1>
      <div className="jx-grid2">
        {TRACKS.map(({ id, label, Icon, tag }, i) => {
          const on = p.tracks.includes(id);
          return (
            <button key={id} type="button" aria-pressed={on} className={'jx-pick' + (on ? ' is-on' : '')} style={{ animationDelay: `${i * 25}ms` }} onClick={() => toggle(id)}>
              <span className={`jx-pick__icon jx-tag--${tag}`}><Icon size={17} /></span>
              <span className="jx-pick__check">{on && <ICheck size={12} />}</span>
              <b>{label}</b>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Rhythm({ p, set }: SP) {
  const has = (t: Track) => p.tracks.includes(t);
  return (
    <>
      <h1 className="jx-h1">Set your <span className="jx-soft">daily</span> rhythm</h1>
      <div className="jx-group">
        <Row icon={<ISun size={16} />} label="Wake up"><input type="time" value={p.wake_time} onChange={e => set({ wake_time: e.target.value || '06:30' })} aria-label="Wake up time" /></Row>
        <Row icon={<IBed size={16} />} label="Bedtime"><input type="time" value={p.bed_time} onChange={e => set({ bed_time: e.target.value || '22:30' })} aria-label="Bedtime" /></Row>
      </div>
      {has('money') && (
        <div className="jx-group">
          <Row icon={<IWallet size={16} />} label="Monthly budget">
            <span className="jx-amount"><i>{symbol(p.currency)}</i><input inputMode="numeric" placeholder="0" aria-label="Monthly budget"
              value={p.monthly_budget ? p.monthly_budget.toLocaleString('en') : ''}
              onChange={e => { const n = Number(e.target.value.replace(/[^\d]/g, '')); set({ monthly_budget: n ? Math.min(n, 1e12) : null }); }} /></span>
          </Row>
          <Row icon={<ICal size={16} />} label="Payday">
            <select value={p.payday ?? ''} onChange={e => set({ payday: e.target.value ? Number(e.target.value) : null })} aria-label="Payday">
              <option value="">Not set</option>
              {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{ordinal(i + 1)}</option>)}
            </select>
          </Row>
        </div>
      )}
      {has('meals') && (
        <div className="jx-group">
          <Row icon={<IMeal size={16} />} label="Meal prep day" tone="meals">
            <select value={p.meal_prep_day ?? ''} onChange={e => set({ meal_prep_day: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Meal prep day">
              <option value="">Not set</option>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </Row>
        </div>
      )}
    </>
  );
}

function Row({ icon, label, children, tone }: { icon: React.ReactNode; label: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className="jx-row">
      <span className={'jx-row__icon' + (tone ? ` jx-tag--${tone}` : '')}>{icon}</span>
      <span className="jx-row__label">{label}</span>
      <span className="jx-row__val">{children}</span>
    </div>
  );
}

function Connect() {
  const rows = [
    { Icon: ICal, name: 'Google Calendar', sub: 'Meetings and events' },
    { Icon: IMail, name: 'Gmail', sub: 'Bank alerts and invites only' },
    { Icon: IUser, name: 'Google Contacts', sub: 'Names for calls' },
    { Icon: IPhone, name: 'Phone calls', sub: 'Say “call Ada at 5”', on: true },
  ];
  return (
    <>
      <AppMark size={44} />
      <h1 className="jx-h1" style={{ marginTop: 14 }}>Let Jaiye fill<br />things in for you</h1>
      <p className="jx-sub">Meetings, calls and bank alerts, filled in for you.</p>
      <div className="jx-stack">
        {rows.map(({ Icon, name, sub, on }, i) => (
          <div key={name} className="jx-card jx-conn jx-rise" style={{ animationDelay: `${i * 25}ms` }}>
            <span className="jx-row__icon jx-row__icon--blue"><Icon size={17} /></span>
            <span className="jx-conn__txt"><b>{name}</b><small>{sub}</small></span>
            {on ? <span className="jx-pill jx-pill--ok"><ICheck size={11} /> On</span> : <span className="jx-pill">Soon</span>}
          </div>
        ))}
      </div>
      <p className="jx-note">Google links arrive in a later update. You can connect them from your profile.</p>
    </>
  );
}

function Private({ p, set }: SP) {
  const [pinOn, setPinOn] = useState(hasPin());
  const [setting, setSetting] = useState(false);
  return (
    <>
      <h1 className="jx-h1">Keep it <span className="jx-soft">private,</span><br />keep it on time</h1>
      <div className="jx-group">
        <Line label="PIN lock" sub="Asked when you open Jaiye"><Toggle label="PIN lock" on={pinOn} onChange={v => { if (v) setSetting(true); else { clearPin(); setPinOn(false); } }} /></Line>
        <Line label="Hide amounts" sub="Tap a number to peek"><Toggle label="Hide amounts" on={!!p.prefs.hideAmounts} onChange={v => set({ prefs: { hideAmounts: v } })} /></Line>
      </div>
      <div className="jx-group">
        <Line label="Morning briefing" sub={hm12(p.prefs.briefingTime ?? '07:00')}><Toggle label="Morning briefing" on={!!p.prefs.morningBriefing} onChange={v => set({ prefs: { morningBriefing: v } })} /></Line>
        <Line label="Meeting alerts"><Toggle label="Meeting alerts" on={!!p.prefs.meetingAlerts} onChange={v => set({ prefs: { meetingAlerts: v } })} /></Line>
        <Line label="Bedtime reminder" sub={hm12(p.bed_time)}><Toggle label="Bedtime reminder" on={!!p.prefs.bedtimeReminder} onChange={v => set({ prefs: { bedtimeReminder: v } })} /></Line>
      </div>
      {setting && <PinSetup onClose={() => setSetting(false)} onSaved={() => { setSetting(false); setPinOn(true); }} />}
    </>
  );
}

export function Line({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="jx-row">
      <span className="jx-row__label">{label}{sub && <small>{sub}</small>}</span>
      <span className="jx-row__val">{children}</span>
    </div>
  );
}

/** Center-crop and shrink a photo so it uploads fast and stays small. */
export async function squareWebp(f: File, size: number): Promise<string> {
  const bmp = await createImageBitmap(f);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d')!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  const webp = c.toDataURL('image/webp', 0.86);
  return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.86);
}

