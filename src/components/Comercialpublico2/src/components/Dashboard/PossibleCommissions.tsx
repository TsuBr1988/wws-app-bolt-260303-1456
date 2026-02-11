import React from 'react';
import { DollarSign, TrendingUp, Users, Target, Info, X } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { Department } from '../../contexts/DepartmentContext';
import { isPossivelComissao } from '../../constants/status';
import { getCommissionRate, calculateContractCommission } from '../../utils/commissionUtils';

interface PossibleCommissionsProps {
  department: Department;
}

export const PossibleCommissions: React.FC<PossibleCommissionsProps> = ({ department }) => {
  const [showBreakdownModal, setShowBreakdownModal] = React.useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null);
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');
  
  // LOG PRINCIPAL: Debug dos dados recebidos
  React.useEffect(() => {
    console.log('🔍 [PossibleCommissions] DEBUG - Dados recebidos:', {
      proposals: proposals.length,
      employees: employees.length,
      proposalsSample: proposals.slice(0, 3).map(p => ({
        client: p.client,
        status: p.status,
        total_value: p.total_value,
        nosso_lance: p.nosso_lance,
        promotor_id: p.promotor_id,
        closer_id: p.closer_id,
        sdr_id: p.sdr_id
      })),
      department
    });
  }, [proposals, employees, department]);

  if (proposalsLoading || employeesLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-sm border border-green-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }
  
  // CORRIGIDO: Usar a constante para filtrar propostas com possível comissão
  const activeProposals = proposals.filter(p => {
    const isActive = isPossivelComissao(p.status);
    if (!isActive) return false;
    
    // Log de cada proposta ativa encontrada
    console.log('🎯 [PossibleCommissions] Proposta ativa encontrada:', {
      client: p.client,
      status: p.status,
      total_value: p.total_value,
      nosso_lance: p.nosso_lance,
      monthly_value: p.monthly_value,
      months: p.months,
      has_promotor: !!p.promotor_id,
      closer_id: p.closer_id,
      sdr_id: p.sdr_id
    });
    
    return true;
  });
  
  console.log('📊 [PossibleCommissions] Propostas ativas filtradas:', {
    total: activeProposals.length,
    comPromotor: activeProposals.filter(p => p.promotor_id).length,
    semPromotor: activeProposals.filter(p => !p.promotor_id).length,
    valoresTotais: activeProposals.map(p => p.total_value || 0),
    nossosLances: activeProposals.map(p => p.nosso_lance || 0)
  });
  
  // Propostas possíveis para comissão (incluindo as com promotor)
  const possibleProposals = proposals.filter(p => isPossivelComissao(p.status));
  
  // Valor total possível EXCLUINDO contratos com promotor (para cálculos de meta)
  const totalPossibleValueForGoals = possibleProposals
    .filter(p => !p.promotor_id)
    .reduce((sum, p) => {
      // REGRA: Usar nosso lance se disponível, senão valor estimado
      const proposalValue = p.nosso_lance || p.total_value || 0;
      console.log('💰 [PossibleCommissions] Proposta para meta:', {
        client: p.client,
        nosso_lance: p.nosso_lance,
        total_value: p.total_value,
        proposalValue,
        has_promotor: !!p.promotor_id
      });
      return sum + Number(proposalValue);
    }, 0);
  
  console.log('📈 [PossibleCommissions] Valor total para metas:', totalPossibleValueForGoals);
  
  const calculatePossibleCommissions = () => {
    const commissionsByEmployee: { [key: string]: { name: string, closerCommission: number, sdrCommission: number, proposals: number } } = {};
    
    // Filtrar funcionários: excluir Rubens Neto
    const filteredEmployees = employees.filter(emp => emp.name !== 'Rubens Neto');
    
    console.log('👥 [PossibleCommissions] Funcionários filtrados (sem Rubens):', {
      original: employees.length,
      filtrados: filteredEmployees.length,
      nomes: filteredEmployees.map(emp => emp.name)
    });

    activeProposals.forEach(proposal => {
      // REGRA: Usar nosso lance se disponível, senão valor estimado (para ambos departamentos)
      const proposalValue = proposal.nosso_lance || proposal.total_value || 0;
      
      console.log('🔢 [PossibleCommissions] Calculando comissão para proposta:', {
        client: proposal.client,
        nosso_lance: proposal.nosso_lance,
        total_value: proposal.total_value,
        proposalValue,
        has_promotor: !!proposal.promotor_id,
        closer_id: proposal.closer_id,
        sdr_id: proposal.sdr_id,
        department
      });
      
      let baseCommission = 0;
      
      if (proposal.promotor_id) {
        // Se tem promotor: sempre 0,01% fixo
        baseCommission = (proposalValue * 0.01) / 100;
        console.log('🎭 [PossibleCommissions] Proposta com promotor:', {
          proposalValue,
          baseCommission,
          taxa: '0,01%'
        });
      } else if (department === 'Petrobras') {
        // Para Petrobras: usar taxa individual baseada no valor
        const contractRate = getCommissionRate(Number(proposalValue), department);
        baseCommission = calculateContractCommission(Number(proposalValue), contractRate);
        console.log('🏭 [PossibleCommissions] Proposta Petrobras:', {
          proposalValue,
          contractRate,
          baseCommission
        });
      } else {
        // Para Comercial Público: usar taxa individual baseada no valor
        const contractRate = getCommissionRate(Number(proposalValue), department);
        baseCommission = calculateContractCommission(Number(proposalValue), contractRate);
        console.log('🏢 [PossibleCommissions] Proposta Comercial Público:', {
          proposalValue,
          contractRate,
          baseCommission
        });
      }
      
      // Closer commission
      if (proposal.closer_id) {
        const closer = filteredEmployees.find(emp => emp.id === proposal.closer_id);
        if (!closer) {
          console.log('⚠️ [PossibleCommissions] Closer não encontrado ou é Rubens Neto:', proposal.closer_id);
          return; // Se for Rubens Neto ou não encontrado, pular
        }
        
        if (!commissionsByEmployee[proposal.closer_id]) {
          commissionsByEmployee[proposal.closer_id] = {
          name: closer?.name || 'Unknown',
          closerCommission: 0,
          sdrCommission: 0,
          proposals: 0
          };
        }
        commissionsByEmployee[proposal.closer_id].closerCommission += baseCommission;
        commissionsByEmployee[proposal.closer_id].proposals += 1;
        
        console.log('👤 [PossibleCommissions] Comissão Closer atribuída:', {
          closer: closer.name,
          proposta: proposal.client,
          baseCommission,
          totalCloserCommission: commissionsByEmployee[proposal.closer_id].closerCommission
        });
      }
      
      // SDR commission (mesma comissão que o closer)
      if (proposal.sdr_id) {
        const sdr = filteredEmployees.find(emp => emp.id === proposal.sdr_id);
        if (!sdr) {
          console.log('⚠️ [PossibleCommissions] SDR não encontrado ou é Rubens Neto:', proposal.sdr_id);
          return; // Se for Rubens Neto ou não encontrado, pular
        }
        
        if (!commissionsByEmployee[proposal.sdr_id]) {
          commissionsByEmployee[proposal.sdr_id] = {
            name: sdr?.name || 'Unknown',
            closerCommission: 0,
            sdrCommission: 0,
            proposals: 0
          };
        }
        commissionsByEmployee[proposal.sdr_id].sdrCommission += baseCommission; // Mesma comissão
        
        console.log('👤 [PossibleCommissions] Comissão SDR atribuída:', {
          sdr: sdr.name,
          proposta: proposal.client,
          baseCommission,
          totalSDRCommission: commissionsByEmployee[proposal.sdr_id].sdrCommission
        });
      }
    });
    
    console.log('📋 [PossibleCommissions] Resultado final do cálculo:', {
      employeeCount: Object.keys(commissionsByEmployee).length,
      totalCommissions: Object.values(commissionsByEmployee).reduce(
        (sum, emp) => sum + emp.closerCommission + emp.sdrCommission, 0
      ),
      detailsByEmployee: Object.entries(commissionsByEmployee).map(([id, data]) => ({
        name: data.name,
        closerCommission: data.closerCommission,
        sdrCommission: data.sdrCommission,
        totalCommission: data.closerCommission + data.sdrCommission,
        proposals: data.proposals
      }))
    });
    
    return commissionsByEmployee;
  };

  const possibleCommissions = calculatePossibleCommissions();
  
  // Calcular total baseado nas comissões individuais por pessoa
  const totalPossible = Object.values(possibleCommissions).reduce(
    (sum, employee) => sum + employee.closerCommission + employee.sdrCommission, 0
  );
  
  const totalProposalValue = totalPossibleValueForGoals; // Usar valor sem promotor
  
  console.log('📊 [PossibleCommissions] Totais calculados:', {
    totalPossible,
    totalProposalValue,
    activeProposalsCount: activeProposals.length,
    possibleCommissionsKeys: Object.keys(possibleCommissions).length
  });

  const BreakdownModal: React.FC<{ type: string; onClose: () => void }> = ({ type, onClose }) => {
    const renderContent = () => {
      switch (type) {
        case 'person-commission':
          const selectedPersonData = selectedPersonId ? possibleCommissions[selectedPersonId] : null;
          if (!selectedPersonData) return null;
          
          const personProposals = activeProposals.filter(p => 
            p.closer_id === selectedPersonId || p.sdr_id === selectedPersonId
          );
          
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhamento de Comissões - {selectedPersonData.name}
              </h3>
              
              <div className={`border rounded-lg p-4 ${
                department === 'Petrobras' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}>
                <h4 className={`font-medium mb-3 ${
                  department === 'Petrobras' ? 'text-yellow-900' : 'text-green-900'
                }`}>
                  Resumo de Comissões Possíveis
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedPersonData.closerCommission > 0 && (
                    <div>
                      <span className="text-gray-600">Como Closer:</span>
                      <div className="font-bold text-green-600">
                        {formatCurrency(selectedPersonData.closerCommission)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedPersonData.proposals} proposta{selectedPersonData.proposals !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                  {selectedPersonData.sdrCommission > 0 && (
                    <div>
                      <span className="text-gray-600">Como SDR:</span>
                      <div className="font-bold text-blue-600">
                        {formatCurrency(selectedPersonData.sdrCommission)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Participação em propostas
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Possível:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(selectedPersonData.closerCommission + selectedPersonData.sdrCommission)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 mb-3">
                  Propostas Envolvidas ({personProposals.length})
                </h4>
                {personProposals.map(proposal => {
                  // NOVA REGRA: Usar nosso lance se disponível, senão valor estimado
                  const proposalValue = proposal.nosso_lance || proposal.total_value || 0;
                  
                  let proposalCommission = 0;
                  let rate = '';
                  
                  if (proposal.promotor_id) {
                    proposalCommission = (proposalValue * 0.01) / 100;
                    rate = '0,01%';
                  } else if (department === 'Petrobras') {
                    const contractRate = getCommissionRate(Number(proposalValue), department);
                    proposalCommission = calculateContractCommission(Number(proposalValue), contractRate);
                    rate = `${contractRate}%`;
                  } else {
                    const contractRate = getCommissionRate(Number(proposalValue), department);
                    proposalCommission = calculateContractCommission(Number(proposalValue), contractRate);
                    rate = `${contractRate}%`;
                  }
                  
                  const isCloser = proposal.closer_id === selectedPersonId;
                  const isSDR = proposal.sdr_id === selectedPersonId;
                  
                  return (
                    <div key={proposal.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{proposal.client}</h5>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              proposal.status === 'Negociação' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {proposal.status}
                            </span>
                            <span>Criado: {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {proposal.promotor_id && (
                            <div className="text-xs text-red-600 mt-1">Com promotor (0,01% fixo)</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatCurrency(proposalValue)}
                          </div>
                          {proposal.nosso_lance && (
                            <div className="text-xs text-green-500">Nosso lance</div>
                          )}
                          {!proposal.nosso_lance && (
                            <div className="text-xs text-blue-500">Valor estimado</div>
                          )}
                          <div className="text-xs text-gray-500">Valor Global</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Taxa Aplicada</div>
                          <div className="font-medium text-blue-600">{rate}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">
                            {isCloser && isSDR ? 'Comissão (Closer + SDR)' : 
                             isCloser ? 'Comissão (Closer)' : 'Comissão (SDR)'}
                          </div>
                          <div className="font-bold text-green-600">
                            {formatCurrency(proposalCommission * (isCloser && isSDR ? 2 : 1))}
                          </div>
                        </div>
                      </div>
                      
                      {isCloser && isSDR && (
                        <div className="mt-2 text-center">
                          <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                            💼 Atuando como Closer E SDR nesta proposta
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {department === 'Petrobras' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">💡 Sistema Petrobras</h4>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p>• <strong>Taxa individual:</strong> Cada contrato tem sua própria taxa baseada no valor</p>
                    <p>• <strong>2,8%:</strong> Contratos até R$ 50 milhões</p>
                    <p>• <strong>1,8%:</strong> Contratos de R$ 50 mi a R$ 100 mi</p>
                    <p>• <strong>1,3%:</strong> Contratos acima de R$ 100 milhões</p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">💡 Sistema de Comissões</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>• <strong>Taxa individual:</strong> Cada contrato tem sua própria taxa baseada no valor</p>
                    <p>• <strong>0,1%:</strong> Contratos até R$ 1,2 milhões</p>
                    <p>• <strong>0,15%:</strong> Contratos de R$ 1,2 mi a R$ 2,4 mi</p>
                    <p>• <strong>0,2%:</strong> Contratos acima de R$ 2,4 milhões</p>
                    <p>• <strong>Distribuição:</strong> Closer e SDR recebem a mesma comissão</p>
                  </div>
                </div>
              )}
            </div>
          );
        case 'total-possible':
          console.log('🔍 [PossibleCommissions] Composição detalhada do valor possível:', {
            totalPossible,
            possibleProposalsCount: possibleProposals.length,
            possibleCommissions: Object.entries(possibleCommissions).map(([id, data]) => ({
              name: data.name,
              closerCommission: data.closerCommission,
              sdrCommission: data.sdrCommission,
              total: data.closerCommission + data.sdrCommission,
              proposals: data.proposals
            })),
            activeProposals: activeProposals.map(proposal => ({
              client: proposal.client,
              value: proposal.total_value,
              status: proposal.status,
              promotor_id: proposal.promotor_id,
              closer_id: proposal.closer_id,
              sdr_id: proposal.sdr_id
            }))
          });
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição das Comissões Possíveis</h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${
                  department === 'Petrobras' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    department === 'Petrobras' ? 'text-yellow-900' : 'text-blue-900'
                  }`}>Closers ({totalPossibleCloser.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</h4>
                  {closerStats.map(closer => (
                    <div key={closer.id} className="flex justify-between text-sm">
                      <span>{closer.name}</span>
                      <span className="font-medium">{formatCurrency(closer.possibleCommission)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">SDRs ({totalPossibleSDR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</h4>
                  {sdrStats.map(sdr => (
                    <div key={sdr.id} className="flex justify-between text-sm">
                      <span>{sdr.name}</span>
                      <span className="font-medium">{formatCurrency(sdr.possibleCommission)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total Geral</span>
                    <span className="text-green-600">{formatCurrency(totalPossible)}</span>
                  </div>
                  {department === 'Petrobras' && (
                    <div className="text-xs text-yellow-600 mt-2 text-center">
                      * Taxas individuais aplicadas por contrato
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        case 'proposal-value':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição do Valor Possível</h3>
              <div className="space-y-2">
                {possibleProposals.map(proposal => (
                  <div key={proposal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{proposal.client}</span>
                      <div className="text-sm text-gray-600">
                        R$ {proposal.monthly_value.toLocaleString()} × {proposal.months} meses
                      </div>
                      {department === 'Petrobras' && (
                        <div className="text-xs text-yellow-600">
                          Taxa: {getCommissionRate(proposal.total_value || 0, department)}%
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(proposal.total_value)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(totalProposalValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        default:
          return null;
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
    <div className={`rounded-xl shadow-sm border p-6 ${
      department === 'Petrobras' 
        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
        : 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Comissões Possíveis</span>
          </h3>
          <p className="text-sm text-gray-600">
            Baseado nas propostas em aberto
            {department === 'Petrobras' && <span className="text-yellow-600 font-medium"> • Petrobras</span>}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPossible)}
          </div>
          <div className="text-sm text-gray-500">Total Possível</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Propostas</p>
              <p className="text-lg md:text-xl font-bold text-blue-600">{possibleProposals.length}</p>
            </div>
            <Target className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Valor Total</p>
              <button 
                onClick={() => setShowBreakdownModal('proposal-value')}
                className="text-sm md:text-lg font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer flex items-center space-x-1"
                title="Clique para ver detalhes"
              >
                {formatCurrency(totalProposalValue)}
                <Info className="w-3 h-3 md:w-4 md:h-4 ml-1" />
              </button>
            </div>
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Pessoas</p>
              <p className="text-lg md:text-xl font-bold text-orange-600">{Object.keys(possibleCommissions).length}</p>
            </div>
            <Users className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Individual Commissions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Comissões por Pessoa:</h4>
        {Object.entries(possibleCommissions).map(([employeeId, data]) => (
          <div key={employeeId} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  department === 'Petrobras' 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                    : 'bg-gradient-to-br from-green-500 to-blue-600'
                }`}>
                  <span className="text-white font-bold text-sm">
                    {data.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{data.name}</p>
                  <p className="text-sm text-gray-500">
                    {data.proposals > 0 ? `${data.proposals} propostas como Closer` : ''}
                    {data.sdrCommission > 0 ? ` • SDR em propostas` : ''}
                    {department === 'Petrobras' && <span className="text-yellow-600"> • Petrobras</span>}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={() => {
                    setSelectedPersonId(employeeId);
                    setShowBreakdownModal('person-commission');
                  }}
                  className="text-sm md:text-lg font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                  title="Clique para ver detalhes"
                >
                  {formatCurrency(data.closerCommission + data.sdrCommission)}
                  <Info className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                </button>
                <div className="text-xs md:text-sm text-gray-500">
                  {data.closerCommission > 0 && `Closer: ${formatCurrency(data.closerCommission)}`}
                  {data.closerCommission > 0 && data.sdrCommission > 0 && ' • '}
                  {data.sdrCommission > 0 && `SDR: ${formatCurrency(data.sdrCommission)}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-4 p-3 rounded-lg ${
        department === 'Petrobras' ? 'bg-yellow-100' : 'bg-blue-100'
      }`}>
        <p className={`text-xs md:text-sm text-center ${
          department === 'Petrobras' ? 'text-yellow-800' : 'text-blue-800'
        }`}>
          💡 <strong>Motivação:</strong> Feche essas {possibleProposals.length} propostas e ganhe até {formatCurrency(totalPossible)} em comissões!
          {department === 'Petrobras' ? (
            <div className="text-xs text-yellow-700 mt-1">
              * Comissões calculadas individualmente: 2,8% até 50M, 1,8% de 50-100M, 1,3% acima de 100M
            </div>
          ) : (
            <div className="text-xs text-blue-700 mt-1">
              * Cada contrato possui sua taxa individual: 0,1% até 1,2M, 0,15% de 1,2-2,4M, 0,2% acima de 2,4M
            </div>
          )}
        </p>
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