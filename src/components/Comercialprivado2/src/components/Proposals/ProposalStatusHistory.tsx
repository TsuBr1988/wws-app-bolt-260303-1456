import React, { useState } from 'react';
import { Clock, X, History, ChevronDown } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { displayDateTime } from '../../utils/dateUtils';

interface ProposalStatusHistoryProps {
  proposalId: string;
  proposalClient: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalStatusHistory: React.FC<ProposalStatusHistoryProps> = ({
  proposalId,
  proposalClient,
  isOpen,
  onClose
}) => {
  const { data: historyData = [], loading } = useSupabaseQuery('proposal_status_history', {
    filter: { proposal_id: proposalId },
    orderBy: { column: 'changed_at', ascending: false }
  });

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Proposta': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Negociação': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Análise de contrato': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Fechado': return 'bg-green-100 text-green-800 border-green-300';
      case 'Perdido': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Histórico de Status</h2>
              <p className="text-sm text-gray-600">{proposalClient}</p>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : historyData.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                {historyData.length} alteração{historyData.length > 1 ? 'ões' : ''} de status registrada{historyData.length > 1 ? 's' : ''}
              </div>
              
              {historyData.map((entry, index) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {entry.old_status && (
                          <>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.old_status)}`}>
                              {entry.old_status}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                          </>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.new_status)}`}>
                          {entry.new_status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.changed_by}
                      </div>
                      <div className="text-xs text-gray-500">
                        {displayDateTime(entry.changed_at)}
                      </div>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                      {entry.notes}
                    </div>
                  )}
                  
                  {index === 0 && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Alteração mais recente
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico</h3>
              <p className="text-gray-500">
                As alterações de status desta proposta aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};