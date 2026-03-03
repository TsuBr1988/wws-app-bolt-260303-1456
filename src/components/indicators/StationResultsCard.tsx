import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { StationResultsTable } from '@/components/dashboard/StationResultsTable';
import { DashboardService } from '@/services/dashboardService';
import { convertMonthYmsToMonthData, getMonthsInRange } from '@/lib/months';
import { StationResultsTableRow, FinancialStationResults, Client } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps, Line, ComposedChart, Cell, LabelList, ReferenceArea } from 'recharts';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TwelveMonthsChartData {
  monthLabel: string;
  faturamento: number;
  faturamento_liquido: number;
  folha_ft: number;
  csv_total: number;
  margem_contribuicao: number;
  forecast_faturamento: number;
  forecast_faturamento_liquido: number;
  forecast_folha_ft: number;
  forecast_csv_total: number;
  forecast_margem_contribuicao: number;
  margem_percentual?: number;
}

interface SingleMonthChartData {
  contract_name: string;
  faturamento: number;
  faturamento_liquido: number;
  folha_ft: number;
  csv_total: number;
  margem_contribuicao: number;
  margem_percentual?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel || data.contract_name}</p>
      {payload.map((entry: any, index: number) => {
        const isMargemContribuicao = entry.dataKey === 'margem_contribuicao';
        const percentual = isMargemContribuicao && data.margem_percentual !== undefined
          ? ` (${data.margem_percentual.toFixed(1)}%)`
          : '';

        return (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: R$ {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{percentual}
          </p>
        );
      })}
    </div>
  );
};


