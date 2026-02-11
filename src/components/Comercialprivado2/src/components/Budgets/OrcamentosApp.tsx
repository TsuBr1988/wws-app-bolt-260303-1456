import { useState } from 'react';
import OrcamentosAppOriginal from '../Orçamentos/src/App';
import { ProposalForm } from '../Proposals/ProposalForm';
import { ProposalEditModal } from '../Proposals/ProposalEditModal';
import { supabase } from '../../lib/supabase';
import { Proposal } from '../../types';

export const OrcamentosApp = () => {
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [proposalInitialData, setProposalInitialData] = useState<{
    client: string;
    monthlyValue: number;
    months: number;
    budgetId: string;
  } | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const handleGenerateProposal = (budgetData: {
    id: string;
    clientName: string;
    monthlyValue: number;
    months: number;
    proposalId?: string;
  }) => {
    // Se tem proposalId, é para editar
    if (budgetData.proposalId) {
      handleUpdateProposal(budgetData.proposalId);
      return;
    }

    // Senão, é para criar nova
    setProposalInitialData({
      client: budgetData.clientName,
      monthlyValue: budgetData.monthlyValue,
      months: budgetData.months,
      budgetId: budgetData.id
    });
    setShowProposalModal(true);
  };

  const handleUpdateProposal = async (proposalId: string) => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (error) throw error;

      if (data) {
        // Converter de snake_case para camelCase
        // A tabela proposals do Comercial Privado 2 não tem proposal_date, closing_date, lost_date, lost_reason
        const proposal: Proposal = {
          id: data.id,
          client: data.client,
          monthlyValue: data.monthly_value,
          months: data.months,
          totalValue: data.total_value,
          status: data.status,
          commission: data.commission,
          commissionRate: data.commission_rate,
          closerId: data.closer_id,
          sdrId: data.sdr_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          budgetId: data.budget_id
        };

        setEditingProposal(proposal);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Erro ao buscar proposta:', error);
      alert('Erro ao buscar proposta para edição.');
    }
  };

  const handleProposalSubmit = async (proposalData: any) => {
    try {
      // Converter campos de camelCase para snake_case e inserir apenas campos que existem na tabela
      const dataToInsert = {
        client: proposalData.client,
        monthly_value: proposalData.monthlyValue,
        months: proposalData.months,
        total_value: proposalData.totalValue,
        status: proposalData.status,
        commission: proposalData.commission,
        commission_rate: proposalData.commissionRate,
        closer_id: proposalData.closerId,
        sdr_id: proposalData.sdrId || null,
        budget_id: proposalData.budgetId || null,
      };

      console.log('💾 Salvando proposta com budget_id:', proposalData.budgetId);

      // Adicionar campos opcionais baseados no status
      if (proposalData.status === 'Fechado' && proposalData.closingDate) {
        dataToInsert.closing_date = proposalData.closingDate;
      }

      if (proposalData.status === 'Perdido') {
        if (proposalData.lostDate) {
          dataToInsert.lost_date = proposalData.lostDate;
        }
        if (proposalData.lostReason) {
          dataToInsert.lost_reason = proposalData.lostReason;
        }
      }

      const { error } = await supabase.from('proposals').insert([dataToInsert]);

      if (error) throw error;

      alert('Proposta criada com sucesso!\n\nVocê pode visualizá-la na aba Propostas.');
      setShowProposalModal(false);
      setProposalInitialData(null);

      // Disparar reload da lista de orçamentos
      setReloadTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      alert('Erro ao criar proposta. Verifique o console para mais detalhes.');
    }
  };

  const handleProposalCancel = () => {
    setShowProposalModal(false);
    setProposalInitialData(null);
  };

  const handleProposalSave = async (updatedProposal: Proposal) => {
    try {
      console.log('💾 Atualizando proposta:', updatedProposal);

      // A tabela proposals do Comercial Privado 2 só tem estas colunas:
      // id, client, monthly_value, months, total_value, status, commission,
      // commission_rate, closer_id, sdr_id, created_at, updated_at
      const dataToUpdate = {
        client: updatedProposal.client,
        monthly_value: updatedProposal.monthlyValue,
        months: updatedProposal.months,
        status: updatedProposal.status,
        closer_id: updatedProposal.closerId,
        sdr_id: updatedProposal.sdrId || null,
        updated_at: new Date().toISOString()
        // Note: total_value, commission e commission_rate são calculados automaticamente pelo trigger
      };

      console.log('📤 Dados para atualizar:', dataToUpdate);
      console.log('🔑 ID da proposta:', updatedProposal.id);

      const { data, error } = await supabase
        .from('proposals')
        .update(dataToUpdate)
        .eq('id', updatedProposal.id)
        .select();

      console.log('✅ Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro detalhado:', error);
        throw error;
      }

      alert('Proposta atualizada com sucesso!');
      setShowEditModal(false);
      setEditingProposal(null);

      // Disparar reload da lista de orçamentos
      setReloadTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('❌ Erro ao atualizar proposta:', error);
      console.error('❌ Mensagem de erro:', error?.message);
      console.error('❌ Detalhes do erro:', error?.details);
      console.error('❌ Hint:', error?.hint);
      alert(`Erro ao atualizar proposta:\n\n${error?.message || 'Erro desconhecido'}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingProposal(null);
  };

  return (
    <div className="pl-8 pr-6">
      <OrcamentosAppOriginal
        onGenerateProposal={handleGenerateProposal}
        reloadTrigger={reloadTrigger}
        supabaseClient={supabase}
      />

      {showProposalModal && proposalInitialData && (
        <ProposalForm
          onSubmit={handleProposalSubmit}
          onCancel={handleProposalCancel}
          initialData={proposalInitialData}
        />
      )}

      {showEditModal && editingProposal && (
        <ProposalEditModal
          proposal={editingProposal}
          isOpen={showEditModal}
          onClose={handleEditModalClose}
          onSave={handleProposalSave}
        />
      )}
    </div>
  );
};
