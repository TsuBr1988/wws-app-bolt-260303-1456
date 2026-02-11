import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_BUDGETS_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_BUDGETS_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Budgets Supabase environment variables');
  console.error('Please set VITE_BUDGETS_SUPABASE_URL and VITE_BUDGETS_SUPABASE_ANON_KEY in your .env file');
  throw new Error('Missing Budgets Supabase environment variables');
}

type GlobalSupabaseCache = {
  __wwsSupabaseClients?: Record<string, SupabaseClient<any>>;
};

const globalCache = globalThis as unknown as GlobalSupabaseCache;
const cacheKey = `budgets:${supabaseUrl}`;

const cachedClient = globalCache.__wwsSupabaseClients?.[cacheKey] as SupabaseClient | undefined;

export const budgetsSupabase: SupabaseClient = cachedClient ?? createClient(supabaseUrl, supabaseAnonKey);

if (import.meta.env.DEV) {
  if (!globalCache.__wwsSupabaseClients) globalCache.__wwsSupabaseClients = {};
  globalCache.__wwsSupabaseClients[cacheKey] = budgetsSupabase;
}
