import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { StackedBars } from '@/components/charts/StackedBars';
import { DashboardService } from '@/services/dashboardService';
import { convertMonthYmsToMonthData } from '@/lib/months';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BillingData {
  monthLabel: string;
  monthYm: string;
  [key: string]: string | number;
}

interface DateRange {
  startIndex: number;
  endIndex: number;
}

export function BillingCard() {
  const [loading, setLoading] = useState(true);
  const [tipoData, setTipoData] = useState<BillingData[]>([]);
  const [companyData, setCompanyData] = useState<BillingData[]>([]);
  const [cidadeData, setCidadeData] = useState<BillingData[]>([]);
  const [allMonths, setAllMonths] = useState<string[]>([]);

  const [tipoRange, setTipoRange] = useState<DateRange | null>(null);
  const [companyRange, setCompanyRange] = useState<DateRange | null>(null);
  const [cidadeRange, setCidadeRange] = useState<DateRange | null>(null);

  const { toast } = useToast();

  const loadData = async (monthsToLoad: string[]) => {
    setLoading(true);
    try {
      const [stationResults, clients] = await Promise.all([
        DashboardService.getFinancialStationResults(monthsToLoad),
        DashboardService.getClients()
      ]);

      const clientsMap = new Map(clients.map(c => [c.name, c]));
      const months = convertMonthYmsToMonthData(monthsToLoad);

      const tipoByMonth = new Map<string, { Publico: number; Privado: number }>();
      const companyByMonth = new Map<string, { WWS: number; Worldwide: number }>();
      const cidadeByMonth = new Map<string, Map<string, number>>();

      monthsToLoad.forEach(monthYm => {
        tipoByMonth.set(monthYm, { Publico: 0, Privado: 0 });
        companyByMonth.set(monthYm, { WWS: 0, Worldwide: 0 });
        cidadeByMonth.set(monthYm, new Map());
      });

      stationResults.forEach(result => {
        const client = clientsMap.get(result.contract_name);
        const revenue = Number(result.revenue) || 0;

        if (client?.tipo) {
          const tipoKey = client.tipo === 'Público' ? 'Publico' : 'Privado';
          const current = tipoByMonth.get(result.month_ym);
          if (current) {
            current[tipoKey] += revenue;
          }
        }

        if (client?.company) {
          const current = companyByMonth.get(result.month_ym);
          if (current) {
            current[client.company as 'WWS' | 'Worldwide'] += revenue;
          }
        }

        if (client?.cidade) {
          const cidadeMap = cidadeByMonth.get(result.month_ym);
          if (cidadeMap) {
            cidadeMap.set(client.cidade, (cidadeMap.get(client.cidade) || 0) + revenue);
          }
        }
      });

      const tipoChartData: BillingData[] = months.map(month => {
        const data = tipoByMonth.get(month.monthYm);
        return {
          monthLabel: month.monthLabel,
          monthYm: month.monthYm,
          Público: data?.Publico || 0,
          Privado: data?.Privado || 0,
        };
      });

      const companyChartData: BillingData[] = months.map(month => {
        const data = companyByMonth.get(month.monthYm);
        return {
          monthLabel: month.monthLabel,
          monthYm: month.monthYm,
          WWS: data?.WWS || 0,
          Worldwide: data?.Worldwide || 0,
        };
      });

      const allCidades = new Set<string>();
      cidadeByMonth.forEach(map => {
        map.forEach((_, cidade) => allCidades.add(cidade));
      });

      const cidadeChartData: BillingData[] = months.map(month => {
        const cidadeMap = cidadeByMonth.get(month.monthYm);
        const row: BillingData = {
          monthLabel: month.monthLabel,
          monthYm: month.monthYm
        };

        allCidades.forEach(cidade => {
          row[cidade] = cidadeMap?.get(cidade) || 0;
        });

        return row;
      });

      setTipoData(tipoChartData);
      setCompanyData(companyChartData);
      setCidadeData(cidadeChartData);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de faturamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
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
          setTipoRange({ startIndex: defaultStart, endIndex: defaultEnd });
          setCompanyRange({ startIndex: defaultStart, endIndex: defaultEnd });
          setCidadeRange({ startIndex: defaultStart, endIndex: defaultEnd });

          await loadData(availableMonths);
        } else {
          setLoading(false);
        }
      } catch (error) {
        toast({
          title: "Erro ao inicializar",
          description: "Não foi possível carregar os meses disponíveis.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    init();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateVariation = (current: number, previous: number): { value: number; formatted: string; isPositive: boolean } => {
    if (previous === 0) {
      return { value: 0, formatted: '-', isPositive: true };
    }
    const variation = ((current - previous) / previous) * 100;
    const isPositive = variation >= 0;
    return {
      value: variation,
      formatted: `${isPositive ? '+' : ''}${variation.toFixed(1)}%`,
      isPositive
    };
  };

  const renderTable = (data: BillingData[], columns: string[]) => {
    return (
      <div className="rounded-lg border overflow-auto max-h-80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              {columns.map(col => (
                <TableHead key={col} className="text-right">{col}</TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const total = columns.reduce((sum, col) => sum + (Number(row[col]) || 0), 0);
              const previousTotal = index > 0
                ? columns.reduce((sum, col) => sum + (Number(data[index - 1][col]) || 0), 0)
                : 0;
              const variation = calculateVariation(total, previousTotal);

              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.monthLabel}</TableCell>
                  {columns.map(col => (
                    <TableCell key={col} className="text-right">
                      {formatCurrency(Number(row[col]) || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {index === 0 ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span className={variation.isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {variation.formatted}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const handlePeriodFilter = (periodType: string, setRange: (range: DateRange) => void) => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let endIndex = allMonths.findIndex(month => month >= currentYearMonth);
    if (endIndex === -1) {
      endIndex = allMonths.length - 1;
    } else if (endIndex > 0 && allMonths[endIndex] > currentYearMonth) {
      endIndex = endIndex - 1;
    }

    let startIndex = 0;

    switch (periodType) {
      case 'last2':
        startIndex = Math.max(0, endIndex - 1);
        break;
      case 'last3':
        startIndex = Math.max(0, endIndex - 2);
        break;
      case 'last6':
        startIndex = Math.max(0, endIndex - 5);
        break;
      case 'last12':
        startIndex = Math.max(0, endIndex - 11);
        break;
      case 'currentYear':
        const currentYear = new Date().getFullYear();
        startIndex = allMonths.findIndex(month => month.startsWith(currentYear.toString()));
        if (startIndex === -1) startIndex = 0;
        break;
      default:
        startIndex = 0;
    }

    setRange({ startIndex, endIndex });
  };

  const renderMonthSelector = (
    range: DateRange,
    setRange: (range: DateRange) => void,
    allData: BillingData[]
  ) => {
    return (
      <div className="space-y-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-600 font-medium">Filtros rápidos:</span>
          <button
            onClick={() => handlePeriodFilter('last2', setRange)}
            className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Últimos 2 meses
          </button>
          <button
            onClick={() => handlePeriodFilter('last3', setRange)}
            className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Últimos 3 meses
          </button>
          <button
            onClick={() => handlePeriodFilter('last6', setRange)}
            className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Últimos 6 meses
          </button>
          <button
            onClick={() => handlePeriodFilter('last12', setRange)}
            className="text-xs px-3 py-1 border border-blue-500 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors font-medium"
          >
            Últimos 12 meses
          </button>
          <button
            onClick={() => handlePeriodFilter('currentYear', setRange)}
            className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Ano atual
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">De:</label>
            <select
              value={range.startIndex}
              onChange={(e) => {
                const newStart = Number(e.target.value);
                if (newStart <= range.endIndex) {
                  setRange({ ...range, startIndex: newStart });
                }
              }}
              className="text-xs border rounded px-2 py-1 bg-white"
            >
              {allData.map((_, index) => (
                <option key={index} value={index}>
                  {allData[index].monthLabel}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Até:</label>
            <select
              value={range.endIndex}
              onChange={(e) => {
                const newEnd = Number(e.target.value);
                if (newEnd >= range.startIndex) {
                  setRange({ ...range, endIndex: newEnd });
                }
              }}
              className="text-xs border rounded px-2 py-1 bg-white"
            >
              {allData.map((_, index) => (
                <option key={index} value={index}>
                  {allData[index].monthLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !tipoRange || !companyRange || !cidadeRange) {
    return (
      <IndicatorCard
        title="Faturamento"
        subtitle="Todos os meses disponíveis"
        accentColor="#2ECC71"
      >
        <div className="flex items-center justify-center h-64 text-gray-500">
          Carregando dados...
        </div>
      </IndicatorCard>
    );
  }

  const filteredTipoData = tipoData.slice(tipoRange.startIndex, tipoRange.endIndex + 1);
  const filteredCompanyData = companyData.slice(companyRange.startIndex, companyRange.endIndex + 1);
  const filteredCidadeData = cidadeData.slice(cidadeRange.startIndex, cidadeRange.endIndex + 1);

  return (
    <IndicatorCard
      title="Faturamento"
      subtitle={`${allMonths.length} meses disponíveis`}
      accentColor="#2ECC71"
    >
      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Por Tipo</h4>
          {renderMonthSelector(tipoRange, setTipoRange, tipoData)}
          <Tabs defaultValue="grafico" className="w-full">
            <TabsList className="grid w-48 grid-cols-2">
              <TabsTrigger value="grafico">Gráfico</TabsTrigger>
              <TabsTrigger value="tabela">Tabela</TabsTrigger>
            </TabsList>
            <TabsContent value="grafico">
              <StackedBars
                data={filteredTipoData}
                series={[
                  { key: 'Público', name: 'Público', color: '#10B981' },
                  { key: 'Privado', name: 'Privado', color: '#F59E0B' }
                ]}
                yAxisLabel="Faturamento (R$)"
              />
            </TabsContent>
            <TabsContent value="tabela">
              {renderTable(filteredTipoData, ['Público', 'Privado'])}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Por Empresa</h4>
          {renderMonthSelector(companyRange, setCompanyRange, companyData)}
          <Tabs defaultValue="grafico" className="w-full">
            <TabsList className="grid w-48 grid-cols-2">
              <TabsTrigger value="grafico">Gráfico</TabsTrigger>
              <TabsTrigger value="tabela">Tabela</TabsTrigger>
            </TabsList>
            <TabsContent value="grafico">
              <StackedBars
                data={filteredCompanyData}
                series={[
                  { key: 'WWS', name: 'WWS', color: '#3B82F6' },
                  { key: 'Worldwide', name: 'Worldwide', color: '#8B5CF6' }
                ]}
                yAxisLabel="Faturamento (R$)"
              />
            </TabsContent>
            <TabsContent value="tabela">
              {renderTable(filteredCompanyData, ['WWS', 'Worldwide'])}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Por Cidade</h4>
          {cidadeData.length > 0 && (
            <>
              {renderMonthSelector(cidadeRange, setCidadeRange, cidadeData)}
              <Tabs defaultValue="grafico" className="w-full">
                <TabsList className="grid w-48 grid-cols-2">
                  <TabsTrigger value="grafico">Gráfico</TabsTrigger>
                  <TabsTrigger value="tabela">Tabela</TabsTrigger>
                </TabsList>
                <TabsContent value="grafico">
                  <StackedBars
                    data={filteredCidadeData}
                    series={Object.keys(cidadeData[0])
                      .filter(k => k !== 'monthLabel' && k !== 'monthYm')
                      .map((cidade, index) => ({
                        key: cidade,
                        name: cidade,
                        color: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#14B8A6', '#84CC16'][index % 10]
                      }))}
                    yAxisLabel="Faturamento (R$)"
                  />
                </TabsContent>
                <TabsContent value="tabela">
                  {renderTable(
                    filteredCidadeData,
                    Object.keys(cidadeData[0]).filter(k => k !== 'monthLabel' && k !== 'monthYm')
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </IndicatorCard>
  );
}
