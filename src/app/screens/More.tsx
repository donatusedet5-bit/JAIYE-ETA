import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { ShellApi } from '../Shell';
import { Avatar } from '../ui/bits';
import { IBed, IBook, IChevron, IGear, IHabit, ILock, ITasks } from '../ui/icons';

export default function More({ api }: { api: ShellApi }) {
  const nav = useNavigate();
  const name = useStore(s => s.profile?.name ?? '');
  const open = useStore(s => s.items.filter(i => (i.kind === 'task' || i.kind === 'reminder') && !i.done).length);
  const rows = [
    { Icon: ITasks, label: 'Tasks', sub: open ? `${open} open` : 'All done', tone: 'tasks', go: () => nav('/app/tasks') },
    { Icon: IBed, label: 'Sleep', sub: 'Coming soon', tone: 'sleep' },
    { Icon: IHabit, label: 'Habits', sub: 'Coming soon', tone: 'reminder' },
    { Icon: IBook, label: 'Journal', sub: 'Coming soon', tone: 'meeting' },
    { Icon: ILock, label: 'Locker', sub: 'Coming soon', tone: 'money' },
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
          <button key={label} className={'jx-li' + (go ? '' : ' is-soon')} onClick={go} disabled={!go}>
            <span className={`jx-row__icon jx-tag--${tone}`}><Icon size={16} /></span>
            <span className="jx-li__txt"><b>{label}</b><small>{sub}</small></span>
            {go && <IChevron size={18} />}
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
