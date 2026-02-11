import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { KPICard } from './KPICard';
import { KPIModal } from './KPIModal';
import { ROIModal } from './ROIModal';
import { supabase } from '../../lib/supabase';
import { useYear } from '../../contexts/YearContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateMonthsBetween } from '../../utils/contractDuration';

interface Contract {
  id: string;
  client_name: string;
  monthly_value: number;
  start_date: string;
  end_date: string;
  margem_percentual: number;
}

interface Proposal {
  id: string;
  created_at: string;
  status: string;
  nosso_lance?: number;
  valor_estimado?: number;
}

interface OperationalCost {
  cost_name: string;
  year: number;
  month: number;
  value: number;
}

export const CommercialKPIs: React.FC = () => {
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedDepartment, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [contractsData, proposalsData, costsData] = await Promise.all([
        supabase
          .from('contracts')
          .select('*')
          .eq('department', selectedDepartment),
        supabase
          .from('proposals')
          .select('*')
          .eq('department', selectedDepartment),
        supabase
          .from('operational_costs')
          .select('*')
          .eq('department', selectedDepartment)
      ]);

      if (contractsData.data) setContracts(contractsData.data);
      if (proposalsData.data) setProposals(proposalsData.data);
      if (costsData.data) setOperationalCosts(costsData.data);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTicketMedio = () => {
    // Usar TODOS os contratos do histórico (sem filtro de ano)
    const allContracts = contracts;

    if (allContracts.length === 0) {
      return {
        value: 'R$ 0,00',
        count: 0,
        total: 0,
        chartData: Array(12).fill(0),
        monthlyEvolution: []
      };
    }

    const sumMonthlyValues = allContracts.reduce((sum, c) => sum + Number(c.monthly_value), 0);
    const ticketMedio = sumMonthlyValues / allContracts.length;

    const contractsByMonth: { [key: number]: Contract[] } = {};
    allContracts.forEach(c => {
      const month = new Date(c.start_date).getMonth();
      if (!contractsByMonth[month]) {
        contractsByMonth[month] = [];
      }
      contractsByMonth[month].push(c);
    });

    let accumulatedContracts: Contract[] = [];
    const monthlyEvolution: { month: string; value: number; contractCount: number }[] = [];
    const chartData: number[] = [];

    for (let month = 0; month < 12; month++) {
      if (contractsByMonth[month]) {
        accumulatedContracts = [...accumulatedContracts, ...contractsByMonth[month]];
      }

      if (accumulatedContracts.length > 0) {
        const sumValues = accumulatedContracts.reduce((sum, c) => sum + Number(c.monthly_value), 0);
        const avgValue = sumValues / accumulatedContracts.length;
        monthlyEvolution.push({
          month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month],
          value: avgValue,
          contractCount: accumulatedContracts.length
        });
        chartData.push(avgValue);
      } else {
        chartData.push(0);
      }
    }

    return {
      value: formatCurrency(ticketMedio),
      count: allContracts.length,
      total: sumMonthlyValues,
      chartData,
      monthlyEvolution
    };
  };

  const calculateCAC = () => {
    const currentDate = new Date();
    const last12MonthsCosts: number[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthCosts = operationalCosts
        .filter(c => c.year === year && c.month === month)
        .reduce((sum, c) => sum + Number(c.value), 0);

      last12MonthsCosts.unshift(monthCosts);
    }

    const totalCosts = last12MonthsCosts.reduce((sum, c) => sum + c, 0);

    const last12MonthsContracts = contracts.filter(c => {
      const contractDate = new Date(c.start_date);
      const monthsAgo = Math.floor((currentDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return monthsAgo < 12;
    });

    const contractCount = last12MonthsContracts.length;
    const cac = contractCount > 0 ? totalCosts / contractCount : 0;

    const monthlyCAC = last12MonthsCosts.map((cost, index) => {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - index), 1);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const monthContracts = contracts.filter(c => {
        const contractDate = new Date(c.start_date);
        return contractDate >= startDate && contractDate <= endDate;
      }).length;

      return monthContracts > 0 ? cost / monthContracts : 0;
    });

    return {
      value: formatCurrency(cac),
      totalCosts,
      contractCount,
      chartData: monthlyCAC
    };
  };

  const calculateROI = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const activeContracts = contracts.filter(c => {
      const endDate = new Date(c.end_date);
      return endDate > currentDate;
    });

    const totalMargin = activeContracts.reduce((sum, contract) => {
      const endDate = new Date(contract.end_date);

      const monthsRemaining = calculateMonthsBetween(currentDate, endDate);

      const faturamentoProjetado = contract.monthly_value * monthsRemaining;
      const margemProjetada = faturamentoProjetado * ((contract.margem_percentual || 10) / 100);
      return sum + margemProjetada;
    }, 0);

    const last12MonthsCosts = operationalCosts
      .filter(c => {
        const costDate = new Date(c.year, c.month - 1);
        const monthsAgo = Math.floor((currentDate.getTime() - costDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        return monthsAgo < 12;
      })
      .reduce((sum, c) => sum + Number(c.value), 0);

    const roi = last12MonthsCosts > 0 ? (totalMargin / last12MonthsCosts) * 100 : 0;

    const monthlyROI = Array(12).fill(0).map((_, index) => {
      const date = new Date(currentYear, currentMonth - (11 - index), 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthCosts = operationalCosts
        .filter(c => c.year === year && c.month === month)
        .reduce((sum, c) => sum + Number(c.value), 0);

      const monthDate = new Date(year, month - 1, 1);
      const activeInMonth = contracts.filter(c => {
        const endDate = new Date(c.end_date);
        return endDate > monthDate;
      });

      const monthMargin = activeInMonth.reduce((sum, c) => {
        const endDate = new Date(c.end_date);
        const monthsFromThen = calculateMonthsBetween(monthDate, endDate);
        const faturamentoProjetado = c.monthly_value * monthsFromThen;
        const margemProjetada = faturamentoProjetado * ((c.margem_percentual || 10) / 100);
        return sum + margemProjetada;
      }, 0);
      return monthCosts > 0 ? (monthMargin / monthCosts) * 100 : 0;
    });

    return {
      value: `${roi.toFixed(1)}%`,
      margin: totalMargin,
      costs: last12MonthsCosts,
      contracts: activeContracts,
      chartData: monthlyROI
    };
  };

  const calculateLTVoverCAC = () => {
    const currentDate = new Date();
    const closedContracts = contracts.filter(c => c.start_date);

    let ltv = 0;
    closedContracts.forEach(contract => {
      const startDate = new Date(contract.start_date);
      const endDate = new Date(contract.end_date);

      if (endDate > currentDate) {
        const monthlyRevenue = Number(contract.monthly_value);
        const startMonth = startDate > currentDate ? startDate : currentDate;
        const monthsRemaining = calculateMonthsBetween(startMonth, endDate);
        ltv += monthlyRevenue * monthsRemaining;
      }
    });

    const last12MonthsCosts = operationalCosts
      .filter(c => {
        const costDate = new Date(c.year, c.month - 1);
        const monthsAgo = Math.floor((currentDate.getTime() - costDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        return monthsAgo < 12;
      })
      .reduce((sum, c) => sum + Number(c.value), 0);

    const last12MonthsContracts = contracts.filter(c => {
      const contractDate = new Date(c.start_date);
      const monthsAgo = Math.floor((currentDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return monthsAgo < 12;
    }).length;

    const cac = last12MonthsContracts > 0 ? last12MonthsCosts / last12MonthsContracts : 0;
    const ratio = cac > 0 ? ltv / cac : 0;

    const monthlyRatios = Array(12).fill(0).map((_, index) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - index), 1);
      return ratio;
    });

    return {
      value: ratio.toFixed(2),
      ltv,
      cac,
      chartData: monthlyRatios
    };
  };

  const calculateLicitacoesEvolution = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthProposals = proposals.filter(p => {
      const date = new Date(p.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthProposals = proposals.filter(p => {
      const date = new Date(p.created_at);
      return date.getMonth() === previousMonthDate.getMonth() && date.getFullYear() === previousMonthDate.getFullYear();
    }).length;

    const growth = previousMonthProposals > 0
      ? ((currentMonthProposals - previousMonthProposals) / previousMonthProposals) * 100
      : 0;

    const monthlyData = Array(12).fill(0).map((_, index) => {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - index), 1);
      return proposals.filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === targetDate.getMonth() && date.getFullYear() === targetDate.getFullYear();
      }).length;
    });

    return {
      value: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
      current: currentMonthProposals,
      previous: previousMonthProposals,
      chartData: monthlyData
    };
  };

  const calculateSalesGrowth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthSales = contracts.filter(c => {
      const date = new Date(c.start_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, c) => {
      const startDate = new Date(c.start_date);
      const endDate = new Date(c.end_date);
      const durationMonths = calculateMonthsBetween(startDate, endDate);
      return sum + (Number(c.monthly_value) * durationMonths);
    }, 0);

    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthSales = contracts.filter(c => {
      const date = new Date(c.start_date);
      return date.getMonth() === previousMonthDate.getMonth() && date.getFullYear() === previousMonthDate.getFullYear();
    }).reduce((sum, c) => {
      const startDate = new Date(c.start_date);
      const endDate = new Date(c.end_date);
      const durationMonths = calculateMonthsBetween(startDate, endDate);
      return sum + (Number(c.monthly_value) * durationMonths);
    }, 0);

    const growth = previousMonthSales > 0
      ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
      : 0;

    const monthlyData = Array(12).fill(0).map((_, index) => {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - index), 1);
      return contracts.filter(c => {
        const date = new Date(c.start_date);
        return date.getMonth() === targetDate.getMonth() && date.getFullYear() === targetDate.getFullYear();
      }).reduce((sum, c) => {
        const startDate = new Date(c.start_date);
        const endDate = new Date(c.end_date);
        const durationMonths = calculateMonthsBetween(startDate, endDate);
        return sum + (Number(c.monthly_value) * durationMonths);
      }, 0);
    });

    return {
      value: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
      current: currentMonthSales,
      previous: previousMonthSales,
      chartData: monthlyData
    };
  };

  const calculatePipelineCoverage = () => {
    const openProposals = proposals.filter(p =>
      p.status !== 'Contrato assinado' &&
      p.status !== 'Desclassificada' &&
      p.status !== 'Perdemos'
    );

    const pipelineValue = openProposals.reduce((sum, p) => {
      return sum + (p.nosso_lance || p.valor_estimado || 0);
    }, 0);

    const yearContracts = contracts.filter(c => {
      const year = new Date(c.start_date).getFullYear();
      return year === selectedYear;
    });

    const closedValue = yearContracts.reduce((sum, c) => {
      const startDate = new Date(c.start_date);
      const endDate = new Date(c.end_date);
      const durationMonths = calculateMonthsBetween(startDate, endDate);
      return sum + (Number(c.monthly_value) * durationMonths);
    }, 0);

    const annualGoal = 3600000;
    const remaining = annualGoal - closedValue;
    const coverage = remaining > 0 ? (pipelineValue / remaining) * 100 : 100;

    const monthlyData = Array(12).fill(coverage);

    return {
      value: `${coverage.toFixed(1)}%`,
      pipelineValue,
      remaining,
      proposalCount: openProposals.length,
      chartData: monthlyData
    };
  };

  const calculateDaysSinceLastWon = () => {
    const currentDate = new Date();

    const wonContracts = contracts
      .filter(c => c.start_date)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

    if (wonContracts.length === 0) {
      return {
        value: '0',
        days: 0,
        lastContractDate: null,
        chartData: Array(12).fill(0)
      };
    }

    const lastContract = wonContracts[0];
    const lastContractDate = new Date(lastContract.start_date);
    const daysSince = Math.floor((currentDate.getTime() - lastContractDate.getTime()) / (1000 * 60 * 60 * 24));

    const monthlyData = Array(12).fill(0).map((_, index) => {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - index), 1);
      const monthEndDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      const contractsInMonth = contracts.filter(c => {
        const date = new Date(c.start_date);
        return date.getMonth() === targetDate.getMonth() && date.getFullYear() === targetDate.getFullYear();
      }).length;

      return contractsInMonth;
    });

    return {
      value: daysSince.toString(),
      days: daysSince,
      lastContractDate: lastContractDate.toLocaleDateString('pt-BR'),
      chartData: monthlyData
    };
  };

  const ticketMedio = calculateTicketMedio();
  const cac = calculateCAC();
  const roi = calculateROI();
  const ltvCac = calculateLTVoverCAC();
  const licitacoes = calculateLicitacoesEvolution();
  const salesGrowth = calculateSalesGrowth();
  const pipeline = calculatePipelineCoverage();
  const daysSinceLastWon = calculateDaysSinceLastWon();

  const getMonthName = (index: number) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[index];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900">KPIs Comerciais</h2>
            <p className="text-sm text-gray-600">Indicadores de desempenho do departamento</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <KPICard
            title="Ticket Médio"
            value={ticketMedio.value}
            subtitle={`Baseado em ${ticketMedio.count} contratos acumulados`}
            baseInfo={[
              `Faturamento acumulado: ${formatCurrency(ticketMedio.total)}`,
              `Contratos fechados: ${ticketMedio.count} contratos`,
              `Período: Todo o histórico`
            ]}
            chartData={ticketMedio.chartData}
            onInfoClick={() => setSelectedKPI('ticket')}
          />

          <KPICard
            title="CAC"
            value={cac.value}
            subtitle="Custo de Aquisição de Cliente"
            baseInfo={[
              `Custos últimos 12 meses: ${formatCurrency(cac.totalCosts)}`,
              `Contratos fechados: ${cac.contractCount}`,
              `Período: Últimos 12 meses`
            ]}
            chartData={cac.chartData}
            onInfoClick={() => setSelectedKPI('cac')}
          />

          <KPICard
            title="ROI"
            value={roi.value}
            subtitle="Retorno sobre Investimento"
            baseInfo={[
              `Margem total: ${formatCurrency(roi.margin)}`,
              `Custos: ${formatCurrency(roi.costs)}`,
              `Contratos: ${roi.contracts.length}`
            ]}
            chartData={roi.chartData}
            onInfoClick={() => setSelectedKPI('roi')}
          />

          <KPICard
            title="LTV / CAC"
            value={ltvCac.value}
            subtitle="Relação Lifetime Value sobre CAC"
            baseInfo={[
              `LTV projetado: ${formatCurrency(ltvCac.ltv)}`,
              `CAC: ${formatCurrency(ltvCac.cac)}`,
              `Ideal: > 3.0`
            ]}
            chartData={ltvCac.chartData}
            onInfoClick={() => setSelectedKPI('ltvcac')}
          />

          <KPICard
            title="Evolução das Licitações"
            value={licitacoes.value}
            subtitle="Comparação com mês anterior"
            baseInfo={[
              `Mês atual: ${licitacoes.current} licitações`,
              `Mês anterior: ${licitacoes.previous} licitações`,
              `Variação: ${licitacoes.value}`
            ]}
            chartData={licitacoes.chartData}
            onInfoClick={() => setSelectedKPI('licitacoes')}
            trend={licitacoes.current > licitacoes.previous ? 'up' : licitacoes.current < licitacoes.previous ? 'down' : 'neutral'}
          />

          <KPICard
            title="Crescimento de Vendas"
            value={salesGrowth.value}
            subtitle="Comparação com mês anterior"
            baseInfo={[
              `Vendas mês atual: ${formatCurrency(salesGrowth.current)}`,
              `Vendas mês anterior: ${formatCurrency(salesGrowth.previous)}`,
              `Variação: ${salesGrowth.value}`
            ]}
            chartData={salesGrowth.chartData}
            onInfoClick={() => setSelectedKPI('sales')}
            trend={salesGrowth.current > salesGrowth.previous ? 'up' : salesGrowth.current < salesGrowth.previous ? 'down' : 'neutral'}
          />

          <KPICard
            title="Cobertura do Pipeline"
            value={pipeline.value}
            subtitle="Propostas abertas vs. meta restante"
            baseInfo={[
              `Valor em pipeline: ${formatCurrency(pipeline.pipelineValue)}`,
              `Falta para meta: ${formatCurrency(pipeline.remaining)}`,
              `Propostas abertas: ${pipeline.proposalCount}`
            ]}
            chartData={pipeline.chartData}
            onInfoClick={() => setSelectedKPI('pipeline')}
          />

          <KPICard
            title="Dias Desde Último Contrato"
            value={daysSinceLastWon.value}
            subtitle="Dias desde o último contrato vencido"
            baseInfo={[
              `Último contrato: ${daysSinceLastWon.lastContractDate || 'Nenhum contrato'}`,
              `Dias desde então: ${daysSinceLastWon.days} dias`,
              `Status: ${daysSinceLastWon.days <= 30 ? 'Recente' : daysSinceLastWon.days <= 60 ? 'Atenção' : 'Crítico'}`
            ]}
            chartData={daysSinceLastWon.chartData}
            onInfoClick={() => setSelectedKPI('daysSinceLastWon')}
            trend={daysSinceLastWon.days <= 30 ? 'up' : daysSinceLastWon.days <= 60 ? 'neutral' : 'down'}
          />
        </div>
      )}

      {selectedKPI === 'ticket' && (
        <KPIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          title="Ticket Médio"
          description="Valor médio mensal dos contratos fechados (evolução acumulada)"
          formula="Ticket Médio = (Σ Valor Mensal de todos os contratos) / Número de Contratos"
          currentValue={ticketMedio.value}
          chartData={ticketMedio.chartData.map((value, index) => {
            const monthData = ticketMedio.monthlyEvolution.find(m =>
              m.month === ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index]
            );
            return {
              month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index],
              value: value,
              contractCount: monthData?.contractCount
            };
          })}
          insights={[
            `Total de ${ticketMedio.count} contratos fechados em todo o histórico`,
            `Soma dos valores mensais: ${formatCurrency(ticketMedio.total)}`,
            `Ticket médio atual: ${ticketMedio.value}`,
            'O gráfico mostra a evolução acumulada do ticket médio a cada novo contrato fechado',
            ticketMedio.count > 0 ? 'Cada novo contrato impacta a média geral' : 'Nenhum contrato fechado no histórico'
          ]}
        />
      )}

      {selectedKPI === 'cac' && (
        <KPIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          title="CAC - Custo de Aquisição de Cliente"
          description="Quanto custa em média para adquirir um novo cliente"
          formula="CAC = Custos Operacionais (12 meses) / Número de Contratos Fechados"
          currentValue={cac.value}
          chartData={cac.chartData.map((value, index) => ({
            month: getMonthName(index),
            value
          }))}
          insights={[
            `Custos totais dos últimos 12 meses: ${formatCurrency(cac.totalCosts)}`,
            `Total de ${cac.contractCount} contratos fechados`,
            'CAC ideal varia por setor, mas deve ser recuperado em até 12 meses',
            'Compare com o LTV para avaliar a sustentabilidade do negócio'
          ]}
        />
      )}

      {selectedKPI === 'roi' && (
        <ROIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          contracts={roi.contracts}
          operationalCosts={roi.costs}
          onRefresh={loadData}
        />
      )}

      {selectedKPI === 'ltvcac' && (
        <KPIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          title="LTV / CAC"
          description="Relação entre o valor vitalício do cliente e o custo de aquisição"
          formula="LTV/CAC = Lifetime Value Projetado / Custo de Aquisição de Cliente"
          currentValue={ltvCac.value}
          chartData={ltvCac.chartData.map((value, index) => ({
            month: getMonthName(index),
            value
          }))}
          insights={[
            `LTV projetado: ${formatCurrency(ltvCac.ltv)}`,
            `CAC: ${formatCurrency(ltvCac.cac)}`,
            'Relação ideal: 3:1 ou superior',
            'Valores abaixo de 1:1 indicam insustentabilidade',
            'Considera faturamento restante dos contratos ativos'
          ]}
        />
      )}

      {selectedKPI === 'licitacoes' && (
        <KPIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          title="Evolução das Licitações"
          description="Variação percentual na quantidade de licitações participadas"
          formula="Evolução = (Licitações Mês Atual - Mês Anterior) / Mês Anterior × 100"
          currentValue={licitacoes.value}
          chartData={licitacoes.chartData.map((value, index) => ({
            month: getMonthName(index),
            value
          }))}
          insights={[
            `Licitações no mês atual: ${licitacoes.current}`,
            `Licitações no mês anterior: ${licitacoes.previous}`,
            licitacoes.current > licitacoes.previous ? 'Crescimento positivo na participação' : 'Redução na participação em licitações',
            'Meta: 12 licitações por mês'
          ]}
        />
      )}

      {selectedKPI === 'sales' && (
        <KPIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          title="Crescimento de Vendas"
          description="Variação percentual no valor das vendas em relação ao mês anterior"
          formula="Crescimento = (Vendas Mês Atual - Mês Anterior) / Mês Anterior × 100"
          currentValue={salesGrowth.value}
          chartData={salesGrowth.chartData.map((value, index) => ({
            month: getMonthName(index),
            value
          }))}
          insights={[
            `Vendas no mês atual: ${formatCurrency(salesGrowth.current)}`,
            `Vendas no mês anterior: ${formatCurrency(salesGrowth.previous)}`,
            salesGrowth.current > salesGrowth.previous ? 'Crescimento positivo nas vendas' : 'Redução nas vendas',
            'Importante monitorar sazonalidade e tendências'
          ]}
        />
      )}

      {selectedKPI === 'pipeline' && (
        <KPIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          title="Cobertura do Pipeline"
          description="Quanto o pipeline atual cobre do que falta para atingir a meta anual"
          formula="Cobertura = Valor em Pipeline / (Meta Anual - Vendas Realizadas) × 100"
          currentValue={pipeline.value}
          chartData={pipeline.chartData.map((value, index) => ({
            month: getMonthName(index),
            value
          }))}
          insights={[
            `Valor total em pipeline: ${formatCurrency(pipeline.pipelineValue)}`,
            `Falta para a meta anual: ${formatCurrency(pipeline.remaining)}`,
            `Propostas abertas: ${pipeline.proposalCount}`,
            'Cobertura ideal: > 200% (para compensar taxa de conversão)',
            pipeline.pipelineValue > pipeline.remaining ? 'Pipeline saudável' : 'Necessário aumentar prospecção'
          ]}
        />
      )}

      {selectedKPI === 'daysSinceLastWon' && (
        <KPIModal
          isOpen={true}
          onClose={() => setSelectedKPI(null)}
          title="Dias Desde Último Contrato"
          description="Número de dias desde o último contrato vencido, indicando a frequência de novos contratos"
          formula="Dias = Data Atual - Data do Último Contrato"
          currentValue={`${daysSinceLastWon.days} dias`}
          chartData={daysSinceLastWon.chartData.map((value, index) => ({
            month: getMonthName(index),
            value
          }))}
          insights={[
            `Último contrato em: ${daysSinceLastWon.lastContractDate || 'Nenhum contrato'}`,
            `Dias desde então: ${daysSinceLastWon.days} dias`,
            daysSinceLastWon.days <= 30 ? '✓ Status: Recente - Bom ritmo de vendas' :
            daysSinceLastWon.days <= 60 ? '⚠ Status: Atenção - Ritmo moderado de vendas' :
            '✗ Status: Crítico - Muitos dias sem novos contratos',
            'O gráfico mostra a quantidade de contratos fechados nos últimos 12 meses',
            'Ideal: Manter um fluxo constante de novos contratos'
          ]}
        />
      )}
    </div>
  );
};