export function StationResultsCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<StationResultsTableRow[]>([]);
  const [originalData, setOriginalData] = useState<FinancialStationResults[]>([]);
  const [twelveMonthsData, setTwelveMonthsData] = useState<TwelveMonthsChartData[]>([]);
  const [singleMonthData, setSingleMonthData] = useState<SingleMonthChartData[]>([]);
  const [viewMode, setViewMode] = useState<'12months' | 'single'>('12months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<'todas' | 'WWS' | 'Worldwide'>('todas');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'Público' | 'Privado'>('todos');
  const [cidadeFilter, setCidadeFilter] = useState<string>('todas');
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [availableContracts, setAvailableContracts] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableCidades, setAvailableCidades] = useState<string[]>([]);
  const [visibleMetrics, setVisibleMetrics] = useState({
    faturamento: true,
    faturamento_liquido: true,
    folha_ft: true,
    csv_total: true,
    margem_contribuicao: true,
  });
  const [filteredTotalRevenue, setFilteredTotalRevenue] = useState(0);
  const [filteredTotalMargin, setFilteredTotalMargin] = useState(0);
  const [chartStartIndex, setChartStartIndex] = useState(0);
  const [sortBy, setSortBy] = useState<'faturamento' | 'folha_ft' | 'csv_total' | 'margem_contribuicao'>('faturamento');
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [contractSearch, setContractSearch] = useState('');
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  const [chartType, setChartType] = useState<'values' | 'percentages'>('values');
  const [dataView, setDataView] = useState<'both' | 'forecast' | 'actual'>('both');
  const [tableMonthIndex, setTableMonthIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'tabela' | 'mini-dre'>('tabela');
  const { toast } = useToast();

  const CONTRACTS_PER_PAGE = 10;

  const tableMonths = convertMonthYmsToMonthData(allMonths);
  const displayMonths = startMonth && endMonth ? getMonthsInRange(startMonth, endMonth) : tableMonths;
  const currentTableMonth = tableMonths.length > 0 ? [tableMonths[tableMonthIndex]] : [];

  useEffect(() => {
    const init = async () => {
      const availableMonths = await DashboardService.getAllAvailableMonths('financial_station_results');
      setAllMonths(availableMonths);

      if (availableMonths.length > 0) {
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        let defaultEnd = availableMonths.findIndex(month => month >= currentYearMonth);
        if (defaultEnd === -1) {
          defaultEnd = availableMonths.length - 1;
        } else if (defaultEnd > 0 && availableMonths[defaultEnd] > currentYearMonth) {
          defaultEnd = defaultEnd - 1;
        }

        const defaultStart = Math.max(0, defaultEnd - 11);
        setStartMonth(availableMonths[defaultStart]);
        setEndMonth(availableMonths[defaultEnd]);
        setSelectedMonth(availableMonths[defaultEnd]);
        setTableMonthIndex(defaultEnd);
      }
    };
    init();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (allMonths.length === 0) return;

      const [data, clientsData] = await Promise.all([
        DashboardService.getFinancialStationResults(allMonths),
        DashboardService.getClients()
      ]);

      setClients(clientsData);
      setOriginalData(data);

      const contractsMap = new Map<string, StationResultsTableRow>();

      data.forEach((record) => {
        const key = record.contract_name;

        if (!contractsMap.has(key)) {
          contractsMap.set(key, {
            id: record.id,
            contract_name: record.contract_name,
          });
        }

        const row = contractsMap.get(key)!;
        row[`${record.month_ym}_forecast_revenue`] = record.forecast_revenue;
        row[`${record.month_ym}_revenue`] = record.revenue;
        row[`${record.month_ym}_forecast_net_revenue`] = record.forecast_net_revenue;
        row[`${record.month_ym}_net_revenue`] = record.net_revenue;
        row[`${record.month_ym}_forecast_payroll_ft`] = record.forecast_payroll_ft;
        row[`${record.month_ym}_payroll_ft`] = record.payroll_ft;
        row[`${record.month_ym}_forecast_csv_total`] = record.forecast_csv_total;
        row[`${record.month_ym}_csv_total`] = record.csv_total;
        row[`${record.month_ym}_forecast_contribution_margin`] = record.forecast_contribution_margin;
        row[`${record.month_ym}_contribution_margin`] = record.contribution_margin;
      });

      setTableData(Array.from(contractsMap.values()));

      const uniqueContracts = Array.from(new Set(data.map(d => d.contract_name))).sort();
      setAvailableContracts(uniqueContracts);

      const uniqueCidades = Array.from(new Set(clientsData.map(c => c.cidade).filter(c => c)));
      setAvailableCidades(uniqueCidades as string[]);

      const getClientInfo = (contractName: string) => clientsData.find(c => c.name === contractName);

      let filteredData = data.filter(d => {
        const client = getClientInfo(d.contract_name);

        if (!client) {
          return false;
        }

        if (companyFilter !== 'todas' && client.company !== companyFilter) {
          return false;
        }

        if (tipoFilter !== 'todos' && client.tipo !== tipoFilter) {
          return false;
        }

        if (cidadeFilter !== 'todas' && client.cidade !== cidadeFilter) {
          return false;
        }

        return true;
      });

      if (selectedContracts.length > 0) {
        filteredData = filteredData.filter(d => selectedContracts.includes(d.contract_name));
      }

      const displayMonthsYms = displayMonths.map(m => m.monthYm);
      const chartFilteredData = filteredData.filter(d => displayMonthsYms.includes(d.month_ym));

      const twelveMonthsChart = displayMonths.map((month) => {
        const monthRecords = chartFilteredData.filter((d) => d.month_ym === month.monthYm);
        const faturamento = monthRecords.reduce((sum, r) => sum + Number(r.revenue), 0);
        const faturamento_liquido = monthRecords.reduce((sum, r) => sum + Number(r.net_revenue), 0);
        const margem_contribuicao = monthRecords.reduce((sum, r) => sum + Number(r.contribution_margin), 0);
        const margem_percentual = faturamento > 0 ? (margem_contribuicao / faturamento) * 100 : 0;

        const forecast_faturamento = monthRecords.reduce((sum, r) => sum + Number(r.forecast_revenue), 0);
        const forecast_faturamento_liquido = monthRecords.reduce((sum, r) => sum + Number(r.forecast_net_revenue), 0);
        const forecast_margem_contribuicao = monthRecords.reduce((sum, r) => sum + Number(r.forecast_contribution_margin), 0);

        return {
          monthLabel: month.monthLabel,
          faturamento,
          faturamento_liquido,
          folha_ft: monthRecords.reduce((sum, r) => sum + Number(r.payroll_ft), 0),
          csv_total: monthRecords.reduce((sum, r) => sum + Number(r.csv_total), 0),
          margem_contribuicao,
          forecast_faturamento,
          forecast_faturamento_liquido,
          forecast_folha_ft: monthRecords.reduce((sum, r) => sum + Number(r.forecast_payroll_ft), 0),
          forecast_csv_total: monthRecords.reduce((sum, r) => sum + Number(r.forecast_csv_total), 0),
          forecast_margem_contribuicao,
          margem_percentual,
        };
      });

      setTwelveMonthsData(twelveMonthsChart);

      const totalRevenue = chartFilteredData.reduce((sum, r) => sum + Number(r.revenue), 0);
      const totalMargin = chartFilteredData.reduce((sum, r) => sum + Number(r.contribution_margin), 0);
      setFilteredTotalRevenue(totalRevenue);
      setFilteredTotalMargin(totalMargin);

      if (selectedMonth) {
        updateSingleMonthChart(filteredData, selectedMonth);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de resultados dos postos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSingleMonthChart = (data: FinancialStationResults[], month: string) => {
    const monthRecords = data.filter((d) => d.month_ym === month);

    const chartData = monthRecords.map(record => {
      const faturamento = Number(record.revenue);
      const faturamento_liquido = Number(record.net_revenue);
      const margem_contribuicao = Number(record.contribution_margin);
      const margem_percentual = faturamento > 0 ? (margem_contribuicao / faturamento) * 100 : 0;

      return {
        contract_name: record.contract_name,
        faturamento,
        faturamento_liquido,
        folha_ft: Number(record.payroll_ft),
        csv_total: Number(record.csv_total),
        margem_contribuicao,
        margem_percentual,
      };
    });

    chartData.sort((a, b) => b[sortBy] - a[sortBy]);

    setSingleMonthData(chartData);
    setChartStartIndex(0);
  };

  const visibleChartData = viewMode === 'single'
    ? singleMonthData.slice(chartStartIndex, chartStartIndex + CONTRACTS_PER_PAGE)
    : twelveMonthsData;

  const canGoToPrevious = chartStartIndex > 0;
  const canGoToNext = chartStartIndex + CONTRACTS_PER_PAGE < singleMonthData.length;

  const handlePreviousContracts = () => {
    if (canGoToPrevious) {
      setChartStartIndex(chartStartIndex - CONTRACTS_PER_PAGE);
    }
  };

  const handleNextContracts = () => {
    if (canGoToNext) {
      setChartStartIndex(chartStartIndex + CONTRACTS_PER_PAGE);
    }
  };

  useEffect(() => {
    if (startMonth && endMonth && allMonths.length > 0) {
      loadData();
    }
  }, [startMonth, endMonth, allMonths]);

  useEffect(() => {
    if (selectedMonth && tableData.length > 0) {
      Promise.all([
        DashboardService.getFinancialStationResults(tableMonths.map(m => m.monthYm)),
        DashboardService.getClients()
      ])
        .then(([data, clientsData]) => {
          const getClientInfo = (contractName: string) => clientsData.find(c => c.name === contractName);

          let filteredData = data.filter(d => {
            const client = getClientInfo(d.contract_name);

            if (!client) {
              return false;
            }

            if (companyFilter !== 'todas' && client.company !== companyFilter) {
              return false;
            }

            if (tipoFilter !== 'todos' && client.tipo !== tipoFilter) {
              return false;
            }

            if (cidadeFilter !== 'todas' && client.cidade !== cidadeFilter) {
              return false;
            }

            if (selectedContracts.length > 0 && !selectedContracts.includes(d.contract_name)) {
              return false;
            }

            return true;
          });

          const currentMonth = allMonths[tableMonthIndex];
          updateSingleMonthChart(filteredData, currentMonth);
        })
        .catch(console.error);
    }
  }, [tableMonthIndex, companyFilter, tipoFilter, cidadeFilter, selectedContracts, allMonths]);

  const handleSave = async (data: StationResultsTableRow[]) => {
    try {
      for (const row of data) {
        if (!row.contract_name || !row.contract_name.trim()) {
          toast({
            title: 'Erro de validação',
            description: 'O nome do contrato não pode estar vazio.',
            variant: 'destructive',
          });
          return;
        }
      }

      const currentRecords: Omit<FinancialStationResults, 'id' | 'created_at' | 'updated_at'>[] = [];

      data.forEach((row) => {
        tableMonths.forEach((month) => {
          const forecast_revenue = Number(row[`${month.monthYm}_forecast_revenue`]) || 0;
          const revenue = Number(row[`${month.monthYm}_revenue`]) || 0;
          const forecast_net_revenue = Number(row[`${month.monthYm}_forecast_net_revenue`]) || 0;
          const net_revenue = Number(row[`${month.monthYm}_net_revenue`]) || 0;
          const forecast_payroll_ft = Number(row[`${month.monthYm}_forecast_payroll_ft`]) || 0;
          const payroll_ft = Number(row[`${month.monthYm}_payroll_ft`]) || 0;
          const forecast_csv_total = Number(row[`${month.monthYm}_forecast_csv_total`]) || 0;
          const csv_total = Number(row[`${month.monthYm}_csv_total`]) || 0;
          const forecast_contribution_margin = Number(row[`${month.monthYm}_forecast_contribution_margin`]) || 0;
          const contribution_margin = Number(row[`${month.monthYm}_contribution_margin`]) || 0;

          currentRecords.push({
            contract_name: row.contract_name,
            month_ym: month.monthYm,
            forecast_revenue,
            revenue,
            forecast_net_revenue,
            net_revenue,
            forecast_payroll_ft,
            payroll_ft,
            forecast_csv_total,
            csv_total,
            forecast_contribution_margin,
            contribution_margin,
          });
        });
      });

      await DashboardService.syncFinancialStationResults(currentRecords, originalData);
      await loadData();

      toast({
        title: 'Sucesso',
        description: 'Dados salvos com sucesso.',
      });
    } catch (error) {
      console.error('Error saving data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao salvar',
        description: `Não foi possível salvar os dados. ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const handlePreviousMonth = () => {
    if (tableMonthIndex > 0) {
      setTableMonthIndex(tableMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (tableMonthIndex < tableMonths.length - 1) {
      setTableMonthIndex(tableMonthIndex + 1);
    }
  };

  return (
    <IndicatorCard
      title="Resultados dos Postos"
      subtitle="Análise detalhada por contrato"
      accentColor="#F1C40F"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <Button
              variant="secondary"
              onClick={() => window.open('https://grupowws.sharepoint.com/:x:/s/Gesto/EWFbvIEwMypFkkzFiliZdzAB1cvQlq5ZoJca50anU9te-w?e=57JCOZ', '_blank')}
            >
              Planilha
            </Button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Visualização:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as '12months' | 'single')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12months">Vários Meses</option>
                <option value="single">Mês Individual</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Empresa:</label>
              <select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value as 'todas' | 'WWS' | 'Worldwide');
                  loadData();
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo:</label>
              <select
                value={tipoFilter}
                onChange={(e) => {
                  setTipoFilter(e.target.value as 'todos' | 'Público' | 'Privado');
                  loadData();
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="Público">Público</option>
                <option value="Privado">Privado</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Cidade:</label>
              <select
                value={cidadeFilter}
                onChange={(e) => {
                  setCidadeFilter(e.target.value);
                  loadData();
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                {availableCidades.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 relative">
              <label className="text-sm font-medium text-gray-700">Contratos:</label>
              <div className="relative min-w-[300px]">
                <input
                  type="text"
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  onFocus={() => setIsContractDropdownOpen(true)}
                  placeholder={selectedContracts.length === 0 ? 'Todos os contratos' : `${selectedContracts.length} contrato(s) selecionado(s)`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isContractDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsContractDropdownOpen(false)}
                    />
                    <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
                        onClick={() => {
                          setSelectedContracts([]);
                          setContractSearch('');
                          setIsContractDropdownOpen(false);
                          loadData();
                        }}
                      >
                        <span className="text-sm">Todos os contratos</span>
                      </div>
                      {availableContracts
                        .filter(contract => contract.toLowerCase().includes(contractSearch.toLowerCase()))
                        .map((contract) => (
                          <div
                            key={contract}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              const existing = selectedContracts.includes(contract);
                              if (existing) {
                                setSelectedContracts(selectedContracts.filter(c => c !== contract));
                              } else {
                                setSelectedContracts([...selectedContracts, contract]);
                              }
                              setContractSearch('');
                              loadData();
                            }}
                          >
                            <span className="text-sm">{contract}</span>
                            {selectedContracts.includes(contract) && (
                              <span className="text-blue-600">✓</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
              {selectedContracts.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedContracts([]);
                    setContractSearch('');
                    loadData();
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <div className="text-xs text-gray-600 mb-1">Faturamento Total</div>
                <div className="text-lg font-bold text-blue-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filteredTotalRevenue)}
                </div>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <div className="text-xs text-gray-600 mb-1">Margem de Contribuição</div>
                <div className="text-lg font-bold text-green-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filteredTotalMargin)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {filteredTotalRevenue > 0 ? `${((filteredTotalMargin / filteredTotalRevenue) * 100).toFixed(1)}% do faturamento` : '0.0%'}
                </div>
              </div>
            </div>

            {viewMode === '12months' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600 font-medium">Filtros rápidos:</span>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      let endIdx = allMonths.findIndex(month => month >= currentYearMonth);
                      if (endIdx === -1) {
                        endIdx = allMonths.length - 1;
                      } else if (endIdx > 0 && allMonths[endIdx] > currentYearMonth) {
                        endIdx = endIdx - 1;
                      }
                      const startIdx = Math.max(0, endIdx - 1);
                      setStartMonth(allMonths[startIdx]);
                      setEndMonth(allMonths[endIdx]);
                    }}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Últimos 2 meses
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      let endIdx = allMonths.findIndex(month => month >= currentYearMonth);
                      if (endIdx === -1) {
                        endIdx = allMonths.length - 1;
                      } else if (endIdx > 0 && allMonths[endIdx] > currentYearMonth) {
                        endIdx = endIdx - 1;
                      }
                      const startIdx = Math.max(0, endIdx - 2);
                      setStartMonth(allMonths[startIdx]);
                      setEndMonth(allMonths[endIdx]);
                    }}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Últimos 3 meses
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      let endIdx = allMonths.findIndex(month => month >= currentYearMonth);
                      if (endIdx === -1) {
                        endIdx = allMonths.length - 1;
                      } else if (endIdx > 0 && allMonths[endIdx] > currentYearMonth) {
                        endIdx = endIdx - 1;
                      }
                      const startIdx = Math.max(0, endIdx - 5);
                      setStartMonth(allMonths[startIdx]);
                      setEndMonth(allMonths[endIdx]);
                    }}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Últimos 6 meses
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      let endIdx = allMonths.findIndex(month => month >= currentYearMonth);
                      if (endIdx === -1) {
                        endIdx = allMonths.length - 1;
                      } else if (endIdx > 0 && allMonths[endIdx] > currentYearMonth) {
                        endIdx = endIdx - 1;
                      }
                      const startIdx = Math.max(0, endIdx - 11);
                      setStartMonth(allMonths[startIdx]);
                      setEndMonth(allMonths[endIdx]);
                    }}
                    className="text-xs px-3 py-1 border border-blue-500 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors font-medium"
                  >
                    Últimos 12 meses
                  </button>
                  <button
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      const startIdx = allMonths.findIndex(month => month.startsWith(currentYear.toString()));
                      if (startIdx !== -1) {
                        const now = new Date();
                        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                        let endIdx = allMonths.findIndex(month => month >= currentYearMonth);
                        if (endIdx === -1) {
                          endIdx = allMonths.length - 1;
                        } else if (endIdx > 0 && allMonths[endIdx] > currentYearMonth) {
                          endIdx = endIdx - 1;
                        }
                        setStartMonth(allMonths[startIdx]);
                        setEndMonth(allMonths[endIdx]);
                      }
                    }}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Ano atual
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">De:</label>
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {tableMonths.map((month) => (
                        <option key={month.monthYm} value={month.monthYm}>
                          {month.monthLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Até:</label>
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {tableMonths.map((month) => (
                        <option key={month.monthYm} value={month.monthYm}>
                          {month.monthLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'single' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Organização:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const newSortBy = e.target.value as typeof sortBy;
                      setSortBy(newSortBy);
                      if (selectedMonth) {
                        Promise.all([
                          DashboardService.getFinancialStationResults(tableMonths.map(m => m.monthYm)),
                          DashboardService.getClients()
                        ])
                          .then(([data, clientsData]) => {
                            const getClientInfo = (contractName: string) => clientsData.find(c => c.name === contractName);

                            let filteredData = data.filter(d => {
                              const client = getClientInfo(d.contract_name);

                              if (!client) {
                                return false;
                              }

                              if (companyFilter !== 'todas' && client.company !== companyFilter) {
                                return false;
                              }

                              if (tipoFilter !== 'todos' && client.tipo !== tipoFilter) {
                                return false;
                              }

                              if (cidadeFilter !== 'todas' && client.cidade !== cidadeFilter) {
                                return false;
                              }

                              if (selectedContracts.length > 0 && !selectedContracts.includes(d.contract_name)) {
                                return false;
                              }

                              return true;
                            });
                            const monthRecords = filteredData.filter((d) => d.month_ym === selectedMonth);
                            const chartData = monthRecords.map(record => {
                              const faturamento = Number(record.revenue);
                              const faturamento_liquido = Number(record.net_revenue);
                              const margem_contribuicao = Number(record.contribution_margin);
                              const margem_percentual = faturamento > 0 ? (margem_contribuicao / faturamento) * 100 : 0;

                              return {
                                contract_name: record.contract_name,
                                faturamento,
                                faturamento_liquido,
                                folha_ft: Number(record.payroll_ft),
                                csv_total: Number(record.csv_total),
                                margem_contribuicao,
                                margem_percentual,
                              };
                            });
                            chartData.sort((a, b) => b[newSortBy] - a[newSortBy]);
                            setSingleMonthData(chartData);
                            setChartStartIndex(0);
                          })
                          .catch(console.error);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="faturamento">Faturamento</option>
                    <option value="folha_ft">Folha + FT</option>
                    <option value="csv_total">CSV + Reversão Impostos</option>
                    <option value="margem_contribuicao">Margem de Contribuição</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {chartType === 'values' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="text-sm font-medium text-gray-700">Exibir dados:</label>
                <select
                  value={dataView}
                  onChange={(e) => setDataView(e.target.value as 'both' | 'forecast' | 'actual')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="both">Previsto x Realizado</option>
                  <option value="forecast">Apenas Previsto</option>
                  <option value="actual">Apenas Realizado</option>
                </select>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-gray-700">Exibir no gráfico:</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleMetrics.faturamento}
                  onChange={(e) => setVisibleMetrics({ ...visibleMetrics, faturamento: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Faturamento Bruto</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleMetrics.faturamento_liquido}
                  onChange={(e) => setVisibleMetrics({ ...visibleMetrics, faturamento_liquido: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Faturamento Líquido</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleMetrics.folha_ft}
                  onChange={(e) => setVisibleMetrics({ ...visibleMetrics, folha_ft: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Folha + FT</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleMetrics.csv_total}
                  onChange={(e) => setVisibleMetrics({ ...visibleMetrics, csv_total: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">CSV + Reversão Impostos</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleMetrics.margem_contribuicao}
                  onChange={(e) => setVisibleMetrics({ ...visibleMetrics, margem_contribuicao: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Margem de Contribuição</span>
              </label>
            </div>
            </div>
          )}
        </div>

        <div className="mb-4 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setChartType('values')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              chartType === 'values'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gráfico em R$
          </button>
          <button
            onClick={() => setChartType('percentages')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              chartType === 'percentages'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Relações %
          </button>
        </div>

        <div className="relative">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'values' ? (
                viewMode === '12months' ? (
                  <ComposedChart data={twelveMonthsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {(dataView === 'forecast' || dataView === 'both') && visibleMetrics.csv_total && <Bar dataKey="forecast_csv_total" name="CSV (Prev)" fill="#fcd34d" />}
                    {(dataView === 'actual' || dataView === 'both') && visibleMetrics.csv_total && <Bar dataKey="csv_total" name="CSV (Real)" fill="#f59e0b" />}
                    {(dataView === 'forecast' || dataView === 'both') && visibleMetrics.faturamento && <Line type="monotone" dataKey="forecast_faturamento" name="Fat. Bruto (Prev)" stroke="#fca5a5" strokeWidth={2} strokeDasharray="5 5" />}
                    {(dataView === 'actual' || dataView === 'both') && visibleMetrics.faturamento && <Line type="monotone" dataKey="faturamento" name="Fat. Bruto (Real)" stroke="#ef4444" strokeWidth={2} />}
                    {(dataView === 'forecast' || dataView === 'both') && visibleMetrics.faturamento_liquido && <Line type="monotone" dataKey="forecast_faturamento_liquido" name="Fat. Líq. (Prev)" stroke="#c4b5fd" strokeWidth={2} strokeDasharray="5 5" />}
                    {(dataView === 'actual' || dataView === 'both') && visibleMetrics.faturamento_liquido && <Line type="monotone" dataKey="faturamento_liquido" name="Fat. Líq. (Real)" stroke="#8b5cf6" strokeWidth={2} />}
                    {(dataView === 'forecast' || dataView === 'both') && visibleMetrics.folha_ft && <Bar dataKey="forecast_folha_ft" name="Folha + FT (Prev)" fill="#93c5fd" />}
                    {(dataView === 'actual' || dataView === 'both') && visibleMetrics.folha_ft && <Bar dataKey="folha_ft" name="Folha + FT (Real)" fill="#3b82f6" />}
                    {(dataView === 'forecast' || dataView === 'both') && visibleMetrics.margem_contribuicao && <Bar dataKey="forecast_margem_contribuicao" name="Margem (Prev)" fill="#6ee7b7" />}
                    {(dataView === 'actual' || dataView === 'both') && visibleMetrics.margem_contribuicao && <Bar dataKey="margem_contribuicao" name="Margem (Real)" fill="#10b981" />}
                  </ComposedChart>
                ) : (
                  <ComposedChart data={visibleChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="contract_name"
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {visibleMetrics.folha_ft && <Bar dataKey="folha_ft" name="Folha + FT" fill="#3b82f6" />}
                    {visibleMetrics.csv_total && <Bar dataKey="csv_total" name="CSV + Reversão Impostos" fill="#f59e0b" />}
                    {visibleMetrics.margem_contribuicao && <Bar dataKey="margem_contribuicao" name="Margem de Contribuição" fill="#10b981" />}
                    {visibleMetrics.faturamento && <Line type="monotone" dataKey="faturamento" name="Faturamento Bruto" stroke="#ef4444" strokeWidth={2} />}
                    {visibleMetrics.faturamento_liquido && <Line type="monotone" dataKey="faturamento_liquido" name="Faturamento Líquido" stroke="#8b5cf6" strokeWidth={2} />}
                  </ComposedChart>
                )
              ) : (
                (() => {
                  const filteredTableData = tableData.filter(row => {
                    const client = clients.find(c => c.name === row.contract_name);
                    if (!client) return false;
                    if (companyFilter !== 'todas' && client.company !== companyFilter) return false;
                    if (tipoFilter !== 'todos' && client.tipo !== tipoFilter) return false;
                    if (cidadeFilter !== 'todas' && client.cidade !== cidadeFilter) return false;
                    if (selectedContracts.length > 0 && !selectedContracts.includes(row.contract_name)) return false;
                    return true;
                  });

                  const relationsChartData = displayMonths.map((month) => {
                    const folhaFt = filteredTableData.reduce((sum, row) => sum + (Number(row[`${month.monthYm}_payroll_ft`]) || 0), 0);
                    const csvTotal = filteredTableData.reduce((sum, row) => sum + (Number(row[`${month.monthYm}_csv_total`]) || 0), 0);
                    const margemContribuicao = filteredTableData.reduce((sum, row) => sum + (Number(row[`${month.monthYm}_contribution_margin`]) || 0), 0);
                    const netRevenue = filteredTableData.reduce((sum, row) => sum + (Number(row[`${month.monthYm}_net_revenue`]) || 0), 0);

                    return {
                      monthLabel: month.monthLabel,
                      folha_ft_percent: netRevenue !== 0 ? (folhaFt / netRevenue) * 100 : 0,
                      csv_total_percent: netRevenue !== 0 ? (csvTotal / netRevenue) * 100 : 0,
                      margem_contribuicao_percent: netRevenue !== 0 ? (margemContribuicao / netRevenue) * 100 : 0,
                    };
                  });

                  const minValue = Math.min(
                    ...relationsChartData.map(d => Math.min(d.folha_ft_percent, d.csv_total_percent, d.margem_contribuicao_percent)),
                    0
                  );
                  const maxValue = Math.max(
                    ...relationsChartData.map(d => Math.max(d.folha_ft_percent, d.csv_total_percent, d.margem_contribuicao_percent)),
                    100
                  );

                  const yAxisDomain = [
                    Math.floor(minValue / 10) * 10 - 10,
                    Math.ceil(maxValue / 10) * 10
                  ];

                  return (
                    <ComposedChart data={relationsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthLabel" />
                      <YAxis
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                        domain={yAxisDomain}
                      />
                      <Tooltip
                        formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                      />
                      <Legend />
                      {yAxisDomain[0] < 0 && (
                        <ReferenceArea
                          y1={yAxisDomain[0]}
                          y2={0}
                          fill="#ef4444"
                          fillOpacity={0.15}
                          ifOverflow="extendDomain"
                        />
                      )}
                      {yAxisDomain[1] > 100 && (
                        <ReferenceArea
                          y1={100}
                          y2={yAxisDomain[1]}
                          fill="#ef4444"
                          fillOpacity={0.15}
                          ifOverflow="extendDomain"
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="folha_ft_percent"
                        name="Folha + FT (%)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                      >
                        <LabelList
                          dataKey="folha_ft_percent"
                          position="top"
                          formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
                          style={{ fontSize: '10px', fill: '#3b82f6' }}
                        />
                      </Line>
                      <Line
                        type="monotone"
                        dataKey="csv_total_percent"
                        name="CSV + Reversão Impostos (%)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 4 }}
                      >
                        <LabelList
                          dataKey="csv_total_percent"
                          position="top"
                          formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
                          style={{ fontSize: '10px', fill: '#f59e0b' }}
                        />
                      </Line>
                      <Line
                        type="monotone"
                        dataKey="margem_contribuicao_percent"
                        name="Margem de Contribuição (%)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                      >
                        <LabelList
                          dataKey="margem_contribuicao_percent"
                          position="top"
                          formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
                          style={{ fontSize: '10px', fill: '#10b981' }}
                        />
                      </Line>
                    </ComposedChart>
                  );
                })()
              )}
            </ResponsiveContainer>
          </div>

          {viewMode === 'single' && chartType === 'values' && singleMonthData.length > CONTRACTS_PER_PAGE && (
            <>
              <button
                onClick={handlePreviousContracts}
                disabled={!canGoToPrevious}
                className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white border-2 rounded-full p-2 shadow-lg transition-all ${
                  canGoToPrevious
                    ? 'border-blue-500 text-blue-500 hover:bg-blue-50 cursor-pointer'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                }`}
                title="Contratos anteriores"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNextContracts}
                disabled={!canGoToNext}
                className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white border-2 rounded-full p-2 shadow-lg transition-all ${
                  canGoToNext
                    ? 'border-blue-500 text-blue-500 hover:bg-blue-50 cursor-pointer'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                }`}
                title="Próximos contratos"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="text-center mt-2 text-sm text-gray-600">
                Exibindo {chartStartIndex + 1} a {Math.min(chartStartIndex + CONTRACTS_PER_PAGE, singleMonthData.length)} de {singleMonthData.length} contratos
              </div>
            </>
          )}
        </div>

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('tabela')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'tabela'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setActiveTab('mini-dre')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'mini-dre'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Mini-DRE
            </button>
          </div>
        </div>

        {activeTab === 'tabela' && (
          <>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                disabled={tableMonthIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Mês Anterior
              </Button>
              <span className="text-sm font-medium text-gray-700">
                {currentTableMonth.length > 0 ? currentTableMonth[0].monthLabel : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={tableMonthIndex === tableMonths.length - 1}
                className="flex items-center gap-2"
              >
                Próximo Mês
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <StationResultsTable
              data={tableData}
              months={currentTableMonth}
              onSave={handleSave}
              loading={loading}
              selectedContracts={selectedContracts}
              companyFilter={companyFilter}
              tipoFilter={tipoFilter}
              cidadeFilter={cidadeFilter}
            />
          </>
        )}

        {activeTab === 'mini-dre' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                    Indicador
                  </th>
                  {displayMonths.map((month) => (
                    <th key={month.monthYm} className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">
                      {month.monthLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                    Faturamento Bruto
                  </td>
                  {displayMonths.map((month) => {
                    const monthData = twelveMonthsData.find(d => d.monthLabel === month.monthLabel);
                    const value = monthData ? monthData.faturamento / 1000 : 0;
                    return (
                      <td key={month.monthYm} className="border border-gray-300 px-4 py-2 text-right">
                        {value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                    Faturamento Líquido
                  </td>
                  {displayMonths.map((month) => {
                    const monthData = twelveMonthsData.find(d => d.monthLabel === month.monthLabel);
                    const value = monthData ? monthData.faturamento_liquido / 1000 : 0;
                    return (
                      <td key={month.monthYm} className="border border-gray-300 px-4 py-2 text-right">
                        {value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                    CSV + Reversão de Impostos
                  </td>
                  {displayMonths.map((month) => {
                    const monthData = twelveMonthsData.find(d => d.monthLabel === month.monthLabel);
                    const value = monthData ? monthData.csv_total / 1000 : 0;
                    return (
                      <td key={month.monthYm} className="border border-gray-300 px-4 py-2 text-right">
                        {value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold text-gray-900">
                    Margem de Contribuição
                  </td>
                  {displayMonths.map((month) => {
                    const monthData = twelveMonthsData.find(d => d.monthLabel === month.monthLabel);
                    const value = monthData ? monthData.margem_contribuicao / 1000 : 0;
                    return (
                      <td key={month.monthYm} className="border border-gray-300 px-4 py-2 text-right font-bold">
                        {value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </IndicatorCard>
  );
}
