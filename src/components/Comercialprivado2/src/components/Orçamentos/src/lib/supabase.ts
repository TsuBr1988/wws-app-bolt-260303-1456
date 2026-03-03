import { createClient } from '@supabase/supabase-js';
import { getDatabase } from '@/lib/databaseResolver';

const budgetsUrl = import.meta.env.VITE_BUDGETS_SUPABASE_URL as string | undefined;
const budgetsAnonKey = import.meta.env.VITE_BUDGETS_SUPABASE_ANON_KEY as string | undefined;

export const usingDedicatedBudgetsDb = Boolean(budgetsUrl && budgetsAnonKey);

export const supabase = usingDedicatedBudgetsDb
	? createClient(budgetsUrl!, budgetsAnonKey!)
	: getDatabase('COMERCIAL');

if (import.meta.env.DEV && !usingDedicatedBudgetsDb) {
	console.warn('⚠️ Orçamentos usando banco GERAL por fallback. Defina VITE_BUDGETS_SUPABASE_URL e VITE_BUDGETS_SUPABASE_ANON_KEY para usar um banco dedicado de orçamentos.');
}
