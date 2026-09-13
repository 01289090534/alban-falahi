import { createClient } from '@supabase/supabase-js';

// Keep Cloudflare/Vite variables as the primary configuration. The publishable
// Supabase key is safe to ship in the browser; the fallback prevents the HR
// app from becoming unusable when Cloudflare build-time variables are missing.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://roycuuyceopmlmkjllrt.supabase.co';
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || 'sb_publishable_fG1i8HSgImBQMdSgj_4q6Q_CBE9Gw21';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
