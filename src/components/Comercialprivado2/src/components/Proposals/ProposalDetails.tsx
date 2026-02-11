import React, { useState } from 'react';
import { X, Edit, Calendar, DollarSign, User, Clock, Target, TrendingUp } from 'lucide-react';
import { Proposal } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { ProbabilityModal, ProbabilityScores } from './ProbabilityModal';
import { ProposalEditModal } from './ProposalEditModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDateTime } from '../../utils/dateUtils';
import { ProposalStatusHistory } from './ProposalStatusHistory';

interface ProposalDetailsProps {
  proposal: Proposal;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onUpdateProbability?: (scores: ProbabilityScores) => void;
  readOnly?: boolean;
}

export const ProposalDetails: React.FC<ProposalDetailsProps> = ({
  proposal,
  isOpen,
  onClose,
  onEdit,
  onUpdateProbability,
  readOnly = false
}) => {
  const { data: employees = [] } = useSupabaseQuery('employees');
  const [showProbabilityModal, setShowProbabilityModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  if (!isOpen) return null;

  const closer = employees.find(emp => emp.id === proposal.closerId);
  const sdr = proposal.sdrId ? employees.find(emp => emp.id === proposal.sdrId) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fechado': return 'bg-green-100 text-green-800 border-green-200';
      case 'Negociação': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Proposta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Perdido': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProbabilityDisplay = (probabilityScores?: ProbabilityScores) => {
    if (!probabilityScores) {
      return { level: 'Não avaliada', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
    
    // Cada critério vale de 1 a 3 pontos (8 critérios = máximo 24 pontos)
    const total = Object.values(probabilityScores).reduce((sum, score) => sum + score, 0);
    
    if (total < 12) return { level: 'Baixa', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300' };
    if (total <= 18) return { level: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-300' };
    return { level: 'Alta', color: 'text-green-600', bgColor: 'bg-green-100 border-green-300' };
  };

  const probabilityDisplay = getProbabilityDisplay(proposal.probabilityScores);

  const handleProbabilityUpdate = (scores: ProbabilityScores) => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    console.log('Atualizando probabilidade nos detalhes:', { scores, total });
    onUpdateProbability(scores);
    
    // Fechar modal após um pequeno delay para mostrar feedback
    setTimeout(() => {
      setShowProbabilityModal(false);
    }, 500);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{proposal.client}</h2>
              <p className="text-gray-600">Detalhes da proposta</p>
            </div>
            <div className="flex items-center space-x-2">
              {!readOnly && onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver histórico
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Probabilidade</label>
                  <div className="mt-1">
                    {!readOnly && onUpdateProbability ? (
                      <button
                        onClick={() => setShowProbabilityModal(true)}
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border hover:opacity-80 transition-opacity ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current`}
                      >
                        {probabilityDisplay.level}
                      </button>
                    ) : (
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current`}>
                        {probabilityDisplay.level}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Criado em</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {displayDateTime(proposal.createdAt)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Última atualização</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {displayDateTime(proposal.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Financeiras</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3 mx-auto">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500">Valor Mensal</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(proposal.monthlyValue)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3 mx-auto">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500">Duração</p>
                  <p className="text-xl font-bold text-gray-900">{proposal.months} meses</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3 mx-auto">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(proposal.totalValue)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3 mx-auto">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-500">Comissão</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(proposal.commission)}
                  </p>
                  <p className="text-xs text-gray-500">({proposal.commissionRate}%)</p>
                </div>
              </div>
            </div>

            {/* Team Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipe Responsável</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {closer && (
                  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={closer.avatar}
                      alt={closer.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{closer.name}</p>
                      <p className="text-sm text-gray-500">Closer</p>
                      <p className="text-xs text-gray-400">{closer.email}</p>
                    </div>
                  </div>
                )}

                {sdr ? (
                  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={sdr.avatar}
                      alt={sdr.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{sdr.name}</p>
                      <p className="text-sm text-gray-500">SDR</p>
                      <p className="text-xs text-gray-400">{sdr.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 border-dashed">
                    <div className="text-center">
                      <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhum SDR atribuído</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Detalhamento da Comissão</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Valor base do cálculo:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(proposal.monthlyValue)} × {proposal.months} meses = {formatCurrency(proposal.totalValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Taxa de comissão:</span>
                  <span className="font-medium text-green-900">{proposal.commissionRate}%</span>
                </div>
                <div className="border-t border-green-300 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">Comissão do Closer:</span>
                    <span className="font-bold text-green-900 text-lg">
                      {formatCurrency(proposal.commission)}
                    </span>
                  </div>
                  {sdr && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-green-700 font-medium">Comissão do SDR (50%):</span>
                      <span className="font-bold text-green-900 text-lg">
                        {formatCurrency(proposal.commission * 0.5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!readOnly && onUpdateProbability && (
        <ProbabilityModal
          isOpen={showProbabilityModal}
          onClose={() => setShowProbabilityModal(false)}
          onSave={handleProbabilityUpdate}
          currentScores={proposal.probabilityScores}
          clientName={proposal.client}
        />
      )}

      <ProposalStatusHistory
        proposalId={proposal.id}
        proposalClient={proposal.client}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  );
};