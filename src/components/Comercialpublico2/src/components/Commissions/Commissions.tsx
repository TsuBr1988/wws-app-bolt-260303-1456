import React, { useState } from 'react';
import { DollarSign, Users, User, Shield, Lock, Calendar } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { GuaranteedCommissions } from '../Dashboard/GuaranteedCommissions';
import { PossibleCommissions } from '../Dashboard/PossibleCommissions';
import { MonthlyCommissionChart } from './MonthlyCommissionChart';
import { EmployeeContractsList } from './EmployeeContractsList';
import { OpenContractsCommissions } from './OpenContractsCommissions';
import MonthlyEffectivenessChart from './MonthlyEffectivenessChart';
import { useYear } from '../../contexts/YearContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { COMMISSION_TIERS, PETROBRAS_COMMISSION_TIERS } from '../../utils/commissionUtils';
import { useSystemVersion } from '../../contexts/SystemVersionContext';

export const Commissions: React.FC = () => {
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { selectedDepartment } = useDepartment();
  const { isAdministrative } = useSystemVersion();
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  // Se não estiver no modo administrativo, mostrar mensagem de acesso restrito
  if (!isAdministrative) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comissões por Funcionário {selectedYear}</h1>
            <p className="text-gray-600">Acompanhamento detalhado de comissões individuais para {selectedYear}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Sem informações para esse perfil</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            As informações de comissões estão disponíveis apenas para usuários com acesso administrativo.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900">Para acessar essas informações:</p>
                <p className="text-xs text-blue-700 mt-1">
                  Mude para o modo "Administrativa" na barra lateral
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (employeesLoading || proposalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Filtrar funcionários que não são Admin (incluir Orçamentista)
  const nonAdminEmployees = employees.filter(emp =>
    emp.role !== 'Admin' && emp.name !== 'Rubens Neto'
  );
  
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
  const employeeRole = (selectedEmployee?.role === 'Orçamentista' || selectedEmployee?.role === 'Orcamentista') ? 'orcamentista' :
    (selectedEmployee?.role === 'Licitante' || selectedEmployee?.role === 'Closer') ? 'closer' : 'sdr';

  // Determinar o departamento do funcionário baseado em suas propostas
  // Se o funcionário tem propostas, usar o departamento mais comum delas
  // Caso contrário, usar o departamento do funcionário cadastrado
  const employeeDepartment = selectedEmployee ? (() => {
    const employeeProposals = proposals.filter(p =>
      (employeeRole === 'closer' && p.closer_id === selectedEmployee.id) ||
      (employeeRole === 'sdr' && p.sdr_id === selectedEmployee.id) ||
      (employeeRole === 'orcamentista' && p.orcamentista_id === selectedEmployee.id)
    );

    if (employeeProposals.length > 0) {
      // Contar departamentos das propostas
      const deptCounts = employeeProposals.reduce((acc, p) => {
        const dept = p.department || 'Comercial Público';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Retornar o departamento mais comum
      return Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Fallback: usar departamento do funcionário ou Comercial Público
    return selectedEmployee.department === 'Petrobras' ? 'Petrobras' : 'Comercial Público';
  })() : selectedDepartment;

  // Calcular estatísticas gerais
  const totalProposalValue = proposals.reduce((sum, p) => sum + Number(p.total_value || 0), 0);
  const totalCommissions = proposals
    .filter(p => p.status === 'Fechado' || p.status === 'Contrato assinado')
    .reduce((sum, p) => sum + Number(p.commission || 0), 0);
  
  const activeProposals = proposals.filter(p => 
    p.status === 'Proposta' || p.status === 'Negociação'
  );
  
  const totalPossibleCommissions = activeProposals
    .reduce((sum, p) => sum + Number(p.commission || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Comissões por Funcionário {selectedYear}</h1>
          <p className="text-sm text-gray-600">Acompanhamento detalhado de comissões individuais para {selectedYear}</p>
        </div>

        {/* Year Selector Mobile */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Ano:</span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Selector Mobile */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Selecione um funcionário:</span>
          </div>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Selecione um funcionário</option>
            {nonAdminEmployees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - {employee.role}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comissões por Funcionário {selectedYear}</h1>
          <p className="text-gray-600">Acompanhamento detalhado de comissões individuais para {selectedYear}</p>
        </div>

        {/* Year and Employee Selectors */}
        <div className="flex items-center space-x-4">
          {/* Year Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Ano:</span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Employee Selector */}
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Funcionário:</span>
          </div>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="">Selecione um funcionário</option>
            {nonAdminEmployees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - {employee.role}
              </option>
            ))}
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
                  <p className="text-xs text-gray-500">Licitantes e ADLs</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Commission Cards Section - Moved from Dashboard */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <GuaranteedCommissions department={selectedDepartment} />
            <PossibleCommissions department={selectedDepartment} />
          </div>
        </>
      )}

      {/* Employee-specific content */}
      {selectedEmployee && (
        <div className="space-y-6">
          {/* Row 1: Monthly Commission Chart */}
          <MonthlyCommissionChart
            employeeId={selectedEmployee.id}
            employeeRole={employeeRole}
            proposals={proposals}
            employeeName={selectedEmployee.name}
            selectedYear={selectedYear}
            department={employeeDepartment}
          />

          {/* Row 2: Open Contracts (full width) */}
          <OpenContractsCommissions
            employeeId={selectedEmployee.id}
            employeeRole={employeeRole}
            proposals={proposals}
            employeeName={selectedEmployee.name}
            selectedYear={selectedYear}
            department={employeeDepartment}
          />

          {/* Row 3: Two columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contracts by Month */}
            <EmployeeContractsList
              employeeId={selectedEmployee.id}
              employeeRole={employeeRole}
              proposals={proposals}
              employeeName={selectedEmployee.name}
              selectedYear={selectedYear}
              department={employeeDepartment}
            />

            {/* Effectiveness Chart */}
            <MonthlyEffectivenessChart
              employeeId={selectedEmployee.id}
              employeeRole={employeeRole}
              proposals={proposals}
              employeeName={selectedEmployee.name}
              selectedYear={selectedYear}
              department={employeeDepartment}
            />
          </div>
        </div>
      )}

      {/* Commission Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Regras de Comissão</h2>

        {(selectedEmployee ? employeeDepartment : selectedDepartment) === 'Petrobras' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {PETROBRAS_COMMISSION_TIERS.map((tier) => (
                <div key={tier.rate} className={`text-center p-4 ${tier.bgColor} border border-current rounded-lg`}>
                  <div className={`text-2xl font-bold ${tier.color}`}>{tier.rate}%</div>
                  <div className={`text-sm ${tier.color}`}>{tier.label}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {tier.maxValue ? 
                      `${formatCurrency(tier.minValue)} - ${formatCurrency(tier.maxValue)}` :
                      `Acima de ${formatCurrency(tier.minValue)}`
                    }
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">📋 Regras Petrobras</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• <strong>Taxa individual:</strong> Baseada no valor global de cada contrato</li>
                <li>• <strong>Sem metas progressivas:</strong> Não há Supermeta ou Megameta</li>
                <li>• <strong>Aplicação direta:</strong> Taxa aplicada diretamente no contrato fechado</li>
                <li>• <strong>Distribuição:</strong> Licitante e ADL recebem a mesma % do valor global</li>
                <li>• <strong>Valor considerado:</strong> Nosso lance (quando disponível) ou valor estimado</li>
              </ul>
            </div>
          </>
        ) : selectedEmployee && employeeRole === 'orcamentista' ? (
          <>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3">📋 Regras de Comissão - Orçamentista</h4>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-purple-300">
                  <div className="font-semibold text-purple-900 mb-2">SEM PROMOTOR:</div>
                  <div className="text-purple-800">
                    • <strong>0,02%</strong> do valor global do contrato
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-purple-300">
                  <div className="font-semibold text-purple-900 mb-2">COM PROMOTOR:</div>
                  <div className="text-purple-800">
                    • <strong>0,005%</strong> do valor global do contrato
                  </div>
                </div>

                <div className="bg-purple-100 rounded-lg p-2 border border-purple-300 mt-3">
                  <p className="text-xs text-purple-800">
                    <strong>Valor considerado:</strong> Nosso lance (quando disponível) ou valor estimado
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">📋 Regras de Comissão - Closer/SDR</h4>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-300">
                  <div className="font-semibold text-blue-900 mb-3">SEM PROMOTOR (Escala de Comissões por Contrato):</div>

                  {/* Grid com as três faixas escalonadas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    {COMMISSION_TIERS.map((tier) => (
                      <div key={tier.rate} className={`text-center p-3 ${tier.bgColor} border-2 border-current rounded-lg`}>
                        <div className={`text-xl font-bold ${tier.color}`}>{tier.rate}%</div>
                        <div className={`text-xs ${tier.color} font-medium mt-1`}>{tier.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-blue-800 space-y-1 mt-3 bg-blue-50 p-2 rounded">
                    <div>• <strong>Closer:</strong> Taxa baseada no valor individual de cada contrato</div>
                    <div>• <strong>SDR:</strong> Mesma taxa do Closer (distribuição igual)</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-300">
                  <div className="font-semibold text-blue-900 mb-2">COM PROMOTOR:</div>
                  <div className="text-blue-800">
                    • <strong>Closer:</strong> 0,005% do valor global do contrato
                  </div>
                  <div className="text-blue-800 mt-1">
                    • <strong>SDR:</strong> 0,005% do valor global do contrato
                  </div>
                </div>

                <div className="bg-blue-100 rounded-lg p-2 border border-blue-300 mt-3">
                  <p className="text-xs text-blue-800">
                    <strong>Valor considerado:</strong> Nosso lance (quando disponível) ou valor estimado
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};