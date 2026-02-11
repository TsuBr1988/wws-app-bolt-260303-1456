import { useState } from 'react';
import { X, FileText, Trash2, Clock, MessageCircle, Award, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import {
  ContractWithAddendums,
  ContractAddendum,
  formatCurrency,
  formatDateBR,
  isInformativeAddendum,
} from '../../lib/contractUtils';

interface AddendumViewModalProps {
  contract: ContractWithAddendums;
  onClose: () => void;
  onDelete?: (addendumId: string) => Promise<void>;
  isAdmin?: boolean;
}

export function AddendumViewModal({
  contract,
  onClose,
  onDelete,
  isAdmin = false,
}: AddendumViewModalProps) {
  const [expandedObs, setExpandedObs] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const addendums = contract.addendums || [];
  const sortedAddendums = [...addendums].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  const mostRecentAddendum = sortedAddendums[0];
  const informativeCount = addendums.filter(isInformativeAddendum).length;
  const punctualCount = addendums.filter((a) => a.is_punctual && !isInformativeAddendum(a)).length;

  const toggleObservation = (id: string) => {
    setExpandedObs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteClick = (addendumId: string) => {
    if (sortedAddendums[0]?.id !== addendumId) {
      alert('Apenas o aditivo mais recente pode ser excluído');
      return;
    }
    setDeleteConfirm(addendumId);
    setDeleteInput('');
  };

  const handleConfirmDelete = async () => {
    if (deleteInput !== 'EXCLUIR') return;
    if (!deleteConfirm || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('❌ Error deleting addendum:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAddendumIcon = (addendum: ContractAddendum) => {
    if (isInformativeAddendum(addendum)) {
      return <MessageCircle className="h-4 w-4 text-blue-600" />;
    }
    if (addendum.is_punctual) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    return <Award className="h-4 w-4 text-blue-600" />;
  };

  const getAddendumType = (addendum: ContractAddendum) => {
    if (isInformativeAddendum(addendum)) return 'Informativo';
    if (addendum.is_punctual) return 'Pontual';
    return 'Permanente';
  };

  const getAddendumBgColor = (addendum: ContractAddendum) => {
    if (isInformativeAddendum(addendum)) return 'bg-blue-50 border-blue-200';
    if (addendum.is_punctual) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-blue-200';
  };

  if (deleteConfirm) {
    const addendumToDelete = addendums.find((a) => a.id === deleteConfirm);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="hover:bg-red-700 rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  Tem certeza que deseja excluir este aditivo?
                </p>
                {addendumToDelete && (
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <strong>Tipo:</strong> {getAddendumType(addendumToDelete)}
                    </p>
                    <p>
                      <strong>Data:</strong> {formatDateBR(addendumToDelete.start_date)}
                    </p>
                    {!isInformativeAddendum(addendumToDelete) && (
                      <p>
                        <strong>Valor:</strong> {formatCurrency(addendumToDelete.monthly_value)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 mb-3">
                Esta ação não pode ser desfeita. Digite <strong>EXCLUIR</strong> para confirmar.
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Digite EXCLUIR"
                className="w-full px-3 py-2 border border-red-300 rounded-lg"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleConfirmDelete}
                disabled={deleteInput !== 'EXCLUIR' || isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Histórico de Aditivos</h2>
            <p className="text-sm text-blue-100">{contract.client_name}</p>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 rounded-full p-1">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {addendums.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">Nenhum Aditivo</p>
              <p className="text-gray-400 text-sm">
                Este contrato ainda não possui aditivos registrados
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 max-w-md mx-auto">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Contrato Original</strong>
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium">{formatCurrency(contract.monthly_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Período:</span>
                    <span className="font-medium">
                      {formatDateBR(contract.start_date)} até {formatDateBR(contract.end_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Data do Aditivo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Data de Término
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Novo Valor
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Observações
                      </th>
                      {isAdmin && (
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAddendums.map((addendum, index) => {
                      const isInformative = isInformativeAddendum(addendum);
                      const isMostRecent = index === 0;
                      const observationText = isInformative
                        ? addendum.observations.replace('[ADITIVO INFORMATIVO] ', '')
                        : addendum.observations;
                      const shouldTruncate = observationText.length > 100;
                      const isExpanded = expandedObs[addendum.id];

                      return (
                        <tr
                          key={addendum.id}
                          className={`border-b border-gray-100 ${getAddendumBgColor(addendum)}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {getAddendumIcon(addendum)}
                              <span className="text-sm font-medium">
                                {getAddendumType(addendum)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="font-medium">
                                {formatDateBR(addendum.start_date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Aditivo #{sortedAddendums.length - index}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="font-medium">{formatDateBR(addendum.end_date)}</div>
                              <div className="text-xs text-gray-500">
                                {addendum.is_punctual ? 'Fim do período' : 'Novo prazo'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {isInformative ? (
                                <span className="text-gray-500 italic">Sem alteração</span>
                              ) : (
                                <>
                                  <div className="font-medium text-green-600">
                                    {formatCurrency(addendum.monthly_value)}
                                  </div>
                                  <div className="text-xs text-gray-500">Por mês</div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {observationText ? (
                              <div className="text-sm text-gray-700">
                                {shouldTruncate && !isExpanded
                                  ? `${observationText.substring(0, 100)}...`
                                  : observationText}
                                {shouldTruncate && (
                                  <button
                                    onClick={() => toggleObservation(addendum.id)}
                                    className="text-blue-600 hover:text-blue-700 ml-1 text-xs"
                                  >
                                    {isExpanded ? 'menos' : 'mais'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-sm">Sem observações</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-center">
                              {isMostRecent ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteClick(addendum.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {mostRecentAddendum && (
                <div
                  className={`border-2 rounded-lg p-4 ${
                    mostRecentAddendum.is_punctual
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-green-50 border-green-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {mostRecentAddendum.is_punctual
                      ? '🟡 Aditivo pontual mais recente (vigência temporária)'
                      : '✅ Este é o aditivo mais recente (valores atuais do contrato)'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {mostRecentAddendum.is_punctual
                      ? `Após ${formatDateBR(mostRecentAddendum.end_date)}, o contrato retornará às condições anteriores`
                      : 'Este aditivo define os valores e prazos atuais do contrato'}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-3">Resumo do Histórico</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Contrato Original</p>
                    <p className="font-medium">{formatCurrency(contract.monthly_value)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateBR(contract.start_date)} até {formatDateBR(contract.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Valor Atual Vigente</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(
                        mostRecentAddendum && !isInformativeAddendum(mostRecentAddendum)
                          ? mostRecentAddendum.monthly_value
                          : contract.monthly_value
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Por mês</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Total de Modificações</p>
                    <p className="font-medium">{addendums.length} aditivos</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Distribuição</p>
                    <p className="text-xs text-gray-700">
                      {punctualCount} pontuais • {informativeCount} informativos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
