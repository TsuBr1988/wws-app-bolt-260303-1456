import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatCurrency';
import { DollarSign, Target, BarChart3, TrendingUp, Info, X, FileText, Users, Calendar } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';
import { displayDate } from '../../utils/dateUtils';
import MiniBar from './MiniBar';
import { getRolling12MonthsCosts, clearCostsCache } from '../../services/costsService';
import { configurationService } from '../../services/configurationService';
import { SalesGrowthKPI } from '../KPIs/SalesGrowthKPI';
import { ProposalEvolutionKPI } from '../KPIs/ProposalEvolutionKPI';
import { LTVKpi } from '../KPIs/LTVKpi';
import { PipelineCoverageKPI } from '../KPIs/PipelineCoverageKPI';
import { SalesConversionKPI } from '../KPIs/SalesConversionKPI';
import { ContractsNeededKPI } from '../KPIs/ContractsNeededKPI';
import { SalesCycleTimeKPI } from '../KPIs/SalesCycleTimeKPI';
import { LastProposalAgeKPI } from '../KPIs/LastProposalAgeKPI';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Function to calculate KPIs monthly following the cumulative snapshot rule
const calculateMonthlyKPIs = async (proposals: any[]): Promise<MonthlyKPIData[]> => {
  const results: MonthlyKPIData[] = [];
  const currentDate = new Date();
  
  // Generate last 12 months (M-11 to M)
  for (let i = 11; i >= 0; i--) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0); // Last day of the month
    const monthLabel = monthEnd.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    // 1. CUMULATIVE SET of contracts closed until end of month M
    const contractsClosedUntilM = proposals.filter(proposal => {
      if (proposal.status !== 'Fechado') return false;
      
      const closeDate = proposal.closing_date ? 
        new Date(proposal.closing_date) : 
        new Date(proposal.created_at);
      
      return closeDate <= monthEnd;
    });
    
    // 2. Calculate CUMULATIVE revenue (for Average Ticket)
    const faturamentoAcumulado = contractsClosedUntilM.reduce(
      (sum, contract) => sum + (contract.monthly_value || 0), 0
    );
    
    // 3. Calculate PROJECTED revenue (for ROI and LTV/CAC)
    const faturamentoProjetado = contractsClosedUntilM.reduce((sum, contract) => {
      const closeDate = contract.closing_date ? 
        new Date(contract.closing_date) : 
        new Date(contract.created_at);
      
      // Calculate complete months between closing_date and monthEnd
      const yearsDiff = monthEnd.getFullYear() - closeDate.getFullYear();
      const monthsDiff = monthEnd.getMonth() - closeDate.getMonth();
      const mesesDecorridos = yearsDiff * 12 + monthsDiff;
      
      // If hasn't completed 12 months yet, calculate remaining revenue
      if (mesesDecorridos < 12) {
        const mesesRestantes = 12 - mesesDecorridos;
        return sum + ((contract.monthly_value || 0) * mesesRestantes);
      }
      
      // If 12 months or more have passed, don't count anymore
      return sum;
    }, 0);
    
    // 5. Calculate unique clients in projected revenue (only those still in 12-month window)
    const clientesUnicosNoFaturamentoProjetado = new Set(
      contractsClosedUntilM.filter(contract => {
        const closeDate = contract.closing_date ? 
          new Date(contract.closing_date) : 
          new Date(contract.created_at);
        
        const yearsDiff = monthEnd.getFullYear() - closeDate.getFullYear();
        const monthsDiff = monthEnd.getMonth() - closeDate.getMonth();
        const mesesDecorridos = yearsDiff * 12 + monthsDiff;
        
        // Include only contracts still in 12-month window
        return mesesDecorridos < 12;
      }).map(contract => contract.client)
    ).size;
    
    const contratosAcumulados = contractsClosedUntilM.length;
    
    // Unique clients (based on client name - can be improved with client_id)
    const clientesUnicos = new Set(contractsClosedUntilM.map(c => c.client));
    const clientesUnicosAcumulados = clientesUnicos.size;
    
    // 6. 12-MONTH ROLLING COSTS ending in M (dinâmicos)
    const { total: custos12Meses } = await getRolling12MonthsCosts(monthEnd);
    
    // 7. Calculate KPIs using specified formulas
    const ticketMedio = contratosAcumulados > 0 ? 
      faturamentoAcumulado / contratosAcumulados : null;
    
    const cac = clientesUnicosAcumulados > 0 ? 
      custos12Meses / clientesUnicosAcumulados : null;
    
    // ROI: use PROJECTED revenue with 20% margin
    const roi = custos12Meses > 0 ? 
      (faturamentoProjetado * 0.20) / custos12Meses : null;
    
    // LTV/CAC: use PROJECTED revenue divided by unique clients in projection, then divided by CAC
    const ltvMedio = clientesUnicosNoFaturamentoProjetado > 0 ? 
      faturamentoProjetado / clientesUnicosNoFaturamentoProjetado : null;
    
    const ltvCac = ltvMedio && cac && cac > 0 ? 
      ltvMedio / cac : null;
    
    results.push({
      monthEnd,
      monthLabel,
      faturamentoAcumulado, // For Average Ticket
      faturamentoProjetado, // For ROI and LTV/CAC
      clientesUnicosNoFaturamentoProjetado, // For average LTV
      contratosAcumulados,
      clientesUnicosAcumulados,
      custos12Meses,
      ticketMedio,
      cac,
      roi,
      ltvCac,
      ltvMedio // Add for display in details
    });
  }
  
  return results;
};

