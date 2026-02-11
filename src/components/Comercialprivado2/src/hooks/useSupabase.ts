import { useEffect, useState } from 'react';
import { useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Tables = Database['public']['Tables'];

// Cache global otimizado
const queryCache = new Map<string, { data: any; timestamp: number; loading: boolean }>();
const CACHE_DURATION = 60000; // 1 minuto para reduzir queries

// Debounce para evitar múltiplas queries simultâneas
const pendingQueries = new Map<string, Promise<any>>();

// Hook para buscar dados de uma tabela
export function useSupabaseQuery<T extends keyof Tables>(
  table: T,
  options?: {
    select?: string;
    filter?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }
) {
  const [data, setData] = useState<Tables[T]['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Criar chave única para cache
  const cacheKey = useMemo(() => {
    return `${table}-${JSON.stringify(options)}`;
  }, [table, JSON.stringify(options)]);

  const fetchData = async () => {
    try {
      // Verificar cache antes de fazer query
      const cached = queryCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION && !cached.loading) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Se já existe query pendente, aguardar
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

      // Criar promise para evitar queries duplicadas
      const queryPromise = (async () => {
        // Marcar como loading no cache
        queryCache.set(cacheKey, { data: [], timestamp: Date.now(), loading: true });
        
        let query = supabase.from(table).select(options?.select || '*');

        // Aplicar filtros
        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        // Aplicar ordenação
        if (options?.orderBy) {
          query = query.order(options.orderBy.column, { 
            ascending: options.orderBy.ascending ?? true 
          });
        }

        return query;
      })();

      // Armazenar query pendente
      pendingQueries.set(cacheKey, queryPromise);

      const query = await queryPromise;
      const { data: result, error } = await query;

      if (error) throw error;
      
      // Salvar no cache
      queryCache.set(cacheKey, { 
        data: result || [], 
        timestamp: Date.now(), 
        loading: false 
      });
      
      // Remover da lista de queries pendentes
      pendingQueries.delete(cacheKey);
      
      setData(result || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Remover do cache em caso de erro
      queryCache.delete(cacheKey);
      pendingQueries.delete(cacheKey);
      setLoading(false);
    } finally {
      // Garantir que loading seja sempre false no final
      setLoading(false);
    }
  };

  const memoizedFetchData = useCallback(fetchData, [cacheKey]);

  useEffect(() => {
    // Sempre executar a função de busca/cache
    memoizedFetchData();
  }, [cacheKey, memoizedFetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Função para limpar cache quando necessário
export function clearQueryCache(pattern?: string) {
  if (pattern) {
    Array.from(queryCache.keys()).forEach(key => {
      if (key.includes(pattern)) queryCache.delete(key);
    });
  } else {
    queryCache.clear();
  }
}

// Hook para inserir dados
export function useSupabaseInsert<T extends keyof Tables>(table: T) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = async (data: Tables[T]['Insert']) => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpar cache relacionado à tabela
      clearQueryCache(table);
      
      console.log(`📝 [useSupabaseInsert] Inserindo dados na tabela ${table}:`, data);
      
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`❌ [useSupabaseInsert] Erro ao inserir em ${table}:`, error);
        throw new Error(error.message || 'Erro ao inserir dados');
      }
      
      console.log(`✅ [useSupabaseInsert] Inserção bem-sucedida em ${table}:`, result);
      return result;
    } catch (err) {
      console.error(`💥 [useSupabaseInsert] Operação de inserção falhou em ${table}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      console.log(`🏁 [useSupabaseInsert] Finalizando inserção em ${table}`);
      setLoading(false);
    }
  };

  // Função upsert específica para weekly_performance
  const upsert = async (data: Tables[T]['Insert'], conflictColumns?: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpar cache relacionado à tabela
      clearQueryCache(table);
      
      console.log('Upserting data:', data, 'conflict columns:', conflictColumns);
      
      let query = supabase.from(table).upsert(data);
      
      // Para weekly_performance, usar a constraint correta
      if (table === 'weekly_performance' && conflictColumns) {
        query = query.select().single();
      } else {
        query = query.select().single();
      }
      
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

// Hook para atualizar dados
export function useSupabaseUpdate<T extends keyof Tables>(table: T) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, data: Tables[T]['Update']) => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpar cache relacionado à tabela
      clearQueryCache(table);
      
      console.log('Updating data:', { id, data });
      
      const { data: result, error } = await supabase
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

// Hook para deletar dados
export function useSupabaseDelete<T extends keyof Tables>(table: T) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRecord = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpar cache relacionado à tabela
      clearQueryCache(table);
      
      console.log('Deleting record with id:', id);
      
      const { error } = await supabase
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