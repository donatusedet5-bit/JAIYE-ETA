import { useEffect, useRef, useState } from 'react';
import { saveProfile, setAvatar, signOutAndWipe, sync, useStore } from '../store';
import { supabase } from '../supabase';
import { useAppTheme } from '../ui/theme';
import { clearPin, hasPin } from '../pin';
import { Avatar, SyncLine, Toggle } from '../ui/bits';
import { ICamera, IClose, ILogout, IReset } from '../ui/icons';
import { Line, squareWebp } from './Onboarding';
import { PinSetup } from './PinLock';
import ResetSheet from './ResetSheet';
import { Portal } from '../ui/Portal';

export default function MeSheet({ onClose }: { onClose: () => void }) {
  const p = useStore(s => s.profile)!;
  const pending = useStore(s => s.sync.pending);
  const { theme, toggle } = useAppTheme();
  const [email, setEmail] = useState('');
  const [name, setName] = useState(p.name);
  const [pinOn, setPinOn] = useState(hasPin());
  const [setting, setSetting] = useState(false);
  const [reset, setReset] = useState(false);
  const [closing, setClosing] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? '')); }, []);
  const close = () => { if (name.trim() && name !== p.name) void saveProfile({ name: name.trim() }); setClosing(true); setTimeout(onClose, 160); };

  async function logout() {
    const warn = pending ? `${pending} change${pending > 1 ? 's haven’t' : ' hasn’t'} synced yet and will be lost. Log out anyway?` : 'Log out of Jaiye on this phone?';
    if (confirm(warn)) await signOutAndWipe();
  }

  return (
    <>
    <Portal><div className={'jx-sheet-wrap' + (closing ? ' is-closing' : '')} onClick={close}>
      <div className="jx-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="You">
        <div className="jx-sheet__grab" />
        <div className="jx-sheet__head"><span /><button className="jx-iconbtn jx-iconbtn--muted" aria-label="Close" onClick={close}><IClose size={16} /></button></div>
        <div className="jx-me">
          <button className="jx-me__photo" onClick={() => file.current?.click()} aria-label="Change photo">
            <Avatar size={72} /><span className="jx-me__cam"><ICamera size={13} /></span>
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) await setAvatar(await squareWebp(f, 320)); }} />
          <input className="jx-me__name" value={name} maxLength={60} onChange={e => setName(e.target.value)} onBlur={() => name.trim() && name !== p.name && saveProfile({ name: name.trim() })} aria-label="Your name" />
          <small>{email}</small>
          <button className="jx-link" onClick={() => void sync()}><SyncLine /></button>
        </div>
        <div className="jx-group">
          <Line label="Dark mode"><Toggle label="Dark mode" on={theme === 'dark'} onChange={toggle} /></Line>
          <Line label="PIN lock" sub="Asked when you open Jaiye"><Toggle label="PIN lock" on={pinOn} onChange={v => { if (v) setSetting(true); else { clearPin(); setPinOn(false); } }} /></Line>
          <Line label="Hide amounts" sub="Tap a number to peek"><Toggle label="Hide amounts" on={!!p.prefs.hideAmounts} onChange={v => saveProfile({ prefs: { hideAmounts: v } })} /></Line>
        </div>
        <div className="jx-group">
          <button className="jx-row jx-row--btn" onClick={() => setReset(true)}><span className="jx-row__label">Reset Jaiye<small>Clear your entries or start over</small></span><span className="jx-row__val"><IReset size={17} /></span></button>
          <button className="jx-row jx-row--btn" onClick={logout}><span className="jx-row__label jx-danger">Log out</span><span className="jx-row__val jx-danger"><ILogout size={17} /></span></button>
        </div>
      </div>
    </div></Portal>
    {reset && <ResetSheet onClose={() => setReset(false)} onDone={() => { setReset(false); onClose(); }} />}
    {setting && <PinSetup onClose={() => setSetting(false)} onSaved={() => { setSetting(false); setPinOn(true); }} />}
    </>
  );
}
