import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Notificacao, NotificacaoFormData, SituacaoNotificacao } from '../types/notificacao';
import { useDepartment } from '../contexts/DepartmentContext';

export function useNotificacoes() {
  const { selectedDepartment } = useDepartment();
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('department', selectedDepartment)
        .order('data_limite', { ascending: true });
        
      if (error) {
        setError(error.message);
        console.error('Erro ao buscar notificações:', error);
      } else {
        setItems((data ?? []) as Notificacao[]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('Erro na função fetchAll:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  const add = useCallback(async (payload: NotificacaoFormData) => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .insert({
          ...payload,
          department: selectedDepartment
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      const newItem = data as Notificacao;
      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (error) {
      console.error('Erro ao adicionar notificação:', error);
      throw error;
    }
  }, [selectedDepartment]);

  const update = useCallback(async (id: string, patch: Partial<NotificacaoFormData>) => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
        
      if (error) throw error;
      
      const updatedItem = data as Notificacao;
      setItems(prev => prev.map(n => n.id === id ? updatedItem : n));
      return updatedItem;
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      throw error;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setItems(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { items, loading, error, fetchAll, add, update, remove };
}

// Função para ordenação padrão
export function sortDefault(list: Notificacao[]): Notificacao[] {
  const rank = (s: SituacaoNotificacao): number => {
    switch (s) {
      case 'A fazer': return 0;
      case 'Não iremos responder': return 1;
      case 'Feito': return 2;
      default: return 3;
    }
  };

  return [...list].sort((a, b) => {
    const rankA = rank(a.situacao);
    const rankB = rank(b.situacao);
    
    if (rankA !== rankB) return rankA - rankB;
    
    // Se ambos são 'A fazer', ordenar por data_limite (mais próximo primeiro)
    if (rankA === 0) {
      return new Date(a.data_limite).getTime() - new Date(b.data_limite).getTime();
    }
    
    // Para outros casos, ordenar por data de criação
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}