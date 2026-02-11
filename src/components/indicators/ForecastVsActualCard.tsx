import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DashboardService } from '@/services/dashboardService';
import { FinancialStationResults, Client } from '@/types/database';
import { convertMonthYmsToMonthData } from '@/lib/months';
import { Info, ChevronDown, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface ComparisonData {
  faturamento: { previsto: number; realizado: number };
  faturamento_liquido: { previsto: number; realizado: number };
  folha_ft: { previsto: number; realizado: number };
  margem: { previsto: number; realizado: number };
  csv_total: { previsto: number; realizado: number };
}

interface ClientVariation {
  clientName: string;
  variation: number;
  previsto: number;
  realizado: number;
}

interface MonthlyDetail {
  month: string;
  previsto: number;
  realizado: number;
  variacao: number;
}

export function ForecastVsActualCard() {
  const [loading, setLoading] = useState(true);
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [data, setData] = useState<FinancialStationResults[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData>({
    faturamento: { previsto: 0, realizado: 0 },
    faturamento_liquido: { previsto: 0, realizado: 0 },
    folha_ft: { previsto: 0, realizado: 0 },
    margem: { previsto: 0, realizado: 0 },
    csv_total: { previsto: 0, realizado: 0 },
  });

  const [tempSelectedMonths, setTempSelectedMonths] = useState<string[]>([]);
  const [tempSelectedContracts, setTempSelectedContracts] = useState<string[]>([]);
  const [tempCidadeFilter, setTempCidadeFilter] = useState<string>('todas');
  const [tempCompanyFilter, setTempCompanyFilter] = useState<'todas' | 'WWS' | 'Worldwide'>('todas');
  const [tempTipoFilter, setTempTipoFilter] = useState<'todos' | 'Público' | 'Privado'>('todos');

  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [availableContracts, setAvailableContracts] = useState<string[]>([]);
  const [cidadeFilter, setCidadeFilter] = useState<string>('todas');
  const [availableCidades, setAvailableCidades] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<'todas' | 'WWS' | 'Worldwide'>('todas');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'Público' | 'Privado'>('todos');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'faturamento' | 'faturamento_liquido' | 'folha_ft' | 'margem' | 'csv_total'>('faturamento');
  const [monthlyDetails, setMonthlyDetails] = useState<MonthlyDetail[]>([]);
  const [topVariations, setTopVariations] = useState<{
    faturamento: ClientVariation[];
    faturamento_liquido: ClientVariation[];
    folha_ft: ClientVariation[];
    csv_total: ClientVariation[];
    margem: ClientVariation[];
  }>({
    faturamento: [],
    faturamento_liquido: [],
    folha_ft: [],
    csv_total: [],
    margem: [],
  });

  const [showTop3Modal, setShowTop3Modal] = useState(false);
  const [top3ModalType, setTop3ModalType] = useState<'faturamento' | 'faturamento_liquido' | 'folha_ft' | 'margem' | 'csv_total'>('faturamento');
  const [allVariations, setAllVariations] = useState<{
    faturamento: ClientVariation[];
    faturamento_liquido: ClientVariation[];
    folha_ft: ClientVariation[];
    csv_total: ClientVariation[];
    margem: ClientVariation[];
  }>({
    faturamento: [],
    faturamento_liquido: [],
    folha_ft: [],
    csv_total: [],
    margem: [],
  });

  const [contractDropdownOpen, setContractDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [contractSearchTerm, setContractSearchTerm] = useState('');

  useEffect(() => {
    if (!contractDropdownOpen) {
      setContractSearchTerm('');
    }
  }, [contractDropdownOpen]);

  useEffect(() => {
    const init = async () => {
      const availableMonths = await DashboardService.getAllAvailableMonths('financial_station_results');
      setAllMonths(availableMonths);

      if (availableMonths.length > 0) {
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let defaultMonth = availableMonths.find(month => month >= currentYearMonth);
        if (!defaultMonth) {
          defaultMonth = availableMonths[availableMonths.length - 1];
        } else if (availableMonths.indexOf(defaultMonth) > 0 && defaultMonth > currentYearMonth) {
          defaultMonth = availableMonths[availableMonths.indexOf(defaultMonth) - 1];
        }
        setSelectedMonths([defaultMonth]);
        setTempSelectedMonths([defaultMonth]);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (allMonths.length > 0) {
      loadData();
    }
  }, [allMonths]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stationData, clientsData] = await Promise.all([
        DashboardService.getFinancialStationResults(allMonths),
        DashboardService.getClients()
      ]);

      setData(stationData);
      setClients(clientsData);

      const uniqueContracts = Array.from(new Set(stationData.map(d => d.contract_name))).sort();
      setAvailableContracts(uniqueContracts);

      const uniqueCidades = Array.from(
        new Set(
          clientsData
            .map(c => c.cidade)
            .filter((cidade): cidade is string => cidade !== null && cidade !== undefined)
        )
      ).sort();
      setAvailableCidades(uniqueCidades);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateComparison();
  }, [data, selectedMonths, selectedContracts, cidadeFilter, companyFilter, tipoFilter, clients]);

  const calculateComparison = () => {
    if (selectedMonths.length === 0 || data.length === 0) return;

    const filteredData = data.filter(record => {
      if (!selectedMonths.includes(record.month_ym)) return false;

      if (selectedContracts.length > 0 && !selectedContracts.includes(record.contract_name)) return false;

      const client = clients.find(c => c.name === record.contract_name);

      if (cidadeFilter !== 'todas' && client?.cidade !== cidadeFilter) return false;
      if (companyFilter !== 'todas' && client?.company !== companyFilter) return false;
      if (tipoFilter !== 'todos' && client?.tipo !== tipoFilter) return false;

      return true;
    });

    const totals = filteredData.reduce((acc, record) => {
      acc.faturamento.previsto += record.forecast_revenue || 0;
      acc.faturamento.realizado += record.revenue || 0;
      acc.faturamento_liquido.previsto += record.forecast_net_revenue || 0;
      acc.faturamento_liquido.realizado += record.net_revenue || 0;
      acc.folha_ft.previsto += record.forecast_payroll_ft || 0;
      acc.folha_ft.realizado += record.payroll_ft || 0;
      acc.margem.previsto += record.forecast_contribution_margin || 0;
      acc.margem.realizado += record.contribution_margin || 0;
      acc.csv_total.previsto += record.forecast_csv_total || 0;
      acc.csv_total.realizado += record.csv_total || 0;
      return acc;
    }, {
      faturamento: { previsto: 0, realizado: 0 },
      faturamento_liquido: { previsto: 0, realizado: 0 },
      folha_ft: { previsto: 0, realizado: 0 },
      margem: { previsto: 0, realizado: 0 },
      csv_total: { previsto: 0, realizado: 0 },
    });

    setComparisonData(totals);
    calculateTopVariations(filteredData);
  };

  const calculateTopVariations = (filteredData: FinancialStationResults[]) => {
    const clientAggregates = new Map<string, {
      faturamento_previsto: number;
      faturamento_realizado: number;
      faturamento_liquido_previsto: number;
      faturamento_liquido_realizado: number;
      folha_ft_previsto: number;
      folha_ft_realizado: number;
      csv_total_previsto: number;
      csv_total_realizado: number;
      margem_previsto: number;
      margem_realizado: number;
    }>();

    filteredData.forEach(record => {
      const existing = clientAggregates.get(record.contract_name) || {
        faturamento_previsto: 0,
        faturamento_realizado: 0,
        faturamento_liquido_previsto: 0,
        faturamento_liquido_realizado: 0,
        folha_ft_previsto: 0,
        folha_ft_realizado: 0,
        csv_total_previsto: 0,
        csv_total_realizado: 0,
        margem_previsto: 0,
        margem_realizado: 0,
      };

      existing.faturamento_previsto += record.forecast_revenue || 0;
      existing.faturamento_realizado += record.revenue || 0;
      existing.faturamento_liquido_previsto += record.forecast_net_revenue || 0;
      existing.faturamento_liquido_realizado += record.net_revenue || 0;
      existing.folha_ft_previsto += record.forecast_payroll_ft || 0;
      existing.folha_ft_realizado += record.payroll_ft || 0;
      existing.csv_total_previsto += record.forecast_csv_total || 0;
      existing.csv_total_realizado += record.csv_total || 0;
      existing.margem_previsto += record.forecast_contribution_margin || 0;
      existing.margem_realizado += record.contribution_margin || 0;

      clientAggregates.set(record.contract_name, existing);
    });

    const calculateVariations = (
      previstoKey: keyof ReturnType<typeof clientAggregates.get>,
      realizadoKey: keyof ReturnType<typeof clientAggregates.get>
    ): ClientVariation[] => {
      const variations: ClientVariation[] = [];

      clientAggregates.forEach((values, clientName) => {
        const previsto = values[previstoKey] as number;
        const realizado = values[realizadoKey] as number;
        const variation = previsto !== 0 ? ((realizado - previsto) / previsto) * 100 : 0;

        variations.push({
          clientName,
          variation,
          previsto,
          realizado,
        });
      });

      return variations
        .filter(v => v.previsto !== 0 || v.realizado !== 0)
        .sort((a, b) => b.variation - a.variation);
    };

    const faturamentoAll = calculateVariations('faturamento_previsto', 'faturamento_realizado');
    const faturamentoLiquidoAll = calculateVariations('faturamento_liquido_previsto', 'faturamento_liquido_realizado');
    const folhaFtAll = calculateVariations('folha_ft_previsto', 'folha_ft_realizado');
    const csvTotalAll = calculateVariations('csv_total_previsto', 'csv_total_realizado');
    const margemAll = calculateVariations('margem_previsto', 'margem_realizado');

    setAllVariations({
      faturamento: faturamentoAll,
      faturamento_liquido: faturamentoLiquidoAll,
      folha_ft: folhaFtAll,
      csv_total: csvTotalAll,
      margem: margemAll,
    });

    setTopVariations({
      faturamento: faturamentoAll.slice(0, 3),
      faturamento_liquido: faturamentoLiquidoAll.slice(0, 3),
      folha_ft: folhaFtAll.slice(0, 3),
      csv_total: csvTotalAll.slice(0, 3),
      margem: margemAll.slice(0, 3),
    });
  };

  const openModal = (type: typeof modalType) => {
    const monthlyData: MonthlyDetail[] = [];

    selectedMonths.forEach(month => {
      const monthData = data.filter(record => {
        if (record.month_ym !== month) return false;

        if (selectedContracts.length > 0 && !selectedContracts.includes(record.contract_name)) return false;

        const client = clients.find(c => c.name === record.contract_name);

        if (cidadeFilter !== 'todas' && client?.cidade !== cidadeFilter) return false;
        if (companyFilter !== 'todas' && client?.company !== companyFilter) return false;
        if (tipoFilter !== 'todos' && client?.tipo !== tipoFilter) return false;

        return true;
      });

      let previsto = 0;
      let realizado = 0;

      monthData.forEach(record => {
        if (type === 'faturamento') {
          previsto += record.forecast_revenue || 0;
          realizado += record.revenue || 0;
        } else if (type === 'faturamento_liquido') {
          previsto += record.forecast_net_revenue || 0;
          realizado += record.net_revenue || 0;
        } else if (type === 'folha_ft') {
          previsto += record.forecast_payroll_ft || 0;
          realizado += record.payroll_ft || 0;
        } else if (type === 'margem') {
          previsto += record.forecast_contribution_margin || 0;
          realizado += record.contribution_margin || 0;
        } else if (type === 'csv_total') {
          previsto += record.forecast_csv_total || 0;
          realizado += record.csv_total || 0;
        }
      });

      const variacao = previsto !== 0 ? ((realizado - previsto) / previsto) * 100 : 0;

      const monthLabel = convertMonthYmsToMonthData([month])[0]?.label || month;
      monthlyData.push({ month: monthLabel, previsto, realizado, variacao });
    });

    setMonthlyDetails(monthlyData);
    setModalType(type);
    setShowModal(true);
  };

  const calculateVariation = (previsto: number, realizado: number) => {
    if (previsto === 0) return 0;

    if (previsto < 0) {
      return ((realizado - previsto) / Math.abs(previsto)) * 100;
    }

    return ((realizado - previsto) / previsto) * 100;
  };

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(Math.abs(value));

    // Garantir que o sinal fique sempre na frente
    return value < 0 ? `-${formatted}` : formatted;
  };

  const formatPercent = (value: number) => {
    // Garantir que o sinal fique sempre na frente
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${Math.abs(value).toFixed(1)}%`;
  };

  // Função para inverter o sinal da variação para Folha+FT e CSV+Reversão
  const getDisplayVariation = (variation: number) => {
    if (modalType === 'folha_ft' || modalType === 'csv_total') {
      return -variation;
    }
    return variation;
  };

  const getVariationColor = (variation: number) => {
    if (variation >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  // Função para colorir valores monetários (positivo = verde, negativo = vermelho)
  const getValueColor = (value: number) => {
    if (value >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  const toggleMonth = (month: string) => {
    setTempSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const selectAllMonths = () => {
    setTempSelectedMonths([...allMonths]);
  };

  const deselectAllMonths = () => {
    setTempSelectedMonths([]);
  };

  const toggleContract = (contract: string) => {
    setTempSelectedContracts(prev =>
      prev.includes(contract)
        ? prev.filter(c => c !== contract)
        : [...prev, contract]
    );
  };

  const selectAllContracts = () => {
    setTempSelectedContracts([...availableContracts]);
  };

  const deselectAllContracts = () => {
    setTempSelectedContracts([]);
  };

  const applyFilters = () => {
    setSelectedMonths(tempSelectedMonths);
    setSelectedContracts(tempSelectedContracts);
    setCidadeFilter(tempCidadeFilter);
    setCompanyFilter(tempCompanyFilter);
    setTipoFilter(tempTipoFilter);
  };

  const Top3Card = ({
    title,
    variations,
    type
  }: {
    title: string;
    variations: ClientVariation[];
    type: typeof top3ModalType;
  }) => {
    const openTop3Modal = () => {
      setTop3ModalType(type);
      setShowTop3Modal(true);
    };

    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={openTop3Modal}
            className="h-6 w-6 p-0"
          >
            <Info className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
        <div className="space-y-2">
          {variations.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">Sem dados</p>
          ) : (
            variations.map((item, index) => {
              // Inverter sinal para Folha+FT e CSV+Reversão
              const displayVariation = (type === 'folha_ft' || type === 'csv_total')
                ? -item.variation
                : item.variation;

              // Usar fonte menor para margem devido aos números maiores
              const textSize = type === 'margem' ? 'text-[10px]' : 'text-xs';

              return (
                <div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-0">
                  <span className={`${textSize} text-gray-700 truncate flex-1 mr-2`}>{item.clientName}</span>
                  <span className={`${textSize} font-semibold ${getVariationColor(displayVariation)} whitespace-nowrap`}>
                    {formatPercent(displayVariation)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const ComparisonIndicator = ({
    title,
    previsto,
    realizado,
    type
  }: {
    title: string;
    previsto: number;
    realizado: number;
    type: typeof modalType;
  }) => {
    let variation = calculateVariation(previsto, realizado);

    // Inverter sinal da variação para Folha+FT e CSV+Reversão
    if (type === 'folha_ft' || type === 'csv_total') {
      variation = -variation;
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal(type)}
            className="h-6 w-6 p-0"
          >
            <Info className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Previsto:</span>
            <span className="text-sm font-medium text-gray-700">{formatCurrency(previsto)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Realizado:</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(realizado)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-gray-500">Variação:</span>
            <span className={`text-sm font-semibold ${getVariationColor(variation)}`}>
              {formatPercent(variation)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getModalTitle = () => {
    const titles = {
      faturamento: 'Faturamento Bruto',
      faturamento_liquido: 'Faturamento Líquido',
      folha_ft: 'Folha + FT',
      margem: 'Margem de Contribuição',
      csv_total: 'CSV + Reversão Impostos',
    };
    return titles[modalType];
  };

  const getTop3ModalTitle = () => {
    const titles = {
      faturamento: 'Todos Contratos - Variação Faturamento Bruto',
      faturamento_liquido: 'Todos Contratos - Variação Faturamento Líquido',
      folha_ft: 'Todos Contratos - Variação Folha + FT',
      margem: 'Todos Contratos - Variação Margem de Contribuição',
      csv_total: 'Todos Contratos - Variação CSV + Reversão Impostos',
    };
    return titles[top3ModalType];
  };

  if (loading) {
    return (
      <IndicatorCard
        title="Análise Previsto e Realizado"
        subtitle="Comparação entre valores previstos e realizados"
        accentColor="#9B59B6"
        defaultExpanded={false}
      >
        <p className="text-center text-gray-500">Carregando...</p>
      </IndicatorCard>
    );
  }

  return (
    <>
      <IndicatorCard
        title="Análise Previsto e Realizado"
        subtitle="Comparação entre valores previstos e realizados"
        accentColor="#9B59B6"
        defaultExpanded={false}
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mês(es)</label>
            <div className="relative">
              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between bg-white"
              >
                <span className="text-sm">
                  {tempSelectedMonths.length === 0 ? 'Selecione mês(es)' : `${tempSelectedMonths.length} selecionado(s)`}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {monthDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-2">
                    <button
                      onClick={selectAllMonths}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllMonths}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-52">
                    {allMonths.map(month => {
                      const monthLabel = convertMonthYmsToMonthData([month])[0]?.label || month;
                      return (
                        <label
                          key={month}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={tempSelectedMonths.includes(month)}
                            onChange={() => toggleMonth(month)}
                            className="mr-2"
                          />
                          <span className="text-sm">{monthLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contratos</label>
            <div className="relative">
              <button
                onClick={() => setContractDropdownOpen(!contractDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between bg-white"
              >
                <span className="text-sm">
                  {tempSelectedContracts.length === 0 ? 'Todos' : `${tempSelectedContracts.length} selecionado(s)`}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {contractDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar contrato..."
                        value={contractSearchTerm}
                        onChange={(e) => setContractSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="sticky top-[52px] bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-2">
                    <button
                      onClick={selectAllContracts}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllContracts}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-52">
                    {availableContracts
                      .filter(contract => contract.toLowerCase().includes(contractSearchTerm.toLowerCase()))
                      .map(contract => (
                        <label
                          key={contract}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={tempSelectedContracts.includes(contract)}
                            onChange={() => toggleContract(contract)}
                            className="mr-2"
                          />
                          <span className="text-sm">{contract}</span>
                        </label>
                      ))}
                    {availableContracts.filter(contract => contract.toLowerCase().includes(contractSearchTerm.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        Nenhum contrato encontrado
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
            <select
              value={tempCidadeFilter}
              onChange={(e) => setTempCidadeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              {availableCidades.map(cidade => (
                <option key={cidade} value={cidade}>{cidade}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
              <select
                value={tempCompanyFilter}
                onChange={(e) => setTempCompanyFilter(e.target.value as typeof tempCompanyFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={tempTipoFilter}
                onChange={(e) => setTempTipoFilter(e.target.value as typeof tempTipoFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="Público">Público</option>
                <option value="Privado">Privado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Button
            onClick={applyFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Aplicar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <ComparisonIndicator
            title="Fat. Bruto"
            previsto={comparisonData.faturamento.previsto}
            realizado={comparisonData.faturamento.realizado}
            type="faturamento"
          />
          <ComparisonIndicator
            title="Fat. Líq."
            previsto={comparisonData.faturamento_liquido.previsto}
            realizado={comparisonData.faturamento_liquido.realizado}
            type="faturamento_liquido"
          />
          <ComparisonIndicator
            title="Folha + FT"
            previsto={comparisonData.folha_ft.previsto}
            realizado={comparisonData.folha_ft.realizado}
            type="folha_ft"
          />
          <ComparisonIndicator
            title="CSV + Reversão Impostos"
            previsto={comparisonData.csv_total.previsto}
            realizado={comparisonData.csv_total.realizado}
            type="csv_total"
          />
          <ComparisonIndicator
            title="Margem"
            previsto={comparisonData.margem.previsto}
            realizado={comparisonData.margem.realizado}
            type="margem"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Top3Card title="Top 3 variação Fat. Bruto" variations={topVariations.faturamento} type="faturamento" />
          <Top3Card title="Top 3 variação Fat. Líq." variations={topVariations.faturamento_liquido} type="faturamento_liquido" />
          <Top3Card title="Top 3 variação Folha + FT" variations={topVariations.folha_ft} type="folha_ft" />
          <Top3Card title="Top 3 variação CSV + Reversão Impostos" variations={topVariations.csv_total} type="csv_total" />
          <Top3Card title="Top 3 variação Margem" variations={topVariations.margem} type="margem" />
        </div>
      </IndicatorCard>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl" onClose={() => setShowModal(false)}>
          <DialogHeader>
            <DialogTitle>{getModalTitle()} - Detalhamento por Mês</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Tabela</TabsTrigger>
              <TabsTrigger value="chart">Gráfico</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Previsto</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Variação %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyDetails.map((detail, index) => {
                    const displayVariacao = getDisplayVariation(detail.variacao);
                    // Aplicar cores aos valores se for margem
                    const shouldColorValues = modalType === 'margem';

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{detail.month}</TableCell>
                        <TableCell className={`text-right ${shouldColorValues ? getValueColor(detail.previsto) : ''}`}>
                          {formatCurrency(detail.previsto)}
                        </TableCell>
                        <TableCell className={`text-right ${shouldColorValues ? getValueColor(detail.realizado) : ''}`}>
                          {formatCurrency(detail.realizado)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${getVariationColor(displayVariacao)}`}>
                          {formatPercent(displayVariacao)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {monthlyDetails.length > 1 && (() => {
                    const totalPrevisto = monthlyDetails.reduce((sum, d) => sum + d.previsto, 0);
                    const totalRealizado = monthlyDetails.reduce((sum, d) => sum + d.realizado, 0);
                    const totalVariacao = calculateVariation(totalPrevisto, totalRealizado);
                    const displayTotalVariacao = getDisplayVariation(totalVariacao);
                    const shouldColorValues = modalType === 'margem';

                    return (
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className={`text-right ${shouldColorValues ? getValueColor(totalPrevisto) : ''}`}>
                          {formatCurrency(totalPrevisto)}
                        </TableCell>
                        <TableCell className={`text-right ${shouldColorValues ? getValueColor(totalRealizado) : ''}`}>
                          {formatCurrency(totalRealizado)}
                        </TableCell>
                        <TableCell className={`text-right ${getVariationColor(displayTotalVariacao)}`}>
                          {formatPercent(displayTotalVariacao)}
                        </TableCell>
                      </TableRow>
                    );
                  })()}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="chart" className="h-[500px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyDetails.map(detail => ({
                    ...detail,
                    variacaoDisplay: getDisplayVariation(detail.variacao)
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="variacaoDisplay"
                    name="Variação %"
                    radius={[8, 8, 0, 0]}
                  >
                    {monthlyDetails.map((entry, index) => {
                      const displayVar = getDisplayVariation(entry.variacao);
                      return (
                        <Cell key={`cell-${index}`} fill={displayVar >= 0 ? '#22c55e' : '#ef4444'} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showTop3Modal} onOpenChange={setShowTop3Modal}>
        <DialogContent className="max-w-3xl" onClose={() => setShowTop3Modal(false)}>
          <DialogHeader>
            <DialogTitle>{getTop3ModalTitle()}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead className="text-right">Previsto</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-right">Variação %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allVariations[top3ModalType].map((item, index) => {
                  // Inverter sinal para Folha+FT e CSV+Reversão
                  const displayVariation = (top3ModalType === 'folha_ft' || top3ModalType === 'csv_total')
                    ? -item.variation
                    : item.variation;

                  // Aplicar cores aos valores se for margem
                  const shouldColorValues = top3ModalType === 'margem';

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell className={`text-right ${shouldColorValues ? getValueColor(item.previsto) : ''}`}>
                        {formatCurrency(item.previsto)}
                      </TableCell>
                      <TableCell className={`text-right ${shouldColorValues ? getValueColor(item.realizado) : ''}`}>
                        {formatCurrency(item.realizado)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${getVariationColor(displayVariation)}`}>
                        {formatPercent(displayVariation)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allVariations[top3ModalType].length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                      Nenhum dado disponível
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
