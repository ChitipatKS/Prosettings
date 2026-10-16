import { createClient as createBrowserSupabaseClient } from './supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// ใช้ Browser Client ตัวใหม่ที่รองรับ Cookie
export const supabase = createBrowserSupabaseClient();