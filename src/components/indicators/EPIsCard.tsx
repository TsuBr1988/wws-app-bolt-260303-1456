import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { EPIsTable } from '@/components/dashboard/EPIsTable';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { EpisTableRow, PurchasesEpis } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface EPIsChartData {
  monthLabel: string;
  orcado: number;
  gasto: number;
  [key: string]: string | number;
}

interface SingleMonthChartData {
  contract_name: string;
  orcado: number;
  gasto: number;
}

interface YearlyChartData {
  contract_name: string;
  orcado: number;
  gasto: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel || data.contract_name}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: R$ {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export function EPIsCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<EpisTableRow[]>([]);
  const [chartData, setChartData] = useState<EPIsChartData[]>([]);
  const [singleMonthChartData, setSingleMonthChartData] = useState<SingleMonthChartData[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<YearlyChartData[]>([]);
  const [viewMode, setViewMode] = useState<'12months' | 'single' | 'yearly'>('12months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const { toast } = useToast();

  const months = getLast12Months();
  const availableYears = ['2024', '2025', '2026'];

  useEffect(() => {
    if (months.length > 0) {
      setSelectedMonth(months[months.length - 1].monthYm);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getPurchasesEpis(monthsRange);

      const contractsMap = new Map<string, EpisTableRow>();

      data.forEach((record) => {
        const key = `${record.company}_${record.contract_name}`;

        if (!contractsMap.has(key)) {
          contractsMap.set(key, {
            id: record.id,
            company: record.company,
            contract_name: record.contract_name,
            budget_2025: record.budget_2025,
          });
        }

        const row = contractsMap.get(key)!;
        row[record.month_ym] = record.amount_spent;
      });

      setTableData(Array.from(contractsMap.values()));

      const chartDataByMonth = months.map((month) => {
        const monthRecords = data.filter((d) => d.month_ym === month.monthYm);

        const totalBudget = monthRecords.reduce((sum, r) => sum + (Number(r.budget_2025) / 12), 0);
        const totalSpent = monthRecords.reduce((sum, r) => sum + Number(r.amount_spent), 0);

        const chartPoint: EPIsChartData = {
          monthLabel: month.monthLabel,
          orcado: totalBudget,
          gasto: totalSpent,
        };

        monthRecords.forEach(record => {
          chartPoint[record.contract_name] = Number(record.amount_spent);
        });

        return chartPoint;
      });

      setChartData(chartDataByMonth);

      if (selectedMonth) {
        updateSingleMonthChart(data, selectedMonth);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de EPIs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSingleMonthChart = (data: PurchasesEpis[], monthYm: string) => {
    const monthRecords = data.filter(d => d.month_ym === monthYm);

    const chartData = monthRecords.map(record => ({
      contract_name: record.contract_name,
      orcado: Number(record.budget_2025) / 12,
      gasto: Number(record.amount_spent),
    }));

    chartData.sort((a, b) => b.gasto - a.gasto);

    setSingleMonthChartData(chartData);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth && tableData.length > 0) {
      DashboardService.getPurchasesEpis(months.map(m => m.monthYm))
        .then(data => updateSingleMonthChart(data, selectedMonth))
        .catch(console.error);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedYear && tableData.length > 0) {
      DashboardService.getPurchasesEpis(months.map(m => m.monthYm))
        .then(data => updateYearlyChart(data, selectedYear, selectedContract))
        .catch(console.error);
    }
  }, [selectedYear, selectedContract]);

  const updateYearlyChart = (data: PurchasesEpis[], year: string, contractFilter: string) => {
    let yearRecords = data.filter(d => d.month_ym.startsWith(year));

    if (contractFilter !== 'all') {
      yearRecords = yearRecords.filter(d => d.contract_name === contractFilter);
    }

    const contractMap = new Map<string, { orcado: number; gasto: number }>();

    yearRecords.forEach(record => {
      const key = record.contract_name;

      if (!contractMap.has(key)) {
        contractMap.set(key, {
          orcado: Number(record.budget_2025),
          gasto: 0
        });
      }

      const contract = contractMap.get(key)!;
      contract.gasto += Number(record.amount_spent);
    });

    const chartData = Array.from(contractMap.entries()).map(([contract_name, values]) => ({
      contract_name,
      orcado: values.orcado,
      gasto: values.gasto
    }));

    chartData.sort((a, b) => b.gasto - a.gasto);

    setYearlyChartData(chartData);
  };

  const handleSave = async (data: EpisTableRow[]) => {
    try {
      const records: Omit<PurchasesEpis, 'id' | 'created_at' | 'updated_at'>[] = [];

      data.forEach((row) => {
        if (!row.contract_name.trim()) {
          toast({
            title: 'Erro de validação',
            description: 'O nome do contrato não pode estar vazio.',
            variant: 'destructive',
          });
          return;
        }

        months.forEach((month) => {
          const amountSpent = Number(row[month.monthYm]) || 0;

          records.push({
            company: row.company as 'WWS' | 'Worldwide',
            contract_name: row.contract_name,
            budget_2025: Number(row.budget_2025) || 0,
            month_ym: month.monthYm,
            amount_spent: amountSpent,
          });
        });
      });

      await DashboardService.upsertPurchasesEpis(records);
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

  const getUniqueContracts = () => {
    const contracts = new Set<string>();
    chartData.forEach(month => {
      Object.keys(month).forEach(key => {
        if (key !== 'monthLabel' && key !== 'orcado' && key !== 'gasto') {
          contracts.add(key);
        }
      });
    });
    return Array.from(contracts);
  };

  const contractColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const uniqueContracts = getUniqueContracts();

  return (
    <IndicatorCard
      title="EPIs"
      subtitle="Orçado vs Gasto - Últimos 12 meses"
      accentColor="#10b981"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Visualização:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as '12months' | 'single' | 'yearly')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="12months">Últimos 12 Meses</option>
              <option value="single">Mês Único</option>
              <option value="yearly">Total do Ano</option>
            </select>
          </div>

          {viewMode === 'single' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Mês:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month) => (
                  <option key={month.monthYm} value={month.monthYm}>
                    {month.monthLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'yearly' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Ano:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Contrato:</label>
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Contratos</option>
                  {uniqueContracts.map((contract) => (
                    <option key={contract} value={contract}>
                      {contract}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === '12months' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {uniqueContracts.map((contract, index) => (
                  <Bar
                    key={contract}
                    dataKey={contract}
                    stackId="a"
                    fill={contractColors[index % contractColors.length]}
                  />
                ))}
              </BarChart>
            ) : viewMode === 'single' ? (
              <BarChart data={singleMonthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contract_name" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="orcado" name="Orçado" fill="#3b82f6" />
                <Bar dataKey="gasto" name="Gasto" fill="#ef4444" />
              </BarChart>
            ) : (
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contract_name" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="orcado" name="Orçado" fill="#3b82f6" />
                <Bar dataKey="gasto" name="Gasto" fill="#ef4444" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <EPIsTable
          data={tableData}
          months={months}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </IndicatorCard>
  );
}
