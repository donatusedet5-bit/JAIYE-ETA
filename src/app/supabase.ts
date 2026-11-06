import { createClient } from '@supabase/supabase-js';

// Public values: safe in the browser. Row-level security keeps each person's data private.
const URL = 'https://utnmtexciuatcfjgsdvb.supabase.co';
const KEY = 'sb_publishable_RcgX3FE6znInBrS6AO9CiQ_b3OxIjWS';

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'jaiye-auth' },
});
