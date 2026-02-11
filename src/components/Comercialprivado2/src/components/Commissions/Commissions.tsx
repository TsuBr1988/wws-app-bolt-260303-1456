import React, { useState } from 'react';
import { DollarSign, Users, User } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { MonthlyCommissionChart } from './MonthlyCommissionChart';
import { EmployeeContractsList } from './EmployeeContractsList';
import { OpenContractsCommissions } from './OpenContractsCommissions';
import { CommissionProgressBar } from './CommissionProgressBar';
import { useYear } from '../../contexts/YearContext';

export const Commissions: React.FC = () => {
  const { selectedYear } = useYear();
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  if (employeesLoading || proposalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Filtrar funcionários que não são Admin
  const nonAdminEmployees = employees.filter(emp => emp.role !== 'Admin');
  
  if (nonAdminEmployees.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
          <p className="text-gray-500">Cadastre funcionários na aba "Configurações" para ver as comissões</p>
        </div>
      </div>
    );
  }
  
  // Encontrar funcionário selecionado
  const selectedEmployee = selectedEmployeeId ? 
    nonAdminEmployees.find(emp => emp.id === selectedEmployeeId) : 
    null;
  
  // Determinar role do funcionário para cálculos
  // Com múltiplos papéis, priorizar Closer se tiver ambos
  const employeeRole = selectedEmployee?.is_closer ? 'closer' : 'sdr';
  
  // Calcular estatísticas gerais
  const totalProposalValue = proposals.reduce((sum, p) => sum + Number(p.total_value || 0), 0);
  const totalCommissions = proposals
    .filter(p => p.status === 'Fechado')
    .reduce((sum, p) => sum + Number(p.commission || 0), 0);
  
  const activeProposals = proposals.filter(p => 
    p.status === 'Proposta' || p.status === 'Negociação'
  );
  
  const totalPossibleCommissions = activeProposals
    .reduce((sum, p) => sum + Number(p.commission || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comissões por Funcionário {selectedYear}</h1>
          <p className="text-gray-600">Acompanhamento detalhado de comissões individuais para {selectedYear}</p>
        </div>
        
        {/* Employee Selector */}
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2 md:space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Funcionário:</span>
          </div>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:min-w-[200px]"
          >
            <option value="">Selecione um funcionário</option>
            {nonAdminEmployees.map(employee => {
              const roles = [];
              if (employee.is_closer) roles.push('Closer');
              if (employee.is_sdr) roles.push('SDR');
              const roleText = roles.length > 0 ? roles.join(' + ') : employee.role;

              return (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {roleText}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* General Stats (when no employee selected) */}
      {!selectedEmployeeId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total em Propostas</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalProposalValue)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comissões Efetivas</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCommissions)}</p>
                  <p className="text-xs text-gray-500">Contratos fechados</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comissões Possíveis</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalPossibleCommissions)}</p>
                  <p className="text-xs text-gray-500">Propostas ativas</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Funcionários</p>
                  <p className="text-2xl font-bold text-orange-600">{nonAdminEmployees.length}</p>
                  <p className="text-xs text-gray-500">Closers e SDRs</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Como usar esta aba</h3>
            <div className="space-y-2 text-blue-800">
              <p>• <strong>Selecione um funcionário</strong> no seletor acima para ver detalhes individuais</p>
              <p>• <strong>Gráfico mensal:</strong> Visualize as comissões efetivas recebidas mês a mês</p>
              <p>• <strong>Contratos por mês:</strong> Veja quais contratos geraram comissão em cada período</p>
              <p>• <strong>Contratos em aberto:</strong> Acompanhe o potencial de comissão com 3 cenários de meta</p>
              <p>• <strong>Barra de progresso:</strong> Monitore o avanço nas metas mensais e conquistas</p>
            </div>
          </div>
        </>
      )}

      {/* Employee-specific content */}
      {selectedEmployee && (
        <div className="space-y-6">
          {/* Progress Bar - Always first */}
          <CommissionProgressBar
            employeeId={selectedEmployee.id}
            employeeRole={employeeRole}
            proposals={proposals}
            employeeName={selectedEmployee.name}
            selectedYear={selectedYear}
          />

          {/* Monthly Chart */}
          <MonthlyCommissionChart
            employeeId={selectedEmployee.id}
            employeeRole={employeeRole}
            proposals={proposals}
            employeeName={selectedEmployee.name}
            selectedYear={selectedYear}
          />

          {/* Two columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contracts by Month */}
            <EmployeeContractsList
              employeeId={selectedEmployee.id}
              employeeRole={employeeRole}
              proposals={proposals}
              employeeName={selectedEmployee.name}
              selectedYear={selectedYear}
            />

            {/* Open Contracts */}
            <OpenContractsCommissions
              employeeId={selectedEmployee.id}
              employeeRole={employeeRole}
              proposals={proposals}
              employeeName={selectedEmployee.name}
              selectedYear={selectedYear}
            />
          </div>
        </div>
      )}

      {/* Commission Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Regras de Comissão</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* SEM PROMOTOR */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">SEM PROMOTOR</h3>
            <p className="text-xs text-blue-700 mb-3">Quando só há Closer OU Orçamentista</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white rounded p-3">
                <span className="text-sm font-medium text-gray-700">Closer</span>
                <span className="text-xl font-bold text-blue-600">0,1%</span>
              </div>
              <div className="flex items-center justify-between bg-white rounded p-3">
                <span className="text-sm font-medium text-gray-700">Orçamentista</span>
                <span className="text-xl font-bold text-blue-600">0,02%</span>
              </div>
            </div>
          </div>

          {/* COM PROMOTOR */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-3">COM PROMOTOR</h3>
            <p className="text-xs text-green-700 mb-3">Quando há Closer E Orçamentista</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white rounded p-3">
                <span className="text-sm font-medium text-gray-700">Closer</span>
                <span className="text-xl font-bold text-green-600">0,01%</span>
              </div>
              <div className="flex items-center justify-between bg-white rounded p-3">
                <span className="text-sm font-medium text-gray-700">Orçamentista</span>
                <span className="text-xl font-bold text-green-600">0,005%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Regras Importantes</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Base de cálculo:</strong> Percentual aplicado sobre o valor global do contrato</li>
            <li>• <strong>Promotor:</strong> Quando ambos (Closer e Orçamentista) estão envolvidos na venda</li>
            <li>• <strong>Funções:</strong> Closer fecha a venda, Orçamentista elabora a proposta</li>
            <li>• <strong>Pagamento:</strong> Comissão paga quando o contrato é fechado</li>
          </ul>
        </div>
      </div>
    </div>
  );
};