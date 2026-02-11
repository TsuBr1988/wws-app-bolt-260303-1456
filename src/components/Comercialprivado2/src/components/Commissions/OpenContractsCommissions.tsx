import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { getOpenContracts, COMMISSION_TIERS } from '../../utils/commissionUtils';
import { formatCurrency } from '../../utils/formatCurrency';

interface OpenContractsCommissionsProps {
  employeeId: string;
  employeeRole: 'closer' | 'sdr';
  proposals: any[];
  employeeName: string;
  selectedYear: number;
}

export const OpenContractsCommissions: React.FC<OpenContractsCommissionsProps> = ({
  employeeId,
  employeeRole,
  proposals,
  employeeName,
  selectedYear
}) => {
  const openContracts = getOpenContracts(proposals, employeeId, employeeRole);
  
  // Calcular totais por tier
  const totals = COMMISSION_TIERS.reduce((acc, tier) => {
    const total = openContracts.reduce((sum, contract) => {
      return sum + ((contract.total_value * tier.rate) / 100);
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
          <p className="text-sm text-gray-600">Potencial de comissão por meta</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-purple-600">
            {openContracts.length} contratos
          </div>
          <div className="text-sm text-gray-500">Em negociação</div>
        </div>
      </div>
      
      {/* Commission Tiers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {COMMISSION_TIERS.map((tier) => (
          <div key={tier.rate} className={`${tier.bgColor} border-2 border-current rounded-lg p-4`}>
            <div className="text-center">
              <div className={`text-lg font-bold ${tier.color}`}>
                {formatCurrency(totals[tier.rate])}
              </div>
              <div className={`text-sm font-medium ${tier.color}`}>
                {tier.label} ({tier.rate}%)
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {tier.maxValue ? 
                  `${formatCurrency(tier.minValue)} - ${formatCurrency(tier.maxValue)}` :
                  `Acima de ${formatCurrency(tier.minValue)}`
                }
              </div>
            </div>
          </div>
        ))}
      </div>
      
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
                      contract.status === 'Negociação' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.status}
                    </span>
                    <span>Criado em {new Date(contract.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(contract.total_value)}
                  </div>
                  <div className="text-sm text-gray-500">Valor Global</div>
                </div>
              </div>
              
              {/* Commission Scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {COMMISSION_TIERS.map((tier) => {
                  const commissionValue = (contract.total_value * tier.rate) / 100;
                  return (
                    <div key={tier.rate} className={`${tier.bgColor} rounded-lg p-3 text-center`}>
                      <div className={`text-lg font-bold ${tier.color}`}>
                        {formatCurrency(commissionValue)}
                      </div>
                      <div className={`text-xs font-medium ${tier.color}`}>
                        {tier.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {tier.rate}% do global
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full font-medium ${
                  employeeRole === 'closer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {employeeRole === 'closer' ? 'Como Closer' : 'Como SDR'}
                </span>
                <span className="text-gray-500">
                  {contract.monthly_value && formatCurrency(contract.monthly_value)} × {contract.months} meses
                </span>
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