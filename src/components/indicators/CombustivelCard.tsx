import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { CombustivelTable } from '@/components/dashboard/CombustivelTable';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { CombustivelTableRow, PurchasesCombustivel } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface CombustivelChartData {
  monthLabel: string;
  WWS: number;
  Worldwide: number;
}

interface SingleMonthChartData {
  department: string;
  orcado: number;
  gasto: number;
}

interface YearlyChartData {
  department: string;
  orcado: number;
  gasto: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel || data.department}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: R$ {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export function CombustivelCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<CombustivelTableRow[]>([]);
  const [chartData, setChartData] = useState<CombustivelChartData[]>([]);
  const [singleMonthChartData, setSingleMonthChartData] = useState<SingleMonthChartData[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<YearlyChartData[]>([]);
  const [viewMode, setViewMode] = useState<'12months' | 'single' | 'yearly'>('12months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedCompany, setSelectedCompany] = useState<'all' | 'WWS' | 'Worldwide'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
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
      const data = await DashboardService.getPurchasesCombustivel(monthsRange);

      const departmentsMap = new Map<string, CombustivelTableRow>();

      data.forEach((record) => {
        const key = `${record.company}_${record.department}`;

        if (!departmentsMap.has(key)) {
          departmentsMap.set(key, {
            id: record.id,
            company: record.company,
            department: record.department,
            budget_2025: record.budget_2025,
          });
        }

        const row = departmentsMap.get(key)!;
        row[record.month_ym] = record.amount_spent;
      });

      setTableData(Array.from(departmentsMap.values()));

      updateChartData(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de combustível.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = (data: PurchasesCombustivel[]) => {
    const filteredData = selectedCompany === 'all'
      ? data
      : data.filter(d => d.company === selectedCompany);

    const chartDataByMonth = months.map((month) => {
      const monthRecords = filteredData.filter((d) => d.month_ym === month.monthYm);

      const wwsTotal = monthRecords
        .filter(r => r.company === 'WWS')
        .reduce((sum, r) => sum + Number(r.amount_spent), 0);

      const worldwideTotal = monthRecords
        .filter(r => r.company === 'Worldwide')
        .reduce((sum, r) => sum + Number(r.amount_spent), 0);

      const chartPoint: CombustivelChartData = {
        monthLabel: month.monthLabel,
        WWS: wwsTotal,
        Worldwide: worldwideTotal,
      };

      return chartPoint;
    });

    setChartData(chartDataByMonth);

    if (selectedMonth) {
      updateSingleMonthChart(filteredData, selectedMonth);
    }
  };

  const updateSingleMonthChart = (data: PurchasesCombustivel[], monthYm: string) => {
    const monthRecords = data.filter(d => d.month_ym === monthYm);

    const chartData = monthRecords.map(record => ({
      department: record.department,
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
    if (tableData.length > 0) {
      DashboardService.getPurchasesCombustivel(months.map(m => m.monthYm))
        .then(data => updateChartData(data))
        .catch(console.error);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedMonth && tableData.length > 0) {
      DashboardService.getPurchasesCombustivel(months.map(m => m.monthYm))
        .then(data => {
          const filteredData = selectedCompany === 'all'
            ? data
            : data.filter(d => d.company === selectedCompany);
          updateSingleMonthChart(filteredData, selectedMonth);
        })
        .catch(console.error);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedYear && tableData.length > 0) {
      DashboardService.getPurchasesCombustivel(months.map(m => m.monthYm))
        .then(data => {
          const filteredData = selectedCompany === 'all' ? data : data.filter(d => d.company === selectedCompany);
          updateYearlyChart(filteredData, selectedYear, selectedDepartment);
        })
        .catch(console.error);
    }
  }, [selectedYear, selectedDepartment]);

  const updateYearlyChart = (data: PurchasesCombustivel[], year: string, departmentFilter: string) => {
    let yearRecords = data.filter(d => d.month_ym.startsWith(year));

    if (departmentFilter !== 'all') {
      yearRecords = yearRecords.filter(d => d.department === departmentFilter);
    }

    const departmentMap = new Map<string, { orcado: number; gasto: number }>();
    yearRecords.forEach(record => {
      const key = record.department;
      if (!departmentMap.has(key)) {
        departmentMap.set(key, { orcado: Number(record.budget_2025), gasto: 0 });
      }
      const dept = departmentMap.get(key)!;
      dept.gasto += Number(record.amount_spent);
    });
    const chartData = Array.from(departmentMap.entries()).map(([department, values]) => ({
      department, orcado: values.orcado, gasto: values.gasto
    }));
    chartData.sort((a, b) => b.gasto - a.gasto);
    setYearlyChartData(chartData);
  };

  const handleSave = async (data: CombustivelTableRow[], deletedRows: CombustivelTableRow[]) => {
    try {
      const records: Omit<PurchasesCombustivel, 'id' | 'created_at' | 'updated_at'>[] = [];
      let hasEmptyDepartment = false;

      data.forEach((row) => {
        if (!row.department.trim()) {
          hasEmptyDepartment = true;
          return;
        }

        months.forEach((month) => {
          const amountSpent = Number(row[month.monthYm]) || 0;

          records.push({
            company: row.company as 'WWS' | 'Worldwide',
            department: row.department,
            budget_2025: Number(row.budget_2025) || 0,
            month_ym: month.monthYm,
            amount_spent: amountSpent,
          });
        });
      });

      if (hasEmptyDepartment) {
        toast({
          title: 'Erro de validação',
          description: 'O nome do departamento não pode estar vazio.',
          variant: 'destructive',
        });
        return;
      }

      if (deletedRows.length > 0) {
        await DashboardService.deletePurchasesCombustivel(deletedRows);
      }

      if (records.length > 0) {
        await DashboardService.upsertPurchasesCombustivel(records);
      }

      await loadData();

      toast({
        title: 'Sucesso',
        description: 'Dados salvos com sucesso.',
      });
    } catch (error) {
      console.error('Error saving combustivel data:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    }
  };


  return (
    <IndicatorCard
      title="Combustível"
      subtitle="Orçado vs Gasto - Últimos 12 meses"
      accentColor="#10b981"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Empresa:</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value as 'all' | 'WWS' | 'Worldwide')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="WWS">WWS</option>
              <option value="Worldwide">Worldwide</option>
            </select>
          </div>

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
                <label className="text-sm font-medium text-gray-700">Departamento:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Departamentos</option>
                  {Array.from(new Set(tableData.map(d => d.department))).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
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
                <Bar dataKey="WWS" name="WWS" fill="#3b82f6" />
                <Bar dataKey="Worldwide" name="Worldwide" fill="#ef4444" />
              </BarChart>
            ) : viewMode === 'single' ? (
              <BarChart data={singleMonthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="orcado" name="Orçado" fill="#3b82f6" />
                <Bar dataKey="gasto" name="Gasto" fill="#ef4444" />
              </BarChart>
            ) : (
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="orcado" name="Orçado" fill="#3b82f6" />
                <Bar dataKey="gasto" name="Gasto" fill="#ef4444" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <CombustivelTable
          data={tableData}
          months={months}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </IndicatorCard>
  );
}
