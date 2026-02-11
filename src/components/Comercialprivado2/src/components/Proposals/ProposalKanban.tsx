import React from 'react';
import { ChevronLeft, ChevronRight, Eye, Calendar, DollarSign } from 'lucide-react';
import { Proposal } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface ProposalKanbanProps {
  proposals: Proposal[];
  onMoveProposal: (proposalId: string, newStatus: string) => void;
  onViewDetails: (proposal: Proposal) => void;
  readOnly?: boolean;
}

const STATUSES = [
  { key: 'SQL', label: 'SQL', color: 'bg-cyan-100 border-cyan-300' },
  { key: 'Proposta', label: 'Proposta', color: 'bg-blue-100 border-blue-300' },
  { key: 'Negociação', label: 'Negociação', color: 'bg-yellow-100 border-yellow-300' },
  { key: 'Análise de contrato', label: 'Análise de Contrato', color: 'bg-purple-100 border-purple-300' },
  { key: 'Fechado', label: 'Fechado', color: 'bg-green-100 border-green-300' },
  { key: 'Perdido', label: 'Perdido', color: 'bg-red-100 border-red-300' }
];

const calculateTimeInStage = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return '1 dia';
  if (diffDays < 7) return `${diffDays} dias`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return '1 semana';
  if (weeks < 4) return `${weeks} semanas`;

  const months = Math.floor(diffDays / 30);
  if (months === 1) return '1 mês';
  return `${months} meses`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const ProposalKanban: React.FC<ProposalKanbanProps> = ({
  proposals,
  onMoveProposal,
  onViewDetails,
  readOnly = false
}) => {
  const getProposalsByStatus = (status: string) => {
    return proposals.filter(p => p.status === status);
  };

  const getTotalValueByStatus = (status: string) => {
    return proposals
      .filter(p => p.status === status)
      .reduce((sum, p) => sum + p.monthlyValue, 0);
  };

  const canMoveLeft = (currentStatus: string) => {
    const currentIndex = STATUSES.findIndex(s => s.key === currentStatus);
    return currentIndex > 0;
  };

  const canMoveRight = (currentStatus: string) => {
    const currentIndex = STATUSES.findIndex(s => s.key === currentStatus);
    return currentIndex < STATUSES.length - 1;
  };

  const handleMove = (proposalId: string, currentStatus: string, direction: 'left' | 'right') => {
    const currentIndex = STATUSES.findIndex(s => s.key === currentStatus);
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < STATUSES.length) {
      onMoveProposal(proposalId, STATUSES[newIndex].key);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.map((status) => {
        const statusProposals = getProposalsByStatus(status.key);
        const totalValue = getTotalValueByStatus(status.key);

        return (
          <div key={status.key} className="flex-shrink-0 w-80">
            <div className={`rounded-lg border-2 ${status.color} p-4 mb-3`}>
              <h3 className="font-semibold text-gray-900 mb-1">{status.label}</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{statusProposals.length} propostas</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {statusProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
                        {proposal.client}
                      </h4>
                      <button
                        onClick={() => onViewDetails(proposal)}
                        className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatCurrency(proposal.monthlyValue)}
                      </span>
                      <span className="text-gray-500 text-xs">/mês</span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>Inclusão: {formatDate(proposal.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 flex items-center justify-center">⏱</span>
                        <span>Tempo: {calculateTimeInStage(proposal.createdAt)}</span>
                      </div>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleMove(proposal.id, proposal.status, 'left')}
                          disabled={!canMoveLeft(proposal.status)}
                          className={`p-1.5 rounded transition-colors ${
                            canMoveLeft(proposal.status)
                              ? 'hover:bg-gray-100 text-gray-700'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title="Mover para etapa anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="text-xs text-gray-500">Mover etapa</span>

                        <button
                          onClick={() => handleMove(proposal.id, proposal.status, 'right')}
                          disabled={!canMoveRight(proposal.status)}
                          className={`p-1.5 rounded transition-colors ${
                            canMoveRight(proposal.status)
                              ? 'hover:bg-gray-100 text-gray-700'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title="Mover para próxima etapa"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {statusProposals.length === 0 && (
                <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                  <p className="text-sm text-gray-500">Nenhuma proposta</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
