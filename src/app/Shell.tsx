import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './screens/Home';
import Calendar from './screens/Calendar';
import Money from './screens/Money';
import Tasks from './screens/Tasks';
import TellSheet, { type TellInit } from './screens/TellSheet';
import MeSheet from './screens/MeSheet';
import { ICal, IHome, ISend, ITasks, IWallet } from './ui/icons';
import type { Item } from './types';
import { Portal } from './ui/Portal';

const TABS = [
  { path: '/app', label: 'Home', Icon: IHome },
  { path: '/app/calendar', label: 'Calendar', Icon: ICal },
  { path: '/app/money', label: 'Money', Icon: IWallet },
  { path: '/app/tasks', label: 'Tasks', Icon: ITasks },
];

export type ShellApi = { tell: (init?: TellInit) => void; edit: (item: Item) => void; me: () => void };

export default function Shell() {
  const loc = useLocation();
  const nav = useNavigate();
  const [tell, setTell] = useState<TellInit | null>(null);
  const [me, setMe] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const api: ShellApi = { tell: (i = {}) => setTell(i), edit: item => setTell({ item }), me: () => setMe(true) };

  const active = Math.max(0, TABS.findIndex(t => t.path === loc.pathname.replace(/\/$/, '')));
  useEffect(() => { window.scrollTo({ top: 0 }); }, [active]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);

  return (
    <div className="jx-shell">
      <main className="jx-page" key={active}>
        <Routes>
          <Route index element={<Home api={api} />} />
          <Route path="calendar" element={<Calendar api={api} />} />
          <Route path="money" element={<Money api={api} />} />
          <Route path="tasks" element={<Tasks api={api} />} />
          <Route path="*" element={<Home api={api} />} />
        </Routes>
      </main>

      <TabBar active={active} onPick={i => nav(TABS[i].path)} onSend={() => api.tell()} />

      {tell && <TellSheet init={tell} onClose={() => setTell(null)} onSaved={msg => { setTell(null); setToast(msg); }} />}
      {me && <MeSheet onClose={() => setMe(false)} />}
      {toast && <Portal><div className="jx-toast" role="status">{toast}</div></Portal>}
    </div>
  );
}

function TabBar({ active, onPick, onSend }: { active: number; onPick: (i: number) => void; onSend: () => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ x: 0, w: 0 });
  useLayoutEffect(() => {
    const measure = () => { const el = refs.current[active]; if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth }); };
    measure();
    const ro = new ResizeObserver(measure);
    refs.current.forEach(el => el && ro.observe(el));
    return () => ro.disconnect();
  }, [active]);
  return (
    <nav className="jx-tabbar" aria-label="Main">
      <div className="jx-tabs">
        <span className="jx-tabs__pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
        {TABS.map(({ label, Icon }, i) => (
          <button key={label} ref={el => { refs.current[i] = el; }} className={'jx-tab' + (i === active ? ' is-on' : '')} aria-current={i === active ? 'page' : undefined} aria-label={label} onClick={() => onPick(i)}>
            <Icon size={19} />{i === active && <span>{label}</span>}
          </button>
        ))}
      </div>
      <button className="jx-send" aria-label="Tell Jaiye" onClick={onSend}><ISend size={22} /></button>
    </nav>
  );
}
