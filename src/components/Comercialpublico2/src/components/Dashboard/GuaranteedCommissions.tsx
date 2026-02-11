import React from 'react';
import { DollarSign, CheckCircle, Users, TrendingUp, Info, X } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { Department } from '../../contexts/DepartmentContext';
import { getCommissionRate, calculateContractCommission } from '../../utils/commissionUtils';

interface GuaranteedCommissionsProps {
  department: Department;
}

export const GuaranteedCommissions: React.FC<GuaranteedCommissionsProps> = ({ department }) => {
  const [showBreakdownModal, setShowBreakdownModal] = React.useState<string | null>(null);
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');
  
  if (proposalsLoading || employeesLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }
  
  // Filtrar propostas fechadas do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const closedProposalsThisMonth = proposals.filter(proposal => {
    if (proposal.status !== 'Fechado' && proposal.status !== 'Contrato assinado') return false;

    // Usar closing_date se disponível, senão created_at
    const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
    return closingDate.getMonth() === currentMonth && closingDate.getFullYear() === currentYear;
  });
  
  // Calcular comissões por funcionário
  const calculateEmployeeCommissions = () => {
    // Filtrar funcionários: excluir Rubens Neto
    const filteredEmployees = employees.filter(emp => emp.name !== 'Rubens Neto');

    // Calcular valor total fechado no mês (EXCLUINDO contratos com promotor para cálculo da taxa)
    const totalClosedValueForGoals = closedProposalsThisMonth
      .filter(proposal => !proposal.promotor_id) // Excluir contratos com promotor do cálculo da taxa
      .reduce((sum, proposal) => {
        // Usar nosso_lance se disponível, senão total_value
        const contractValue = proposal.nosso_lance || proposal.total_value || 0;
        return sum + Number(contractValue);
      }, 0);
    
    let commissionRate = 0;
    let displayCommissionRate = '';
    
    if (department === 'Petrobras') {
      // Para Petrobras: não há taxa única, calcular média ponderada
      const totalCommission = closedProposalsThisMonth.reduce((sum, proposal) => {
        const contractValue = proposal.nosso_lance || proposal.total_value || 0;
        if (proposal.promotor_id) {
          return sum + (Number(contractValue) * 0.005) / 100; // 0,005% fixo para promotor
        } else {
          const rate = getCommissionRate(Number(contractValue), department);
          return sum + calculateContractCommission(Number(contractValue), rate);
        }
      }, 0);
      
      const totalValue = closedProposalsThisMonth.reduce((sum, proposal) => {
        const contractValue = proposal.nosso_lance || proposal.total_value || 0;
        return sum + Number(contractValue);
      }, 0);
      
      commissionRate = totalValue > 0 ? (totalCommission / totalValue) * 100 : 0;
      displayCommissionRate = 'Individual';
    } else {
      // Para Comercial Público: taxa baseada no volume mensal
      const getCommercialCommissionRate = (totalValue: number) => {
        if (totalValue <= 1200000) return 0.1;
        if (totalValue <= 2400000) return 0.15;
        return 0.20;
      };
      
      commissionRate = getCommercialCommissionRate(totalClosedValueForGoals);
      displayCommissionRate = `${commissionRate}%`;
    }
    
    const commissionsByEmployee: { [key: string]: { name: string, role: string, closerCommission: number, sdrCommission: number, proposals: number } } = {};
    
    closedProposalsThisMonth.forEach(proposal => {
      // Usar nosso_lance se disponível, senão total_value
      const contractValue = proposal.nosso_lance || proposal.total_value || 0;
      
      let proposalCommission = 0;

      if (proposal.promotor_id) {
        // Se tem promotor: sempre 0,005% fixo
        proposalCommission = (Number(contractValue) * 0.005) / 100;
      } else if (department === 'Petrobras') {
        // Para Petrobras: usar taxa individual do contrato
        const contractRate = getCommissionRate(Number(contractValue), department);
        proposalCommission = calculateContractCommission(Number(contractValue), contractRate);
      } else {
        // Para Comercial Público: usar taxa do mês
        proposalCommission = (Number(contractValue) * commissionRate) / 100;
      }
      
      // Comissão do Closer
      if (proposal.closer_id) {
        const closer = filteredEmployees.find(emp => emp.id === proposal.closer_id);
        if (closer) {
          if (!commissionsByEmployee[proposal.closer_id]) {
            commissionsByEmployee[proposal.closer_id] = {
              name: closer.name,
              role: closer.role,
              closerCommission: 0,
              sdrCommission: 0,
              proposals: 0
            };
          }
          commissionsByEmployee[proposal.closer_id].closerCommission += proposalCommission;
          commissionsByEmployee[proposal.closer_id].proposals += 1;
        }
      }
      
      // Comissão do SDR (mesma taxa que o closer)
      if (proposal.sdr_id) {
        const sdr = filteredEmployees.find(emp => emp.id === proposal.sdr_id);
        if (sdr) {
          if (!commissionsByEmployee[proposal.sdr_id]) {
            commissionsByEmployee[proposal.sdr_id] = {
              name: sdr.name,
              role: sdr.role,
              closerCommission: 0,
              sdrCommission: 0,
              proposals: 0
            };
          }
          commissionsByEmployee[proposal.sdr_id].sdrCommission += proposalCommission;
        }
      }
    });
    
    return { commissionsByEmployee, commissionRate, displayCommissionRate };
  };
  
  const { commissionsByEmployee: employeeCommissions, commissionRate, displayCommissionRate } = calculateEmployeeCommissions();
  const totalGuaranteedCommissions = Object.values(employeeCommissions)
  .reduce(
    (sum, emp) => sum + emp.closerCommission + emp.sdrCommission, 0
  );

  const getRateColor = (dept: Department, rate: number) => {
    if (dept === 'Petrobras') return 'text-yellow-600';
    if (rate === 0.1) return 'text-red-600';
    if (rate === 0.15) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRateBgColor = (dept: Department, rate: number) => {
    if (dept === 'Petrobras') return 'bg-yellow-50 border-yellow-200';
    if (rate === 0.1) return 'bg-red-50 border-red-200';
    if (rate === 0.15) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };
  const BreakdownModal: React.FC<{ type: string; onClose: () => void }> = ({ type, onClose }) => {
    const renderContent = () => {
      switch (type) {
        case 'total-guaranteed':
          console.log('🔍 [GuaranteedCommissions] Composição detalhada do valor garantido:', {
            totalGuaranteedCommissions,
            closedProposalsCount: closedProposalsThisMonth.length,
            employeeCommissions: Object.entries(employeeCommissions).map(([id, data]) => ({
              name: data.name,
              closerCommission: data.closerCommission,
              sdrCommission: data.sdrCommission,
              total: data.closerCommission + data.sdrCommission
            })),
            closedContracts: closedProposalsThisMonth.map(contract => ({
              client: contract.client,
              value: contract.nosso_lance || contract.total_value,
              closing_date: contract.closing_date,
              commission: contract.commission || 0
            }))
          });
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição das Comissões Garantidas</h3>
              
              {/* Mostrar contratos fechados primeiro */}
              <div className={`border rounded-lg p-4 mb-4 ${
                department === 'Petrobras' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <h4 className={`font-medium mb-3 ${
                  department === 'Petrobras' ? 'text-yellow-900' : 'text-blue-900'
                }`}>Contratos Fechados Este Mês ({closedProposalsThisMonth.length})</h4>
                <div className="space-y-3">
                  {closedProposalsThisMonth.map(contract => {
                    const contractValue = contract.nosso_lance || contract.total_value || 0;
                    let contractCommission = 0;
                    let contractRate = '';
                    
                    if (contract.promotor_id) {
                      contractCommission = (Number(contractValue) * 0.1) / 100;
                      contractRate = '0,1%';
                    } else if (department === 'Petrobras') {
                      const rate = getCommissionRate(Number(contractValue), department);
                      contractCommission = calculateContractCommission(Number(contractValue), rate);
                      contractRate = `${rate}%`;
                    } else {
                      contractCommission = (Number(contractValue) * commissionRate) / 100;
                      contractRate = `${commissionRate}%`;
                    }
                    
                    const closingDate = contract.closing_date ? new Date(contract.closing_date) : new Date(contract.created_at);
                    
                    return (
                      <div key={contract.id} className={`bg-white rounded-lg p-3 border ${
                        department === 'Petrobras' ? 'border-yellow-200' : 'border-blue-200'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{contract.client}</h5>
                            <div className="text-sm text-gray-600">
                              Fechado em: {closingDate.toLocaleDateString('pt-BR')}
                            </div>
                            {contract.nosso_lance && (
                              <div className={`text-xs ${
                                department === 'Petrobras' ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                Baseado no nosso lance
                              </div>
                            )}
                            {contract.promotor_id && (
                              <div className="text-xs text-red-600">
                                Com promotor (0,01% fixo)
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatCurrency(contractCommission)}
                            </div>
                            <div className="text-xs text-gray-500">comissão total</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <span>{contract.nosso_lance ? 'Nosso Lance:' : 'Valor Global:'}</span>
                            <div className={`font-medium ${
                              department === 'Petrobras' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              {formatCurrency(contract.nosso_lance || contract.total_value)}
                            </div>
                          </div>
                          <div>
                            <span>Taxa:</span>
                            <div className="font-medium">{contractRate}</div>
                          </div>
                          <div>
                            <span>Mensal:</span>
                            <div className="font-medium">{formatCurrency(contract.monthly_value)} × {contract.months}m</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Distribuição por funcionário */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 mt-6 mb-3">Distribuição por Funcionário</h4>
                {Object.keys(employeeCommissions).length > 0 ? (
                  Object.entries(employeeCommissions).map(([employeeId, data]) => (
                    <div key={employeeId} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{data.name}</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(data.closerCommission + data.sdrCommission)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {data.closerCommission > 0 && (
                          <div className="flex justify-between">
                            <span>Como Closer ({data.proposals} contratos)</span>
                            <span>{formatCurrency(data.closerCommission)}</span>
                          </div>
                        )}
                        {data.sdrCommission > 0 && (
                          <div className="flex justify-between">
                            <span>Como SDR ({department === 'Petrobras' ? 'taxa individual' : `${commissionRate}% do valor`})</span>
                            <span>{formatCurrency(data.sdrCommission)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-sm">Nenhuma comissão calculada</div>
                    <div className="text-xs mt-1">
                      Verifique se existem contratos fechados este mês
                    </div>
                  </div>
                )}
              </div>
              
              {/* Resumo final */}
              <div className={`border rounded-lg p-4 ${
                department === 'Petrobras' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {formatCurrency(closedProposalsThisMonth.reduce((sum, p) => sum + (p.nosso_lance || p.total_value || 0), 0))}
                    </div>
                    <div className="text-gray-600">Volume Fechado*</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {displayCommissionRate}
                    </div>
                    <div className="text-gray-600">Taxa Aplicada</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {formatCurrency(totalGuaranteedCommissions)}
                    </div>
                    <div className="text-gray-600">Total Comissões</div>
                  </div>
                </div>
                <div className={`text-center mt-3 text-xs ${
                  department === 'Petrobras' ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  <strong>Fórmula:</strong> {department === 'Petrobras' 
                    ? 'Taxa individual por contrato baseada no valor global' 
                    : `Nosso Lance × ${commissionRate}% = Total de Comissões`
                  }
                  <div className="mt-1">
                    <em>* Baseado no nosso lance quando disponível, valor estimado como fallback</em>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>Total Garantido Final</span>
                  <span className="text-green-600">{formatCurrency(totalGuaranteedCommissions)}</span>
                </div>
              </div>
            </div>
          );
        case 'closed-value':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição do Valor Fechado</h3>
              <div className={`border rounded-lg p-3 mb-4 ${
                department === 'Petrobras' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${
                  department === 'Petrobras' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  <strong>Metodologia:</strong> Valores baseados no nosso lance quando disponível, 
                  ou valor estimado como fallback. 
                  {department === 'Petrobras' 
                    ? ' Para Petrobras, cada contrato tem taxa individual baseada no valor global.'
                    : ' Isso garante cálculos mais precisos das comissões.'
                  }
                </p>
              </div>
              <div className="space-y-2">
                {closedProposalsThisMonth.map(proposal => (
                  <div key={proposal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{proposal.client}</span>
                      <div className="text-sm text-gray-600">
                        Fechado em: {proposal.closing_date ? new Date(proposal.closing_date).toLocaleDateString('pt-BR') : 'Data não informada'}
                      </div>
                      {proposal.nosso_lance && (
                        <div className={`text-xs ${
                          department === 'Petrobras' ? 'text-yellow-600' : 'text-blue-600'
                        }`}>
                          📊 Baseado no nosso lance
                        </div>
                      )}
                      {department === 'Petrobras' && (
                        <div className="text-xs text-yellow-600">
                          Taxa: {getCommissionRate(proposal.nosso_lance || proposal.total_value || 0, department)}%
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(proposal.nosso_lance || proposal.total_value)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total Fechado</span>
                    <span className="text-green-600">{formatCurrency(closedProposalsThisMonth.reduce((sum, p) => sum + (p.nosso_lance || p.total_value || 0), 0))}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {department === 'Petrobras' 
                      ? 'Comissões calculadas individualmente por contrato'
                      : 'Valores calculados com base no nosso lance (mais preciso)'
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <div className="text-lg mb-2">🔍 Conteúdo não encontrado</div>
                <div className="text-sm">Tipo de detalhamento: {type}</div>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detalhamento</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Comissões Garantidas do Mês</span>
          </h3>
          <p className="text-sm text-gray-600">
            Baseado em contratos já fechados
            {department === 'Petrobras' && <span className="text-yellow-600 font-medium"> • Petrobras</span>}
          </p>
        </div>
        <div className="text-right">
          <button 
            onClick={() => setShowBreakdownModal('total-guaranteed')}
            className="text-xl md:text-2xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center space-x-1"
            title="Clique para ver detalhes"
          >
            {formatCurrency(totalGuaranteedCommissions)}
            <Info className="w-3 h-3 md:w-4 md:h-4 ml-1" />
          </button>
          <div className="text-xs md:text-sm text-gray-500">Total Garantido</div>
        </div>
      </div>

      {/* Volume e Taxa */}
      <div className={`mb-6 p-4 rounded-lg border ${getRateBgColor(department, commissionRate)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Volume Fechado no Mês</h4>
            <button 
              onClick={() => setShowBreakdownModal('closed-value')}
              className="text-xl md:text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
              title="Clique para ver detalhes"
            >
              {formatCurrency(closedProposalsThisMonth.reduce((sum, p) => sum + (p.nosso_lance || p.total_value || 0), 0))}
              <Info className="w-3 h-3 md:w-4 md:h-4 ml-1" />
            </button>
          </div>
          <div className="text-right">
            <h4 className="text-sm font-semibold text-gray-900">Taxa Atual</h4>
            <p className={`text-xl md:text-2xl font-bold ${getRateColor(department, commissionRate)}`}>
              {displayCommissionRate}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Fechados</p>
              <p className="text-lg md:text-xl font-bold text-gray-900">{closedProposalsThisMonth.length}</p>
            </div>
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Valor Total</p>
              <button 
                onClick={() => setShowBreakdownModal('closed-value')}
                className="text-lg md:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
                title="Clique para ver detalhes"
              >
                {formatCurrency(closedProposalsThisMonth.reduce((sum, p) => sum + (p.nosso_lance || p.total_value || 0), 0))}
                <Info className="w-3 h-3 md:w-4 md:h-4 ml-1" />
              </button>
            </div>
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Pessoas</p>
              <p className="text-lg md:text-xl font-bold text-gray-900">{Object.keys(employeeCommissions).length}</p>
            </div>
            <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Individual Commissions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Comissões por Pessoa:</h4>
        {Object.entries(employeeCommissions).length > 0 ? (
          Object.entries(employeeCommissions).map(([employeeId, data]) => (
            <div key={employeeId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    department === 'Petrobras' ? 'bg-yellow-500' :
                    data.role === 'Closer' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    <span className="text-white font-bold text-sm">
                      {data.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{data.name}</p>
                    <p className="text-sm text-gray-500">
                      {data.role} • {data.proposals > 0 ? `${data.proposals} contratos fechados` : 'SDR em contratos'}
                      {department === 'Petrobras' && <span className="text-yellow-600"> • Petrobras</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm md:text-lg font-bold text-green-600">
                    {formatCurrency(data.closerCommission + data.sdrCommission)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    {data.closerCommission > 0 && `Closer: ${formatCurrency(data.closerCommission)}`}
                    {data.closerCommission > 0 && data.sdrCommission > 0 && ' • '}
                    {data.sdrCommission > 0 && `SDR: ${formatCurrency(data.sdrCommission)}`}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum contrato fechado este mês</p>
            <p className="text-sm text-gray-400">As comissões aparecerão quando contratos forem fechados</p>
          </div>
        )}
      </div>

      {/* Commission Rules */}
      <div className={`mt-6 p-4 rounded-lg border ${
        department === 'Petrobras' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <h4 className={`text-xs md:text-sm font-medium mb-3 ${
          department === 'Petrobras' ? 'text-yellow-900' : 'text-blue-900'
        }`}>Regras de Comissão</h4>

        {department === 'Petrobras' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs md:text-sm">
            <div className="text-center p-2 bg-yellow-100 border border-yellow-300 rounded">
              <div className="font-medium text-yellow-800">2,8%</div>
              <div className="text-yellow-600">Até R$ 50 mi</div>
            </div>
            <div className="text-center p-2 bg-orange-100 border border-orange-300 rounded">
              <div className="font-medium text-orange-800">1,8%</div>
              <div className="text-orange-600">R$ 50 mi - R$ 100 mi</div>
            </div>
            <div className="text-center p-2 bg-green-100 border border-green-300 rounded">
              <div className="font-medium text-green-800">1,3%</div>
              <div className="text-green-600">Acima de R$ 100 mi</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs md:text-sm">
            <div className="bg-white rounded-lg p-3 border border-blue-300">
              <div className="font-semibold text-blue-900 mb-2">SEM PROMOTOR:</div>
              <div className="space-y-1 text-blue-800">
                <div>• <strong>Closer:</strong> 0,1% do valor global</div>
                <div>• <strong>Orçamentista:</strong> 0,02% do valor global</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-blue-300">
              <div className="font-semibold text-blue-900 mb-2">COM PROMOTOR:</div>
              <div className="space-y-1 text-blue-800">
                <div>• <strong>Closer:</strong> 0,01% do valor global</div>
                <div>• <strong>Orçamentista:</strong> 0,005% do valor global</div>
              </div>
            </div>

            <div className="bg-blue-100 rounded-lg p-2 border border-blue-300">
              <p className="text-xs text-blue-800 text-center">
                A comissão é calculada sobre o valor global do contrato (nosso lance)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    {showBreakdownModal && (
      <BreakdownModal 
        type={showBreakdownModal} 
        onClose={() => setShowBreakdownModal(null)} 
      />
    )}
    </>
  );
};