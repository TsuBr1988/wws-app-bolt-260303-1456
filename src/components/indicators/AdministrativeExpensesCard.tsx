import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { AdministrativeExpensesTable } from '@/components/dashboard/AdministrativeExpensesTable';
import { DashboardService } from '@/services/dashboardService';
import { convertMonthYmsToMonthData } from '@/lib/months';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface AdminExpenseRow {
  id: string;
  company: 'WWS' | 'Worldwide';
  department: string;
  [key: string]: string | number;
}

interface ChartData {
  monthLabel: string;
  [key: string]: string | number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: R$ {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function AdministrativeExpensesCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<AdminExpenseRow[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [companyFilter, setCompanyFilter] = useState<'todas' | 'WWS' | 'Worldwide'>('todas');
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [displayStartIndex, setDisplayStartIndex] = useState(0);
  const [displayEndIndex, setDisplayEndIndex] = useState(0);
  const { toast } = useToast();

  const months = convertMonthYmsToMonthData(allMonths);
  const displayMonths = months.slice(displayStartIndex, displayEndIndex + 1);

  const loadData = async (monthsToLoad: string[]) => {
    setLoading(true);
    try {
      const data = await DashboardService.getFinancialAdministrativeExpenses(monthsToLoad);

      const departmentsMap = new Map<string, AdminExpenseRow>();

      data.forEach((record) => {
        const key = `${record.company}_${record.department}`;

        if (!departmentsMap.has(key)) {
          const row: AdminExpenseRow = {
            id: key,
            company: record.company as 'WWS' | 'Worldwide',
            department: record.department,
          };

          monthsToLoad.forEach((monthYm) => {
            row[monthYm] = 0;
          });

          departmentsMap.set(key, row);
        }

        const row = departmentsMap.get(key)!;
        row[record.month_ym] = record.amount || 0;
      });

      let rows = Array.from(departmentsMap.values());

      if (companyFilter !== 'todas') {
        rows = rows.filter(row => row.company === companyFilter);
      }

      setTableData(rows);
      prepareChartData(rows);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as despesas administrativas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (rows: AdminExpenseRow[]) => {
    const chartDataMap = new Map<string, ChartData>();

    displayMonths.forEach((month) => {
      const monthData: ChartData = {
        monthLabel: month.monthLabel,
      };

      rows.forEach((row) => {
        const key = `${row.company} - ${row.department}`;
        monthData[key] = Number(row[month.monthYm]) || 0;
      });

      chartDataMap.set(month.monthYm, monthData);
    });

    setChartData(Array.from(chartDataMap.values()));
  };

  useEffect(() => {
    const init = async () => {
      try {
        const availableMonths = await DashboardService.getAllAvailableMonths('fin_administrative_expenses');
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
          setDisplayStartIndex(defaultStart);
          setDisplayEndIndex(defaultEnd);

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

  useEffect(() => {
    if (allMonths.length > 0 && companyFilter) {
      loadData(allMonths);
    }
  }, [companyFilter]);

  const handleSave = async (data: AdminExpenseRow[]) => {
    try {
      const records: { company: string; department: string; month_ym: string; amount: number }[] = [];

      data.forEach((row) => {
        if (!row.department || row.department.trim() === '') {
          toast({
            title: 'Erro de validação',
            description: 'O nome do departamento não pode estar vazio.',
            variant: 'destructive',
          });
          return;
        }

        allMonths.forEach((monthYm) => {
          const amount = Number(row[monthYm]) || 0;

          records.push({
            company: row.company,
            department: row.department,
            month_ym: monthYm,
            amount,
          });
        });
      });

      await DashboardService.upsertFinancialAdministrativeExpenses(records);
      await loadData();

      toast({
        title: 'Sucesso',
        description: 'Dados salvos com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    }
  };

  const allDepartmentKeys = Array.from(
    new Set(
      tableData.map((row) => `${row.company} - ${row.department}`)
    )
  );

  return (
    <IndicatorCard
      title="Despesas Administrativas"
      subtitle="Análise de custos por departamento"
      accentColor="#E74C3C"
    >
      <div className="space-y-6">
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
                setDisplayStartIndex(startIdx);
                setDisplayEndIndex(endIdx);
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
                setDisplayStartIndex(startIdx);
                setDisplayEndIndex(endIdx);
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
                setDisplayStartIndex(startIdx);
                setDisplayEndIndex(endIdx);
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
                setDisplayStartIndex(startIdx);
                setDisplayEndIndex(endIdx);
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
                  setDisplayStartIndex(startIdx);
                  setDisplayEndIndex(endIdx);
                }
              }}
              className="text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Ano atual
            </button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Empresa:</label>
              <select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value as 'todas' | 'WWS' | 'Worldwide');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">De:</label>
              <select
                value={displayStartIndex}
                onChange={(e) => {
                  const newStart = Number(e.target.value);
                  if (newStart <= displayEndIndex) {
                    setDisplayStartIndex(newStart);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={month.monthYm} value={index}>
                  {month.monthLabel}
                </option>
              ))}
            </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Até:</label>
              <select
                value={displayEndIndex}
                onChange={(e) => {
                  const newEnd = Number(e.target.value);
                  if (newEnd >= displayStartIndex) {
                    setDisplayEndIndex(newEnd);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={month.monthYm} value={index}>
                    {month.monthLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando dados...</div>
          </div>
        ) : (
          <>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="rect"
                  />
                  {allDepartmentKeys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={COLORS[index % COLORS.length]}
                      name={key}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <AdministrativeExpensesTable
              data={tableData}
              onSave={handleSave}
              months={displayMonths}
            />
          </>
        )}
      </div>
    </IndicatorCard>
  );
}
