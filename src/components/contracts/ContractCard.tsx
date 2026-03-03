import { useState, useEffect } from 'react';
import { MapPin, FileText, Calendar, Power, Edit, AlertCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import {
  ContractWithAddendums,
  formatCurrency,
  formatDateBR,
  getCurrentValue,
  getCurrentEndDate,
  isContractExpired,
  getClosestEndDate,
} from '../../lib/contractUtils';
import { ContractEmployees } from './ContractEmployees';
import { SupabaseClient } from '@supabase/supabase-js';

interface ContractCardProps {
  supabaseClient: SupabaseClient;
  contract: ContractWithAddendums;
  onEditClick: () => void;
  onAddendumClick: () => void;
  onViewAddendumsClick: () => void;
  onStatusChange?: (contractId: string, newStatus: boolean) => Promise<void>;
  isAdmin?: boolean;
}

export function ContractCard({
  supabaseClient,
  contract,
  onEditClick,
  onAddendumClick,
  onViewAddendumsClick,
  onStatusChange,
  isAdmin = false,
}: ContractCardProps) {
  const [isEmployeesExpanded, setIsEmployeesExpanded] = useState(false);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoadingTotal, setIsLoadingTotal] = useState(true);

  const currentValue = getCurrentValue(contract);
  const currentEndDate = getCurrentEndDate(contract);
  const isExpired = isContractExpired(contract);
  const isActiveStatus = contract.is_active && !isExpired;
  const closestEnd = getClosestEndDate(contract);

  const addendumCount = contract.addendums?.length || 0;
  const latestAddendum = contract.addendums && contract.addendums.length > 0
    ? contract.addendums[0]
    : null;

  useEffect(() => {
    loadTotalEmployees();
  }, [contract.id]);

  const loadTotalEmployees = async () => {
    try {
      setIsLoadingTotal(true);

      const { data: employeesData, error: employeesError } = await supabaseClient
        .from('contract_employees')
        .select('id')
        .eq('contract_id', contract.id);

      if (employeesError) throw employeesError;

      if (!employeesData || employeesData.length === 0) {
        setTotalEmployees(0);
        setIsLoadingTotal(false);
        return;
      }

      const employeeIds = employeesData.map(e => e.id);

      const { data: quantitiesData, error: quantitiesError } = await supabaseClient
        .from('contract_employee_quantities')
        .select('contract_employee_id, addendum_number, quantity, effective_date')
        .in('contract_employee_id', employeeIds);

      if (quantitiesError) throw quantitiesError;

      const addendumMap = new Map<number, string>();
      if (quantitiesData) {
        quantitiesData.forEach(q => {
          if (q.effective_date && !addendumMap.has(q.addendum_number)) {
            addendumMap.set(q.addendum_number, q.effective_date);
          }
        });
      }

      const addendumsList = Array.from(addendumMap.entries())
        .map(([number, date]) => ({ number, date }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const currentAddendumNumber = addendumsList.length > 0
        ? addendumsList[addendumsList.length - 1].number
        : 0;

      const employeeQuantities = new Map<string, number>();

      employeesData.forEach(emp => {
        const empQuantities = quantitiesData?.filter(q => q.contract_employee_id === emp.id) || [];
        let lastQty = 0;

        for (let i = 0; i <= currentAddendumNumber; i++) {
          const qty = empQuantities.find(q => q.addendum_number === i)?.quantity;
          if (qty !== undefined) {
            lastQty = qty;
          }
        }

        employeeQuantities.set(emp.id, lastQty);
      });

      const total = Array.from(employeeQuantities.values()).reduce((sum, qty) => sum + qty, 0);
      setTotalEmployees(total);
    } catch (error) {
      console.error('Error loading total employees:', error);
      setTotalEmployees(0);
    } finally {
      setIsLoadingTotal(false);
    }
  };

  return (
    <div className={`rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl overflow-hidden transition-all transform hover:scale-[1.01] ${
      contract.empresa === 'WWS' ? 'bg-yellow-50' : 'bg-gray-100'
    }`}>
      <div className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${
        isActiveStatus ? 'bg-green-500' : 'bg-red-500'
      } text-white flex items-center justify-between flex-wrap gap-1.5`}>
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 flex-wrap">
          <Power className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold text-xs sm:text-sm">
            {isActiveStatus ? 'ATIVO' : 'INATIVO'}
          </span>
          <span className={`px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
            contract.empresa === 'WWS'
              ? 'bg-yellow-200 text-yellow-800'
              : 'bg-gray-200 text-gray-800'
          }`}>
            {contract.empresa}
          </span>
          <span className={`px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
            contract.tipo === 'Publico'
              ? 'bg-blue-200 text-blue-800'
              : 'bg-purple-200 text-purple-800'
          }`}>
            {contract.tipo || 'Público'}
          </span>
        </div>
        <span className="text-[10px] sm:text-xs md:text-sm">
          {currentValue > 0 ? '✓ Faturando' : 'Sem faturamento'}
        </span>
      </div>

      {closestEnd && closestEnd.daysRemaining <= 90 && (
        <div className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 ${
          closestEnd.type === 'contract'
            ? 'bg-red-50 border-b-2 border-red-300'
            : 'bg-orange-50 border-b-2 border-orange-300'
        }`}>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <AlertCircle className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${
              closestEnd.type === 'contract' ? 'text-red-600' : 'text-orange-600'
            }`} />
            <span className={`text-[10px] sm:text-xs md:text-sm font-medium ${
              closestEnd.type === 'contract' ? 'text-red-700' : 'text-orange-700'
            }`}>
              {closestEnd.daysRemaining} dias • Encerra {formatDateBR(closestEnd.date)}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-0">
          <div className="flex-1 w-full">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-brand-dark mb-1">{contract.client_name}</h3>
            {contract.city && (
              <div className="flex items-center space-x-1 text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{contract.city}</span>
              </div>
            )}

            <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
              {contract.contract_object}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 text-xs sm:text-sm text-gray-600">
              {contract.numero_pregao && (
                <div className="whitespace-nowrap">
                  <span className="text-[10px] sm:text-xs text-gray-500">Pregão: </span>
                  <span className="font-medium">{contract.numero_pregao}</span>
                </div>
              )}
              {contract.numero_contrato && (
                <div className="whitespace-nowrap">
                  <span className="text-[10px] sm:text-xs text-gray-500">Contrato: </span>
                  <span className="font-medium">{contract.numero_contrato}</span>
                </div>
              )}
              <div className="flex items-center space-x-0.5 sm:space-x-1 whitespace-nowrap">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-[10px] sm:text-xs">Início: {formatDateBR(contract.start_date)}</span>
              </div>
              <div className="flex items-center space-x-0.5 sm:space-x-1 whitespace-nowrap">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                <span className="text-[10px] sm:text-xs">Término: <span className="font-medium text-red-600">{formatDateBR(currentEndDate)}</span></span>
              </div>
              {(contract as any).prazo_maximo_renovacao && (() => {
                const startDate = new Date(contract.start_date);
                const maxMonths = (contract as any).prazo_maximo_renovacao;
                const maxDate = new Date(startDate);
                maxDate.setMonth(maxDate.getMonth() + maxMonths);
                return (
                  <div className="whitespace-nowrap">
                    <span className="text-[10px] sm:text-xs text-gray-500">Renov. máx: </span>
                    <span className="font-medium text-blue-600">{formatDateBR(maxDate.toISOString().split('T')[0])}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 sm:gap-4 md:gap-6 w-full md:w-auto md:ml-6">
            <div className="text-center md:text-right flex-1 md:flex-none">
              <div className="flex items-center justify-center md:justify-end space-x-1 sm:space-x-2 text-green-600 mb-0.5 sm:mb-1">
                <span className="text-[10px] sm:text-xs font-medium">💰 Faturamento</span>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
                {formatCurrency(currentValue)}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500">por mês</div>
            </div>

            <div className="text-center md:text-right flex-1 md:flex-none">
              <div className="flex items-center justify-center md:justify-end space-x-1 sm:space-x-2 text-blue-600 mb-0.5 sm:mb-1">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-medium">Aditivos</span>
              </div>
              <button
                onClick={onViewAddendumsClick}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 hover:text-blue-700"
              >
                {addendumCount}
              </button>
              <div className="text-[10px] sm:text-xs text-gray-500">
                {latestAddendum ? `Último: ${formatDateBR(latestAddendum.start_date)}` : 'Nenhum'}
              </div>
            </div>

            <div className="text-center md:text-right flex-1 md:flex-none">
              <div className="flex items-center justify-center md:justify-end space-x-1 sm:space-x-2 text-purple-600 mb-0.5 sm:mb-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-medium">Colaboradores</span>
              </div>
              <button
                onClick={() => setIsEmployeesExpanded(!isEmployeesExpanded)}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 hover:text-purple-700 flex items-center justify-center md:justify-end w-full gap-1"
              >
                {isLoadingTotal ? '...' : totalEmployees}
                {isEmployeesExpanded ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
              <div className="text-[10px] sm:text-xs text-gray-500">
                {isEmployeesExpanded ? 'Ocultar' : 'Mostrar'}
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
              <Button
                onClick={onAddendumClick}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap flex-1 md:flex-none text-xs sm:text-sm h-8 sm:h-9"
              >
                + Aditivo
              </Button>
              <Button
                onClick={onEditClick}
                size="sm"
                variant="outline"
                className="whitespace-nowrap flex-1 md:flex-none text-xs sm:text-sm h-8 sm:h-9"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        {isEmployeesExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <ContractEmployees
              contractId={contract.id}
              supabaseClient={supabaseClient}
              isExpanded={isEmployeesExpanded}
              onToggleExpand={loadTotalEmployees}
            />
          </div>
        )}
      </div>
    </div>
  );
}
