import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_BUDGETS_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_BUDGETS_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Budgets Supabase environment variables');
}

type GlobalSupabaseCache = {
  __wwsSupabaseClients?: Record<string, SupabaseClient<any>>;
};

const globalCache = globalThis as unknown as GlobalSupabaseCache;
const cacheKey = `orcamentos:${supabaseUrl}`;

const cachedClient = globalCache.__wwsSupabaseClients?.[cacheKey] as SupabaseClient | undefined;

export const supabase: SupabaseClient = cachedClient ?? createClient(supabaseUrl, supabaseAnonKey);

if (import.meta.env.DEV) {
  if (!globalCache.__wwsSupabaseClients) globalCache.__wwsSupabaseClients = {};
  globalCache.__wwsSupabaseClients[cacheKey] = supabase;
}
