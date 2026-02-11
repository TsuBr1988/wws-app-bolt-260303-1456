import React, { useState, useEffect } from 'react';
import { X, Save, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateMonthsBetween } from '../../utils/contractDuration';

interface Contract {
  id: string;
  client_name: string;
  start_date: string;
  monthly_value: number;
  end_date: string;
  margem_percentual: number;
  proposal_id?: string;
}

interface ContractWithProposal extends Contract {
  originalMonths: number;
  originalMonthlyValue: number;
  contractSignedDate: string;
}

interface ROIModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
  operationalCosts: number;
  onRefresh: () => void;
}

export const ROIModal: React.FC<ROIModalProps> = ({
  isOpen,
  onClose,
  contracts: initialContracts,
  operationalCosts,
  onRefresh
}) => {
  const [contracts, setContracts] = useState<ContractWithProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMargin, setEditingMargin] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    async function loadContractsWithProposals() {
      setLoading(true);
      const contractsWithProposals: ContractWithProposal[] = [];

      for (const contract of initialContracts) {
        if (contract.proposal_id) {
          const { data: proposal } = await supabase
            .from('proposals')
            .select('valor_meses, valor_mensal, updated_at, situacao')
            .eq('id', contract.proposal_id)
            .single();

          if (proposal) {
            contractsWithProposals.push({
              ...contract,
              originalMonths: proposal.valor_meses || 0,
              originalMonthlyValue: proposal.valor_mensal || contract.monthly_value,
              contractSignedDate: proposal.updated_at
            });
          } else {
            const startDate = new Date(contract.start_date);
            const endDate = new Date(contract.end_date);
            const months = calculateMonthsBetween(startDate, endDate);
            contractsWithProposals.push({
              ...contract,
              originalMonths: months,
              originalMonthlyValue: contract.monthly_value,
              contractSignedDate: contract.start_date
            });
          }
        } else {
          const startDate = new Date(contract.start_date);
          const endDate = new Date(contract.end_date);
          const months = calculateMonthsBetween(startDate, endDate);
          contractsWithProposals.push({
            ...contract,
            originalMonths: months,
            originalMonthlyValue: contract.monthly_value,
            contractSignedDate: contract.start_date
          });
        }
      }

      setContracts(contractsWithProposals);
      setLoading(false);
    }

    loadContractsWithProposals();
  }, [initialContracts]);

  if (!isOpen) return null;

  const calculateContractData = (contract: ContractWithProposal) => {
    const currentDate = new Date();
    const contractSignedDate = new Date(contract.contractSignedDate);
    const endDate = new Date(contractSignedDate);
    endDate.setMonth(endDate.getMonth() + contract.originalMonths);

    const totalDurationMonths = contract.originalMonths;
    const monthsRemaining = calculateMonthsBetween(currentDate, endDate);

    const valorGlobal = contract.originalMonthlyValue * totalDurationMonths;
    const faturamentoProjetado = contract.originalMonthlyValue * monthsRemaining;
    const margemReais = faturamentoProjetado * (contract.margem_percentual / 100);

    return {
      durationMonths: totalDurationMonths,
      monthsRemaining,
      valorGlobal,
      faturamentoProjetado,
      margemReais,
      endDate
    };
  };

  const totalMargin = contracts.reduce((sum, contract) => {
    const { margemReais } = calculateContractData(contract);
    return sum + margemReais;
  }, 0);

  const roi = operationalCosts > 0 ? (totalMargin / operationalCosts) * 100 : 0;

  const handleMarginEdit = (contractId: string, value: string) => {
    setEditingMargin({ ...editingMargin, [contractId]: value });
  };

  const handleCancelEdit = (contractId: string) => {
    const newEditingState = { ...editingMargin };
    delete newEditingState[contractId];
    setEditingMargin(newEditingState);
  };

  const handleSaveMargin = async (contractId: string) => {
    const value = editingMargin[contractId];

    if (!value || value.trim() === '') {
      alert('Digite um valor para a margem');
      return;
    }

    const newMargin = parseFloat(value);

    if (isNaN(newMargin) || newMargin < 0 || newMargin > 100) {
      alert('Margem deve ser um número entre 0 e 100');
      return;
    }

    setSaving(contractId);

    try {
      const contract = contracts.find(c => c.id === contractId);
      console.log('Tentando atualizar contrato:', {
        contractId,
        contractName: contract?.client_name,
        newMargin,
        contractExists: !!contract
      });

      const { data, error } = await supabase
        .from('contracts')
        .update({ margem_percentual: newMargin })
        .eq('id', contractId)
        .select();

      console.log('Resposta do Supabase:', { error, data });

      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        throw new Error(`${error.message} (código: ${error.code || 'desconhecido'})`);
      }

      console.log('Atualização confirmada:', data);

      const newEditingState = { ...editingMargin };
      delete newEditingState[contractId];
      setEditingMargin(newEditingState);

      await new Promise(resolve => setTimeout(resolve, 300));

      onRefresh();

      alert('Margem atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar margem:', error);
      alert('Erro ao salvar margem: ' + (error as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const sortedContracts = [...contracts].sort((a, b) =>
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ROI - Retorno sobre Investimento</h2>
            <p className="text-sm text-gray-600 mt-1">
              Contratos ativos com margens projetadas (faturamento restante)
            </p>
          </div>
          <button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Margem Projetada Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMargin)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Custos Operacionais (Últimos 12 meses)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(operationalCosts)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-2xl font-bold text-blue-600">{roi.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Fórmula:</strong> ROI = (Σ Margem Projetada de contratos ativos / Custos Operacionais últimos 12 meses) × 100</p>
            <p className="mt-1 text-xs"><strong>Margem Projetada:</strong> Faturamento restante (do mês atual até fim do contrato) × Margem %</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Carregando dados das propostas...</div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Contrato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Cliente
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Global
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meses Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meses Restantes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Mensal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faturamento Projetado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margem %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margem R$
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedContracts.map((contract) => {
                  const { durationMonths, monthsRemaining, valorGlobal, faturamentoProjetado, margemReais } = calculateContractData(contract);
                  const isEditing = editingMargin[contract.id] !== undefined;
                  const displayMargin = isEditing ? editingMargin[contract.id] : contract.margem_percentual.toString();

                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(contract.contractSignedDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {contract.client_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(valorGlobal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {durationMonths}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        <span className={monthsRemaining === 0 ? 'text-red-600 font-semibold' : 'text-blue-600 font-semibold'}>
                          {monthsRemaining}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(contract.monthly_value)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                        {formatCurrency(faturamentoProjetado)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={displayMargin}
                            onChange={(e) => handleMarginEdit(contract.id, e.target.value)}
                            onFocus={(e) => {
                              if (!isEditing) {
                                handleMarginEdit(contract.id, contract.margem_percentual.toString());
                              }
                            }}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-600">%</span>
                          {isEditing && (
                            <>
                              <button
                                onClick={() => handleSaveMargin(contract.id)}
                                disabled={saving === contract.id}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                title="Salvar"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelEdit(contract.id)}
                                disabled={saving === contract.id}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Cancelar"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        {formatCurrency(margemReais)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-right text-sm text-gray-900">
                    Total Margem Projetada:
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-bold">
                    {formatCurrency(totalMargin)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700">Insights</span>
            {showInsights ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {showInsights && (
            <div className="px-6 pb-4">
              <div className="text-sm text-gray-600 space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>Total de {sortedContracts.length} contratos ativos</li>
                  <li>Margem projetada total: {formatCurrency(totalMargin)}</li>
                  <li>ROI calculado: {roi.toFixed(1)}% (ideal: acima de 100%)</li>
                  <li>A margem é calculada sobre o <strong>faturamento restante</strong> (do mês atual até o fim de cada contrato)</li>
                  <li>Você pode editar a margem percentual de cada contrato clicando no campo, alterando e clicando em salvar</li>
                  {roi < 100 && <li className="text-red-600">⚠️ ROI abaixo de 100% indica que os custos superam as margens projetadas</li>}
                  {roi >= 100 && roi < 200 && <li className="text-yellow-600">⚠️ ROI moderado - considere otimizar custos ou margens</li>}
                  {roi >= 200 && <li className="text-green-600">✓ ROI excelente - operação altamente lucrativa</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
