import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import '../styles/app.css';
import { supabase } from './supabase';
import { loadFor, useStore, wireSync } from './store';
import { hasPin, watchLock } from './pin';
import Welcome from './screens/Welcome';
import Onboarding from './screens/Onboarding';
import PinLock from './screens/PinLock';
import Shell from './Shell';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [locked, setLocked] = useState(() => hasPin());
  const ready = useStore(s => s.ready);
  const onboarded = useStore(s => !!s.profile?.onboarded_at);
  const userId = useStore(s => s.userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user.id;
    if (uid && uid !== userId) { wireSync(); void loadFor(uid); }
  }, [session?.user.id, userId]);

  useEffect(() => watchLock(() => setLocked(true)), []);

  let view;
  if (session === undefined || (session && !ready)) view = <Boot />;
  else if (!session) view = <Welcome />;
  else if (!onboarded) view = <Onboarding />;
  else if (locked && hasPin()) view = <PinLock onUnlock={() => setLocked(false)} />;
  else view = <Shell />;

  return <div className="jx">{view}</div>;
}

function Boot() {
  return (
    <div className="jx-bootscreen" aria-label="Opening Jaiye">
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="64" cy="18" r="10.5" fill="#fff" /><path d="M64 40V80L36 58" stroke="#fff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
}
