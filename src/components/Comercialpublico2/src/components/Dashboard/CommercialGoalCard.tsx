import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, DollarSign, AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { formatDateBR, getCurrentDateTimeBR } from '../../utils/dateUtils';
import { isContratoAssinado } from '../../constants/status';

interface MonthlyGoal {
  month: number;
  year: number;
  monthName: string;
  targetContracts: number;
  targetRevenue: number;
  actualContracts: number;
  actualRevenue: number;
  surplus: number;
  deficit: number;
  adjustedTarget: number;
}

interface ContractAllocation {
  id: string;
  client: string;
  monthlyValue: number;
  annualValue: number;
  signedMonth: number;
  signedYear: number;
  allocatedMonth: number;
  allocatedYear: number;
  closingDate: string;
}

export const CommercialGoalCard: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonthDetails, setSelectedMonthDetails] = useState<number | null>(null);
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const { data: proposals = [], loading } = useSupabaseQuery('proposals');
  const { monthlyGoals, getMonthGoal, getAnnualGoal, loading: goalsLoading } = useMonthlyGoals();
  
  // Configurações da meta (agora dinâmicas)
  const TARGET_ANNUAL_REVENUE = getAnnualGoal(); // Valor dinâmico do Supabase
  
  // Período da meta: Março a Dezembro
  const GOAL_START_MONTH = 1; // Janeiro
  const GOAL_END_MONTH = 12; // Dezembro
  const CURRENT_YEAR = selectedYear;

  // Escutar mudanças nas metas
  React.useEffect(() => {
    const handleGoalsUpdate = (event: CustomEvent) => {
        // Recarregar dados sem reload da página
        console.log('🔄 Atualizando metas do dashboard para o ano', selectedYear);
        window.dispatchEvent(new CustomEvent('refreshDashboard'));
      window.location.reload();
    };

    window.addEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    };
  }, [selectedYear]);

  if (loading || goalsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Filtrar contratos fechados no período da meta
  const closedContracts = proposals.filter(proposal => {
    if (!isContratoAssinado(proposal.status) || !proposal.closing_date) return false;

    // Excluir contratos com promotor (não contam para metas)
    if (proposal.promotor_id) return false;

    // Excluir licitações que não geram comissão nem contam para meta
    if (proposal.nao_gera_comissao) return false;

    // Excluir licitações que não contam para meta comercial
    if (proposal.nao_conta_meta_comercial) return false;

    const closingDate = new Date(proposal.closing_date);
    const month = closingDate.getMonth() + 1;
    const year = closingDate.getFullYear();

    return year === CURRENT_YEAR && month >= GOAL_START_MONTH && month <= GOAL_END_MONTH;
  });

  // Contratos fechados INCLUINDO promotor (para "Total Vendido")
  const allClosedContracts = proposals.filter(proposal => {
    if (!isContratoAssinado(proposal.status) || !proposal.closing_date) return false;

    // Excluir licitações que não geram comissão nem contam para meta
    if (proposal.nao_gera_comissao) return false;

    // Excluir licitações que não contam para meta comercial
    if (proposal.nao_conta_meta_comercial) return false;

    const closingDate = new Date(proposal.closing_date);
    const month = closingDate.getMonth() + 1;
    const year = closingDate.getFullYear();

    return year === CURRENT_YEAR && month >= GOAL_START_MONTH && month <= GOAL_END_MONTH;
  });

  // Calcular alocação de contratos por mês
  const calculateContractAllocations = (): ContractAllocation[] => {
    const allocations: ContractAllocation[] = [];
    const monthlyDeficits: { [key: string]: number } = {};
    
    const totalClosedValueThisMonth = closedContracts.reduce(
      (sum, proposal) => sum + (Number(proposal.monthly_value || 0) * Number(proposal.months || 12)), 0
    );
    
    // Inicializar déficits mensais
    for (let month = GOAL_START_MONTH; month <= GOAL_END_MONTH; month++) {
      monthlyDeficits[`${CURRENT_YEAR}-${month}`] = getMonthGoal(month);
    }
    
    // Ordenar contratos por data de fechamento
    const sortedContracts = [...closedContracts].sort((a, b) => 
      new Date(a.closing_date!).getTime() - new Date(b.closing_date!).getTime()
    );
    
    sortedContracts.forEach(contract => {
      const closingDate = new Date(contract.closing_date!);
      const signedMonth = closingDate.getMonth() + 1;
      const annualValue = contract.monthly_value * 12; // Valor anual do contrato (mantém a multiplicação para contratos)
      const contractValue = contract.nosso_lance || contract.total_value; // Usar nosso lance prioritariamente
      
      let remainingValue = annualValue;
      let currentMonth = signedMonth;
      
      // Alocar valor começando pelo mês de assinatura
      while (remainingValue > 0 && currentMonth <= GOAL_END_MONTH) {
        const monthKey = `${CURRENT_YEAR}-${currentMonth}`;
        const monthDeficit = monthlyDeficits[monthKey] || 0;
        
        if (monthDeficit > 0) {
          const allocatedValue = Math.min(remainingValue, monthDeficit);
          
          allocations.push({
            id: contract.id,
            client: contract.client,
            monthlyValue: contract.monthly_value,
            annualValue: allocatedValue,
            signedMonth,
            signedYear: CURRENT_YEAR,
            allocatedMonth: currentMonth,
            allocatedYear: CURRENT_YEAR,
            closingDate: contract.closing_date!
          });
          
          monthlyDeficits[monthKey] -= allocatedValue;
          remainingValue -= allocatedValue;
        }
        
        currentMonth++;
      }
    });
    
    return allocations;
  };

  const contractAllocations = calculateContractAllocations();

  // Calcular dados mensais
  const calculateMonthlyData = (): (MonthlyGoal & {
    cumulativeDeficit: number;
    adjustedTargetFromDeficit: number;
    effectiveTarget: number;
    inheritedCarryOver: number;
    carryOverToNext: number;
    hasContracts: boolean;
    remainingToTarget: number;
  })[] => {
    const monthlyData: MonthlyGoal[] = [];
    let carryOverFromPreviousMonth = 0;
    
    for (let month = GOAL_START_MONTH; month <= GOAL_END_MONTH; month++) {
      const monthName = new Date(CURRENT_YEAR, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
      const originalTargetRevenue = getMonthGoal(month); // Meta original do Supabase
      
      // Contratos fechados neste mês (INCLUINDO promotor para acompanhamento mensal)
      const monthContracts = allClosedContracts.filter(contract => {
        const closingDate = new Date(contract.closing_date!);
        return closingDate.getMonth() + 1 === month && closingDate.getFullYear() === CURRENT_YEAR;
      });
      
      // Calcular valor GLOBAL real dos contratos fechados neste mês
      const actualGlobalRevenue = monthContracts.reduce(
        (sum, contract) => {
          const contractValue = contract.nosso_lance || contract.total_value;
          return sum + contractValue; // USAR VALOR GLOBAL, NÃO MENSAL
        }, 0
      );
      
      // REGRAS PARA META EFETIVA:
      // 1. Se tem meta original (> 0): usar meta + carryover
      // 2. Se não tem meta (= 0): usar apenas carryover (déficit herdado)
      let effectiveTarget;
      if (originalTargetRevenue > 0) {
        // Mês com meta: aplicar carryover sobre a meta
        effectiveTarget = Math.max(0, originalTargetRevenue + carryOverFromPreviousMonth);
      } else {
        // Mês sem meta: usar apenas o carryover (se positivo)
        effectiveTarget = Math.max(0, carryOverFromPreviousMonth);
      }
      
      // Guardar o valor herdado para exibição
      const inheritedCarryOver = carryOverFromPreviousMonth;
      
      // CÁLCULO DE DÉFICIT/SUPERÁVIT:
      // Comparar valor GLOBAL realizado vs meta efetiva
      const monthlyDeficit = Math.max(0, effectiveTarget - actualGlobalRevenue);
      const monthlySurplus = Math.max(0, actualGlobalRevenue - effectiveTarget);
      
      // CARRYOVER PARA O PRÓXIMO MÊS:
      let carryOverToNext = 0;
      
      if (monthlySurplus > 0) {
        // Superávit: abater dos próximos meses (valor negativo)
        carryOverToNext = -monthlySurplus;
      } else if (monthlyDeficit > 0) {
        // Déficit: acumular para os próximos meses (valor positivo)
        carryOverToNext = monthlyDeficit;
      } else {
        // Sem déficit nem superávit: não carregar nada
        carryOverToNext = 0;
      }
      
      // Atualizar carryOver para a próxima iteração
      carryOverFromPreviousMonth = carryOverToNext;
      
      // Verificar se o mês tem contratos (para exibição)
      const hasContracts = monthContracts.length > 0;
      
      // CÁLCULO DO VALOR FALTANTE PARA A META
      // Se o mês já passou: mostrar quanto faltou/sobrou
      // Se o mês é futuro: mostrar quanto falta para atingir a meta efetiva
      const remainingToTarget = Math.max(0, effectiveTarget - actualGlobalRevenue);
      
      const currentMonthData = {
        month,
        year: CURRENT_YEAR,
        monthName,
        targetContracts: Math.ceil(effectiveTarget / (effectiveTarget > 0 ? effectiveTarget / 12 : 25000)),
        targetRevenue: originalTargetRevenue, // Meta original
        actualContracts: monthContracts.length,
        actualRevenue: actualGlobalRevenue, // Valor GLOBAL real fechado no mês
        surplus: monthlySurplus,
        deficit: monthlyDeficit,
        adjustedTarget: effectiveTarget,
        cumulativeDeficit: Math.max(0, carryOverFromPreviousMonth), // Manter compatibilidade
        adjustedTargetFromDeficit: effectiveTarget,
        effectiveTarget,
        inheritedCarryOver,
        carryOverToNext,
        hasContracts,
        remainingToTarget
      };
      
      monthlyData.push(currentMonthData);
    }
    
    return monthlyData as any;
  };

  const monthlyData = calculateMonthlyData();
  
  // Calcular totais
  // Total vendido = soma dos valores globais (nosso_lance ou total_value)
  const totalActualRevenue = allClosedContracts.reduce(
    (sum, contract) => {
      const contractValue = contract.nosso_lance || contract.total_value;
      return sum + contractValue;
    }, 0
  );
  
  // Valor mensal = soma dos valores mensais de cada contrato
  const totalActualMonthlyValue = allClosedContracts.reduce(
    (sum, contract) => {
      const contractValue = contract.nosso_lance || contract.total_value;
      const monthlyValue = contractValue / (contract.months || 12);
      return sum + monthlyValue;
    }, 0
  );
  
  const totalActualContracts = allClosedContracts.length;
  
  // Calcular total de meses de todos os contratos fechados
  const totalMonthsAllContracts = allClosedContracts.reduce(
    (sum, contract) => sum + (contract.months || 12), 0
  );
  
  const totalTargetContracts = Math.ceil(TARGET_ANNUAL_REVENUE / (TARGET_ANNUAL_REVENUE > 0 ? TARGET_ANNUAL_REVENUE / 12 : 300000)); // Baseado nas metas
  const progressPercentage = (totalActualRevenue / TARGET_ANNUAL_REVENUE) * 100;
  const remainingRevenue = TARGET_ANNUAL_REVENUE - totalActualRevenue;
  
  // Alertas
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const alerts = [];
  
  // Verificar meses sem contratos
  monthlyData.forEach(month => {
    if (month.month < currentMonth && month.actualRevenue < month.targetRevenue) {
      alerts.push({
        type: 'warning' as const,
        message: `${month.monthName}: ${month.actualContracts} contratos fechados - Déficit de ${formatCurrency(month.deficit)}`
      });
    }
    
    if (month.actualRevenue > month.targetRevenue) {
      alerts.push({
        type: 'success' as const,
        message: `${month.monthName}: Meta superada em ${formatCurrency(month.surplus)}`
      });
    }
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Função auxiliar para determinar se o mês já passou
  const isMonthPast = (month: number) => {
    const now = getCurrentDateTimeBR();
    const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11
    const currentYear = now.getFullYear();
    
    return CURRENT_YEAR < currentYear || (CURRENT_YEAR === currentYear && month <= currentMonth);
  };

  // Função para renderizar um card mensal
  const renderMonthCard = (monthData: MonthlyGoal & { 
    cumulativeDeficit: number; 
    adjustedTargetFromDeficit: number; 
    effectiveTarget: number;
    carryOverToNext: number;
    hasContracts: boolean;
    remainingToTarget: number;
  }) => {
    const isPast = isMonthPast(monthData.month);
    const hasAlert = isPast && monthData.actualRevenue < monthData.effectiveTarget;
    const hasSuccess = isPast && monthData.actualRevenue > 0 && monthData.actualRevenue >= monthData.effectiveTarget;
    const hasNoOriginalGoal = monthData.targetRevenue <= 0;
    const hasEffectiveGoal = monthData.effectiveTarget > 0;
    const hasContracts = monthData.hasContracts;
    
    const handleCardClick = () => {
      setSelectedMonthDetails(monthData.month);
    };
    
    return (
      <button 
        key={monthData.month}
        onClick={handleCardClick}
        className={`rounded-lg p-2 md:p-4 border transition-all ${
          !hasEffectiveGoal && !hasContracts
            ? 'bg-gray-50 border-gray-200 opacity-50'
            : !isPast 
            ? 'bg-gray-100 border-gray-200 opacity-60 cursor-default' 
            : hasSuccess
            ? 'bg-green-50 border-green-200 hover:bg-green-100'
            : hasAlert
            ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
            : hasContracts && hasNoOriginalGoal
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        } text-left w-full`}
      >
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <h4 className={`font-medium text-xs md:text-sm ${
            !hasEffectiveGoal && !hasContracts ? 'text-gray-400' : 
            !isPast ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {monthData.monthName}
          </h4>
          {isPast && (hasEffectiveGoal || hasContracts) && (
            hasSuccess ? (
              <CheckCircle className="w-3 h-3 md:w-5 md:h-5 text-green-600" />
            ) : hasAlert ? (
              <AlertTriangle className="w-3 h-3 md:w-5 md:h-5 text-yellow-600" />
            ) : hasContracts && hasNoOriginalGoal ? (
              <DollarSign className="w-3 h-3 md:w-5 md:h-5 text-blue-600" />
            ) : null
          )}
        </div>
        
        <div className={`space-y-1 text-xs ${
          !hasEffectiveGoal && !hasContracts ? 'text-gray-400' : 
          !isPast ? 'text-gray-400' : 'text-gray-700'
        }`}>
          <div className="text-center">
            <div className="text-gray-500 text-xs">
              {hasEffectiveGoal || hasContracts ? 
                (isPast ? 'Valor Faltante' : 'Meta Efetiva') : 
                'Sem Meta'
              }
            </div>
            <div className={`text-sm md:text-lg font-bold ${
              !hasEffectiveGoal && !hasContracts ? 'text-gray-400' : 
              !isPast ? 'text-gray-500' :
              hasNoOriginalGoal && hasContracts ? 'text-blue-600' :
              monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 
              'text-red-600'
            }`}>
              {!hasEffectiveGoal && !hasContracts ? 'Sem meta' : 
               hasNoOriginalGoal && hasEffectiveGoal ? (
                <>
                  {formatCurrency(monthData.remainingToTarget)}
                  <div className="text-xs text-red-500 font-normal mt-0.5 md:mt-1 hidden md:block">
                    {monthData.remainingToTarget > 0 ? '(Déficit herdado)' : '(Déficit quitado)'}
                  </div>
                </>
               ) : hasEffectiveGoal ? (
                <>
                  {isPast ? 
                    formatCurrency(monthData.remainingToTarget) : 
                    formatCurrency(monthData.effectiveTarget)
                  }
                  <div className="text-xs text-gray-500 font-normal mt-0.5 md:mt-1 hidden md:block">
                    {isPast ? (
                      monthData.remainingToTarget > 0 ? 
                        `(Faltou: ${formatCurrency(monthData.remainingToTarget)})` :
                        `(Meta atingida)`
                    ) : (
                      monthData.targetRevenue > 0 ? 
                        `(Meta: ${formatCurrency(monthData.targetRevenue)})` :
                        '(Déficit herdado)'
                    )
                    }
                  </div>
                </>
               ) : 'Sem meta'}
            </div>
          </div>
          
          {isPast && (hasEffectiveGoal || hasContracts) && (
            <div className="text-center mt-1 md:mt-2">
              <div className="font-medium text-xs md:text-sm">{formatCurrency(monthData.actualRevenue)}</div>
              <div className="text-gray-500 text-xs">{monthData.actualContracts} contrato{monthData.actualContracts !== 1 ? 's' : ''}</div>
              {hasContracts && hasNoOriginalGoal && (
                <div className="text-xs text-blue-600 mt-0.5 md:mt-1 hidden md:block">Contrato sem meta</div>
              )}
            </div>
          )}
        </div>
      </button>
    );
  };

  // Modal para detalhes do mês
  const MonthDetailsModal: React.FC<{ monthData: any; onClose: () => void }> = ({ monthData, onClose }) => {
    const isPast = isMonthPast(monthData.month);
    const hasOriginalGoal = monthData.targetRevenue > 0;
    const hasEffectiveGoal = monthData.effectiveTarget > 0;
    const hasContracts = monthData.hasContracts;
    const carryOver = monthData.inheritedCarryOver || 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{monthData.monthName} {CURRENT_YEAR}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {hasEffectiveGoal || hasContracts ? (
              <>
                {/* Status Banner */}
                <div className={`border rounded-lg p-4 ${
                  !isPast ? 'bg-blue-50 border-blue-200' :
                  !hasOriginalGoal && hasContracts ? 'bg-blue-50 border-blue-200' :
                  monthData.actualRevenue >= monthData.effectiveTarget ? 'bg-green-50 border-green-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {isPast && (hasEffectiveGoal || hasContracts) && (
                      !hasOriginalGoal && hasContracts ? (
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      ) :
                      monthData.actualRevenue >= monthData.effectiveTarget ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      )
                    )}
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        !isPast ? 'text-blue-900' :
                        !hasOriginalGoal && hasContracts ? 'text-blue-900' :
                        monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {!isPast ? 'Mês Futuro' :
                         !hasOriginalGoal && hasContracts ? 'Contrato Sem Meta Original' :
                         monthData.actualRevenue >= monthData.effectiveTarget ? 'Meta Atingida' : 'Meta Não Atingida'}
                      </h3>
                      <p className={`text-sm ${
                        !isPast ? 'text-blue-700' :
                        !hasOriginalGoal && hasContracts ? 'text-blue-700' :
                        monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {!isPast ? 'Aguardando dados do mês' :
                         !hasOriginalGoal && hasContracts ? 
                         `Contrato fechado sem meta original: ${formatCurrency(monthData.actualRevenue)}/mês` :
                         monthData.actualRevenue >= monthData.effectiveTarget ? 
                         `Superou a meta efetiva em ${formatCurrency(monthData.actualRevenue - monthData.effectiveTarget)}` :
                         `Déficit de ${formatCurrency(monthData.effectiveTarget - monthData.actualRevenue)}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Dados do Mês */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {hasOriginalGoal ? (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Meta Original</label>
                        <div className="text-xl font-bold text-blue-600">{formatCurrency(monthData.targetRevenue)}</div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Meta Original</label>
                        <div className="text-xl font-bold text-gray-400">Não definida</div>
                        <div className="text-xs text-gray-500">Mês sem meta configurada</div>
                      </div>
                    )}
                    
                    {carryOver !== 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          {carryOver > 0 ? 'Déficit Herdado' : 'Superávit Herdado'}
                        </label>
                        <div className={`text-xl font-bold ${carryOver > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {carryOver > 0 ? '+' : ''}{formatCurrency(Math.abs(carryOver))}
                        </div>
                        <div className="text-xs text-gray-500">Do mês anterior</div>
                      </div>
                    )}
                    
                    {hasEffectiveGoal && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Meta Efetiva</label>
                        <div className={`text-2xl font-bold ${
                          !hasOriginalGoal ? 'text-red-600' :
                          monthData.effectiveTarget > monthData.targetRevenue ? 'text-red-600' : 
                          monthData.effectiveTarget < monthData.targetRevenue ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {formatCurrency(monthData.effectiveTarget)}
                        </div>
                        {hasOriginalGoal && monthData.effectiveTarget !== monthData.targetRevenue && (
                          <div className="text-xs text-gray-500">
                            {monthData.effectiveTarget > monthData.targetRevenue ? 
                              `+${formatCurrency(monthData.effectiveTarget - monthData.targetRevenue)}` :
                              `-${formatCurrency(monthData.targetRevenue - monthData.effectiveTarget)}`
                            }
                          </div>
                        )}
                        {!hasOriginalGoal && (
                          <div className="text-xs text-red-500">
                            Déficit acumulado dos meses anteriores
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {isPast && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Realizado (Mensal)</label>
                          <div className={`text-xl font-bold ${
                            !hasOriginalGoal && hasContracts ? 'text-blue-600' :
                            monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(monthData.actualRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {monthData.actualContracts} contrato{monthData.actualContracts !== 1 ? 's' : ''} • Valor mensal
                          </div>
                        </div>
                        
                        {hasEffectiveGoal && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              {monthData.actualRevenue >= monthData.effectiveTarget ? 'Superávit' : 'Déficit'}
                            </label>
                            <div className={`text-xl font-bold ${
                              monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(Math.abs(monthData.actualRevenue - monthData.effectiveTarget))}
                            </div>
                          </div>
                        )}
                        
                        {!hasOriginalGoal && hasContracts && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Impacto Positivo</label>
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(monthData.actualRevenue)}
                            </div>
                        <div className="text-xs text-gray-500">
                              Contribuição para o ano sem meta
                        </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Impacto no Próximo Mês */}
                {isPast && (hasEffectiveGoal || hasContracts) && monthData.carryOverToNext !== 0 && (
                  <div className={`p-4 rounded-lg border ${
                    monthData.carryOverToNext > 0 ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200'
                  }`}>
                    <h4 className={`font-medium ${
                      monthData.carryOverToNext > 0 ? 'text-red-800' : 'text-green-800'
                    } mb-2`}>
                      Impacto no Próximo Mês
                    </h4>
                    <p className={`text-sm ${
                      monthData.carryOverToNext > 0 ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {monthData.carryOverToNext > 0 ? 
                        `Déficit de ${formatCurrency(monthData.carryOverToNext)} será acumulado para o próximo mês` :
                        `Superávit de ${formatCurrency(Math.abs(monthData.carryOverToNext))} será abatido do próximo mês`
                      }
                    </p>
                  </div>
                )}
                
                {/* Cálculo Detalhado */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Cálculo Detalhado</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    {hasOriginalGoal ? (
                      <div className="flex justify-between">
                        <span>Meta Original:</span>
                        <span className="font-medium">{formatCurrency(monthData.targetRevenue)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Meta Original:</span>
                        <span className="font-medium text-gray-400">Não definida</span>
                      </div>
                    )}
                    {carryOver !== 0 && (
                      <div className="flex justify-between">
                        <span>{carryOver > 0 ? 'Déficit' : 'Superávit'} Herdado:</span>
                        <span className={`font-medium ${carryOver > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {carryOver > 0 ? '+' : ''}{formatCurrency(Math.abs(carryOver))}
                        </span>
                      </div>
                    )}
                    {hasEffectiveGoal && (
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Meta Efetiva:</span>
                        <span>{formatCurrency(monthData.effectiveTarget)}</span>
                      </div>
                    )}
                    {isPast && (
                      <>
                        <div className="flex justify-between">
                          <span>Realizado (Mensal):</span>
                          <span className="font-medium">{formatCurrency(monthData.actualRevenue)}</span>
                        </div>
                        {hasEffectiveGoal && (
                          <div className="border-t pt-2 flex justify-between font-bold">
                            <span>{monthData.actualRevenue >= monthData.effectiveTarget ? 'Superávit:' : 'Déficit:'}</span>
                            <div className={monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 'text-red-600'}>
                              <span>{formatCurrency(Math.abs(monthData.actualRevenue - monthData.effectiveTarget))}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Sem Meta Definida</h3>
                  <p className="text-sm">Este mês não possui meta comercial configurada</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Determinar cores baseadas no departamento
  const getThemeColors = () => {
    if (selectedDepartment === 'Petrobras') {
      return {
        bgGradient: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
        border: 'border-yellow-300',
        titleText: 'text-green-800',
        subtitleText: 'text-green-700',
        iconBg: 'bg-yellow-500',
        cardBg: 'bg-yellow-50',
        cardBorder: 'border-yellow-200',
        buttonBg: 'bg-yellow-200',
        buttonHover: 'hover:bg-yellow-300',
        buttonText: 'text-green-800'
      };
    }
    
    return {
      bgGradient: 'bg-gradient-to-r from-blue-50 to-green-50',
      border: 'border-blue-200',
      titleText: 'text-gray-900',
      subtitleText: 'text-gray-600',
      iconBg: 'bg-blue-600',
      cardBg: 'bg-white',
      cardBorder: 'border-gray-200',
      buttonBg: 'bg-white border-gray-300',
      buttonHover: 'hover:bg-gray-50',
      buttonText: 'text-gray-700'
    };
  };

  const theme = getThemeColors();

  return (
    <div className={`${theme.bgGradient} rounded-xl shadow-sm border-2 ${theme.border} p-6 mb-6`}>
      {/* Header Mobile - Só título */}
      <div className="md:hidden flex items-center space-x-3 mb-4">
        <div className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center`}>
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${theme.titleText}`}>Meta Comercial {CURRENT_YEAR}</h2>
          <p className={`text-sm ${theme.subtitleText}`}>Jan-Dez • {formatCurrency(TARGET_ANNUAL_REVENUE)}</p>
        </div>
      </div>
      
      {/* Header Desktop - Completo */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${theme.iconBg} rounded-xl flex items-center justify-center`}>
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${theme.titleText}`}>Meta Comercial {CURRENT_YEAR}</h2>
            <p className={`${theme.subtitleText}`}>Janeiro a Dezembro • Meta anual: {formatCurrency(TARGET_ANNUAL_REVENUE)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center space-x-2 px-4 py-2 ${theme.buttonBg} border rounded-lg ${theme.buttonHover} transition-colors ${theme.buttonText}`}
        >
          <Info className="w-4 h-4" />
          <span>{showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
        </button>
      </div>

      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className={`${theme.cardBg} rounded-lg p-6 border ${theme.cardBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${theme.subtitleText}`}>Meta Anual</h3>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className={`text-2xl font-bold ${theme.titleText}`}>{formatCurrency(TARGET_ANNUAL_REVENUE)}</div>
          <div className={`text-sm ${theme.subtitleText}`}>
            {totalTargetContracts} contratos • <span className="text-xs">({formatCurrency(TARGET_ANNUAL_REVENUE / 12)}/mês)</span>
          </div>
        </div>

        <div className={`${theme.cardBg} rounded-lg p-6 border ${theme.cardBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${theme.subtitleText}`}>Total Vendido</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalActualRevenue)}</div>
          <div className={`text-sm ${theme.subtitleText} mt-1`}>
            {formatCurrency(totalActualMonthlyValue)}/mês
          </div>
          <div className={`text-sm ${theme.subtitleText}`}>
            {totalActualContracts} contrato{totalActualContracts !== 1 ? 's' : ''} fechado{totalActualContracts !== 1 ? 's' : ''}
          </div>
        </div>

        <div className={`${theme.cardBg} rounded-lg p-6 border ${theme.cardBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${theme.subtitleText}`}>Progresso</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{progressPercentage.toFixed(1)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all ${getProgressColor(progressPercentage)}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className={`${theme.cardBg} rounded-lg p-6 border ${theme.cardBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${theme.subtitleText}`}>Falta Atingir</h3>
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {remainingRevenue > 0 ? (
              <>
                {formatCurrency(remainingRevenue)}
                <div className="text-xs text-gray-500 font-normal mt-1">
                  ({formatCurrency(remainingRevenue / (12 - new Date().getMonth()))}/mês restante)
                </div>
              </>
            ) : 'Meta Atingida!'}
          </div>
          <div className={`text-sm ${theme.subtitleText}`}>
            {remainingRevenue > 0 ? 'Para atingir meta anual' : '🎉 Parabéns!'}
          </div>
        </div>
      </div>

      {/* Cards Mensais */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold ${theme.titleText} mb-4`}>Acompanhamento Mensal - {CURRENT_YEAR}</h3>
        
        {/* Layout responsivo - Mobile: 2 colunas x 6 linhas, Desktop: 6 colunas x 2 linhas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4">
          {monthlyData.map(monthData => renderMonthCard(monthData))}
        </div>
      </div>
      
      {/* Botão Ver Detalhes Mobile - Após cards mensais */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2 ${theme.buttonBg} border rounded-lg ${theme.buttonHover} transition-colors text-sm ${theme.buttonText}`}
        >
          <Info className="w-4 h-4" />
          <span>{showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
        </button>
      </div>

      {/* Detalhes Expandidos */}
      {showDetails && (
        <div className="space-y-6">

          {/* Lista de Contratos */}
          <div className={`${theme.cardBg} rounded-lg p-6 border ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.titleText} mb-4`}>Contratos Fechados {CURRENT_YEAR} ({totalActualContracts})</h3>
            {allClosedContracts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className={`text-left py-3 px-4 font-medium ${theme.subtitleText}`}>Cliente</th>
                      <th className={`text-center py-3 px-4 font-medium ${theme.subtitleText}`}>Mês Assinatura</th>
                      <th className={`text-center py-3 px-4 font-medium ${theme.subtitleText}`}>Valor Mensal</th>
                      <th className={`text-center py-3 px-4 font-medium ${theme.subtitleText}`}>Valor Anual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allClosedContracts.map((contract) => {
                      const contractValue = contract.nosso_lance || contract.total_value;
                      const closingDate = new Date(contract.closing_date!);
                      const closingMonth = closingDate.getMonth() + 1;
                      
                      return (
                        <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className={`py-3 px-4 font-medium ${theme.titleText}`}>{contract.client}</td>
                        <td className="py-3 px-4 text-center">
                          {formatDateBR(contract.closing_date!, { month: 'short', year: 'numeric' })}
                          {contract.promotor_id && (
                            <div className="text-xs text-red-500 font-medium">Com Promotor</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">{formatCurrency((contract.nosso_lance || contract.total_value) / (contract.months || 12))}</td>
                        <td className="py-3 px-4 text-center font-medium" title={contract.nosso_lance ? 'Baseado no nosso lance' : 'Baseado no valor estimado'}>
                          <div className={contract.promotor_id ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(contractValue)}
                          {contract.nosso_lance && (
                            <div className={`text-xs ${contract.promotor_id ? 'text-red-500' : 'text-green-500'}`}>Nosso lance</div>
                          )}
                          {contract.promotor_id && (
                            <div className="text-xs text-red-500">Comissão 0,1%</div>
                          )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className={`${theme.subtitleText}`}>Nenhum contrato fechado em {CURRENT_YEAR}</p>
                <p className={`text-sm ${theme.subtitleText} opacity-75`}>Os contratos fechados aparecerão aqui automaticamente</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de Detalhes do Mês */}
      {selectedMonthDetails !== null && (
        <MonthDetailsModal
          monthData={monthlyData.find(m => m.month === selectedMonthDetails)}
          onClose={() => setSelectedMonthDetails(null)}
        />
      )}
    </div>
  );
};