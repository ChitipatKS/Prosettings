import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // แจ้งเตือนใน Console หากยังไม่ได้เซ็ตค่าคอนฟิกใน .env.local
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ Supabase URL or Anon Key is missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
