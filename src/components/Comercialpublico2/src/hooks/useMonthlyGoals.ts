import { useState, useEffect } from 'react';
import { monthlyGoalsService, MonthlyGoal } from '../services/monthlyGoalsService';
import { useYear } from '../contexts/YearContext';
import { useDepartment } from '../contexts/DepartmentContext';

export function useMonthlyGoals() {
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Carregando metas para ${selectedDepartment} - ${selectedYear}`);
      
      try {
        const goals = await monthlyGoalsService.getMonthlyGoals(selectedYear, selectedDepartment);
        setMonthlyGoals(goals);
        console.log(`✅ Metas carregadas para ${selectedDepartment}: ${goals.length} meses`);
      } catch (fetchError) {
        console.error('❌ Erro específico ao buscar metas:', fetchError);
        
        // Verificar se é erro de rede/conexão
        if (fetchError.message?.includes('Failed to fetch') || 
            fetchError.message?.includes('NetworkError') || 
            fetchError.message?.includes('ERR_INTERNET_DISCONNECTED')) {
          
          console.error('🌐 Erro de conectividade detectado - usando metas padrão');
          
          // Criar metas padrão e mostrar erro específico de conexão
          const defaultGoals = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            year: selectedYear,
            monthName: new Date(selectedYear, index, 1).toLocaleDateString('pt-BR', { month: 'long' }),
            targetValue: selectedDepartment === 'Petrobras' ? 500000 : 300000
          }));
          
          setMonthlyGoals(defaultGoals);
          setError('⚠️ Problema de conexão com o banco de dados. Usando metas padrão. Verifique: 1) Arquivo .env existe 2) Supabase URL/Key corretos 3) Internet conectada');
          return;
        }
        
        // Fallback: criar metas padrão se falhar
        const defaultGoals = Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          year: selectedYear,
          monthName: new Date(selectedYear, index, 1).toLocaleDateString('pt-BR', { month: 'long' }),
          targetValue: selectedDepartment === 'Petrobras' ? 500000 : 300000 // Padrão baseado no departamento
        }));
        
        setMonthlyGoals(defaultGoals);
        setError('Usando metas padrão - erro no banco de dados: ' + (fetchError.message || 'Erro desconhecido'));
        console.log('🔄 Usando metas padrão devido ao erro de conexão');
      }
      
    } catch (err) {
      console.error('❌ Erro geral ao carregar metas:', err);
      
      // Criar metas padrão em caso de erro total
      const defaultGoals = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        year: selectedYear,
        monthName: new Date(selectedYear, index, 1).toLocaleDateString('pt-BR', { month: 'long' }),
        targetValue: selectedDepartment === 'Petrobras' ? 500000 : 300000 // Padrão baseado no departamento
      }));
      
      setMonthlyGoals(defaultGoals);
      setError('❌ Erro crítico: Verifique se o arquivo .env existe e contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY válidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Recarregar quando o ano selecionado mudar
    loadGoals();
  }, [selectedYear, selectedDepartment]);

  // Escutar mudanças nas metas vindas das configurações
  useEffect(() => {
    const handleGoalsUpdate = (event: CustomEvent) => {
      console.log('🔄 Hook useMonthlyGoals detectou atualização das metas:', event.detail);
      if (event.detail.year === selectedYear && event.detail.department === selectedDepartment) {
        setMonthlyGoals(event.detail.goals);
        setLoading(false);
        setError(null);
      }
    };

    window.addEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    };
  }, [selectedYear, selectedDepartment]);
  
  const updateGoals = async (newGoals: MonthlyGoal[]) => {
    try {
      setLoading(true);
      console.log('💾 Atualizando metas via hook para', selectedDepartment, ':', newGoals);
      
      await monthlyGoalsService.updateMonthlyGoals(newGoals, selectedDepartment);
      setMonthlyGoals(newGoals);
      
      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('monthlyGoalsUpdated', { 
        detail: { goals: newGoals, year: selectedYear, department: selectedDepartment } 
      }));
      
      console.log('✅ Metas atualizadas com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar metas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar metas');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMonthGoal = (month: number): number => {
    const goal = monthlyGoals.find(g => g.month === month);
    return goal?.targetValue ?? (selectedDepartment === 'Petrobras' ? 500000 : 300000); // Fallback baseado no departamento
  };

  const getAnnualGoal = (): number => {
    return monthlyGoals.reduce((sum, goal) => sum + goal.targetValue, 0);
  };

  return {
    monthlyGoals,
    selectedYear,
    loading,
    error,
    updateGoals,
    refetch: loadGoals,
    getMonthGoal,
    getAnnualGoal
  };
}