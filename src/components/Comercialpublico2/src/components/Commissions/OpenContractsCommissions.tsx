import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { getOpenContracts, COMMISSION_TIERS, PETROBRAS_COMMISSION_TIERS, getCommissionRate, calculateContractCommission, calculateOrcamentistaCommission } from '../../utils/commissionUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import { Department } from '../../contexts/DepartmentContext';

interface OpenContractsCommissionsProps {
  employeeId: string;
  employeeRole: 'closer' | 'sdr' | 'orcamentista';
  proposals: any[];
  employeeName: string;
  selectedYear: number;
  department: Department;
}

export const OpenContractsCommissions: React.FC<OpenContractsCommissionsProps> = ({
  employeeId,
  employeeRole,
  proposals,
  employeeName,
  selectedYear,
  department
}) => {
  // Para orçamentistas, buscar contratos onde ele está marcado
  const openContracts = employeeRole === 'orcamentista'
    ? proposals.filter(proposal => {
        const validStatuses = ['Aguardando', 'Em andamento'];
        if (!validStatuses.includes(proposal.status)) return false;
        if (proposal.nao_gera_comissao === true) return false;
        if (proposal.orcamentista_id !== employeeId) return false;
        // Orçamentistas podem trabalhar em qualquer departamento, não filtrar por department
        return true;
      })
    : getOpenContracts(proposals, employeeId, employeeRole as 'closer' | 'sdr', department);

  // Escolher tiers baseado no departamento
  const commissionTiers = department === 'Petrobras' ? PETROBRAS_COMMISSION_TIERS : COMMISSION_TIERS;

  // Para orçamentistas e closers, calcular totais separados
  const commissionBreakdown = (employeeRole === 'orcamentista' || (employeeRole === 'closer' && department === 'Comercial Público'))
    ? {
        semPromotor: openContracts
          .filter(c => !c.promotor_id)
          .reduce((sum, c) => {
            const value = c.nosso_lance || c.total_value || 0;
            const commission = employeeRole === 'orcamentista'
              ? calculateOrcamentistaCommission(value, false)
              : calculateContractCommission(value, getCommissionRate(value, department));
            return sum + commission;
          }, 0),
        comPromotor: openContracts
          .filter(c => c.promotor_id)
          .reduce((sum, c) => {
            const value = c.nosso_lance || c.total_value || 0;
            return sum + (value * 0.005) / 100;
          }, 0),
        total: openContracts.reduce((sum, c) => {
          const value = c.nosso_lance || c.total_value || 0;
          if (c.promotor_id) {
            return sum + (value * 0.005) / 100;
          } else {
            const commission = employeeRole === 'orcamentista'
              ? calculateOrcamentistaCommission(value, false)
              : calculateContractCommission(value, getCommissionRate(value, department));
            return sum + commission;
          }
        }, 0)
      }
    : null;

  // Calcular totais por tier para closers/sdrs
  const totals = commissionTiers.reduce((acc, tier) => {
    const total = openContracts.reduce((sum, contract) => {
      const contractValue = contract.nosso_lance || contract.total_value || 0;
      if (department === 'Petrobras') {
        // Para Petrobras: usar taxa específica do contrato
        const contractRate = getCommissionRate(contractValue, department);
        return sum + calculateContractCommission(contractValue, contractRate);
      } else {
        // Para Comercial Público: usar tier rate
        return sum + ((contractValue * tier.rate) / 100);
      }
    }, 0);
    return { ...acc, [tier.rate]: total };
  }, {} as { [key: number]: number });
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>Contratos em Aberto - {employeeName}</span>
          </h3>
          <p className="text-sm text-gray-600">
            {employeeRole === 'orcamentista'
              ? 'Potencial de comissão (0,02% sem promotor, 0,005% com promotor)'
              : department === 'Petrobras'
              ? 'Potencial de comissão por valor do contrato'
              : employeeRole === 'closer'
              ? 'Potencial de comissão (0,1% a 0,2% sem promotor, 0,005% com promotor)'
              : 'Potencial de comissão por valor do contrato'
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-purple-600">
            {openContracts.length} contratos
          </div>
          <div className="text-sm text-gray-500">Em negociação</div>
        </div>
      </div>
      
      {/* Commission Tiers Summary */}
      {commissionBreakdown !== null ? (
        <div className="space-y-4 mb-6">
          {/* Total Card */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(commissionBreakdown.total)}
              </div>
              <div className="text-sm font-medium text-purple-800">
                Comissão Total Potencial
              </div>
              <div className="text-xs text-gray-600 mt-2">
                {openContracts.filter(c => !c.promotor_id).length} contratos sem promotor ({employeeRole === 'orcamentista' ? '0,02%' : '0,1% a 0,2%'})
                {openContracts.filter(c => c.promotor_id).length > 0 && (
                  <> + {openContracts.filter(c => c.promotor_id).length} contratos com promotor (0,005%)</>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-700">
                  {formatCurrency(commissionBreakdown.semPromotor)}
                </div>
                <div className="text-xs font-medium text-purple-900">
                  Sem Promotor
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {employeeRole === 'orcamentista' ? 'Taxa: 0,02%' : 'Taxas: 0,1% a 0,2%'}
                </div>
                <div className="text-xs text-gray-500">
                  {openContracts.filter(c => !c.promotor_id).length} contratos
                </div>
              </div>
            </div>

            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-700">
                  {formatCurrency(commissionBreakdown.comPromotor)}
                </div>
                <div className="text-xs font-medium text-orange-900">
                  Com Promotor
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Taxa fixa: 0,005%
                </div>
                <div className="text-xs text-gray-500">
                  {openContracts.filter(c => c.promotor_id).length} contratos
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className={`grid grid-cols-1 ${department === 'Petrobras' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4 mb-6`}>
        {commissionTiers.map((tier) => (
          <div key={tier.rate} className={`${tier.bgColor} border-2 border-current rounded-lg p-4`}>
            <div className="text-center">
              <div className={`text-lg font-bold ${tier.color}`}>
                {formatCurrency(totals[tier.rate])}
              </div>
              <div className={`text-sm font-medium ${tier.color}`}>
                {department === 'Petrobras' ? `${tier.label} (${tier.rate}%)` : `Comissão Total (${tier.rate}%)`}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {department === 'Petrobras'
                  ? (tier.maxValue ? `${formatCurrency(tier.minValue)} - ${formatCurrency(tier.maxValue)}` : `Acima de ${formatCurrency(tier.minValue)}`)
                  : `Taxa fixa de ${tier.rate}% sobre todos os contratos`
                }
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Contracts List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {openContracts.length > 0 ? (
          openContracts.map((contract: any) => (
            <div key={contract.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{contract.client}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contract.status === 'Em andamento' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.status}
                    </span>
                    <span>Criado em {new Date(contract.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(contract.nosso_lance || contract.total_value)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                    {contract.nosso_lance ? (
                      <>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Nosso Lance
                        </span>
                      </>
                    ) : (
                      <span>Valor Global Estimado</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Commission Scenarios */}
              <div className="grid grid-cols-1 gap-3 mt-4">
                {(employeeRole === 'orcamentista' || employeeRole === 'closer') && department === 'Comercial Público' ? (
                  // Para Orçamentista e Closer (Comercial Público): mostrar apenas UM cenário
                  contract.promotor_id ? (
                    // Tem promotor: mostrar só com promotor
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {formatCurrency(((contract.nosso_lance || contract.total_value || 0) * 0.005) / 100)}
                      </div>
                      <div className="text-xs font-medium text-orange-800">
                        Com Promotor
                      </div>
                      <div className="text-xs text-gray-600">
                        Taxa fixa: 0,005%
                      </div>
                    </div>
                  ) : (
                    // Não tem promotor: mostrar só sem promotor
                    (() => {
                      const contractValue = contract.nosso_lance || contract.total_value || 0;
                      const contractRate = employeeRole === 'orcamentista'
                        ? 0.02
                        : getCommissionRate(contractValue, department);
                      const commissionValue = employeeRole === 'orcamentista'
                        ? calculateOrcamentistaCommission(contractValue, false)
                        : calculateContractCommission(contractValue, contractRate);

                      return (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {formatCurrency(commissionValue)}
                          </div>
                          <div className="text-xs font-medium text-purple-800">
                            {employeeRole === 'orcamentista' ? 'Como Orçamentista' : 'Como Closer'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {employeeRole === 'orcamentista' ? 'Taxa: 0,02%' : `Taxa: ${contractRate}%`}
                          </div>
                        </div>
                      );
                    })()
                  )
                ) : department === 'Petrobras' ? (
                  // Para Petrobras: mostrar apenas a comissão específica deste contrato
                  (() => {
                    const contractValue = contract.nosso_lance || contract.total_value || 0;
                    const contractRate = getCommissionRate(contractValue, department);
                    const commissionValue = calculateContractCommission(contractValue, contractRate);
                    const tier = contractValue <= 50000000 ? 'Até 50M' :
                                contractValue <= 100000000 ? '50M - 100M' : 'Acima de 100M';

                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-yellow-600">
                          {formatCurrency(commissionValue)}
                        </div>
                        <div className="text-xs font-medium text-yellow-800">
                          {tier} - {contractRate}%
                        </div>
                        <div className="text-xs text-gray-600">
                          Comissão individual
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // Para Comercial Público: mostrar comissão baseada no valor do contrato
                  (() => {
                    const contractValue = contract.nosso_lance || contract.total_value || 0;
                    const contractRate = getCommissionRate(contractValue, department);
                    const commissionValue = calculateContractCommission(contractValue, contractRate);

                    // Determinar a faixa
                    const tier = COMMISSION_TIERS.find(t =>
                      contractValue > t.minValue && (t.maxValue === null || contractValue <= t.maxValue)
                    ) || COMMISSION_TIERS[0];

                    return (
                      <div className={`${tier.bgColor} border border-current rounded-lg p-3 text-center`}>
                        <div className={`text-lg font-bold ${tier.color}`}>
                          {formatCurrency(commissionValue)}
                        </div>
                        <div className={`text-xs font-medium ${tier.color}`}>
                          {tier.label} - {tier.rate}%
                        </div>
                        <div className="text-xs text-gray-600">
                          Comissão individual
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full font-medium ${
                  employeeRole === 'orcamentista' ? 'bg-purple-100 text-purple-800' :
                  employeeRole === 'closer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {employeeRole === 'orcamentista' ? 'Como Orçamentista' :
                   employeeRole === 'closer' ? 'Como Closer' : 'Como SDR'}
                </span>
                {(employeeRole === 'orcamentista' || employeeRole === 'closer') && contract.promotor_id && (
                  <span className="text-orange-600 font-medium text-xs">
                    • Tem Promotor
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato em aberto</h3>
            <p className="text-gray-500">
              {employeeName} não possui contratos em negociação no momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
};