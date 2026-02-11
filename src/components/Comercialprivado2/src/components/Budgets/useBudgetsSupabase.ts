import { useEffect, useState, useMemo, useCallback } from 'react';
import { budgetsSupabase } from './budgetsSupabase';

type BudgetTables =
  | 'budgets'
  | 'budget_posts'
  | 'budget_work_scales'
  | 'budget_functions'
  | 'budget_calculations'
  | 'budget_materials'
  | 'budget_equipments'
  | 'budget_uniforms'
  | 'capex'
  | 'cities'
  | 'config_functions'
  | 'config_benefits'
  | 'config_uniforms'
  | 'differentiated_benefits'
  | 'flywheel';

const queryCache = new Map<string, { data: any; timestamp: number; loading: boolean }>();
const CACHE_DURATION = 60000;
const pendingQueries = new Map<string, Promise<any>>();

export function useBudgetsSupabaseQuery<T = any>(
  table: BudgetTables,
  options?: {
    select?: string;
    filter?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => {
    return `${table}-${JSON.stringify(options)}`;
  }, [table, JSON.stringify(options)]);

  const fetchData = async () => {
    try {
      const cached = queryCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION && !cached.loading) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      if (pendingQueries.has(cacheKey)) {
        const pendingQuery = pendingQueries.get(cacheKey);
        if (pendingQuery) {
          const result = await pendingQuery;
          const query = await result;
          const { data: queryData } = await query;
          setData(queryData || []);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      const queryPromise = (async () => {
        queryCache.set(cacheKey, { data: [], timestamp: Date.now(), loading: true });

        let query = budgetsSupabase.from(table).select(options?.select || '*');

        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (options?.orderBy) {
          query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true
          });
        }

        return query;
      })();

      pendingQueries.set(cacheKey, queryPromise);

      const query = await queryPromise;
      const { data: result, error } = await query;

      if (error) throw error;

      queryCache.set(cacheKey, {
        data: result || [],
        timestamp: Date.now(),
        loading: false
      });

      pendingQueries.delete(cacheKey);

      setData(result || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      queryCache.delete(cacheKey);
      pendingQueries.delete(cacheKey);
      setLoading(false);
    }
  };

  const memoizedFetchData = useCallback(fetchData, [cacheKey]);

  useEffect(() => {
    memoizedFetchData();
  }, [cacheKey, memoizedFetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function clearBudgetsQueryCache(pattern?: string) {
  if (pattern) {
    Array.from(queryCache.keys()).forEach(key => {
      if (key.includes(pattern)) queryCache.delete(key);
    });
  } else {
    queryCache.clear();
  }
}

export function useBudgetsSupabaseInsert(table: BudgetTables) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      clearBudgetsQueryCache(table);

      console.log(`📝 [useBudgetsSupabaseInsert] Inserindo dados na tabela ${table}:`, data);

      const { data: result, error } = await budgetsSupabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`❌ [useBudgetsSupabaseInsert] Erro ao inserir em ${table}:`, error);
        throw new Error(error.message || 'Erro ao inserir dados');
      }

      console.log(`✅ [useBudgetsSupabaseInsert] Inserção bem-sucedida em ${table}:`, result);
      return result;
    } catch (err) {
      console.error(`💥 [useBudgetsSupabaseInsert] Operação de inserção falhou em ${table}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const upsert = async (data: any, conflictColumns?: string[]) => {
    try {
      setLoading(true);
      setError(null);

      clearBudgetsQueryCache(table);

      console.log('Upserting data:', data, 'conflict columns:', conflictColumns);

      let query = budgetsSupabase.from(table).upsert(data);
      query = query.select().single();

      const { data: result, error } = await query;

      if (error) {
        console.error('Supabase upsert error:', error);
        throw new Error(error.message || 'Erro ao fazer upsert dos dados');
      }

      console.log('Upsert successful:', result);
      return result;
    } catch (err) {
      console.error('Upsert operation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { insert, upsert, loading, error };
}

export function useBudgetsSupabaseUpdate(table: BudgetTables) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      clearBudgetsQueryCache(table);

      console.log('Updating data:', { id, data });

      const { data: result, error } = await budgetsSupabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(error.message || 'Erro ao atualizar dados');
      }

      console.log('Update successful:', result);
      return result;
    } catch (err) {
      console.error('Update operation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

export function useBudgetsSupabaseDelete(table: BudgetTables) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRecord = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      clearBudgetsQueryCache(table);

      console.log('Deleting record with id:', id);

      const { error } = await budgetsSupabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(error.message || 'Erro ao deletar dados');
      }

      console.log('Delete successful');
    } catch (err) {
      console.error('Delete operation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteRecord, loading, error };
}
