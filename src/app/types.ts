export type Kind = 'money' | 'meeting' | 'call' | 'meal' | 'task' | 'sleep' | 'reminder' | 'note' | 'habit';
export type Track = 'money' | 'meetings' | 'meals' | 'tasks' | 'sleep' | 'habits';

export type Item = {
  id: string;
  kind: Kind;
  title: string;
  amount: number | null;      // money: negative = spent, positive = income
  currency: string | null;
  at: string | null;          // ISO time it happens / happened
  done: boolean;
  source: 'typed' | 'voice' | 'gmail' | 'calendar' | 'contacts' | 'import';
  raw: string | null;
  data: Record<string, unknown>;
  deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type Prefs = {
  hideAmounts?: boolean;
  morningBriefing?: boolean;
  briefingTime?: string;
  meetingAlerts?: boolean;
  bedtimeReminder?: boolean;
};

export type Profile = {
  id: string;
  name: string;
  avatar_path: string | null;
  country: string | null;
  currency: string;
  tracks: Track[];
  wake_time: string;
  bed_time: string;
  monthly_budget: number | null;
  payday: number | null;
  meal_prep_day: number | null;
  prefs: Prefs;
  onboarded_at: string | null;
  updated_at?: string;
};

export type SyncState = { status: 'idle' | 'syncing' | 'offline' | 'error'; pending: number; lastSync: number | null };
