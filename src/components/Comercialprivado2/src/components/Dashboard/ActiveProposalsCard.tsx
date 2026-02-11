import React from 'react';
import { FileText, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { displayDate } from '../../utils/dateUtils';

export const ActiveProposalsCard: React.FC = () => {
  // Buscar propostas ativas do Supabase
  const { data: proposals = [], loading } = useSupabaseQuery('proposals', {
    orderBy: { column: 'created_at', ascending: false }
  });
  
  const { data: employees = [] } = useSupabaseQuery('employees');

  // Filtrar apenas propostas ativas (não fechadas nem perdidas)
  const activeProposals = proposals.filter(p => 
    p.status === 'Proposta' || 
    p.status === 'Negociação' || 
    p.status === 'Análise de contrato'
  );

  const totalValue = activeProposals.reduce((sum, p) => sum + p.total_value, 0);
  const totalCommission = activeProposals.reduce((sum, p) => sum + p.commission, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Proposta': return 'bg-yellow-100 text-yellow-800';
      case 'Negociação': return 'bg-blue-100 text-blue-800';
      case 'Análise de contrato': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return null;
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Desconhecido';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-between border border-gray-200 rounded-2xl shadow-sm bg-white p-6 h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-between border border-gray-200 rounded-2xl shadow-sm bg-white p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-md font-semibold text-gray-900">Propostas Ativas</h2>
          <p className="text-sm text-gray-500">Em andamento e negociação</p>
        </div>
        <p className="text-sm text-indigo-600 font-bold">{activeProposals.length} propostas</p>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[280px]">
        {activeProposals.length > 0 ? (
          activeProposals.map((proposal) => {
            const closerName = getEmployeeName(proposal.closer_id);
            const sdrName = getEmployeeName(proposal.sdr_id);
            const sellers = [closerName, sdrName].filter(Boolean);
            
            return (
              <div key={proposal.id} className="p-3 bg-blue-50 rounded border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-gray-800 text-sm">{proposal.client}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {formatCurrency(proposal.monthly_value)} × {proposal.months} meses
                </p>
                <p className="text-xs text-gray-500 mb-1">
                  Total: <strong>{formatCurrency(proposal.total_value)}</strong>
                </p>
                <p className="text-green-600 font-bold text-sm">
                  {formatCurrency(proposal.commission)} comissão
                </p>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Criado: {displayDate(proposal.created_at)}</span>
                  <span className="max-w-[120px] truncate">
                    {sellers.length > 0 ? sellers.join(', ') : 'Sem responsável'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma proposta ativa</h3>
            <p className="text-gray-500">
              Propostas fechadas ou perdidas não aparecem aqui
            </p>
          </div>
        )}
      </div>

      {activeProposals.length > 0 && (
        <>
          <div className="mt-4 flex justify-between border-t pt-3 text-sm font-medium">
            <div className="text-center">
              <p className="text-blue-700">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-gray-500">Valor Total</p>
            </div>
            <div className="text-center">
              <p className="text-green-700">{formatCurrency(totalCommission)}</p>
              <p className="text-xs text-gray-500">Comissão Total</p>
            </div>
          </div>
          
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
              <TrendingUp className="w-3 h-3" />
              <span>
                Potencial de {formatCurrency(totalCommission)} em comissões ativas
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};