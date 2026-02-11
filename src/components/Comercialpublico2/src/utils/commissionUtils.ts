// Utilitários para cálculo de comissões
import { formatCurrency } from './formatCurrency';
import { Department } from '../contexts/DepartmentContext';

export interface CommissionTier {
  rate: number;
  minValue: number;
  maxValue: number | null;
  label: string;
  color: string;
  bgColor: string;
}

// Regras de comissão para CLOSERS: taxas escalonadas baseadas no valor do contrato
export const COMMISSION_TIERS: CommissionTier[] = [
  {
    rate: 0.1,
    minValue: 0,
    maxValue: 1200000,
    label: 'Até R$ 1,2 mi',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    rate: 0.15,
    minValue: 1200000,
    maxValue: 2400000,
    label: 'R$ 1,2 mi - R$ 2,4 mi',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    rate: 0.2,
    minValue: 2400000,
    maxValue: null,
    label: 'Acima de R$ 2,4 mi',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  }
];

// Tiers específicas para Petrobras (baseadas no valor individual do contrato)
export const PETROBRAS_COMMISSION_TIERS: CommissionTier[] = [
  {
    rate: 2.8,
    minValue: 0,
    maxValue: 50000000,
    label: 'Até 50M',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    rate: 1.8,
    minValue: 50000000,
    maxValue: 100000000,
    label: '50M - 100M',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    rate: 1.3,
    minValue: 100000000,
    maxValue: null,
    label: 'Acima de 100M',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  }
];
// Determinar taxa de comissão baseada no valor global do contrato
export const getCommissionRate = (contractValue: number, department: Department = 'Comercial Público'): number => {
  if (department === 'Petrobras') {
    // Para Petrobras: taxa baseada no valor individual do contrato
    if (contractValue <= 50000000) return 2.8;
    if (contractValue <= 100000000) return 1.8;
    return 1.3;
  } else {
    // Para Comercial Público: taxas escalonadas baseadas no valor individual do contrato
    if (contractValue <= 1200000) return 0.1;
    if (contractValue <= 2400000) return 0.15;
    return 0.2;
  }
};

// Obter informações da tier de comissão atual
export const getCommissionTier = (contractValue: number, department: Department = 'Comercial Público'): CommissionTier => {
  const tiers = department === 'Petrobras' ? PETROBRAS_COMMISSION_TIERS : COMMISSION_TIERS;
  return tiers.find(tier => 
    contractValue >= tier.minValue && (tier.maxValue === null || contractValue <= tier.maxValue)
  ) || tiers[0];
};

// Calcular comissão efetiva para um contrato
export const calculateContractCommission = (contractValue: number, rate: number): number => {
  return (contractValue * rate) / 100;
};

// Calcular comissão de closer para um contrato (baseado no valor global)
export const calculateCloserCommission = (contractValue: number, hasPromotor: boolean = false, department: Department = 'Comercial Público'): number => {
  // Se tiver promotor, comissão fixa de 0,005%
  if (hasPromotor) {
    return (contractValue * 0.005) / 100;
  }
  // Sem promotor: usar taxa escalonada baseada no valor do contrato
  const rate = getCommissionRate(contractValue, department);
  return (contractValue * rate) / 100;
};

