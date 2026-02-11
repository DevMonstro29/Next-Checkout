import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const SUPABASE_URL = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = rawKey || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
