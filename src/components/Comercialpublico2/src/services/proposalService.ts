import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Proposal = Database['public']['Tables']['proposals']['Row'];
type ProposalInsert = Database['public']['Tables']['proposals']['Insert'];
type ProposalUpdate = Database['public']['Tables']['proposals']['Update'];
type ProbabilityScores = Database['public']['Tables']['probability_scores']['Insert'];

export const proposalService = {
  // Buscar todas as propostas com dados relacionados
  async getAll() {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        closer:employees!closer_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        sdr:employees!sdr_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        promotor:employees!promotor_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        orcamentista:employees!orcamentista_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        probability_scores (
          economic_buyer,
          metrics,
          decision_criteria,
          decision_process,
          identify_pain,
          champion,
          competition,
          engagement,
          total_score
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar proposta por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        closer:employees!closer_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        sdr:employees!sdr_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        promotor:employees!promotor_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        orcamentista:employees!orcamentista_id (
          id,
          name,
          email,
          avatar,
          role
        ),
        probability_scores (
          economic_buyer,
          metrics,
          decision_criteria,
          decision_process,
          identify_pain,
          champion,
          competition,
          engagement,
          total_score
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar nova proposta
  async create(proposal: ProposalInsert) {
    const { data, error } = await supabase
      .from('proposals')
      .insert(proposal)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar proposta
  async update(id: string, proposal: ProposalUpdate) {
    const { data, error } = await supabase
      .from('proposals')
      .update(proposal)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar proposta
  async delete(id: string) {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Atualizar ou criar avaliação de probabilidade
  async updateProbabilityScores(proposalId: string, scores: ProbabilityScores) {
    const { data, error } = await supabase
      .from('probability_scores')
      .upsert({
        proposal_id: proposalId,
        ...scores
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar propostas por funcionário
  async getByEmployee(employeeId: string, role: 'closer' | 'sdr') {
    const column = role === 'closer' ? 'closer_id' : 'sdr_id';
    
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq(column, employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar estatísticas de propostas
  async getStats() {
    const { data, error } = await supabase
      .from('proposals')
      .select('status, total_value, commission');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      totalValue: data?.reduce((sum, p) => sum + p.total_value, 0) || 0,
      totalCommission: data?.reduce((sum, p) => sum + p.commission, 0) || 0,
      byStatus: {
        Proposta: data?.filter(p => p.status === 'Proposta').length || 0,
        Negociação: data?.filter(p => p.status === 'Negociação').length || 0,
        Fechado: data?.filter(p => p.status === 'Fechado' || p.status === 'Contrato assinado').length || 0,
        Perdido: data?.filter(p => p.status === 'Perdido').length || 0,
      }
    };

    return stats;
  }
};