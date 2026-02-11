import React from 'react';
import { Target, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSupabaseQuery } from '../../hooks/useSupabase';

export const TopSummaryCards: React.FC = () => {
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const { data: employees = [] } = useSupabaseQuery('employees');
  
  // Calcular propostas ativas
  const activeProposals = proposals.filter(p => 
    p.status === 'Proposta' || p.status === 'Negociação'
  );
  
  const activeValue = activeProposals.reduce((sum, p) => sum + (p.total_value || 0), 0);
  const monthlyValue = activeProposals.reduce((sum, p) => sum + (p.monthly_value || 0), 0);
  
  // Calcular comissões possíveis usando a mesma lógica do PossibleCommissions
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
  
  // Calcular total baseado nas comissões individuais por pessoa
  const totalPossibleCommission = Object.values(possibleCommissions).reduce(
    (sum, employee) => sum + employee.closerCommission + employee.sdrCommission, 0
  );
  
  const closedDeals = proposals.filter(p => p.status === 'Fechado').length;
  const totalProposals = proposals.length;
  const conversionRate = totalProposals > 0 ? Math.round((closedDeals / totalProposals) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-6">

      {/* Propostas Ativas */}
      <div className="flex justify-between items-start p-6 border border-gray-200 rounded-2xl shadow-sm bg-white h-full hover:shadow-md transition-shadow">
        <div className="flex-1">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">Propostas Ativas</h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(activeValue)}</p>
          <p className="text-xs text-gray-500">{formatCurrency(monthlyValue)} valor mensal</p>
          <p className="text-xs text-gray-500 mt-1">{activeProposals.length} propostas ativas</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Comissão Potencial */}
      <div className="flex justify-between items-start p-6 border border-gray-200 rounded-2xl shadow-sm bg-white h-full hover:shadow-md transition-shadow">
        <div className="flex-1">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">Possibilidade de comissão</h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalPossibleCommission)}</p>
          <p className="text-xs text-gray-500">Propostas em aberto</p>
        </div>
        <div className="rounded-xl bg-green-50 p-3">
          <DollarSign className="w-5 h-5 text-green-600" />
        </div>
      </div>

      {/* Negócios Fechados */}
      <div className="flex justify-between items-start p-6 border border-gray-200 rounded-2xl shadow-sm bg-white h-full hover:shadow-md transition-shadow">
        <div className="flex-1">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">Negócios Fechados</h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{closedDeals}</p>
          <p className="text-xs text-gray-500">Total do sistema</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Taxa de Conversão */}
      <div className="flex justify-between items-start p-6 border border-gray-200 rounded-2xl shadow-sm bg-white h-full hover:shadow-md transition-shadow">
        <div className="flex-1">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">Taxa de Conversão</h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{conversionRate}%</p>
          <p className="text-xs text-gray-500">Proposta → Fechado</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3">
          <TrendingUp className="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </div>
  );
};