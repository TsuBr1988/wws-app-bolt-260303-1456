import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const requiredEnv = (key: keyof ImportMetaEnv): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`[Supabase] Missing environment variable: ${key}`);
  }
  return value;
};

type GlobalSupabaseCache = {
  __wwsSupabaseClients?: Record<string, SupabaseClient<any>>;
};

const getCachedClient = (cacheKey: string, url: string, anonKey: string): SupabaseClient => {
  const globalCache = globalThis as unknown as GlobalSupabaseCache;
  const cachedClient = globalCache.__wwsSupabaseClients?.[cacheKey] as SupabaseClient | undefined;
  const client = cachedClient ?? createClient(url, anonKey);

  if (import.meta.env.DEV) {
    if (!globalCache.__wwsSupabaseClients) globalCache.__wwsSupabaseClients = {};
    globalCache.__wwsSupabaseClients[cacheKey] = client;
  }

  return client;
};

const geralUrl = requiredEnv('VITE_SUPABASE_GERAL_URL');
const geralAnon = requiredEnv('VITE_SUPABASE_GERAL_ANON');
const financasUrl = requiredEnv('VITE_SUPABASE_FINANCAS_URL');
const financasAnon = requiredEnv('VITE_SUPABASE_FINANCAS_ANON');
const comercialPrivadoUrl = requiredEnv('VITE_SUPABASE_COMERCIAL_PRIVADO_URL');
const comercialPrivadoAnon = requiredEnv('VITE_SUPABASE_COMERCIAL_PRIVADO_ANON');
const comercialPublicoUrl = requiredEnv('VITE_SUPABASE_COMERCIAL_PUBLICO_URL');
const comercialPublicoAnon = requiredEnv('VITE_SUPABASE_COMERCIAL_PUBLICO_ANON');

export const supabaseGeral = getCachedClient(`geral:${geralUrl}`, geralUrl, geralAnon);
export const supabaseFinancas = getCachedClient(`financas:${financasUrl}`, financasUrl, financasAnon);
export const supabaseComercialPrivado = getCachedClient(
  `comercial-privado:${comercialPrivadoUrl}`,
  comercialPrivadoUrl,
  comercialPrivadoAnon
);
export const supabaseComercialPublico = getCachedClient(
  `comercial-publico:${comercialPublicoUrl}`,
  comercialPublicoUrl,
  comercialPublicoAnon
);
