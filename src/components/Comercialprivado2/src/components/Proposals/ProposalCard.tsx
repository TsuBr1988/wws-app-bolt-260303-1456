import React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, User, Clock, Edit, Save, X, MessageSquare } from 'lucide-react';
import { Proposal } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { ProbabilityModal, ProbabilityScores } from './ProbabilityModal';
import { ProposalDetails } from './ProposalDetails';
import { ProposalEditModal } from './ProposalEditModal';
import { ProposalCommentsModal } from './ProposalCommentsModal';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate, formatDateForInput, calculateTimeDifference } from '../../utils/dateUtils';
import { StatusDropdown } from './StatusDropdown';

// UUID validation utility
function isUUID(v?: string | null): boolean {
  return !!v && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
}

// Centralized observations button with counting
function ObservationsButton({ proposalId, proposalClient, readOnly }: { proposalId: string | null; proposalClient: string; readOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  
  async function refreshCount() {
    if (!isUUID(proposalId)) { 
      setCount(0); 
      return; 
    }
    
    try {
      const { count: commentCount, error } = await supabase
        .from("proposal_comments")
        .select("*", { head: true, count: "exact" })
        .eq("proposal_id", proposalId!);
        
      if (!error && typeof commentCount === "number") {
        setCount(commentCount);
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
      setCount(0);
    }
  }

  useEffect(() => {
    refreshCount();
  }, [proposalId]);

  const isValidProposal = isUUID(proposalId);

  return (
    <>
      <button
        type="button"
        onClick={() => isValidProposal && setOpen(true)}
        disabled={!isValidProposal}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isValidProposal ? "Ver observações desta proposta" : "ID da proposta inválido"}
      >
        <MessageSquare className="w-3 h-3" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold min-w-[16px]">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <ProposalCommentsModal
        proposalId={proposalId}
        proposalClient={proposalClient}
        isOpen={open}
        onClose={() => {
          setOpen(false);
          // Refresh count when modal closes
          setTimeout(() => refreshCount(), 100);
        }}
        readOnly={readOnly}
      />
    </>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  onUpdateProbability?: (proposalId: string, scores: ProbabilityScores) => void;
  onUpdateProposal?: (updatedProposal: Proposal) => void;
  onRefreshData?: () => void;
  readOnly?: boolean;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onUpdateProbability,
  onUpdateProposal,
  onRefreshData,
  readOnly = false
}) => {
  const [showProbabilityModal, setShowProbabilityModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [editingValue, setEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState(proposal.monthlyValue.toString());
  const [editingMargem, setEditingMargem] = useState(false);
  const [tempMargem, setTempMargem] = useState(proposal.margemPercentual?.toString() || '');
  const [editingCidade, setEditingCidade] = useState(false);
  const [tempCidade, setTempCidade] = useState(proposal.cidade || '');
  const [editingDate, setEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(formatDateForInput(proposal.createdAt));

  // Buscar funcionários para exibir nomes
  const { data: employees = [] } = useSupabaseQuery('employees', {
    select: 'id, name'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fechado': return 'bg-green-100 text-green-800';
      case 'Negociação': return 'bg-blue-100 text-blue-800';
      case 'Proposta': return 'bg-yellow-100 text-yellow-800';
      case 'Perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityDisplay = (probabilityScores?: ProbabilityScores) => {
    if (!probabilityScores) {
      return { level: 'Não avaliada', color: 'text-gray-500', bgColor: 'bg-gray-100 border-gray-300' };
    }
    
    // Cada critério vale de 1 a 3 pontos (8 critérios = máximo 24 pontos)
    const total = Object.values(probabilityScores).reduce((sum, score) => sum + score, 0);
    
    if (total < 12) return { level: 'Baixa', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300' };
    if (total <= 18) return { level: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-300' };
    return { level: 'Alta', color: 'text-green-600', bgColor: 'bg-green-100 border-green-300' };
  };

  const closer = employees.find(emp => emp.id === proposal.closerId);
  const sdr = proposal.sdrId ? employees.find(emp => emp.id === proposal.sdrId) : null;
  const probabilityDisplay = getProbabilityDisplay(proposal.probabilityScores);

  const handleProbabilityUpdate = (scores: ProbabilityScores) => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    console.log('Atualizando probabilidade no card:', { scores, total });
    
    // Chamar função de atualização do componente pai
    if (onUpdateProbability) {
      onUpdateProbability(proposal.id, scores);
    }
    
    // Mostrar mensagem de sucesso
    const probabilityLevel = total < 12 ? 'Baixa' : total <= 18 ? 'Média' : 'Alta';
    alert(`✅ Avaliação salva com sucesso!\n\n📊 Pontuação: ${total}/24\n🎯 Probabilidade: ${probabilityLevel}\n\n🔄 Atualizando toda a tela...`);
  };

  const handleProposalUpdate = (updatedProposal: Proposal) => {
    if (onUpdateProposal) {
      onUpdateProposal(updatedProposal);
    }
  };

  const handleValueEdit = () => {
    setEditingValue(true);
    setTempValue(proposal.monthlyValue.toString());
  };

  const handleValueSave = () => {
    const newValue = parseFloat(tempValue) || 0;
    if (newValue !== proposal.monthlyValue) {
      // Recalcular valores baseados no novo valor mensal
      const totalValue = newValue * proposal.months;
      
      // Recalcular comissão baseada no novo valor
      let rate = 0.4; // 0.4% default
      if (newValue >= 100000) {
        rate = 1.2;
      } else if (newValue >= 50000) {
        rate = 0.8;
      }
      
      const commission = (totalValue * rate) / 100;
      
      const updatedProposal: Proposal = {
        ...proposal,
        monthlyValue: newValue,
        totalValue,
        commission,
        commissionRate: rate,
        updatedAt: new Date().toISOString()
      };
      
      handleProposalUpdate(updatedProposal);
    }
    setEditingValue(false);
  };

  const handleValueCancel = () => {
    setEditingValue(false);
    setTempValue(proposal.monthlyValue.toString());
  };

  const handleDateEdit = () => {
    setEditingDate(true);
    setTempDate(proposal.createdAt.split('T')[0]);
  };

  const handleDateSave = () => {
    const newDate = tempDate;
    if (newDate !== formatDateForInput(proposal.createdAt)) {
      const updatedProposal: Proposal = {
        ...proposal,
        createdAt: newDate,
        updatedAt: new Date().toISOString() // Isso será tratado no backend
      };
      
      handleProposalUpdate(updatedProposal);
    }
    setEditingDate(false);
  };

  const handleDateCancel = () => {
    setEditingDate(false);
    setTempDate(formatDateForInput(proposal.createdAt));
  };

  const handleMargemEdit = () => {
    setEditingMargem(true);
    setTempMargem(proposal.margemPercentual?.toString() || '');
  };

  const handleMargemSave = async () => {
    const newMargem = tempMargem ? parseFloat(tempMargem) : null;

    if (newMargem !== proposal.margemPercentual) {
      try {
        const { error } = await supabase
          .from('proposals')
          .update({ margem_percentual: newMargem })
          .eq('id', proposal.id);

        if (error) throw error;

        // Atualizar o estado local
        const updatedProposal: Proposal = {
          ...proposal,
          margemPercentual: newMargem || undefined,
          updatedAt: new Date().toISOString()
        };

        if (onUpdateProposal) {
          onUpdateProposal(updatedProposal);
        }
      } catch (error) {
        console.error('Erro ao salvar margem:', error);
        alert('Erro ao salvar margem. Tente novamente.');
      }
    }
    setEditingMargem(false);
  };

  const handleMargemCancel = () => {
    setEditingMargem(false);
    setTempMargem(proposal.margemPercentual?.toString() || '');
  };

  const handleCidadeEdit = () => {
    setEditingCidade(true);
    setTempCidade(proposal.cidade || '');
  };

  const handleCidadeSave = async () => {
    const newCidade = tempCidade.trim() || null;

    if (newCidade !== proposal.cidade) {
      try {
        const { error } = await supabase
          .from('proposals')
          .update({ cidade: newCidade })
          .eq('id', proposal.id);

        if (error) throw error;

        // Atualizar o estado local
        const updatedProposal: Proposal = {
          ...proposal,
          cidade: newCidade || undefined,
          updatedAt: new Date().toISOString()
        };

        if (onUpdateProposal) {
          onUpdateProposal(updatedProposal);
        }
      } catch (error) {
        console.error('Erro ao salvar cidade:', error);
        alert('Erro ao salvar cidade. Tente novamente.');
      }
    }
    setEditingCidade(false);
  };

  const handleCidadeCancel = () => {
    setEditingCidade(false);
    setTempCidade(proposal.cidade || '');
  };

  const handleStatusChange = () => {
    if (onRefreshData) {
      onRefreshData();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        {/* Layout otimizado com melhor distribuição */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Cliente + Valor Mensal */}
            <div className="col-span-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Cliente</div>
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-left w-full mb-3"
              >
                <h3 className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline break-words leading-snug">
                  {proposal.client}
                </h3>
              </button>

              {/* Valor Mensal e Margem lado a lado */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-3">
                  {/* Valor Mensal */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Valor Mensal</div>
                    {editingValue && !readOnly ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleValueSave();
                            if (e.key === 'Escape') handleValueCancel();
                          }}
                        />
                        <button onClick={handleValueSave} className="p-0.5 text-green-600 hover:text-green-800">
                          <Save className="w-3 h-3" />
                        </button>
                        <button onClick={handleValueCancel} className="p-0.5 text-red-600 hover:text-red-800">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleValueEdit}
                        className={`group flex items-center gap-1 rounded px-2 py-1 transition-colors text-sm w-full ${
                          readOnly ? 'cursor-default' : 'hover:bg-blue-50'
                        }`}
                        title="Clique para editar"
                        disabled={readOnly}
                      >
                        <span className="font-bold text-green-700">{formatCurrency(proposal.monthlyValue)}</span>
                        {!readOnly && (
                          <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Margem % */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Margem</div>
                    {editingMargem && !readOnly ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={tempMargem}
                          onChange={(e) => setTempMargem(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleMargemSave();
                            if (e.key === 'Escape') handleMargemCancel();
                          }}
                        />
                        <span className="text-xs text-gray-600">%</span>
                        <button onClick={handleMargemSave} className="p-0.5 text-green-600 hover:text-green-800">
                          <Save className="w-3 h-3" />
                        </button>
                        <button onClick={handleMargemCancel} className="p-0.5 text-red-600 hover:text-red-800">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleMargemEdit}
                        className={`group flex items-center gap-1 rounded px-2 py-1 transition-colors text-sm w-full ${
                          readOnly ? 'cursor-default' : 'hover:bg-blue-50'
                        }`}
                        title={readOnly ? "Somente leitura" : "Clique para editar margem"}
                        disabled={readOnly}
                      >
                        <span className="font-bold text-blue-700">
                          {proposal.margemPercentual ? `${proposal.margemPercentual.toFixed(2)}%` : '-'}
                        </span>
                        {!readOnly && (
                          <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Cidade */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Cidade</div>
                    {editingCidade && !readOnly ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Ex: São Paulo"
                          value={tempCidade}
                          onChange={(e) => setTempCidade(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCidadeSave();
                            if (e.key === 'Escape') handleCidadeCancel();
                          }}
                        />
                        <button onClick={handleCidadeSave} className="p-0.5 text-green-600 hover:text-green-800">
                          <Save className="w-3 h-3" />
                        </button>
                        <button onClick={handleCidadeCancel} className="p-0.5 text-red-600 hover:text-red-800">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleCidadeEdit}
                        className={`group flex items-center gap-1 rounded px-2 py-1 transition-colors text-sm w-full ${
                          readOnly ? 'cursor-default' : 'hover:bg-blue-50'
                        }`}
                        title={readOnly ? "Somente leitura" : "Clique para editar cidade"}
                        disabled={readOnly}
                      >
                        <span className="font-bold text-purple-700">
                          {proposal.cidade || '-'}
                        </span>
                        {!readOnly && (
                          <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Data de Inclusão */}
            <div className="col-span-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Data de Inclusão</div>
              {editingDate ? (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDateSave();
                      if (e.key === 'Escape') handleDateCancel();
                    }}
                  />
                  <button onClick={handleDateSave} className="p-0.5 text-green-600 hover:text-green-800">
                    <Save className="w-3 h-3" />
                  </button>
                  <button onClick={handleDateCancel} className="p-0.5 text-red-600 hover:text-red-800">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDateEdit}
                  className="group flex items-center gap-1 hover:bg-blue-50 rounded px-2 py-1.5 transition-colors text-sm"
                  title="Clique para editar"
                >
                  <span className="font-medium text-gray-900">{displayDate(proposal.createdAt)}</span>
                  <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Probabilidade */}
            <div className="col-span-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Probabilidade</div>
              <button
                onClick={() => !readOnly && setShowProbabilityModal(true)}
                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium border hover:opacity-80 transition-opacity ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current whitespace-nowrap`}
                title={readOnly ? "Somente leitura" : "Clique para avaliar probabilidade"}
                disabled={readOnly}
              >
                {probabilityDisplay.level}
              </button>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</div>
              <StatusDropdown
                currentStatus={proposal.status}
                proposalId={proposal.id}
                proposalClient={proposal.client}
                onStatusChange={handleStatusChange}
                readOnly={readOnly}
              />
            </div>

            {/* Closer */}
            <div className="col-span-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Closer</div>
              <div className="text-sm">
                <span className="font-medium text-gray-900 block">{closer?.name || 'N/D'}</span>
              </div>
            </div>

            {/* SDR */}
            <div className="col-span-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">SDR</div>
              <div className="text-sm">
                <span className="font-medium text-gray-900 block">{sdr?.name || 'N/D'}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="col-span-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Ações</div>
              <div className="flex flex-col items-stretch gap-2">
                <ObservationsButton proposalId={proposal.id} proposalClient={proposal.client} readOnly={readOnly} />
                {!readOnly ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap text-center"
                  >
                    Editar
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-300 text-gray-500 rounded text-xs font-medium whitespace-nowrap text-center">
                    Bloqueado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Linha de informação de tempo */}
        {(proposal.status === 'Proposta' || proposal.status === 'Negociação' || proposal.status === 'Análise de contrato') && (
          <div className="px-4 pb-4">
            <div className="text-center py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded text-xs">
              <span className="font-medium text-blue-800">
                📅 EM ABERTO HÁ {calculateTimeDifference(proposal.createdAt, new Date().toISOString())}
              </span>
            </div>
          </div>
        )}

        {proposal.status === 'Fechado' && proposal.closingDate && (
          <div className="px-4 pb-4">
            <div className="text-center py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded text-xs">
              <span className="font-medium text-green-800">
                ⏱️ FECHADO EM {calculateTimeDifference(proposal.createdAt, proposal.closingDate)}
              </span>
            </div>
          </div>
        )}
      </div>

      {!readOnly && <ProbabilityModal
        isOpen={showProbabilityModal}
        onClose={() => setShowProbabilityModal(false)}
        proposal={proposal}
        onSave={handleProbabilityUpdate}
      />}

      <ProposalDetails
        proposal={proposal}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {!readOnly && <ProposalEditModal
        proposal={proposal}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleProposalUpdate}
        onDelete={() => {
          // Recarregar dados após exclusão
          window.location.reload();
        }}
      />}

      <ProposalCommentsModal
        proposalId={proposal.id}
        proposalClient={proposal.client}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        readOnly={readOnly}
      />
    </>
  );
};