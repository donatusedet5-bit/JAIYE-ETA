import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { AppMark, Lockup } from '../ui/Mark';
import { IBack, ISend, ISpark } from '../ui/icons';
import { Tag } from '../ui/bits';

type Step = 'hello' | 'say' | 'account';

export default function Welcome() {
  const [step, setStep] = useState<Step>('hello');
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  if (step === 'account') return <Account mode={mode} setMode={setMode} onBack={() => setStep(mode === 'login' ? 'hello' : 'say')} />;

  return (
    <div className={'jx-screen jx-onb' + (step === 'hello' ? ' jx-onb--hero' : '')}>
      {step === 'hello' ? (
        <div className="jx-hello" key="hello">
          <div className="jx-hello__bar">
            <Lockup light />
            <button className="jx-link jx-link--light" onClick={() => { setMode('login'); setStep('account'); }}>Log in</button>
          </div>
          <div className="jx-hello__float" aria-hidden="true">
            <span className="jx-chip jx-chip--a">Bolt to Yaba, 3.2k <Tag kind="money" /></span>
            <span className="jx-chip jx-chip--b">Design review at 3 <Tag kind="meeting" /></span>
            <span className="jx-chip jx-chip--c">Egusi and eba tonight <Tag kind="meal" /></span>
            <span className="jx-chip jx-chip--d">Call Ada at 5 <Tag kind="call" /></span>
            <span className="jx-hello__icon"><AppMark size={60} draw /></span>
          </div>
          <div className="jx-hello__copy jx-rise">
            <h1 className="jx-h1"><span className="jx-soft">Enjoy</span> life.<br />Jaiye keeps track.</h1>
            <p className="jx-sub">Say it once. Jaiye files the rest.</p>
          </div>
        </div>
      ) : (
        <div className="jx-onb__body" key="say">
          <div className="jx-topbar">
            <button className="jx-iconbtn" aria-label="Back" onClick={() => setStep('hello')}><IBack size={18} /></button>
            <span />
          </div>
          <SayDemo />
          <h1 className="jx-h1 jx-rise" style={{ marginTop: 28 }}>Say it once.<br /><span className="jx-soft">Jaiye</span> fills it in.</h1>
        </div>
      )}
      <div className="jx-onb__foot">
        <div className="jx-dots" aria-hidden="true"><i className={step === 'hello' ? 'on' : ''} /><i className={step === 'say' ? 'on' : ''} /></div>
        <button className="jx-btn jx-btn--primary jx-btn--block" onClick={() => step === 'hello' ? setStep('say') : (setMode('signup'), setStep('account'))}>
          {step === 'hello' ? 'Get started' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

const LINE = 'Paid 15k for light, call Ada at 5';

function SayDemo() {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(LINE.length); setPhase(2); return; }
    let t: number;
    if (n < LINE.length && phase === 0) t = window.setTimeout(() => setN(n + 1), 45);
    else if (phase === 0) t = window.setTimeout(() => setPhase(1), 350);
    else if (phase === 1) t = window.setTimeout(() => setPhase(2), 450);
    else t = window.setTimeout(() => { setN(0); setPhase(0); }, 3200);
    return () => clearTimeout(t);
  }, [n, phase]);
  const typed = LINE.slice(0, n);
  const cut = 'Paid 15k for light'.length;
  return (
    <div className="jx-card jx-say" aria-label="Example: Paid 15k for light, call Ada at 5">
      <div className={'jx-say__box' + (phase >= 1 ? ' is-sent' : '')}>
        <p>
          <span className="jx-say__money">{typed.slice(0, cut)}</span>
          {typed.length > cut && <span className="jx-say__call">{typed.slice(cut)}</span>}
          {phase === 0 && <i className="jx-caret" />}
        </p>
        <div className="jx-say__row"><span className="jx-say__spark"><ISpark size={13} /></span><span className="jx-say__send"><ISend size={15} /></span></div>
      </div>
      <div className={'jx-say__out' + (phase === 2 ? ' is-in' : '')}>
        <div className="jx-say__item">₦15,000 electricity <Tag kind="money" /></div>
        <div className="jx-say__item">Call Ada <Tag kind="call" /></div>
      </div>
    </div>
  );
}

function Account({ mode, setMode, onBack }: { mode: 'signup' | 'login'; setMode: (m: 'signup' | 'login') => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null);
  const signup = mode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!navigator.onLine) { setMsg({ kind: 'err', text: 'You’re offline. Connect once to sign in; after that Jaiye works offline.' }); return; }
    if (password.length < 8) { setMsg({ kind: 'err', text: 'Use at least 8 characters for your password.' }); return; }
    setBusy(true);
    const res = signup
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (res.error) {
      const m = res.error.message.toLowerCase();
      setMsg({ kind: 'err', text: m.includes('invalid login') ? 'That email and password don’t match.' : m.includes('already registered') ? 'You already have an account. Log in instead.' : m.includes('confirm') ? 'Confirm your email first, then log in.' : res.error.message });
      return;
    }
    if (signup && !res.data.session) setMsg({ kind: 'ok', text: 'Check your email to confirm, then log in here.' });
  }

  return (
    <form className="jx-screen jx-onb" onSubmit={submit}>
      <div className="jx-onb__body">
        <div className="jx-topbar">
          <button type="button" className="jx-iconbtn" aria-label="Back" onClick={onBack}><IBack size={18} /></button>
          <span />
        </div>
        <div className="jx-rise" key={mode}>
          <AppMark size={44} />
          <h1 className="jx-h1" style={{ marginTop: 18 }}>{signup ? <>Make your <span className="jx-soft">Jaiye</span> account</> : <>Welcome <span className="jx-soft">back</span></>}</h1>
          <p className="jx-sub">{signup ? 'So your things are safe on every phone.' : 'Log in to pick up where you left off.'}</p>
        </div>
        <label className="jx-field jx-rise" style={{ animationDelay: '60ms' }}>
          <span>Email</span>
          <input type="email" inputMode="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label className="jx-field jx-rise" style={{ animationDelay: '110ms' }}>
          <span>Password</span>
          <input type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </label>
        {msg && <p className={'jx-msg jx-msg--' + msg.kind} role="status">{msg.text}</p>}
      </div>
      <div className="jx-onb__foot">
        <button className="jx-btn jx-btn--primary jx-btn--block" disabled={busy}>{busy ? 'One moment…' : signup ? 'Create account' : 'Log in'}</button>
        <button type="button" className="jx-link" onClick={() => { setMsg(null); setMode(signup ? 'login' : 'signup'); }}>
          {signup ? 'Have an account? Log in' : 'New here? Make an account'}
        </button>
      </div>
    </form>
  );
}
