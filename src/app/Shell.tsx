import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './screens/Home';
import Calendar from './screens/Calendar';
import Money from './screens/Money';
import Meals from './screens/Meals';
import More from './screens/More';
import Tasks from './screens/Tasks';
import TellSheet, { type TellInit } from './screens/TellSheet';
import MoneySheet from './screens/MoneySheet';
import MeSheet from './screens/MeSheet';
import { ICal, IHome, IMeal, IMore, ISend, IWallet } from './ui/icons';
import type { Item } from './types';
import { Portal } from './ui/Portal';

const TABS = [
  { path: '/app', label: 'Home', Icon: IHome },
  { path: '/app/calendar', label: 'Calendar', Icon: ICal },
  { path: '/app/money', label: 'Money', Icon: IWallet },
  { path: '/app/meals', label: 'Meals', Icon: IMeal },
  { path: '/app/more', label: 'More', Icon: IMore },
];
// Screens reached from More keep the More tab lit.
const UNDER_MORE = ['/app/tasks'];

export type ShellApi = {
  tell: (init?: TellInit) => void;
  edit: (item: Item) => void;
  money: () => void;
  me: () => void;
  toast: (msg: string) => void;
};

export default function Shell() {
  const loc = useLocation();
  const nav = useNavigate();
  const [tell, setTell] = useState<TellInit | null>(null);
  const [money, setMoney] = useState(false);
  const [me, setMe] = useState(false);
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null);
  const api: ShellApi = {
    tell: (i = {}) => { setToast(null); setTell(i); },
    edit: item => setTell({ item }),
    money: () => { setToast(null); setMoney(true); },
    me: () => setMe(true),
    toast: msg => setToast(t => ({ msg, n: (t?.n ?? 0) + 1 })),
  };

  const path = loc.pathname.replace(/\/$/, '');
  const active = UNDER_MORE.includes(path) ? 4 : Math.max(0, TABS.findIndex(t => t.path === path));
  useEffect(() => { window.scrollTo({ top: 0 }); }, [path]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1800); return () => clearTimeout(t); }, [toast]);

  return (
    <div className="jx-shell">
      <main className="jx-page" key={path}>
        <Routes>
          <Route index element={<Home api={api} />} />
          <Route path="calendar" element={<Calendar api={api} />} />
          <Route path="money" element={<Money api={api} />} />
          <Route path="meals" element={<Meals api={api} />} />
          <Route path="more" element={<More api={api} />} />
          <Route path="tasks" element={<Tasks api={api} />} />
          <Route path="*" element={<Home api={api} />} />
        </Routes>
      </main>

      <TabBar active={active} onPick={i => nav(TABS[i].path)} onSend={() => api.tell()} onHold={api.money} />

      {tell && <TellSheet init={tell} onClose={() => setTell(null)} onSaved={msg => { setTell(null); api.toast(msg); }} />}
      {money && <MoneySheet onClose={() => setMoney(false)} onSaved={msg => { setMoney(false); api.toast(msg); }} />}
      {me && <MeSheet onClose={() => setMe(false)} />}
      {toast && <Portal><div className="jx-toast" role="status" key={toast.n}>{toast.msg}</div></Portal>}
    </div>
  );
}

function TabBar({ active, onPick, onSend, onHold }: { active: number; onPick: (i: number) => void; onSend: () => void; onHold: () => void }) {
  // Long-press the send button for quick money logging.
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const down = () => { held.current = false; timer.current = window.setTimeout(() => { held.current = true; onHold(); }, 420); };
  const up = () => window.clearTimeout(timer.current);
  return (
    <nav className="jx-tabbar" aria-label="Main">
      <div className="jx-tabs">
        {TABS.map(({ label, Icon }, i) => (
          <button key={label} className={'jx-tab' + (i === active ? ' is-on' : '')} aria-current={i === active ? 'page' : undefined} onClick={() => onPick(i)}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </div>
      <button className="jx-send" aria-label="Tell Jaiye (hold to log money)"
        onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        onContextMenu={e => e.preventDefault()}
        onClick={() => { if (!held.current) onSend(); held.current = false; }}>
        <ISend size={22} />
      </button>
    </nav>
  );
}
