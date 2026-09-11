import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://roycuuyceopmlmkjllrt.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_fG1i8HSgImBQMdSgj_4q6Q_CBE9Gw21';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
