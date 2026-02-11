import { useState, useEffect } from 'react';
import { configurationService, MonthlyGoal } from '../services/configurationService';
import { useYear } from '../contexts/YearContext';

export function useMonthlyGoals() {
  const { selectedYear } = useYear();
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const goals = await configurationService.getMonthlyGoals(selectedYear);
      
      // Se não houver metas, criar padrão
      if (goals.length === 0) {
        const defaultGoals: MonthlyGoal[] = Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          monthName: new Date(2025, index, 1).toLocaleDateString('pt-BR', { month: 'long' }),
          targetValue: 300000 // R$ 300k padrão
        }));
        
        await configurationService.updateMonthlyGoals(defaultGoals, selectedYear);
        setMonthlyGoals(defaultGoals);
      } else {
        setMonthlyGoals(goals);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Recarregar quando o ano selecionado mudar
    loadGoals();
  }, [selectedYear]);

  // Escutar mudanças nas metas vindas das configurações
  useEffect(() => {
    const handleGoalsUpdate = (event: CustomEvent) => {
      console.log('🔄 Hook useMonthlyGoals detectou atualização das metas:', event.detail.goals);
      if (event.detail.year === selectedYear) {
        setMonthlyGoals(event.detail.goals);
        setLoading(false);
        setError(null);
      }
    };

    window.addEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    };
  }, [selectedYear]);
  
  const updateGoals = async (newGoals: MonthlyGoal[]) => {
    try {
      setLoading(true);
      await configurationService.updateMonthlyGoals(newGoals, selectedYear);
      setMonthlyGoals(newGoals);
      
      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('monthlyGoalsUpdated', { 
        detail: { goals: newGoals, year: selectedYear } 
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar metas');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMonthGoal = (month: number): number => {
    const goal = monthlyGoals.find(g => g.month === month);
    return goal?.targetValue ?? 0;
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