interface DetailBreakdownData {
  title: string;
  type: 'revenue' | 'contracts' | 'costs' | 'clients' | 'projection';
  data: any;
}

interface DetailBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  type: 'revenue' | 'contracts' | 'costs' | 'clients' | 'projection';
}

const DetailBreakdownModal: React.FC<DetailBreakdownModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  data, 
  type 
}) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'revenue':
      case 'contracts':
        return (
          <div className="space-y-3">
            {data.contracts?.map((contract: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{contract.client}</span>
                  <span className="font-bold text-green-600">{formatCurrency(contract.monthly_value)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Fechado em: {displayDate(contract.closing_date || contract.created_at)}
                </div>
              </div>
            ))}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-900">Total:</span>
                <span className="font-bold text-blue-600">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        );
      
      case 'clients':
        return (
          <div className="space-y-3">
            {data.clients?.map((client: string, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-900">{client}</span>
              </div>
            ))}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-900">Total de clientes únicos:</span>
                <span className="font-bold text-blue-600">{data.count}</span>
              </div>
            </div>
          </div>
        );
      
      case 'costs':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">Metodologia de Custos</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Base anual:</strong> R$ 196.017,31</p>
                <p><strong>Composição:</strong> Custos operacionais totais</p>
                <p><strong>Distribuição:</strong> Janela móvel de 12 meses</p>
                <p><strong>Atualização:</strong> Mensal</p>
              </div>
            </div>
          </div>
        );
      
      case 'projection':
        return (
          <div className="space-y-3">
            {data.contracts?.map((contract: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{contract.client}</span>
                  <span className="font-bold text-purple-600">{formatCurrency(contract.remaining_value)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <div>Fechado em: {displayDate(contract.closing_date || contract.created_at)}</div>
                  <div>Meses restantes: {contract.remaining_months}/12</div>
                  <div>Valor mensal: {formatCurrency(contract.monthly_value)}</div>
                </div>
              </div>
            ))}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-900">Faturamento projetado total:</span>
                <span className="font-bold text-purple-600">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return <p>Dados não disponíveis</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

interface KPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: 'ticket' | 'cac' | 'roi' | 'ltvcac';
}

interface MonthlyKPIData {
  monthEnd: Date;
  monthLabel: string;
  // Dados acumulativos até o mês
  faturamentoAcumulado: number;
  faturamentoProjetado: number;
  clientesUnicosNoFaturamentoProjetado: number;
  contratosAcumulados: number;
  clientesUnicosAcumulados: number;
  // Custos 12 meses móveis terminando no mês
  custos12Meses: number;
  // KPIs calculados
  ticketMedio: number | null;
  cac: number | null;
  roi: number | null;
  ltvCac: number | null;
  ltvMedio: number | null;
}

// Função otimizada para calcular KPIs em paralelo
const calculateMonthlyKPIsFast = async (proposals: any[]): Promise<MonthlyKPIData[]> => {
  const currentDate = new Date();
  const monthEnds = Array.from({ length: 12 }, (_, idx) =>
    new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - idx) + 1, 0)
  );

  // Pre-calcular dados por mês (sem custos)
  const preData = monthEnds.map(monthEnd => {
    const contractsClosedUntilM = proposals.filter(proposal => {
      if (proposal.status !== 'Fechado') return false;
      const closeDate = proposal.closing_date ? 
        new Date(proposal.closing_date) : 
        new Date(proposal.created_at);
      return closeDate <= monthEnd;
    });
    
    const faturamentoAcumulado = contractsClosedUntilM.reduce(
      (sum, contract) => sum + (contract.monthly_value || 0), 0
    );
    
    const faturamentoProjetado = contractsClosedUntilM.reduce((sum, contract) => {
      const closeDate = contract.closing_date ? 
        new Date(contract.closing_date) : 
        new Date(contract.created_at);
      
      const yearsDiff = monthEnd.getFullYear() - closeDate.getFullYear();
      const monthsDiff = monthEnd.getMonth() - closeDate.getMonth();
      const mesesDecorridos = yearsDiff * 12 + monthsDiff;
      
      if (mesesDecorridos < 12) {
        const mesesRestantes = 12 - mesesDecorridos;
        return sum + ((contract.monthly_value || 0) * mesesRestantes);
      }
      
      return sum;
    }, 0);
    
    const clientesUnicosAcumulados = new Set(contractsClosedUntilM.map(c => c.client)).size;
    const clientesUnicosNoFaturamentoProjetado = new Set(
      contractsClosedUntilM.filter(contract => {
        const closeDate = contract.closing_date ? 
          new Date(contract.closing_date) : 
          new Date(contract.created_at);
        const yearsDiff = monthEnd.getFullYear() - closeDate.getFullYear();
        const monthsDiff = monthEnd.getMonth() - closeDate.getMonth();
        const mesesDecorridos = yearsDiff * 12 + monthsDiff;
        return mesesDecorridos < 12;
      }).map(contract => contract.client)
    ).size;
    
    return {
      monthEnd,
      contractsClosedUntilM,
      faturamentoAcumulado,
      faturamentoProjetado,
      clientesUnicosAcumulados,
      clientesUnicosNoFaturamentoProjetado,
      contratosAcumulados: contractsClosedUntilM.length
    };
  });
  
  // Calcular custos em paralelo para todos os meses
  const costsResults = await Promise.all(
    monthEnds.map(monthEnd => getRolling12MonthsCosts(monthEnd))
  );
  
  // Combinar resultados
  return preData.map((data, index) => {
    const { total: custos12Meses } = costsResults[index];
    const monthLabel = data.monthEnd.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    const ticketMedio = data.contratosAcumulados > 0 ? 
      data.faturamentoAcumulado / data.contratosAcumulados : null;
    
    const cac = data.clientesUnicosAcumulados > 0 ? 
      custos12Meses / data.clientesUnicosAcumulados : null;
    
    const roi = custos12Meses > 0 ? 
      (data.faturamentoProjetado * 0.20) / custos12Meses : null;
    
    const ltvMedio = data.clientesUnicosNoFaturamentoProjetado > 0 ? 
      data.faturamentoProjetado / data.clientesUnicosNoFaturamentoProjetado : null;
    
    const ltvCac = ltvMedio && cac && cac > 0 ? 
      ltvMedio / cac : null;
    
    return {
      monthEnd: data.monthEnd,
      monthLabel,
      faturamentoAcumulado: data.faturamentoAcumulado,
      faturamentoProjetado: data.faturamentoProjetado,
      clientesUnicosNoFaturamentoProjetado: data.clientesUnicosNoFaturamentoProjetado,
      contratosAcumulados: data.contratosAcumulados,
      clientesUnicosAcumulados: data.clientesUnicosAcumulados,
      custos12Meses,
      ticketMedio,
      cac,
      roi,
      ltvCac,
      ltvMedio
    };
  });
};

