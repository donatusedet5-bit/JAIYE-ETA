import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { ShellApi } from '../Shell';
import { Avatar, dayKey } from '../ui/bits';
import { hasPin } from '../pin';
import { IBed, IBook, IChevron, IGear, IHabit, ILock, ITasks } from '../ui/icons';

export default function More({ api }: { api: ShellApi }) {
  const nav = useNavigate();
  const name = useStore(s => s.profile?.name ?? '');
  const items = useStore(s => s.items);
  const open = items.filter(i => (i.kind === 'task' || i.kind === 'reminder') && !i.done).length;
  const today = dayKey(new Date());
  const habits = items.filter(i => i.kind === 'habit');
  const ticked = habits.filter(h => Array.isArray(h.data.days) && (h.data.days as string[]).includes(today)).length;
  const lastNight = items.filter(i => i.kind === 'sleep' && typeof i.data.wake === 'string').sort((a, b) => b.at!.localeCompare(a.at!))[0];
  const slept = lastNight ? (new Date(lastNight.data.wake as string).getTime() - new Date(lastNight.at!).getTime()) / 3600000 : 0;
  const wrote = items.some(i => i.kind === 'journal' && dayKey(new Date(i.at ?? i.created_at)) === today);
  const locked = items.filter(i => i.kind === 'locker').length;
  const rows = [
    { Icon: ITasks, label: 'Tasks', sub: open ? `${open} open` : 'All done', tone: 'tasks', go: () => nav('/app/tasks') },
    { Icon: IBed, label: 'Sleep', sub: slept > 0 ? `Last night ${Math.floor(slept)}h ${Math.round((slept % 1) * 60)}m` : 'Log last night', tone: 'sleep', go: () => nav('/app/sleep') },
    { Icon: IHabit, label: 'Habits', sub: habits.length ? `${ticked} of ${habits.length} today` : 'Build a daily streak', tone: 'reminder', go: () => nav('/app/habits') },
    { Icon: IBook, label: 'Journal', sub: wrote ? 'Written today' : 'How was today?', tone: 'meeting', go: () => nav('/app/journal') },
    { Icon: ILock, label: 'Locker', sub: hasPin() ? `${locked ? locked + ' private note' + (locked === 1 ? '' : 's') + ' · ' : ''}PIN protected` : 'Private notes behind your PIN', tone: 'money', go: () => nav('/app/locker') },
  ];
  return (
    <div className="jx-content jx-content--top">
      <div className="jx-titlebar"><h1 className="jx-title">More</h1></div>
      <button className="jx-card jx-meCard jx-rise" onClick={api.me}>
        <Avatar size={52} />
        <span className="jx-li__txt"><b>{name || 'You'}</b><small>Profile, PIN and settings</small></span>
        <IChevron size={18} />
      </button>
      <div className="jx-card jx-list jx-rise" style={{ animationDelay: '30ms', marginTop: 12 }}>
        {rows.map(({ Icon, label, sub, tone, go }) => (
          <button key={label} className="jx-li" onClick={go}>
            <span className={`jx-row__icon jx-tag--${tone}`}><Icon size={16} /></span>
            <span className="jx-li__txt"><b>{label}</b><small>{sub}</small></span>
            <IChevron size={18} />
          </button>
        ))}
      </div>
      <div className="jx-card jx-list" style={{ marginTop: 12 }}>
        <button className="jx-li" onClick={api.me}>
          <span className="jx-row__icon"><IGear size={16} /></span>
          <span className="jx-li__txt"><b>Settings</b><small>Dark mode, PIN lock, hide amounts</small></span>
          <IChevron size={18} />
        </button>
      </div>
    </div>
  );
}
