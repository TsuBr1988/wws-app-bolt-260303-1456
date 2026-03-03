import { type SupabaseClient } from '@supabase/supabase-js';
import { getDatabase } from '@/lib/databaseResolver';
import { Database } from './database.types';

export const supabase = getDatabase('COMERCIAL_PRIVADO') as SupabaseClient<Database>;