const KPIModal: React.FC<KPIModalProps> = ({ isOpen, onClose, kpiType }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const [showDetailModal, setShowDetailModal] = useState<DetailBreakdownData | null>(null);
  const [monthlyKPIs, setMonthlyKPIs] = useState<MonthlyKPIData[] | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);

  // Carregar dados KPI quando modal abrir
  React.useEffect(() => {
    if (!isOpen) return;
    
    let mounted = true;
    (async () => {
      try {
        setLoadingKpis(true);
        const result = await calculateMonthlyKPIsFast(proposals);
        if (mounted) setMonthlyKPIs(result);
      } catch (error) {
        console.error('Erro ao calcular monthly KPIs para o modal:', error);
        if (mounted) setMonthlyKPIs([]);
      } finally {
        if (mounted) setLoadingKpis(false);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, proposals]);
  
  if (!isOpen) return null;
  
  if (loadingKpis || !monthlyKPIs) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Calculando KPIs...</span>
          </div>
        </div>
      </div>
    );
  }
  
  const currentMonthData = monthlyKPIs[monthlyKPIs.length - 1];
  if (!currentMonthData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-8">
          <div className="text-center">
            <p className="text-gray-600">Erro ao carregar dados dos KPIs.</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Função para formatar valores em formato abreviado (K, M)
  const formatCurrencyAbbreviated = (value: number): string => {
    if (value === 0) return 'R$ 0';
    
    if (Math.abs(value) >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    } else {
      return `R$ ${value.toFixed(0)}`;
    }
  };

  // Função para formatar valores no formato de ratio
  const formatRatio = (value: number): string => {
    if (value === 0) return '0.0x';
    return `${value.toFixed(1)}x`;
  };


  const getKPIData = () => {
    switch (kpiType) {
      case 'ticket':
        return {
          title: 'Ticket Médio',
          icon: <DollarSign className="w-6 h-6 text-blue-500" />,
          color: 'blue',
          currentValue: currentMonthData.ticketMedio ? formatCurrency(currentMonthData.ticketMedio) : '—',
          formula: 'Σ(monthly_value dos contratos fechados até M) ÷ Quantidade de contratos fechados até M',
          details: [
            { label: 'Faturamento acumulado até o mês', value: formatCurrency(currentMonthData.faturamentoAcumulado) },
            { label: 'Contratos fechados acumulados', value: `${currentMonthData.contratosAcumulados} contratos` },
            { label: 'Mês de referência', value: currentMonthData.monthEnd.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) },
            { label: 'Método de cálculo', value: 'Snapshot acumulativo' }
          ],
          chartData: monthlyKPIs.map(m => ({ month: m.monthLabel, value: m.ticketMedio || 0 })),
          yAxisFormatter: (value: number) => formatCurrencyAbbreviated(value),
          valueFormatter: (value: number) => formatCurrencyAbbreviated(value),
          chartColor: '#3B82F6'
        };
      
      case 'cac':
        return {
          title: 'CAC - Custo de Aquisição de Cliente',
          icon: <Target className="w-6 h-6 text-orange-500" />,
          color: 'orange',
          currentValue: currentMonthData.cac ? formatCurrency(currentMonthData.cac) : '—',
          formula: 'Custos 12 meses móveis terminando em M ÷ Clientes únicos fechados até M',
          details: [
            { label: 'Custos últimos 12 meses', value: formatCurrency(currentMonthData.custos12Meses) },
            { label: 'Clientes únicos fechados acumulados', value: `${currentMonthData.clientesUnicosAcumulados} clientes` },
            { label: 'Fonte de custos', value: 'Configurações > Custos Operacionais' },
            { label: 'Janela de custos', value: 'Últimos 12 meses móveis' }
          ],
          chartData: monthlyKPIs.map(m => ({ month: m.monthLabel, value: m.cac || 0 })),
          yAxisFormatter: (value: number) => value > 0 ? formatCurrencyAbbreviated(value) : 'R$ 0',
          valueFormatter: (value: number) => formatCurrencyAbbreviated(value),
          chartColor: '#F59E0B'
        };
      
      case 'roi':
        return {
          title: 'ROI - Retorno sobre Investimento',
          icon: <TrendingUp className="w-6 h-6 text-purple-500" />,
          color: 'purple',
          currentValue: currentMonthData.roi ? currentMonthData.roi.toFixed(2) : '—',
          formula: '(Faturamento projetado restante × 20%) ÷ Custos 12 meses móveis',
          details: [
            { label: 'Faturamento projetado restante', value: formatCurrency(currentMonthData.faturamentoProjetado) },
            { label: 'Margem aplicada (20%)', value: formatCurrency(currentMonthData.faturamentoProjetado * 0.20) },
            { label: 'Custos últimos 12 meses', value: formatCurrency(currentMonthData.custos12Meses) },
            { label: 'Fonte de custos', value: 'Configurações > Custos Operacionais' }
          ],
          chartData: monthlyKPIs.map(m => ({ month: m.monthLabel, value: m.roi || 0 })),
          yAxisFormatter: (value: number) => value > 0 ? value.toFixed(1) : '0.0',
          valueFormatter: (value: number) => value.toFixed(2),
          chartColor: '#8B5CF6'
        };
      
      case 'ltvcac':
        return {
          title: 'LTV/CAC - Lifetime Value vs Custo de Aquisição',
          icon: <BarChart3 className="w-6 h-6 text-green-600" />,
          color: 'green',
          currentValue: currentMonthData.ltvCac ? `${currentMonthData.ltvCac.toFixed(1)}x` : '—',
          formula: '(Faturamento projetado restante ÷ Clientes únicos da projeção) ÷ CAC do mês M',
          details: [
            { label: 'Faturamento projetado restante', value: formatCurrency(currentMonthData.faturamentoProjetado) },
            { label: 'Clientes únicos na projeção', value: `${currentMonthData.clientesUnicosNoFaturamentoProjetado} clientes` },
            { label: 'LTV médio (faturamento ÷ clientes)', value: currentMonthData.ltvMedio ? formatCurrency(currentMonthData.ltvMedio) : '—' },
            { label: 'CAC do mês', value: currentMonthData.cac ? formatCurrency(currentMonthData.cac) : '—' },
            { label: 'Proporção (LTV médio ÷ CAC)', value: currentMonthData.ltvCac ? `${currentMonthData.ltvCac.toFixed(1)}x` : '—' },
            { label: 'Status', value: currentMonthData.ltvCac && currentMonthData.ltvCac >= 3 ? 'Excelente' : currentMonthData.ltvCac && currentMonthData.ltvCac >= 1 ? 'Marginal' : 'Crítico' }
          ],
          chartData: monthlyKPIs.map(m => ({ month: m.monthLabel, value: m.ltvCac || 0 })),
          yAxisFormatter: (value: number) => formatRatio(value),
          valueFormatter: (value: number) => formatRatio(value),
          chartColor: '#10B981'
        };
      
      default:
        return null;
    }
  };

  const kpiData = getKPIData();
  if (!kpiData) return null;

  // Configurar dados do Chart.js
  const chartData = {
    labels: kpiData.chartData.map(d => d.month),
    datasets: [
      {
        label: kpiData.title,
        data: kpiData.chartData.map(d => d.value),
        backgroundColor: kpiData.chartColor, // Solid color (remove transparency)
        borderColor: kpiData.chartColor,
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 20,
        bottom: 10
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${kpiData.title}: ${kpiData.valueFormatter(context.parsed.y)}`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: kpiData.chartColor,
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: window.innerWidth < 480 ? 10 : 11
          },
          callback: function(value: any) {
            return kpiData.yAxisFormatter(value);
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: window.innerWidth < 480 ? 9 : 10
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };
  
  const maxValue = Math.max(...kpiData.chartData.map(d => d.value), 1);
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', line: '#3B82F6' };
      case 'orange': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', line: '#F59E0B' };
      case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', line: '#8B5CF6' };
      case 'green': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', line: '#10B981' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', line: '#6B7280' };
    }
  };

  const colors = getColorClasses(kpiData.color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
              {kpiData.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{kpiData.title}</h2>
              <p className="text-sm text-gray-600">Análise detalhada com snapshot acumulativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Valor Atual do Mês */}
          <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6 text-center`}>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Valor Atual (Mês Corrente)</h3>
            <div className={`text-4xl font-bold ${colors.text} mb-2`}>
              {kpiData.currentValue}
            </div>
            <p className="text-sm text-gray-600">{kpiData.formula}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seção 1: Racional do Cálculo (Mês Atual) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo (Mês Atual)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  {kpiData.details.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">{detail.label}:</span>
                      <span className="text-sm font-bold text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className={`mt-4 p-3 ${colors.bg} border ${colors.border} rounded`}>
                  <p className={`text-sm font-medium ${colors.text}`}>
                    <strong>Fórmula aplicada:</strong> {kpiData.formula}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Dados calculados até {currentMonthData.monthEnd.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 2: Gráfico de Evolução (Últimos 12 Meses) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evolução - Últimos 12 Meses</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                
                {/* Chart.js Chart Container */}
                <div className="w-full h-80">
                  <Bar data={chartData} options={chartOptions} />
                </div>

                {/* Chart Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className={`${window.innerWidth < 480 ? 'text-base' : 'text-lg'} font-bold ${colors.text}`}>
                      {kpiData.valueFormatter(Math.max(...kpiData.chartData.map(d => d.value)))}
                    </div>
                    <div className={`${window.innerWidth < 480 ? 'text-xs' : 'text-sm'} text-gray-600`}>Maior Valor</div>
                  </div>
                  <div className="text-center">
                    <div className={`${window.innerWidth < 480 ? 'text-base' : 'text-lg'} font-bold ${colors.text}`}>
                      {kpiData.valueFormatter(kpiData.chartData.reduce((sum, d) => sum + d.value, 0) / kpiData.chartData.length)}
                    </div>
                    <div className={`${window.innerWidth < 480 ? 'text-xs' : 'text-sm'} text-gray-600`}>Média 12 Meses</div>
                  </div>
                  <div className="text-center">
                    <div className={`${window.innerWidth < 480 ? 'text-base' : 'text-lg'} font-bold ${colors.text}`}>
                      {kpiData.valueFormatter(kpiData.chartData[kpiData.chartData.length - 1]?.value || 0)}
                    </div>
                    <div className={`${window.innerWidth < 480 ? 'text-xs' : 'text-sm'} text-gray-600`}>Mês Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights e Metodologia */}
          <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
            <h4 className={`font-medium ${colors.text} mb-2`}>💡 Metodologia e Insights</h4>
            <div className={`space-y-2 ${window.innerWidth < 480 ? 'text-xs' : 'text-sm'} text-gray-700`}>
              <p><strong>📈 Snapshot:</strong> Contratos acumulados até o fim de M</p>
              <p><strong>🔄 Custos Dinâmicos:</strong> {'Soma dos últimos 12 meses de "Configurações > Custos Operacionais"'}</p>
              <p><strong>👥 Clientes Únicos:</strong> Sem duplicação por nome</p>
              
              {kpiType === 'ticket' && (
                <>
                  <p><strong>• Interpretação:</strong> Valor médio por contrato fechado</p>
                  <p><strong>• Tendência:</strong> ↗️ = Clientes de maior valor</p>
                </>
              )}
              {kpiType === 'cac' && (
                <>
                  <p><strong>• Interpretação:</strong> Custo para adquirir 1 cliente</p>
                  <p><strong>• Custos:</strong> Janela móvel 12 meses da configuração</p>
                </>
              )}
              {kpiType === 'roi' && (
                <>
                  <p><strong>• Interpretação:</strong> Retorno sobre investimento</p>
                  <p><strong>• Custos:</strong> Soma dinâmica dos últimos 12 meses</p>
                  <p><strong>• Margem:</strong> 20% sobre faturamento projetado</p>
                </>
              )}
              {kpiType === 'ltvcac' && (
                <>
                  <p><strong>• Interpretação:</strong> Proporção entre valor do cliente e custo de aquisição</p>
                  <p><strong>• Benchmark:</strong> ≥3x = Excelente, ≥1x = Marginal, &lt;1x = Crítico</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommercialKPIs: React.FC = () => {
  const { selectedYear } = useYear();
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  const [isExpanded, setIsExpanded] = useState(false);
  const [openModal, setOpenModal] = useState<'ticket' | 'cac' | 'roi' | 'ltvcac' | null>(null);
  const [currentKPIs, setCurrentKPIs] = useState<any>(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [sparklineData, setSparklineData] = useState<any>(null);

  // 1) FUNCTION DECLARATIONS PRIMEIRO

  // Calcular KPIs do mês atual
  const calculateCurrentMonthKPIs = async () => {
    const currentDate = new Date();
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Contratos fechados até o fim do mês atual
    const contractsClosedUntilM = proposals.filter(proposal => {
      if (proposal.status !== 'Fechado') return false;
      
      const closeDate = proposal.closing_date ? 
        new Date(proposal.closing_date) : 
        new Date(proposal.created_at);
      
      return closeDate <= monthEnd;
    });
    
    // Faturamento acumulado
    const faturamentoAcumulado = contractsClosedUntilM.reduce(
      (sum, contract) => sum + (contract.monthly_value || 0), 0
    );
    
    // Faturamento projetado (restante dos 12 meses)
    const faturamentoProjetado = contractsClosedUntilM.reduce((sum, contract) => {
      const closeDate = contract.closing_date ? 
        new Date(contract.closing_date) : 
        new Date(contract.created_at);
      
      const yearsDiff = monthEnd.getFullYear() - closeDate.getFullYear();
      const monthsDiff = monthEnd.getMonth() - closeDate.getMonth();
      const mesesDecorridos = yearsDiff * 12 + monthsDiff;
      
      if (mesesDecorridos < 12) {
        const mesesRestantes = 12 - mesesDecorridos;
        return sum + ((contract.monthly_value || 0) * mesesRestantes);
      }
      
      return sum;
    }, 0);
    
    // Clientes únicos
    const clientesUnicos = new Set(contractsClosedUntilM.map(c => c.client));
    const clientesUnicosAcumulados = clientesUnicos.size;
    
    // Clientes únicos na projeção
    const clientesUnicosNoFaturamentoProjetado = new Set(
      contractsClosedUntilM.filter(contract => {
        const closeDate = contract.closing_date ? 
          new Date(contract.closing_date) : 
          new Date(contract.created_at);
        
        const yearsDiff = monthEnd.getFullYear() - closeDate.getFullYear();
        const monthsDiff = monthEnd.getMonth() - closeDate.getMonth();
        const mesesDecorridos = yearsDiff * 12 + monthsDiff;
        
        return mesesDecorridos < 12;
      }).map(contract => contract.client)
    ).size;
    
    // Custos dos últimos 12 meses
    const { total: custos12Meses } = await getRolling12MonthsCosts(monthEnd);
    
    // Calcular KPIs
    const contratosAcumulados = contractsClosedUntilM.length;
    const ticketMedio = contratosAcumulados > 0 ? faturamentoAcumulado / contratosAcumulados : 0;
    const cacValue = clientesUnicosAcumulados > 0 ? custos12Meses / clientesUnicosAcumulados : 0;
    const roiValue = custos12Meses > 0 ? (faturamentoProjetado * 0.20) / custos12Meses : 0;
    const ltvMedio = clientesUnicosNoFaturamentoProjetado > 0 ? faturamentoProjetado / clientesUnicosNoFaturamentoProjetado : 0;
    const ltvCacRatio = ltvMedio && cacValue && cacValue > 0 ? ltvMedio / cacValue : 0;
    
    return {
      ticketMedio,
      cacValue,
      roiValue,
      ltvCacRatio,
      custos12Meses,
      faturamentoAcumulado,
      faturamentoProjetado,
      contratosAcumulados,
      clientesUnicosAcumulados,
      clientesUnicosNoFaturamentoProjetado,
      ltvMedio
    };
  };

  // Preparar dados para sparklines - reusar as mesmas séries dos modais
  async function prepareSparklineData() {
    const sparklineData = await calculateMonthlyKPIs(proposals);
    
    return {
      ticketMedio: last12(toNumberArray(sparklineData.map(m => m.ticketMedio || 0))),
      cac: last12(toNumberArray(sparklineData.map(m => m.cac || 0))),
      roi: last12(toNumberArray(sparklineData.map(m => m.roi || 0))),
      ltvCac: last12(toNumberArray(sparklineData.map(m => m.ltvCac || 0)))
    };
  }

  // Utilitários para séries seguras
  function toNumberArray(a: any): number[] {
    if (!Array.isArray(a)) return [];
    // aceita séries [{value}, …] ou [number, …]
    return a.map(x => Number(x?.value ?? x)).filter(n => Number.isFinite(n));
  }
  function last12(a: number[]): number[] { return a.slice(-12); }
  
  // 3) EFFECTS APÓS FUNCTION DECLARATIONS

  // Calcular KPIs quando os dados das propostas mudarem
  React.useEffect(() => {
    const calculateKPIs = async () => {
      if (proposalsLoading || proposals.length === 0) return;
      
      setKpisLoading(true);
      try {
        const kpis = await calculateCurrentMonthKPIs();
        setCurrentKPIs(kpis);
      } catch (error) {
        console.error('Erro ao calcular KPIs:', error);
        // Usar valores padrão em caso de erro
        setCurrentKPIs({
          ticketMedio: 0,
          cacValue: 0,
          roiValue: 0,
          ltvCacRatio: 0,
          custos12Meses: 0
        });
      } finally {
        setKpisLoading(false);
      }
    };

    calculateKPIs();
  }, [proposals, proposalsLoading, selectedYear]);
  
  // Calcular dados do sparkline de forma assíncrona
  React.useEffect(() => {
    const calculateSparklines = async () => {
      if (proposalsLoading || !currentKPIs) return;
      
      try {
        const data = await prepareSparklineData();
        setSparklineData(data);
      } catch (error) {
        console.error('Erro ao calcular sparklines:', error);
      }
    };

    calculateSparklines();
  }, [proposals, proposalsLoading, currentKPIs]);
  
  // 4) CONDITIONAL RENDERS NO FINAL
  if (proposalsLoading || kpisLoading || !currentKPIs) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6 items-stretch">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 border rounded-xl shadow bg-white flex flex-col h-[320px]">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!sparklineData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6 items-stretch">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 border rounded-xl shadow bg-white flex flex-col h-[320px]">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 my-6">
        {/* Card Header - Always Visible */}
        <div
          className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900">KPI's comerciais</h2>
            <p className="text-sm text-gray-500">
              {isExpanded ? 'Clique para recolher os indicadores' : 'Clique para expandir e ver todos os indicadores'}
            </p>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isExpanded ? 'Recolher KPIs' : 'Expandir KPIs'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Expandable Content */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {isExpanded && (
            <div className="px-6 pb-6 space-y-6">
              {/* Seção 1: KPIs Principais (4 existentes) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Indicadores Principais</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Ticket Médio */}
        <div className="p-4 border rounded-xl shadow bg-white flex flex-col h-[320px] relative">
          <button
            onClick={() => setOpenModal('ticket')}
            className="absolute top-3 right-3 p-1.5 hover:bg-blue-100 rounded-full transition-colors"
            title="Ver detalhes do Ticket Médio"
          >
            <Info className="w-4 h-4 text-blue-500" />
          </button>
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-blue-500" /> Ticket Médio
            </h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentKPIs.ticketMedio)}</p>
          <p className="text-xs text-gray-500">Baseado em {currentKPIs.contratosAcumulados} contratos acumulados</p>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            Faturamento acumulado: <strong>{formatCurrency(currentKPIs.faturamentoAcumulado)}</strong><br />
            Contratos fechados: <strong>{currentKPIs.contratosAcumulados} contratos</strong><br />
            Ano: <strong>{new Date().getFullYear()}</strong>
          </div>
          <div className="mt-2 text-xs text-green-600 font-medium">● Snapshot acumulativo</div>
          
          {/* Minigráfico */}
          <div className="mt-3">
            <MiniBar
              data={sparklineData.ticketMedio}
              color="#0ea5e9"
              height={40}
            />
          </div>
        </div>

        {/* CAC */}
        <div className="p-4 border rounded-xl shadow bg-white flex flex-col h-[320px] relative">
          <button
            onClick={() => setOpenModal('cac')}
            className="absolute top-3 right-3 p-1.5 hover:bg-orange-100 rounded-full transition-colors"
            title="Ver detalhes do CAC"
          >
            <Info className="w-4 h-4 text-orange-500" />
          </button>
          
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
            <Target className="w-4 h-4 text-orange-500" /> CAC
          </h3>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(currentKPIs.cacValue)}</p>
          <p className="text-xs text-gray-500">Investimento por cliente único adquirido</p>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            Custos últimos 12 meses: <strong>{formatCurrency(currentKPIs.custos12Meses)}</strong><br />
            Clientes únicos acumulados: <strong>{currentKPIs.clientesUnicosAcumulados} clientes</strong><br />
            Status: <span className="text-green-600">● Dinâmico</span>
          </div>
          <div className="mt-2 text-xs text-orange-600 font-medium">● Custos configuráveis</div>
          
          {/* Minigráfico */}
          <div className="mt-3">
            <MiniBar
              data={sparklineData.cac}
              color="#fb923c"
              height={40}
            />
          </div>
        </div>

        {/* ROI */}
        <div className="p-4 border rounded-xl shadow bg-white flex flex-col h-[320px] relative">
          <button
            onClick={() => setOpenModal('roi')}
            className="absolute top-3 right-3 p-1.5 hover:bg-purple-100 rounded-full transition-colors"
            title="Ver detalhes do ROI"
          >
            <Info className="w-4 h-4 text-purple-500" />
          </button>
          
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-purple-500" /> ROI
          </h3>
          <p className={`text-2xl font-bold ${currentKPIs.roiValue < 1 ? 'text-red-600' : 'text-green-600'}`}>
            {currentKPIs.roiValue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">Retorno sobre investimento (margem ÷ custos)</p>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            Faturamento projetado c/ margem 20%: <strong>{formatCurrency(currentKPIs.faturamentoProjetado * 0.20)}</strong><br />
            Custos últimos 12 meses: <strong>{formatCurrency(currentKPIs.custos12Meses)}</strong><br />
            Status: <span className={currentKPIs.roiValue >= 1 ? 'text-green-600' : 'text-red-600'}>
              ● {currentKPIs.roiValue >= 1 ? 'Positivo' : 'Baixo'}
            </span>
          </div>
          <div className="mt-2 text-xs text-purple-600 font-medium">● Projeção 12m por contrato</div>
          
          {/* Minigráfico */}
          <div className="mt-3">
            <MiniBar
              data={sparklineData.roi}
              color="#a78bfa"
              height={40}
            />
          </div>
        </div>

        {/* LTV/CAC */}
        <div className="p-4 border rounded-xl shadow bg-white flex flex-col h-[320px] relative">
          <button
            onClick={() => setOpenModal('ltvcac')}
            className="absolute top-3 right-3 p-1.5 hover:bg-green-100 rounded-full transition-colors"
            title="Ver detalhes do LTV/CAC"
          >
            <Info className="w-4 h-4 text-green-600" />
          </button>
          
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
            <BarChart3 className="w-4 h-4 text-green-600" /> LTV/CAC
          </h3>
          <p className="text-2xl font-bold text-green-600">{currentKPIs.ltvCacRatio.toFixed(1)}x</p>
          <p className="text-xs text-gray-500">Retorno do investimento em aquisição</p>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            Clientes únicos na projeção: <strong>{currentKPIs.clientesUnicosNoFaturamentoProjetado} clientes</strong><br />
            LTV médio por cliente: <strong>{currentKPIs.ltvMedio > 0 ? formatCurrency(currentKPIs.ltvMedio) : '—'}</strong><br />
            Status: <span className={
              currentKPIs.ltvCacRatio >= 3 ? 'text-green-600' : 
              currentKPIs.ltvCacRatio >= 1 ? 'text-yellow-600' : 'text-red-600'
            }>
              ● {currentKPIs.ltvCacRatio >= 3 ? 'Excelente' : currentKPIs.ltvCacRatio >= 1 ? 'Marginal' : 'Crítico'}
            </span>
          </div>
          <div className="mt-2 text-xs text-green-600 font-medium">● LTV médio ÷ CAC</div>
          
          {/* Minigráfico */}
          <div className="mt-3">
            <MiniBar
              data={sparklineData.ltvCac}
              color="#22c55e"
              height={40}
            />
          </div>
        </div>
                </div>
              </div>

              {/* Seção 2: KPIs de Vendas (4 novos) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Indicadores de Vendas</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ProposalEvolutionKPI />
                  <SalesGrowthKPI />
                  <LTVKpi />
                  <PipelineCoverageKPI />
                </div>
              </div>

              {/* Seção 3: KPIs de Performance (3 novos) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Indicadores de Performance</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SalesConversionKPI />
                  <ContractsNeededKPI />
                  <SalesCycleTimeKPI />
                  <LastProposalAgeKPI />
                </div>
              </div>

              {/* Informações de Atualização */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Informações dos KPIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800 text-sm">
                  <div>
                    <p>• <strong>Atualização:</strong> Dados em tempo real baseados nas propostas</p>
                    <p>• <strong>Período base:</strong> Últimos 12 meses para cálculos históricos</p>
                    <p>• <strong>Metodologia:</strong> Snapshot acumulativo e janelas móveis</p>
                  </div>
                  <div>
                    <p>• <strong>Faturamento:</strong> Valor mensal por 12 meses após assinatura</p>
                    <p>• <strong>Cliques:</strong> Cada KPI possui modal com detalhes e fórmulas</p>
                    <p>• <strong>Minigráficos:</strong> Evolução mensal dos últimos 12 períodos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <KPIModal
        isOpen={!!openModal}
        onClose={() => setOpenModal(null)}
        kpiType={openModal!}
      />
    </>
  );
};