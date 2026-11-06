import { useMemo, useState } from 'react';
import { updateItem, useStore } from '../store';
import type { ShellApi } from '../Shell';
import { Empty, SyncLine } from '../ui/bits';
import { ICheck, IPlus, ITasks } from '../ui/icons';
import { sameDay, time } from '../format';
import type { Item } from '../types';

export default function Tasks({ api }: { api: ShellApi }) {
  const items = useStore(s => s.items);
  const [showDone, setShowDone] = useState(false);
  const { open, done } = useMemo(() => {
    const t = items.filter(i => i.kind === 'task' || i.kind === 'reminder');
    const byWhen = (a: Item, b: Item) => (a.at ?? '9999').localeCompare(b.at ?? '9999') || b.created_at.localeCompare(a.created_at);
    return { open: t.filter(i => !i.done).sort(byWhen), done: t.filter(i => i.done).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 30) };
  }, [items]);

  return (
    <div className="jx-content jx-content--top">
      <div className="jx-titlebar">
        <div><h1 className="jx-title">Tasks</h1><SyncLine /></div>
        <button className="jx-roundbtn" aria-label="Add a task" onClick={() => api.tell({ kind: 'task' })}><IPlus size={19} /></button>
      </div>
      {open.length ? (
        <div className="jx-card jx-list jx-rise">
          {open.map(i => <TaskRow key={i.id} i={i} api={api} />)}
        </div>
      ) : (
        <Empty icon={<ITasks size={20} />} title={done.length ? 'All done' : 'No tasks yet'} text={done.length ? 'Nice. Enjoy the rest of your day.' : 'Try “Pay electricity bill Friday” in Tell Jaiye.'} />
      )}
      {done.length > 0 && (
        <>
          <div className="jx-sechead"><h2 className="jx-h3">Done</h2><button className="jx-link jx-link--sm" onClick={() => setShowDone(v => !v)}>{showDone ? 'Hide' : `Show ${done.length}`}</button></div>
          {showDone && <div className="jx-card jx-list jx-rise">{done.map(i => <TaskRow key={i.id} i={i} api={api} />)}</div>}
        </>
      )}
    </div>
  );
}

function TaskRow({ i, api }: { i: Item; api: ShellApi }) {
  const late = !i.done && i.at && new Date(i.at) < new Date();
  return (
    <div className={'jx-li jx-task' + (i.done ? ' is-done' : '')}>
      <button className="jx-check" role="checkbox" aria-checked={i.done} aria-label={i.done ? 'Mark not done' : 'Mark done'} onClick={() => updateItem(i.id, { done: !i.done })}>
        <ICheck size={13} />
      </button>
      <button className="jx-li__txt" onClick={() => api.edit(i)}>
        <b>{i.title}</b>
        {i.at && <small className={late ? 'jx-danger' : ''}>{sameDay(new Date(i.at), new Date()) ? 'Today' : new Date(i.at).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}, {time(i.at)}</small>}
      </button>
    </div>
  );
}
