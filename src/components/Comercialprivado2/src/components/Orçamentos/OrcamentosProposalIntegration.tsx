import { useState } from 'react';
import { ProposalForm } from '../Proposals/ProposalForm';
import { supabase } from '../lib/supabase';
import OrcamentosApp from './src/App';

export const OrcamentosWithProposalIntegration = () => {
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalInitialData, setProposalInitialData] = useState<{
    client: string;
    monthlyValue: number;
    months: number;
    budgetId: string;
  } | null>(null);

  const handleGenerateProposal = (budgetData: {
    id: string;
    clientName: string;
    monthlyValue: number;
    months: number;
  }) => {
    setProposalInitialData({
      client: budgetData.clientName,
      monthlyValue: budgetData.monthlyValue,
      months: budgetData.months,
      budgetId: budgetData.id
    });
    setShowProposalModal(true);
  };

  const handleProposalSubmit = async (proposalData: any) => {
    try {
      // Verifica se já existe uma proposta para este orçamento
      if (proposalData.budget_id) {
        const { data: existingProposal, error: checkError } = await supabase
          .from('proposals')
          .select('id, client')
          .eq('budget_id', proposalData.budget_id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingProposal) {
          alert(
            `⚠️ Já existe uma proposta para este orçamento!\n\n` +
            `Cliente: ${existingProposal.client}\n\n` +
            `Cada orçamento pode ter apenas uma proposta vinculada.\n` +
            `Veja a proposta existente na aba Propostas.`
          );
          setShowProposalModal(false);
          setProposalInitialData(null);
          return;
        }
      }

      const { error } = await supabase.from('proposals').insert([proposalData]);

      if (error) {
        // Verifica se é erro de constraint única
        if (error.code === '23505' && error.message.includes('unique_budget_id')) {
          alert(
            '⚠️ Já existe uma proposta para este orçamento!\n\n' +
            'Cada orçamento pode ter apenas uma proposta vinculada.\n' +
            'Veja a proposta existente na aba Propostas.'
          );
        } else {
          throw error;
        }
      } else {
        alert('✅ Proposta criada com sucesso!\n\nVocê pode visualizá-la na aba Propostas.');
      }

      setShowProposalModal(false);
      setProposalInitialData(null);
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      alert('❌ Erro ao criar proposta. Tente novamente.');
    }
  };

  const handleProposalCancel = () => {
    setShowProposalModal(false);
    setProposalInitialData(null);
  };

  return (
    <>
      <OrcamentosApp onGenerateProposal={handleGenerateProposal} />

      {showProposalModal && proposalInitialData && (
        <ProposalForm
          onSubmit={handleProposalSubmit}
          onCancel={handleProposalCancel}
          initialData={proposalInitialData}
        />
      )}
    </>
  );
};
