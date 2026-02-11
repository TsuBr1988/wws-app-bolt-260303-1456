import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { FinRevenueTable } from '@/components/dashboard/FinRevenueTable';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { FinRevenueTableRow, FinRevenue } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface FinRevenueChartData {
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

export function FinRevenueCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<FinRevenueTableRow[]>([]);
  const [chartData, setChartData] = useState<FinRevenueChartData[]>([]);
  const [singleMonthChartData, setSingleMonthChartData] = useState<SingleMonthChartData[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<YearlyChartData[]>([]);
  const [viewMode, setViewMode] = useState<'12months' | 'single' | 'yearly'>('12months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [typeFilter, setTypeFilter] = useState<'ambos' | 'publico' | 'privado'>('ambos');
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
      const data = await DashboardService.getFinRevenue(monthsRange);

      const contractsMap = new Map<string, FinRevenueTableRow>();

      data.forEach((record) => {
        const key = `${record.company}_${record.contract_name}_${record.type}`;

        if (!contractsMap.has(key)) {
          contractsMap.set(key, {
            id: record.id,
            company: record.company,
            contract_name: record.contract_name,
            type: record.type,
            budget_2025: record.budget_2025,
          });
        }

        const row = contractsMap.get(key)!;
        row[record.month_ym] = record.amount;
      });

      setTableData(Array.from(contractsMap.values()));

      const chartDataByMonth = months.map((month) => {
        const filteredData = typeFilter === 'ambos' ? data : data.filter(d => d.type === typeFilter);
        const monthRecords = filteredData.filter((d) => d.month_ym === month.monthYm);

        const totalBudget = monthRecords.reduce((sum, r) => sum + (Number(r.budget_2025) / 12), 0);
        const totalSpent = monthRecords.reduce((sum, r) => sum + Number(r.amount), 0);

        const chartPoint: FinRevenueChartData = {
          monthLabel: month.monthLabel,
          orcado: totalBudget,
          gasto: totalSpent,
        };

        monthRecords.forEach(record => {
          chartPoint[record.contract_name] = Number(record.amount);
        });

        return chartPoint;
      });

      setChartData(chartDataByMonth);

      if (selectedMonth) {
        const filteredData = typeFilter === 'ambos' ? data : data.filter(d => d.type === typeFilter);
        updateSingleMonthChart(filteredData, selectedMonth);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de faturamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSingleMonthChart = (data: FinRevenue[], month: string) => {
    const monthRecords = data.filter((d) => d.month_ym === month);

    const chartData = monthRecords.map(record => ({
      contract_name: record.contract_name,
      orcado: Number(record.budget_2025) / 12,
      gasto: Number(record.amount),
    }));

    chartData.sort((a, b) => b.gasto - a.gasto);

    setSingleMonthChartData(chartData);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth && tableData.length > 0) {
      DashboardService.getFinRevenue(months.map(m => m.monthYm))
        .then(data => {
          const filteredData = typeFilter === 'ambos' ? data : data.filter(d => d.type === typeFilter);
          updateSingleMonthChart(filteredData, selectedMonth);
        })
        .catch(console.error);
    }
  }, [selectedMonth, typeFilter]);

  useEffect(() => {
    if (selectedYear && tableData.length > 0) {
      DashboardService.getFinRevenue(months.map(m => m.monthYm))
        .then(data => {
          const filteredData = typeFilter === 'ambos' ? data : data.filter(d => d.type === typeFilter);
          updateYearlyChart(filteredData, selectedYear);
        })
        .catch(console.error);
    }
  }, [selectedYear, typeFilter]);

  const updateYearlyChart = (data: FinRevenue[], year: string) => {
    const yearRecords = data.filter(d => d.month_ym.startsWith(year));

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
      contract.gasto += Number(record.amount);
    });

    const chartData = Array.from(contractMap.entries()).map(([contract_name, values]) => ({
      contract_name,
      orcado: values.orcado,
      gasto: values.gasto
    }));

    chartData.sort((a, b) => b.gasto - a.gasto);

    setYearlyChartData(chartData);
  };

  const handleSave = async (data: FinRevenueTableRow[]) => {
    try {
      const records: Omit<FinRevenue, 'id' | 'created_at'>[] = [];

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
          const amount = Number(row[month.monthYm]) || 0;

          records.push({
            company: row.company as 'WWS' | 'Worldwide',
            contract_name: row.contract_name,
            type: row.type as 'publico' | 'privado',
            budget_2025: Number(row.budget_2025) || 0,
            month_ym: month.monthYm,
            amount: amount,
          });
        });
      });

      await DashboardService.upsertFinRevenue(records);
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
      title="Faturamento"
      subtitle="Orçado vs Gasto - Últimos 12 meses"
      accentColor="#16a34a"
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

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tipo:</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'ambos' | 'publico' | 'privado');
                loadData();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ambos">Ambos</option>
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
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

        <FinRevenueTable
          data={tableData}
          months={months}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </IndicatorCard>
  );
}
