import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://roycuuyceopmlmkjllrt.supabase.co';
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || 'sb_publishable_fG1i8HSgImBQMdSgj_4q6Q_CBE9Gw21';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storageKey: 'alban-falahi-hr-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