// Calcular comissões mensais de um funcionário
export const calculateMonthlyCommissions = (proposals: any[], employeeId: string, role: 'closer' | 'sdr', year?: number, department: Department = 'Comercial Público') => {
  const targetYear = year || new Date().getFullYear();
  const monthlyData: { [key: string]: { contracts: any[], totalValue: number, commission: number, commissionRate: number } } = {};
  
  // Inicializar todos os meses
  for (let month = 1; month <= 12; month++) {
    const monthKey = `${targetYear}-${month.toString().padStart(2, '0')}`;
    monthlyData[monthKey] = { contracts: [], totalValue: 0, commission: 0, commissionRate: 0 };
  }
  
  // Filtrar contratos fechados do funcionário
  const closedContracts = proposals.filter(proposal => {
    if (proposal.status !== 'Fechado' && proposal.status !== 'Contrato assinado') return false;

    // Excluir licitações que não geram comissão
    if (proposal.nao_gera_comissao === true) return false;

    // Verificar se o funcionário está envolvido no contrato
    if (role === 'closer' && proposal.closer_id !== employeeId) return false;
    if (role === 'sdr' && proposal.sdr_id !== employeeId) return false;

    // Filtrar pelo ano
    const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
    if (closingDate.getFullYear() !== targetYear) return false;

    // Filtrar pelo departamento da proposta
    if (proposal.department !== department) return false;

    return true;
  });
  
  // Agrupar contratos por mês primeiro
  const contractsByMonth: { [key: string]: any[] } = {};
  
  closedContracts.forEach(contract => {
    const closingDate = contract.closing_date ? new Date(contract.closing_date) : new Date(contract.created_at);
    const monthKey = `${targetYear}-${(closingDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!contractsByMonth[monthKey]) {
      contractsByMonth[monthKey] = [];
    }
    contractsByMonth[monthKey].push(contract);
  });
  
  // Calcular comissão mensal baseada no departamento
  Object.entries(contractsByMonth).forEach(([monthKey, contracts]) => {
    if (monthlyData[monthKey]) {
      if (department === 'Petrobras') {
        // Para Petrobras: calcular comissão por contrato individual
        let monthlyTotalValue = 0;
        let monthlyCommission = 0;
        let averageRate = 0;
        
        contracts.forEach(contract => {
          const contractValue = contract.nosso_lance || contract.total_value || 0;
          const contractRate = getCommissionRate(contractValue, department);
          const contractCommission = calculateContractCommission(contractValue, contractRate);
          
          monthlyTotalValue += contractValue;
          monthlyCommission += contractCommission;
        });
        
        // Calcular taxa média do mês (para exibição)
        averageRate = monthlyTotalValue > 0 ? (monthlyCommission / monthlyTotalValue) * 100 : 0;
        
        monthlyData[monthKey] = {
          contracts,
          totalValue: monthlyTotalValue,
          commission: monthlyCommission,
          commissionRate: averageRate
        };
      } else {
        // Para Comercial Público: usar taxas escalonadas por contrato
        let monthlyTotalValue = 0;
        let monthlyCommission = 0;
        let averageRate = 0;

        contracts.forEach(contract => {
          const contractValue = contract.nosso_lance || contract.total_value || 0;
          const hasPromotor = !!contract.promotor_id;
          const contractCommission = calculateCloserCommission(contractValue, hasPromotor, department);

          monthlyTotalValue += contractValue;
          monthlyCommission += contractCommission;
        });

        // Calcular taxa média do mês (para exibição)
        averageRate = monthlyTotalValue > 0 ? (monthlyCommission / monthlyTotalValue) * 100 : 0;

        monthlyData[monthKey] = {
          contracts,
          totalValue: monthlyTotalValue,
          commission: monthlyCommission,
          commissionRate: averageRate
        };
      }
    }
  });
  
  return monthlyData;
};

// Calcular valor total fechado pelo funcionário no mês atual
export const calculateCurrentMonthTotal = (proposals: any[], employeeId: string, role: 'closer' | 'sdr', department: Department = 'Comercial Público'): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return proposals
    .filter(proposal => {
      if (proposal.status !== 'Fechado' && proposal.status !== 'Contrato assinado') return false;
      // Excluir licitações que não geram comissão
      if (proposal.nao_gera_comissao === true) return false;
      if (role === 'closer' && proposal.closer_id !== employeeId) return false;
      if (role === 'sdr' && proposal.sdr_id !== employeeId) return false;
      // Filtrar pelo departamento da proposta
      if (proposal.department !== department) return false;

      const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
      return closingDate.getMonth() === currentMonth && closingDate.getFullYear() === currentYear;
    })
    .reduce((sum, proposal) => {
      // Usar nosso_lance se disponível, senão total_value
      const contractValue = proposal.nosso_lance || proposal.total_value || 0;
      return sum + contractValue;
    }, 0);
};

// Calcular contratos em aberto de um funcionário
export const getOpenContracts = (proposals: any[], employeeId: string, role: 'closer' | 'sdr', department: Department = 'Comercial Público') => {
  // Status válidos para contratos em aberto: Aguardando e Em andamento
  const validStatuses = ['Aguardando', 'Em andamento'];

  const openContracts = proposals.filter(proposal => {
    if (!validStatuses.includes(proposal.status)) return false;
    // Excluir licitações que não geram comissão
    if (proposal.nao_gera_comissao === true) return false;
    if (role === 'closer' && proposal.closer_id !== employeeId) return false;
    if (role === 'sdr' && proposal.sdr_id !== employeeId) return false;
    // Filtrar pelo departamento da proposta
    if (proposal.department !== department) return false;

    return true;
  });
  
  console.log('📋 Contratos em aberto:', {
    employeeId,
    role,
    openCount: openContracts.length,
    contracts: openContracts.map(p => ({
      client: p.client,
      status: p.status,
      closer_id: p.closer_id,
      sdr_id: p.sdr_id,
      total_value: p.total_value
    }))
  });
  
  return openContracts;
};

// Calcular comissão de orçamentista para um contrato (baseado no valor global)
export const calculateOrcamentistaCommission = (contractValue: number, hasPromotor: boolean = false): number => {
  // Se tiver promotor, comissão fixa de 0,005%
  if (hasPromotor) {
    return (contractValue * 0.005) / 100;
  }
  // Sem promotor: taxa fixa de 0,02%
  return (contractValue * 0.02) / 100;
};

// Calcular comissões mensais de um orçamentista
export const calculateOrcamentistaMonthlyCommissions = (proposals: any[], orcamentistaId: string, year?: number, department: Department = 'Comercial Público') => {
  const targetYear = year || new Date().getFullYear();
  const monthlyData: { [key: string]: { contracts: any[], totalValue: number, commission: number } } = {};

  // Inicializar todos os meses
  for (let month = 1; month <= 12; month++) {
    const monthKey = `${targetYear}-${month.toString().padStart(2, '0')}`;
    monthlyData[monthKey] = { contracts: [], totalValue: 0, commission: 0 };
  }

  // Filtrar contratos fechados do orçamentista
  const closedContracts = proposals.filter(proposal => {
    if (proposal.status !== 'Fechado' && proposal.status !== 'Contrato assinado') return false;

    // Excluir licitações que não geram comissão
    if (proposal.nao_gera_comissao === true) return false;

    // Verificar se o orçamentista está envolvido no contrato
    if (proposal.orcamentista_id !== orcamentistaId) return false;

    // Filtrar pelo ano
    const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
    if (closingDate.getFullYear() !== targetYear) return false;

    // Orçamentistas podem trabalhar em qualquer departamento, não filtrar por department

    return true;
  });

  // Agrupar contratos por mês
  const contractsByMonth: { [key: string]: any[] } = {};

  closedContracts.forEach(contract => {
    const closingDate = contract.closing_date ? new Date(contract.closing_date) : new Date(contract.created_at);
    const monthKey = `${targetYear}-${(closingDate.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!contractsByMonth[monthKey]) {
      contractsByMonth[monthKey] = [];
    }
    contractsByMonth[monthKey].push(contract);
  });

  // Calcular comissão mensal
  Object.entries(contractsByMonth).forEach(([monthKey, contracts]) => {
    if (monthlyData[monthKey]) {
      let monthlyTotalValue = 0;
      let monthlyCommission = 0;

      contracts.forEach(contract => {
        const contractValue = contract.nosso_lance || contract.total_value || 0;
        const hasPromotor = !!contract.promotor_id;
        const commission = calculateOrcamentistaCommission(contractValue, hasPromotor);

        monthlyTotalValue += contractValue;
        monthlyCommission += commission;
      });

      monthlyData[monthKey] = {
        contracts,
        totalValue: monthlyTotalValue,
        commission: monthlyCommission
      };
    }
  });

  return monthlyData;
};

// Calcular valor total fechado pelo orçamentista no mês atual
export const calculateOrcamentistaCurrentMonthTotal = (proposals: any[], orcamentistaId: string, department: Department = 'Comercial Público'): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return proposals
    .filter(proposal => {
      if (proposal.status !== 'Fechado' && proposal.status !== 'Contrato assinado') return false;
      // Excluir licitações que não geram comissão
      if (proposal.nao_gera_comissao === true) return false;
      if (proposal.orcamentista_id !== orcamentistaId) return false;
      // Orçamentistas podem trabalhar em qualquer departamento, não filtrar por department

      const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
      return closingDate.getMonth() === currentMonth && closingDate.getFullYear() === currentYear;
    })
    .reduce((sum, proposal) => {
      const contractValue = proposal.nosso_lance || proposal.total_value || 0;
      return sum + contractValue;
    }, 0);
};

