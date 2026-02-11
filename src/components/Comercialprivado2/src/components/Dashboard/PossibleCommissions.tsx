import React from 'react';
import { DollarSign, TrendingUp, Users, Target, Info, X } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { CommissionDetailModal } from '../Commissions/CommissionDetailModal';

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

interface PossibleCommissionsProps {
  // Removido prop não utilizado
}

export const PossibleCommissions: React.FC<PossibleCommissionsProps> = () => {
  const [selectedPerson, setSelectedPerson] = React.useState<PersonCommissionData | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = React.useState<string | null>(null);
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');
  
  if (proposalsLoading || employeesLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-sm border border-green-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }
  
  const activeProposals = proposals.filter(p => p.status === 'Proposta' || p.status === 'Negociação');
  
  // Calcular comissões possíveis: APENAS propostas ativas (Proposta e Negociação)
  // EXCLUIR: Fechado e Perdido
  const possibleProposals = proposals.filter(p => 
    p.status === 'Proposta' || p.status === 'Negociação'
  );
  
  const calculatePossibleCommissions = () => {
    const commissionsByEmployee: { [key: string]: { name: string, closerCommission: number, sdrCommission: number, proposals: number } } = {};
    
    activeProposals.forEach(proposal => {
      // Closer commission
      if (!commissionsByEmployee[proposal.closer_id]) {
        const closer = employees.find(emp => emp.id === proposal.closer_id);
        commissionsByEmployee[proposal.closer_id] = {
          name: closer?.name || 'Unknown',
          closerCommission: 0,
          sdrCommission: 0,
          proposals: 0
        };
      }
      commissionsByEmployee[proposal.closer_id].closerCommission += Number(proposal.commission || 0);
      commissionsByEmployee[proposal.closer_id].proposals += 1;
      
      // SDR commission (100% da comissão para propostas onde é indicado)
      if (proposal.sdr_id) {
        if (!commissionsByEmployee[proposal.sdr_id]) {
          const sdr = employees.find(emp => emp.id === proposal.sdr_id);
          commissionsByEmployee[proposal.sdr_id] = {
            name: sdr?.name || 'Unknown',
            closerCommission: 0,
            sdrCommission: 0,
            proposals: 0
          };
        }
        commissionsByEmployee[proposal.sdr_id].sdrCommission += Number(proposal.commission || 0); // 100% da comissão
      }
    });
    
    return commissionsByEmployee;
  };

  const possibleCommissions = calculatePossibleCommissions();
  
  // Generate closer stats from real employees data
  const closerStats = employees
    .filter(emp => emp.is_closer === true)
    .map(closer => ({
      id: closer.id,
      name: closer.name,
      currentMonthSales: proposals
        .filter(p => p.closer_id === closer.id && p.status === 'Fechado')
        .reduce((sum, p) => sum + (p.total_value || 0), 0),
      realizedCommission: proposals
        .filter(p => p.closer_id === closer.id && p.status === 'Fechado')
        .reduce((sum, p) => sum + (p.commission || 0), 0),
      possibleCommission: possibleProposals
        .filter(p => p.closer_id === closer.id)
        .reduce((sum, p) => sum + (p.commission || 0), 0),
      totalCommission: proposals
        .filter(p => p.closer_id === closer.id)
        .reduce((sum, p) => sum + (p.commission || 0), 0)
    }));

  // Generate SDR stats from real employees data
  const sdrStats = employees
    .filter(emp => emp.is_sdr === true)
    .map(sdr => ({
      id: sdr.id,
      name: sdr.name,
      currentMonthProposals: proposals
        .filter(p => p.sdr_id === sdr.id && 
          new Date(p.created_at).getMonth() === new Date().getMonth())
        .length,
      realizedCommission: proposals
        .filter(p => p.sdr_id === sdr.id && p.status === 'Fechado')
        .reduce((sum, p) => sum + (p.commission || 0) * 0.5, 0), // SDR gets 50%
      possibleCommission: possibleProposals
        .filter(p => p.sdr_id === sdr.id)
        .reduce((sum, p) => sum + (p.commission || 0) * 0.5, 0), // SDR gets 50%
      totalCommission: proposals
        .filter(p => p.sdr_id === sdr.id)
        .reduce((sum, p) => sum + (p.commission || 0) * 0.5, 0) // SDR gets 50%
    }));

  const totalRealizedCloser = closerStats.reduce((sum, closer) => sum + closer.realizedCommission, 0);
  const totalRealizedSDR = sdrStats.reduce((sum, sdr) => sum + sdr.realizedCommission, 0);
  const totalRealized = totalRealizedCloser + totalRealizedSDR;
  
  const totalPossibleCloser = closerStats.reduce((sum, closer) => sum + closer.possibleCommission, 0);
  const totalPossibleSDR = sdrStats.reduce((sum, sdr) => sum + sdr.possibleCommission, 0);
  
  // Calcular total baseado nas comissões individuais por pessoa
  const totalPossible = Object.values(possibleCommissions).reduce(
    (sum, employee) => sum + employee.closerCommission + employee.sdrCommission, 0
  );
  
  const totalProposalValue = possibleProposals.reduce((sum, p) => sum + Number(p.total_value || 0), 0);

  // Função para preparar dados da pessoa para o modal
  const preparePersonData = (employeeId: string): PersonCommissionData | null => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return null;

    const employeeProposals = possibleProposals.filter(p => 
      p.closer_id === employeeId || p.sdr_id === employeeId
    );

    const proposalDetails: CommissionDetail[] = employeeProposals.map(proposal => {
      const commissionValue = Number(proposal.commission || 0);
      
      return {
        proposalId: proposal.id,
        client: proposal.client,
        totalValue: proposal.total_value || 0,
        commissionRate: proposal.commission_rate || 0.4,
        commissionValue,
        status: proposal.status,
        closingDate: proposal.closing_date,
        createdAt: proposal.created_at
      };
    });

    const totalCommission = proposalDetails.reduce((sum, p) => sum + p.commissionValue, 0);

    return {
      employeeId,
      name: employee.name,
      role: employee.role,
      avatar: employee.avatar,
      totalCommission,
      proposals: proposalDetails
    };
  };

  const handlePersonClick = (employeeId: string) => {
    const personData = preparePersonData(employeeId);
    if (personData) {
      setSelectedPerson(personData);
    }
  };

  const BreakdownModal: React.FC<{ type: string; onClose: () => void }> = ({ type, onClose }) => {
    const renderContent = () => {
      switch (type) {
        case 'total-possible':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição das Comissões Possíveis</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Closers ({totalPossibleCloser.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</h4>
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
                </div>
              </div>
            </div>
          );
        case 'proposal-value':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição do Valor Possível</h3>
              <div className="space-y-3">
                {possibleProposals.map(proposal => (
                  <div key={proposal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{proposal.client}</span>
                      <div className="text-sm text-gray-600">
                        R$ {proposal.monthly_value.toLocaleString()} × {proposal.months} meses
                      </div>
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Comissões Possíveis</span>
          </h3>
          <p className="text-sm text-gray-500">Baseado nas propostas em aberto</p>
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
              <p className="text-sm text-gray-600">Propostas Possíveis</p>
              <p className="text-xl font-bold text-blue-600">{possibleProposals.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Possível</p>
              <button 
                onClick={() => setShowBreakdownModal('proposal-value')}
                className="text-xl font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer flex items-center space-x-1"
                title="Clique para ver detalhes"
              >
                {formatCurrency(totalProposalValue)}
                <Info className="w-3 h-3 ml-1" />
              </button>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pessoas Envolvidas</p>
              <p className="text-xl font-bold text-orange-600">{Object.keys(possibleCommissions).length}</p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {data.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{data.name}</p>
                  <p className="text-sm text-gray-500">
                    {data.proposals > 0 ? `${data.proposals} propostas como Closer` : ''}
                    {data.sdrCommission > 0 ? ` • SDR em propostas` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={() => handlePersonClick(employeeId)}
                  className="text-lg font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                  title="Clique para ver detalhes das propostas"
                >
                  {formatCurrency(data.closerCommission + data.sdrCommission)}
                  <Info className="w-3 h-3 ml-1" />
                </button>
                <div className="text-xs text-gray-500">
                  {data.closerCommission > 0 && `Closer: ${formatCurrency(data.closerCommission)}`}
                  {data.closerCommission > 0 && data.sdrCommission > 0 && ' • '}
                  {data.sdrCommission > 0 && `SDR: ${formatCurrency(data.sdrCommission)}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-800 text-center">
          💡 <strong>Motivação:</strong> Feche essas {possibleProposals.length} propostas e ganhe até {formatCurrency(totalPossible)} em comissões!
        </p>
      </div>
    </div>
    
    {showBreakdownModal && (
      <BreakdownModal 
        type={showBreakdownModal} 
        onClose={() => setShowBreakdownModal(null)} 
      />
    )}
    
    {/* Commission Detail Modal */}
    <CommissionDetailModal
      isOpen={!!selectedPerson}
      onClose={() => setSelectedPerson(null)}
      person={selectedPerson}
    />
    </>
  );
};