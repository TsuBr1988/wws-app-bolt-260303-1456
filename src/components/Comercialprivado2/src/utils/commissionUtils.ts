// Utilitários para cálculo de comissões
import { formatCurrency } from './formatCurrency';

export interface CommissionTier {
  rate: number;
  minValue: number;
  maxValue: number | null;
  label: string;
  color: string;
  bgColor: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  {
    rate: 0.4,
    minValue: 0,
    maxValue: 600000,
    label: 'Meta Base',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  {
    rate: 0.8,
    minValue: 600000,
    maxValue: 1200000,
    label: 'Supermeta',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    rate: 1.2,
    minValue: 1200000,
    maxValue: null,
    label: 'Megameta',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  }
];

// Determinar taxa de comissão baseada no volume total
export const getCommissionRate = (totalValue: number): number => {
  if (totalValue <= 600000) return 0.4;
  if (totalValue <= 1200000) return 0.8;
  return 1.2;
};

// Obter informações da tier de comissão atual
export const getCommissionTier = (totalValue: number): CommissionTier => {
  return COMMISSION_TIERS.find(tier =>
    totalValue >= tier.minValue && (tier.maxValue === null || totalValue <= tier.maxValue)
  ) || COMMISSION_TIERS[0];
};

/**
 * Calcula a taxa de comissão baseada na função e se há promotor
 *
 * SEM PROMOTOR (só um dos papéis preenchido):
 * - Closer: 0,1% do valor global
 * - Orçamentista: 0,02% do valor global
 *
 * COM PROMOTOR (ambos papéis preenchidos):
 * - Closer: 0,01% do valor global
 * - Orçamentista: 0,005% do valor global
 */
export const getCommissionRateByRole = (
  proposal: any,
  role: 'closer' | 'sdr'
): number => {
  const hasCloser = !!proposal.closer_id;
  const hasSdr = !!proposal.sdr_id;
  const hasPromotor = hasCloser && hasSdr;

  if (role === 'closer') {
    return hasPromotor ? 0.01 : 0.1;
  } else {
    return hasPromotor ? 0.005 : 0.02;
  }
};

// Calcular comissão efetiva para um contrato
export const calculateContractCommission = (contractValue: number, rate: number): number => {
  return (contractValue * rate) / 100;
};

// Calcular comissões mensais de um funcionário
export const calculateMonthlyCommissions = (proposals: any[], employeeId: string, role: 'closer' | 'sdr', year?: number) => {
  const targetYear = year || new Date().getFullYear();
  const monthlyData: { [key: string]: { contracts: any[], totalValue: number, commission: number } } = {};

  // Inicializar todos os meses
  for (let month = 1; month <= 12; month++) {
    const monthKey = `${targetYear}-${month.toString().padStart(2, '0')}`;
    monthlyData[monthKey] = { contracts: [], totalValue: 0, commission: 0 };
  }

  // Filtrar contratos fechados do funcionário
  const closedContracts = proposals.filter(proposal => {
    if (proposal.status !== 'Fechado') return false;

    // Verificar se o funcionário está envolvido no contrato
    if (role === 'closer' && proposal.closer_id !== employeeId) return false;
    if (role === 'sdr' && proposal.sdr_id !== employeeId) return false;

    // Filtrar pelo ano
    const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
    if (closingDate.getFullYear() !== targetYear) return false;

    return true;
  });

  // Processar cada contrato fechado
  closedContracts.forEach(contract => {
    // Usar data de fechamento para determinar o mês
    const closingDate = contract.closing_date ? new Date(contract.closing_date) : new Date(contract.created_at);
    const monthKey = `${targetYear}-${(closingDate.getMonth() + 1).toString().padStart(2, '0')}`;

    if (monthlyData[monthKey]) {
      monthlyData[monthKey].contracts.push(contract);
      monthlyData[monthKey].totalValue += contract.total_value || 0;

      // Calcular comissão usando a nova função que considera promotor
      const commissionRate = getCommissionRateByRole(contract, role);
      monthlyData[monthKey].commission += calculateContractCommission(contract.total_value || 0, commissionRate);
    }
  });

  return monthlyData;
};

// Calcular valor total fechado pelo funcionário no mês atual
export const calculateCurrentMonthTotal = (proposals: any[], employeeId: string, role: 'closer' | 'sdr'): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return proposals
    .filter(proposal => {
      if (proposal.status !== 'Fechado') return false;
      if (role === 'closer' && proposal.closer_id !== employeeId) return false;
      if (role === 'sdr' && proposal.sdr_id !== employeeId) return false;
      
      const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
      return closingDate.getMonth() === currentMonth && closingDate.getFullYear() === currentYear;
    })
    .reduce((sum, proposal) => sum + (proposal.total_value || 0), 0);
};

// Calcular contratos em aberto de um funcionário
export const getOpenContracts = (proposals: any[], employeeId: string, role: 'closer' | 'sdr') => {
  return proposals.filter(proposal => {
    if (proposal.status !== 'Proposta' && proposal.status !== 'Negociação') return false;
    if (role === 'closer' && proposal.closer_id !== employeeId) return false;
    if (role === 'sdr' && proposal.sdr_id !== employeeId) return false;
    
    return true;
  });
};

// Formatar progresso da meta
export const formatProgressInfo = (currentValue: number) => {
  const currentRate = getCommissionRate(currentValue);
  const currentTier = getCommissionTier(currentValue);
  const progressPercentage = currentTier.maxValue ? 
    Math.min((currentValue / currentTier.maxValue) * 100, 100) : 100;
    
  let nextMilestone = null;
  let remainingToNext = 0;
  
  if (currentValue < 600000) {
    nextMilestone = 600000;
    remainingToNext = 600000 - currentValue;
  } else if (currentValue < 1200000) {
    nextMilestone = 1200000;
    remainingToNext = 1200000 - currentValue;
  }
  
  return {
    currentRate,
    currentTier,
    progressPercentage,
    nextMilestone,
    remainingToNext,
    hasAchievement: currentValue >= 600000
  };
};