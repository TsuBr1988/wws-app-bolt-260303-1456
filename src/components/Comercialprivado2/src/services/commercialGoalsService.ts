import { supabase } from '../lib/supabase';

type CommercialGoal = {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  prize: string;
  target_type: 'points' | 'sales' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao' | 'valores_mensais_contratos';
  target_value: number;
  status: 'active' | 'completed' | 'expired';
  participants_ids?: string[];
  winner_ids?: string[];
  completion_date?: string;
  created_at: string;
  updated_at: string;
};

type CommercialGoalInsert = Omit<CommercialGoal, 'id' | 'created_at' | 'updated_at'>;
type CommercialGoalUpdate = Partial<CommercialGoalInsert>;

export const commercialGoalsService = {
  async getAllGoals() {
    const { data, error } = await supabase
      .from('commercial_goals')
      .select('*')
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getGoalById(id: string) {
    const { data, error } = await supabase
      .from('commercial_goals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createGoal(goal: CommercialGoalInsert) {
    try {
      console.log('🚀 Criando meta comercial no Supabase:', goal);

      const { data, error } = await supabase
        .from('commercial_goals')
        .insert(goal)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase ao criar meta comercial:', {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          goalData: goal
        });
        throw error;
      }

      console.log('✅ Meta comercial criada com sucesso:', data);
      return data;
    } catch (err) {
      console.error('💥 Erro inesperado ao criar meta comercial:', err);
      throw err;
    }
  },

  async updateGoal(id: string, goal: CommercialGoalUpdate) {
    const { data, error } = await supabase
      .from('commercial_goals')
      .update(goal)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGoal(id: string) {
    const { error } = await supabase
      .from('commercial_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async markGoalCompleted(id: string, completionDate: string) {
    const { data, error } = await supabase
      .from('commercial_goals')
      .update({
        status: 'completed',
        completion_date: completionDate
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markGoalExpired(id: string) {
    const { data, error } = await supabase
      .from('commercial_goals')
      .update({
        status: 'expired'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async assignWinners(id: string, winnerIds: string[]) {
    const { data, error } = await supabase
      .from('commercial_goals')
      .update({
        winner_ids: winnerIds
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGoalsByStatus(status: 'active' | 'completed' | 'expired') {
    const { data, error } = await supabase
      .from('commercial_goals')
      .select('*')
      .eq('status', status)
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async calculateGoalProgress(goal: CommercialGoal, employees: any[], weeklyPerformance: any[], proposals: any[], specificEmployeeId?: string) {
    const startDate = new Date(goal.start_date);
    const endDate = new Date(goal.end_date);

    let participantIds = goal.participants_ids && goal.participants_ids.length > 0
      ? goal.participants_ids
      : employees.filter(emp => emp.role !== 'Admin').map(emp => emp.id);

    if (specificEmployeeId) {
      participantIds = participantIds.filter(id => id === specificEmployeeId);
    }

    const debugLog = (...args: unknown[]) => {
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === 'true') console.log(...args);
    };

    debugLog('🎯 Calculando progresso da meta comercial:', {
      goalId: goal.id,
      targetType: goal.target_type,
      participantIds,
      participantCount: participantIds.length,
      hasSpecificParticipants: goal.participants_ids && goal.participants_ids.length > 0,
      specificEmployeeId: specificEmployeeId || 'todos'
    });

    const relevantPerformance = weeklyPerformance.filter(perf => {
      const weekDate = new Date(perf.week_ending_date);
      const isParticipant = participantIds.includes(perf.employee_id);
      const isInPeriod = weekDate >= startDate && weekDate <= endDate;

      return isParticipant && isInPeriod;
    });

    debugLog('📊 Performance relevante filtrada:', {
      totalPerformanceRecords: weeklyPerformance.length,
      filteredPerformanceRecords: relevantPerformance.length,
      participantIds,
      dateRange: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }
    });

    const actualParticipants = [...new Set(relevantPerformance.map(p => p.employee_id))];
    debugLog('👥 Participantes com dados no período:', {
      expectedParticipants: participantIds,
      actualParticipants,
      missingParticipants: participantIds.filter(id => !actualParticipants.includes(id))
    });

    if (goal.target_type === 'points') {
      const totalPoints = relevantPerformance.reduce((sum, perf) => sum + (perf.total_points || 0), 0);
      debugLog('🎯 Progresso de pontos:', { totalPoints, recordsCount: relevantPerformance.length });
      return totalPoints;

    } else if (goal.target_type === 'mql') {
      const totalMQL = relevantPerformance.reduce((sum, perf) => sum + (perf.mql || 0), 0);
      debugLog('📞 Progresso de MQL:', { totalMQL, recordsCount: relevantPerformance.length });
      return totalMQL;

    } else if (goal.target_type === 'visitas_agendadas') {
      const totalVisitas = relevantPerformance.reduce((sum, perf) => sum + (perf.visitas_agendadas || 0), 0);
      debugLog('📅 Progresso de visitas agendadas:', { totalVisitas, recordsCount: relevantPerformance.length });
      return totalVisitas;

    } else if (goal.target_type === 'contratos_assinados') {
      const totalContratos = relevantPerformance.reduce((sum, perf) => sum + (perf.contrato_assinado || 0), 0);
      debugLog('🤝 Progresso de contratos assinados:', { totalContratos, recordsCount: relevantPerformance.length });
      return totalContratos;

    } else if (goal.target_type === 'pontos_educacao') {
      const totalEducacao = relevantPerformance.reduce((sum, perf) => sum + (perf.pontos_educacao || 0), 0);
      debugLog('🎓 Progresso de pontos de educação:', { totalEducacao, recordsCount: relevantPerformance.length });
      return totalEducacao;

    } else if (goal.target_type === 'sales') {
      const relevantProposals = proposals.filter(proposal => {
        if (proposal.status !== 'Fechado') return false;

        const closingDate = proposal.closing_date ?
          new Date(proposal.closing_date) :
          new Date(proposal.created_at);

        const isInPeriod = closingDate >= startDate && closingDate <= endDate;

        const isParticipant = participantIds.includes(proposal.closer_id) ||
                             (proposal.sdr_id && participantIds.includes(proposal.sdr_id));

        debugLog('💰 Verificando proposta para vendas:', {
          client: proposal.client,
          closerId: proposal.closer_id,
          sdrId: proposal.sdr_id,
          isParticipant,
          isInPeriod,
          participantIds
        });

        return isInPeriod && isParticipant;
      });

      const totalSales = relevantProposals.reduce((sum, proposal) => sum + (proposal.total_value || 0), 0);
      debugLog('💰 Progresso de vendas:', {
        totalSales,
        proposalsCount: relevantProposals.length,
        proposals: relevantProposals.map(p => ({ client: p.client, value: p.total_value, closer: p.closer_id, sdr: p.sdr_id }))
      });
      return totalSales;

    } else if (goal.target_type === 'valores_mensais_contratos') {
      const relevantProposals = proposals.filter(proposal => {
        if (proposal.status !== 'Fechado') return false;

        const closingDate = proposal.closing_date ?
          new Date(proposal.closing_date) :
          new Date(proposal.created_at);

        const isInPeriod = closingDate >= startDate && closingDate <= endDate;

        const isParticipant = participantIds.includes(proposal.closer_id) ||
                             (proposal.sdr_id && participantIds.includes(proposal.sdr_id));

        debugLog('📅 Verificando proposta para valores mensais:', {
          client: proposal.client,
          monthlyValue: proposal.monthly_value,
          closerId: proposal.closer_id,
          sdrId: proposal.sdr_id,
          isParticipant,
          isInPeriod,
          participantIds
        });

        return isInPeriod && isParticipant;
      });

      const totalMonthlyValue = relevantProposals.reduce((sum, proposal) => sum + (proposal.monthly_value || 0), 0);
      debugLog('📅 Progresso de valores mensais de contratos:', {
        totalMonthlyValue,
        proposalsCount: relevantProposals.length,
        proposals: relevantProposals.map(p => ({
          client: p.client,
          monthlyValue: p.monthly_value,
          totalValue: p.total_value,
          closer: p.closer_id,
          sdr: p.sdr_id
        }))
      });
      return totalMonthlyValue;
    }

    debugLog('❌ Tipo de meta não reconhecido:', goal.target_type);
    return 0;
  }
};
