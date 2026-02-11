import React, { useState } from 'react';
import { X, FileText, Calendar, DollarSign, MessageCircle, Trash2, Clock, Award } from 'lucide-react';
import { ContractWithAddendums } from '../../types/contracts';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateBR } from '../../utils/dateUtils';
import { useSupabaseDelete } from '../../hooks/useSupabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { clearQueryCache } from '../../hooks/useSupabase';

interface AddendumViewModalProps {
  contract: ContractWithAddendums;
  onClose: () => void;
  onUpdate?: () => void;
}

export const AddendumViewModal: React.FC<AddendumViewModalProps> = ({
  contract,
  onClose,
  onUpdate
}) => {
  const { canEdit } = useSystemVersion();
  const { deleteRecord: deleteAddendum, loading: deleteLoading } = useSupabaseDelete('contract_addendums');
  const [expandedObservations, setExpandedObservations] = useState<Set<string>>(new Set());
  const [deletingAddendum, setDeletingAddendum] = useState<string | null>(null);

  // Função para identificar aditivos informativos
  const isInformativeAddendum = (addendum: any) => {
    return addendum.monthly_value === 0 && 
           addendum.observations && 
           addendum.observations.startsWith('[ADITIVO INFORMATIVO]');
  };

  const toggleObservation = (addendumId: string) => {
    setExpandedObservations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(addendumId)) {
        newSet.delete(addendumId);
      } else {
        newSet.add(addendumId);
      }
      return newSet;
    });
  };

  const handleDeleteAddendum = async (addendumId: string, isLatest: boolean) => {
    if (!isLatest) {
      alert('❌ Só é possível excluir o aditivo mais recente.');
      return;
    }

    const addendum = contract.addendums.find(a => a.id === addendumId);
    if (!addendum) return;

    const confirmMessage = `⚠️ CONFIRMAR EXCLUSÃO DO ADITIVO\n\nVocê tem certeza que deseja excluir este aditivo?\n\n📅 Período: ${formatDateBR(addendum.start_date)} até ${formatDateBR(addendum.end_date)}\n💰 Valor: ${formatCurrency(addendum.monthly_value)}\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR') {
      try {
        console.log('🗑️ Iniciando exclusão do aditivo:', addendumId);
        setDeletingAddendum(addendumId);
        
        // Executar exclusão no Supabase
        console.log('💾 Excluindo do banco de dados...');
        await deleteAddendum(addendumId);
        console.log('✅ Aditivo excluído do banco com sucesso');
        
        // Limpar cache para garantir dados frescos
        console.log('🧹 Limpando cache...');
        clearQueryCache('contracts');
        clearQueryCache('contract_addendums');
        
        // Forçar atualização dos dados
        console.log('🔄 Atualizando dados...');
        if (onUpdate) {
          await onUpdate();
        }
        
        console.log('✅ Sistema atualizado com sucesso');
        alert('✅ Aditivo excluído com sucesso!');
        
        // Fechar modal após pequeno delay para garantir atualização
        setTimeout(() => {
          console.log('🚪 Fechando modal...');
          onClose();
        }, 500);
        
      } catch (error) {
        console.error('❌ Erro ao excluir aditivo:', error);
        console.error('Detalhes do erro:', {
          addendumId,
          error: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined
        });
        
        let errorMessage = 'Erro desconhecido ao excluir aditivo.';
        
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as any).message;
          
          if (message.includes('foreign key')) {
            errorMessage = 'Não é possível excluir: existem dados relacionados a este aditivo.';
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = `Erro: ${message}`;
          }
        }
        
        alert(`❌ ${errorMessage}`);
      } finally {
        console.log('🏁 Finalizando processo de exclusão');
        setDeletingAddendum(null);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const needsTruncation = (text: string, maxLength: number = 100) => {
    return text && text.length > maxLength;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Aditivos do Contrato</h2>
              <p className="text-sm text-gray-600">{contract.client_name}</p>
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
          {contract.addendums.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {contract.addendums.length} Aditivo{contract.addendums.length > 1 ? 's' : ''} Registrado{contract.addendums.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-gray-600">
                  Histórico completo de modificações contratuais
                </p>
              </div>

              {/* Header da tabela */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-1 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-gray-500" />
                  <span>Tipo</span>
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Data do Aditivo</span>
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Data de Término</span>
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>Novo Valor</span>
                </div>
                <div className="col-span-3 flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span>Observações</span>
                </div>
                {canEdit('contracts') && (
                  <div className="col-span-2 flex items-center justify-center space-x-2">
                    <span>Ações</span>
                  </div>
                )}
              </div>

              {/* Lista de aditivos */}
              <div className="space-y-3">
                {contract.addendums.map((addendum, index) => (
                  <div 
                    key={addendum.id} 
                    className={`bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      addendum.is_punctual 
                        ? 'border-yellow-200 bg-yellow-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`grid gap-4 items-center ${canEdit('contracts') ? 'grid-cols-12' : 'grid-cols-11'}`}>
                      {/* Tipo do Aditivo */}
                      <div className="col-span-1">
                        {isInformativeAddendum(addendum) ? (
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Informativo</span>
                          </div>
                        ) : addendum.is_punctual ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-800">Pontual</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Award className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Permanente</span>
                          </div>
                        )}
                      </div>

                      {/* Data do Aditivo */}
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateBR(addendum.effective_start_date || addendum.start_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Aditivo #{contract.addendums.length - index}
                        </div>
                      </div>

                      {/* Data de Término */}
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-blue-600">
                          {formatDateBR(addendum.end_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {addendum.is_punctual ? 'Fim do período' : 'Novo prazo'}
                        </div>
                      </div>

                      {/* Novo Valor */}
                      <div className="col-span-2">
                        {isInformativeAddendum(addendum) ? (
                          <div className="text-sm font-bold text-blue-600">
                            Sem alteração
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(addendum.monthly_value)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {isInformativeAddendum(addendum) ? 'Valor mantido' : 'Por mês'}
                        </div>
                      </div>

                      {/* Observações */}
                      <div className="col-span-3">
                        {addendum.observations && addendum.observations.trim() ? (
                          <div className="text-sm text-gray-700">
                            <span>
                              {expandedObservations.has(addendum.id)
                                ? addendum.observations
                                : truncateText(addendum.observations)
                              }
                            </span>
                            {needsTruncation(addendum.observations) && (
                              <button
                                onClick={() => toggleObservation(addendum.id)}
                                className="ml-2 text-blue-600 hover:text-blue-800 font-medium text-xs"
                              >
                                {expandedObservations.has(addendum.id) ? 'mostrar menos' : 'mostrar mais'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            Sem observações
                          </div>
                        )}
                      </div>

                      {/* Ações (Excluir - só para Admin e só o mais recente) */}
                      {canEdit('contracts') && (
                        <div className="col-span-2 flex justify-center">
                          {index === 0 ? ( // Só o primeiro (mais recente) pode ser excluído
                            <button
                              onClick={() => handleDeleteAddendum(addendum.id, true)}
                              disabled={deleteLoading || deletingAddendum === addendum.id}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 border border-red-300"
                              title="Excluir aditivo mais recente"
                            >
                              {deletingAddendum === addendum.id ? (
                                <>
                                  <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
                                  <span className="text-sm">Excluindo...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  <span className="text-sm font-medium">Excluir</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="px-4 py-2 text-gray-400 border border-gray-200 rounded-lg bg-gray-50">
                              <span className="text-sm">Não permitido</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Linha de separação para melhor organização visual */}
                    {index === 0 && (
                      <div className={`mt-3 pt-3 border-t rounded-lg p-2 ${
                        addendum.is_punctual 
                          ? 'border-yellow-200 bg-yellow-100' 
                          : 'border-green-200 bg-green-50'
                      }`}>
                        <div className={`text-xs font-medium text-center ${
                          addendum.is_punctual 
                            ? 'text-yellow-700' 
                            : 'text-green-700'
                        }`}>
                          {addendum.is_punctual 
                            ? '🕒 Aditivo pontual mais recente (vigência temporária)'
                            : '✓ Este é o aditivo mais recente (valores atuais do contrato)'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resumo do histórico */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Resumo do Histórico</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Contrato original:</strong> {formatCurrency(contract.monthly_value)} (vigente de {formatDateBR(contract.start_date)} até {formatDateBR(contract.end_date)})</p>
                  <p><strong>Valor atual:</strong> {formatCurrency(contract.current_value)} (vigente até {formatDateBR(contract.current_end_date)})</p>
                  <p><strong>Total de modificações:</strong> {contract.addendums.length} aditivo{contract.addendums.length > 1 ? 's' : ''}</p>
                  <p><strong>Aditivos pontuais:</strong> {contract.addendums.filter(a => a.is_punctual && !isInformativeAddendum(a)).length}</p>
                  <p><strong>Aditivos informativos:</strong> {contract.addendums.filter(a => isInformativeAddendum(a)).length}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Aditivo</h3>
              <p className="text-gray-500">
                Este contrato ainda não possui aditivos. O contrato vigente possui os valores originais.
              </p>
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Valor mensal:</strong> {formatCurrency(contract.monthly_value)}</p>
                  <p><strong>Período:</strong> {formatDateBR(contract.start_date)} até {formatDateBR(contract.end_date)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};