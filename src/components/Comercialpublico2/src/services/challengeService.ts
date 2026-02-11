import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type ChallengeInsert = Database['public']['Tables']['challenges']['Insert'];
type ChallengeUpdate = Database['public']['Tables']['challenges']['Update'];

export const challengeService = {
  // Buscar todos os desafios
  async getAllChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Buscar desafio por ID
  async getChallengeById(id: string) {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo desafio
  async createChallenge(challenge: ChallengeInsert) {
    try {
      console.log('🚀 Criando desafio no Supabase:', challenge);
      
      const { data, error } = await supabase
        .from('challenges')
        .insert(challenge)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase ao criar desafio:', {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          challengeData: challenge
        });
        throw error;
      }
      
      console.log('✅ Desafio criado com sucesso:', data);
      return data;
    } catch (err) {
      console.error('💥 Erro inesperado ao criar desafio:', err);
      throw err;
    }
  },

  // Atualizar desafio
  async updateChallenge(id: string, challenge: ChallengeUpdate) {
    const { data, error } = await supabase
      .from('challenges')
      .update(challenge)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar desafio
  async deleteChallenge(id: string) {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Marcar desafio como concluído
  async markChallengeCompleted(id: string, completionDate: string) {
    const { data, error } = await supabase
      .from('challenges')
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

  // Marcar desafio como expirado
  async markChallengeExpired(id: string) {
    const { data, error } = await supabase
      .from('challenges')
      .update({
        status: 'expired'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atribuir vencedores a um desafio
  async assignWinners(id: string, winnerIds: string[]) {
    const { data, error } = await supabase
      .from('challenges')
      .update({
        winner_ids: winnerIds
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar desafios por status
  async getChallengesByStatus(status: 'active' | 'completed' | 'expired') {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', status)
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Calcular progresso de um desafio
  async calculateChallengeProgress(challenge: Challenge, employees: any[], weeklyPerformance: any[], proposals: any[]) {
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    // IMPORTANTE: Se há participantes específicos, considerar APENAS eles
    // Se não há participantes específicos (array vazio/null), considerar todos os funcionários não-admin
    const participantIds = challenge.participants_ids && challenge.participants_ids.length > 0 
      ? challenge.participants_ids 
      : employees.filter(emp => emp.role !== 'Admin').map(emp => emp.id);

    console.log('🎯 Calculando progresso do desafio:', {
      challengeId: challenge.id,
      targetType: challenge.target_type,
      participantIds,
      participantCount: participantIds.length,
      hasSpecificParticipants: challenge.participants_ids && challenge.participants_ids.length > 0
    });

    // Filtrar performance semanal APENAS dos participantes no período do desafio
    const relevantPerformance = weeklyPerformance.filter(perf => {
      const weekDate = new Date(perf.week_ending_date);
      const isParticipant = participantIds.includes(perf.employee_id);
      const isInPeriod = weekDate >= startDate && weekDate <= endDate;
      
      return isParticipant && isInPeriod;
    });

    console.log('📊 Performance relevante filtrada:', {
      totalPerformanceRecords: weeklyPerformance.length,
      filteredPerformanceRecords: relevantPerformance.length,
      participantIds,
      dateRange: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }
    });

    // Garantir que estamos considerando apenas os participantes corretos
    const actualParticipants = [...new Set(relevantPerformance.map(p => p.employee_id))];
    console.log('👥 Participantes com dados no período:', {
      expectedParticipants: participantIds,
      actualParticipants,
      missingParticipants: participantIds.filter(id => !actualParticipants.includes(id))
    });
    
    if (challenge.target_type === 'points') {
      // Calcular soma de pontos da performance semanal
      const totalPoints = relevantPerformance.reduce((sum, perf) => sum + (perf.total_points || 0), 0);
      console.log('🎯 Progresso de pontos:', { totalPoints, recordsCount: relevantPerformance.length });
      return totalPoints;
      
    } else if (challenge.target_type === 'mql') {
      // Calcular soma de MQLs da performance semanal
      const totalMQL = relevantPerformance.reduce((sum, perf) => sum + (perf.mql || 0), 0);
      console.log('📞 Progresso de MQL:', { totalMQL, recordsCount: relevantPerformance.length });
      return totalMQL;
      
    } else if (challenge.target_type === 'visitas_agendadas') {
      // Calcular soma de visitas agendadas da performance semanal
      const totalVisitas = relevantPerformance.reduce((sum, perf) => sum + (perf.visitas_agendadas || 0), 0);
      console.log('📅 Progresso de visitas agendadas:', { totalVisitas, recordsCount: relevantPerformance.length });
      return totalVisitas;
      
    } else if (challenge.target_type === 'contratos_assinados') {
      // Calcular soma de contratos assinados da performance semanal
      const totalContratos = relevantPerformance.reduce((sum, perf) => sum + (perf.contrato_assinado || 0), 0);
      console.log('🤝 Progresso de contratos assinados:', { totalContratos, recordsCount: relevantPerformance.length });
      return totalContratos;
      
    } else if (challenge.target_type === 'pontos_educacao') {
      // Calcular soma de pontos de educação da performance semanal
      const totalEducacao = relevantPerformance.reduce((sum, perf) => sum + (perf.pontos_educacao || 0), 0);
      console.log('🎓 Progresso de pontos de educação:', { totalEducacao, recordsCount: relevantPerformance.length });
      return totalEducacao;
      
    } else if (challenge.target_type === 'sales') {
      // Calcular soma de vendas APENAS das propostas com status "Contrato assinado"
      const relevantProposals = proposals.filter(proposal => {
        if (proposal.status !== 'Contrato assinado') return false;

        // Excluir propostas que não contam para meta comercial
        if (proposal.nao_conta_meta_comercial === true || proposal.nao_gera_comissao === true) {
          console.log('⚠️ Proposta excluída do desafio (não conta para meta):', {
            client: proposal.client,
            naoContaMetaComercial: proposal.nao_conta_meta_comercial,
            naoGeraComissao: proposal.nao_gera_comissao
          });
          return false;
        }

        // Usar data_assinatura se disponível, senão usar closing_date
        const signatureDate = proposal.data_assinatura ?
          new Date(proposal.data_assinatura) :
          (proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at));

        const isInPeriod = signatureDate >= startDate && signatureDate <= endDate;

        // CRÍTICO: Verificar se o closer OU sdr está na lista de participantes
        const isParticipant = participantIds.includes(proposal.closer_id) ||
                             (proposal.sdr_id && participantIds.includes(proposal.sdr_id));

        console.log('💰 Verificando proposta para vendas:', {
          client: proposal.client,
          closerId: proposal.closer_id,
          sdrId: proposal.sdr_id,
          isParticipant,
          isInPeriod,
          status: proposal.status,
          signatureDate: signatureDate.toISOString().split('T')[0],
          participantIds
        });

        return isInPeriod && isParticipant;
      });

      const totalSales = relevantProposals.reduce((sum, proposal) => {
        const nossoLance = typeof proposal.nosso_lance === 'string'
          ? parseFloat(proposal.nosso_lance)
          : (proposal.nosso_lance || 0);
        return sum + nossoLance;
      }, 0);

      console.log('💰 Progresso de vendas:', {
        totalSales,
        proposalsCount: relevantProposals.length,
        proposals: relevantProposals.map(p => ({
          client: p.client,
          nossoLance: p.nosso_lance,
          totalValue: p.total_value,
          closer: p.closer_id,
          sdr: p.sdr_id
        }))
      });
      return totalSales;

    } else if (challenge.target_type === 'monthly_value') {
      // Calcular soma do VALOR MENSAL dos contratos assinados
      const relevantProposals = proposals.filter(proposal => {
        if (proposal.status !== 'Contrato assinado') return false;

        // Excluir propostas que não contam para meta comercial
        if (proposal.nao_conta_meta_comercial === true || proposal.nao_gera_comissao === true) {
          console.log('⚠️ Proposta excluída do desafio (não conta para meta):', {
            client: proposal.client,
            naoContaMetaComercial: proposal.nao_conta_meta_comercial,
            naoGeraComissao: proposal.nao_gera_comissao
          });
          return false;
        }

        // Usar data_assinatura se disponível, senão usar closing_date
        const signatureDate = proposal.data_assinatura ?
          new Date(proposal.data_assinatura) :
          (proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at));

        const isInPeriod = signatureDate >= startDate && signatureDate <= endDate;

        // CRÍTICO: Verificar se o closer OU sdr está na lista de participantes
        const isParticipant = participantIds.includes(proposal.closer_id) ||
                             (proposal.sdr_id && participantIds.includes(proposal.sdr_id));

        console.log('💵 Verificando proposta para valor mensal:', {
          client: proposal.client,
          closerId: proposal.closer_id,
          sdrId: proposal.sdr_id,
          isParticipant,
          isInPeriod,
          status: proposal.status,
          monthlyValue: proposal.monthly_value,
          signatureDate: signatureDate.toISOString().split('T')[0],
          participantIds
        });

        return isInPeriod && isParticipant;
      });

      const totalMonthlyValue = relevantProposals.reduce((sum, proposal) => {
        const monthlyValue = typeof proposal.monthly_value === 'string'
          ? parseFloat(proposal.monthly_value)
          : (proposal.monthly_value || 0);
        return sum + monthlyValue;
      }, 0);

      console.log('💵 Progresso de valor mensal:', {
        totalMonthlyValue,
        proposalsCount: relevantProposals.length,
        proposals: relevantProposals.map(p => ({
          client: p.client,
          monthlyValue: p.monthly_value,
          months: p.months,
          closer: p.closer_id,
          sdr: p.sdr_id
        }))
      });
      return totalMonthlyValue;
    }

    console.log('❌ Tipo de meta não reconhecido:', challenge.target_type);
    return 0;
  }
};