// Calcular comissão total do orçamentista no mês atual
export const calculateOrcamentistaCurrentMonthCommission = (proposals: any[], orcamentistaId: string, department: Department = 'Comercial Público'): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return proposals
    .filter(proposal => {
      if (proposal.status !== 'Fechado' && proposal.status !== 'Contrato assinado') return false;
      // Excluir licitações que não geram comissão
      if (proposal.nao_gera_comissao === true) return false;
      if (proposal.orcamentista_id !== orcamentistaId) return false;
      // Orçamentistas podem trabalhar em qualquer departamento, não filtrar por department

      const closingDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
      return closingDate.getMonth() === currentMonth && closingDate.getFullYear() === currentYear;
    })
    .reduce((sum, proposal) => {
      const contractValue = proposal.nosso_lance || proposal.total_value || 0;
      const hasPromotor = !!proposal.promotor_id;
      const commission = calculateOrcamentistaCommission(contractValue, hasPromotor);
      return sum + commission;
    }, 0);
};

// Formatar progresso da meta
export const formatProgressInfo = (currentValue: number, department: Department = 'Comercial Público') => {
  if (department === 'Petrobras') {
    // Para Petrobras não há conceito de meta progressiva
    return {
      currentRate: 0, // Não aplicável
      currentTier: { 
        rate: 0, 
        minValue: 0, 
        maxValue: null, 
        label: 'Petrobras', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100' 
      },
      progressPercentage: 0,
      nextMilestone: null,
      remainingToNext: 0,
      hasAchievement: false,
      isPetrobras: true
    };
  }
  
  const currentRate = getCommissionRate(currentValue, department);
  const currentTier = getCommissionTier(currentValue, department);
  const progressPercentage = currentTier.maxValue ? 
    Math.min((currentValue / currentTier.maxValue) * 100, 100) : 100;
    
  let nextMilestone = null;
  let remainingToNext = 0;
  
  if (currentValue < 1200000) {
    nextMilestone = 1200000;
    remainingToNext = 1200000 - currentValue;
  } else if (currentValue < 2400000) {
    nextMilestone = 2400000;
    remainingToNext = 2400000 - currentValue;
  }
  
  return {
    currentRate,
    currentTier,
    progressPercentage,
    nextMilestone,
    remainingToNext,
    hasAchievement: currentValue >= 1200000,
    isPetrobras: false
  };
};