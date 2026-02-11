import React from 'react';
import { X, User, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

interface CommissionDetail {
  proposalId: string;
  client: string;
  totalValue: number;
  commissionRate: number;
  commissionValue: number;
  status: string;
  closingDate?: string;
  createdAt: string;
}

interface PersonCommissionData {
  employeeId: string;
  name: string;
  role: string;
  avatar?: string;
  totalCommission: number;
  proposals: CommissionDetail[];
}

interface CommissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: PersonCommissionData | null;
}

export const CommissionDetailModal: React.FC<CommissionDetailModalProps> = ({
  isOpen,
  onClose,
  person
}) => {
  if (!isOpen || !person) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fechado': return 'bg-green-100 text-green-800';
      case 'Negociação': return 'bg-blue-100 text-blue-800';
      case 'Proposta': return 'bg-yellow-100 text-yellow-800';
      case 'Perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalhamento de Comissão</h2>
              <div className="flex items-center space-x-3 mt-1">
                {person.avatar && (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <span className="text-sm font-medium text-gray-700">{person.name}</span>
                  <span className="text-sm text-gray-500 ml-2">• {person.role}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Total da Comissão</h3>
                <p className="text-sm text-green-700">
                  Baseado em {person.proposals.length} proposta{person.proposals.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(person.totalCommission)}
                </div>
                <div className="text-sm text-green-700">Valor total</div>
              </div>
            </div>
          </div>

          {/* Proposals Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Cliente</th>
                  <th className="text-center p-4 font-medium text-gray-700">Status</th>
                  <th className="text-right p-4 font-medium text-gray-700">Valor da Proposta</th>
                  <th className="text-center p-4 font-medium text-gray-700">Taxa Comissão</th>
                  <th className="text-right p-4 font-medium text-gray-700">Valor Comissão</th>
                  <th className="text-center p-4 font-medium text-gray-700">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {person.proposals.length > 0 ? (
                  person.proposals.map((proposal) => (
                    <tr key={proposal.proposalId} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{proposal.client}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        {formatCurrency(proposal.totalValue)}
                      </td>
                      <td className="p-4 text-center text-gray-700">
                        {proposal.commissionRate}%
                      </td>
                      <td className="p-4 text-right font-semibold text-green-600">
                        {formatCurrency(proposal.commissionValue)}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {proposal.closingDate ? displayDate(proposal.closingDate) : displayDate(proposal.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p>Nenhuma proposta encontrada para {person.name}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          {person.proposals.length > 0 && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {person.proposals.length}
                  </div>
                  <div className="text-gray-600">Proposta{person.proposals.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {formatCurrency(person.proposals.reduce((sum, p) => sum + p.totalValue, 0))}
                  </div>
                  <div className="text-gray-600">Valor Total</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(person.totalCommission)}
                  </div>
                  <div className="text-gray-600">Comissão Total</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};