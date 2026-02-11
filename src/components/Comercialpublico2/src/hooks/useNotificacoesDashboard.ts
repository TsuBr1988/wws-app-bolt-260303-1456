import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useDepartment } from '../contexts/DepartmentContext';

interface NotificacaoBasica {
  id: string;
  cliente: string;
  assunto: string;
  detalhes: string | null;
  data_recebimento: string;
  data_limite: string;
  situacao: 'A fazer' | 'Feito' | 'Não iremos responder';
  created_at: string;
}

// Hook para notificações vencendo hoje (status ≠ 'Feito')
export function useNotificacoesHoje() {
  const { selectedDepartment } = useDepartment();
  const [items, setItems] = useState<NotificacaoBasica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoje = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calcular início e fim do dia em São Paulo (UTC-3)
      const nowSP = new Date();
      const todayStartSP = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate(), 0, 0, 0);
      const todayEndSP = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate(), 23, 59, 59);
      
      // Converter para UTC para consulta no banco
      const todayStartUTC = new Date(todayStartSP.getTime() + 3 * 60 * 60 * 1000);
      const todayEndUTC = new Date(todayEndSP.getTime() + 3 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('department', selectedDepartment)
        .neq('situacao', 'Feito')
        .gte('data_limite', todayStartUTC.toISOString())
        .lte('data_limite', todayEndUTC.toISOString())
        .order('situacao', { ascending: true }) // A fazer primeiro
        .order('data_limite', { ascending: true }); // Mais próximo primeiro
        
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações de hoje');
      console.error('Erro ao buscar notificações de hoje:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchHoje();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchHoje, 60000);
    
    // Atualizar quando voltar o foco
    const handleFocus = () => fetchHoje();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchHoje]);

  return { items, loading, error, refetch: fetchHoje };
}

// Hook para notificações a vencer (próximos 30 dias, status = 'A fazer')
export function useNotificacoesAVencer() {
  const { selectedDepartment } = useDepartment();
  const [items, setItems] = useState<NotificacaoBasica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAVencer = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calcular amanhã e próximos 30 dias em São Paulo
      const nowSP = new Date();
      const tomorrowSP = new Date(nowSP.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStartSP = new Date(tomorrowSP.getFullYear(), tomorrowSP.getMonth(), tomorrowSP.getDate(), 0, 0, 0);
      
      const thirtyDaysFromNowSP = new Date(nowSP.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysEndSP = new Date(thirtyDaysFromNowSP.getFullYear(), thirtyDaysFromNowSP.getMonth(), thirtyDaysFromNowSP.getDate(), 23, 59, 59);
      
      // Converter para UTC para consulta no banco
      const tomorrowStartUTC = new Date(tomorrowStartSP.getTime() + 3 * 60 * 60 * 1000);
      const thirtyDaysEndUTC = new Date(thirtyDaysEndSP.getTime() + 3 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('department', selectedDepartment)
        .eq('situacao', 'A fazer')
        .gte('data_limite', tomorrowStartUTC.toISOString())
        .lte('data_limite', thirtyDaysEndUTC.toISOString())
        .order('data_limite', { ascending: true }); // Mais próximo primeiro
        
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações futuras');
      console.error('Erro ao buscar notificações a vencer:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchAVencer();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchAVencer, 60000);
    
    // Atualizar quando voltar o foco
    const handleFocus = () => fetchAVencer();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAVencer]);

  return { items, loading, error, refetch: fetchAVencer };
}

// Hook para notificações vencidas (data_limite < hoje, status != 'Feito')
export function useNotificacoesVencidas() {
  const { selectedDepartment } = useDepartment();
  const [items, setItems] = useState<NotificacaoBasica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVencidas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calcular início do dia de ontem em São Paulo (UTC-3)
      const nowSP = new Date();
      const yesterdayEndSP = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate() - 1, 23, 59, 59);
      
      // Converter para UTC para consulta no banco
      const yesterdayEndUTC = new Date(yesterdayEndSP.getTime() + 3 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('department', selectedDepartment)
        .neq('situacao', 'Feito')
        .lte('data_limite', yesterdayEndUTC.toISOString())
        .order('data_limite', { ascending: false }); // Mais recentes primeiro
        
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações vencidas');
      console.error('Erro ao buscar notificações vencidas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchVencidas();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchVencidas, 60000);
    
    // Atualizar quando voltar o foco
    const handleFocus = () => fetchVencidas();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchVencidas]);

  return { items, loading, error, refetch: fetchVencidas };
}