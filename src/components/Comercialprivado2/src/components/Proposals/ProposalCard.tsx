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
        className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isValidProposal ? "Ver observações desta proposta" : "ID da proposta inválido"}
      >
        <MessageSquare className="w-3 h-3" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold min-w-[14px]">
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
        {/* Layout em 3 linhas */}
        <div className="p-3">
          {/* LINHA 1: Cliente, Valor Mensal, Margem, Probabilidade, Status */}
          <div className="grid grid-cols-12 gap-3 items-center mb-2">
            {/* Cliente */}
            <div className="col-span-4">
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-left w-full"
              >
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Cliente</div>
                <h3 className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline break-words leading-tight line-clamp-2">
                  {proposal.client}
                </h3>
              </button>
            </div>

            {/* Valor Mensal */}
            <div className="col-span-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Valor Mensal</div>
              {editingValue && !readOnly ? (
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className={`group flex items-center gap-0.5 rounded px-1.5 py-0.5 transition-colors text-xs w-full ${
                    readOnly ? 'cursor-default' : 'hover:bg-blue-50'
                  }`}
                  title="Clique para editar"
                  disabled={readOnly}
                >
                  <span className="font-bold text-green-700">{formatCurrency(proposal.monthlyValue)}</span>
                  {!readOnly && (
                    <Edit className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )}
            </div>

            {/* Margem % */}
            <div className="col-span-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Margem</div>
              {editingMargem && !readOnly ? (
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={tempMargem}
                    onChange={(e) => setTempMargem(e.target.value)}
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleMargemSave();
                      if (e.key === 'Escape') handleMargemCancel();
                    }}
                  />
                  <button onClick={handleMargemSave} className="p-0.5 text-green-600 hover:text-green-800">
                    <Save className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={handleMargemCancel} className="p-0.5 text-red-600 hover:text-red-800">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMargemEdit}
                  className={`group flex items-center gap-0.5 rounded px-1 py-0.5 transition-colors text-xs ${
                    readOnly ? 'cursor-default' : 'hover:bg-blue-50'
                  }`}
                  title={readOnly ? "Somente leitura" : "Clique para editar margem"}
                  disabled={readOnly}
                >
                  <span className="font-bold text-blue-700">
                    {proposal.margemPercentual ? `${proposal.margemPercentual.toFixed(2)}%` : '-'}
                  </span>
                  {!readOnly && (
                    <Edit className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              )}
            </div>

            {/* Probabilidade */}
            <div className="col-span-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Probabilidade</div>
              <button
                onClick={() => !readOnly && setShowProbabilityModal(true)}
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border hover:opacity-80 transition-opacity ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current whitespace-nowrap w-full justify-center`}
                title={readOnly ? "Somente leitura" : "Clique para avaliar probabilidade"}
                disabled={readOnly}
              >
                {probabilityDisplay.level}
              </button>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Status</div>
              <StatusDropdown
                currentStatus={proposal.status}
                proposalId={proposal.id}
                proposalClient={proposal.client}
                onStatusChange={handleStatusChange}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* LINHA 2: Cidade, Closer, SDR, Família, Data da Inclusão */}
          <div className="grid grid-cols-12 gap-3 items-center mb-2 pb-2 border-b border-gray-100">
            {/* Cidade */}
            <div className="col-span-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Cidade</div>
              {editingCidade && !readOnly ? (
                <div className="flex items-center gap-0.5">
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={tempCidade}
                    onChange={(e) => setTempCidade(e.target.value)}
                    className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCidadeSave();
                      if (e.key === 'Escape') handleCidadeCancel();
                    }}
                  />
                  <button onClick={handleCidadeSave} className="p-0.5 text-green-600 hover:text-green-800">
                    <Save className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={handleCidadeCancel} className="p-0.5 text-red-600 hover:text-red-800">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCidadeEdit}
                  className={`group flex items-center gap-0.5 rounded px-1.5 py-0.5 transition-colors text-xs truncate max-w-full ${
                    readOnly ? 'cursor-default' : 'hover:bg-blue-50'
                  }`}
                  title={readOnly ? "Somente leitura" : "Clique para editar cidade"}
                  disabled={readOnly}
                >
                  <span className="font-bold text-purple-700 truncate">
                    {proposal.cidade || '-'}
                  </span>
                  {!readOnly && (
                    <Edit className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </button>
              )}
            </div>

            {/* Closer */}
            <div className="col-span-3">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Closer</div>
              <div className="text-xs px-1.5 py-0.5">
                <span className="font-medium text-gray-900 block truncate">{closer?.name || 'N/D'}</span>
              </div>
            </div>

            {/* SDR */}
            <div className="col-span-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">SDR</div>
              <div className="text-xs px-1.5 py-0.5">
                <span className="font-medium text-gray-900 block truncate">{sdr?.name || 'N/D'}</span>
              </div>
            </div>

            {/* Família */}
            <div className="col-span-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Família</div>
              <div className="px-1.5 py-0.5 text-xs">
                <span className="font-medium text-gray-900 truncate block">{proposal.familia || '-'}</span>
              </div>
            </div>

            {/* Data de Inclusão */}
            <div className="col-span-3">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Data da Inclusão</div>
              {editingDate ? (
                <div className="flex items-center gap-0.5">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDateSave();
                      if (e.key === 'Escape') handleDateCancel();
                    }}
                  />
                  <button onClick={handleDateSave} className="p-0.5 text-green-600 hover:text-green-800">
                    <Save className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={handleDateCancel} className="p-0.5 text-red-600 hover:text-red-800">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDateEdit}
                  className="group flex items-center gap-0.5 hover:bg-blue-50 rounded px-1.5 py-0.5 transition-colors text-xs"
                  title="Clique para editar"
                >
                  <span className="font-medium text-gray-900">{displayDate(proposal.createdAt)}</span>
                  <Edit className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {/* LINHA 3: Tempo da Proposta, Ações */}
          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Tempo da Proposta */}
            <div className="col-span-10">
              {(proposal.status === 'Proposta' || proposal.status === 'Negociação' || proposal.status === 'Análise de contrato') && (
                <div className="text-center py-1.5 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded text-xs">
                  <span className="font-medium text-blue-800">
                    📅 EM ABERTO HÁ {calculateTimeDifference(proposal.createdAt, new Date().toISOString())}
                  </span>
                </div>
              )}

              {proposal.status === 'Fechado' && proposal.closingDate && (
                <div className="text-center py-1.5 px-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded text-xs">
                  <span className="font-medium text-green-800">
                    ⏱️ FECHADO EM {calculateTimeDifference(proposal.createdAt, proposal.closingDate)}
                  </span>
                </div>
              )}

              {proposal.status === 'Perdido' && (
                <div className="text-center py-1.5 px-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded text-xs">
                  <span className="font-medium text-red-800">
                    ❌ PERDIDO
                  </span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="col-span-2">
              <div className="flex items-center gap-1.5 justify-end">
                <ObservationsButton proposalId={proposal.id} proposalClient={proposal.client} readOnly={readOnly} />
                {!readOnly ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-[10px] font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Editar
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-300 text-gray-500 rounded text-[10px] font-medium whitespace-nowrap">
                    Bloqueado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
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