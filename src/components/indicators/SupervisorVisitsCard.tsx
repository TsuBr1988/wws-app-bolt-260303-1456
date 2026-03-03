import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { SupervisorVisitsTable } from '@/components/dashboard/SupervisorVisitsTable';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { SupervisorVisitsTableRow, OperationalSupervisorVisits } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface SupervisorVisitsChartData {
  monthLabel: string;
  [key: string]: string | number;
}

interface SingleMonthChartData {
  supervisor_name: string;
  visitas: number;
}

interface YearlyChartData {
  supervisor_name: string;
  visitas: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel || data.supervisor_name}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toLocaleString('pt-BR')} visitas
        </p>
      ))}
    </div>
  );
};

export function SupervisorVisitsCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<SupervisorVisitsTableRow[]>([]);
  const [chartData, setChartData] = useState<SupervisorVisitsChartData[]>([]);
  const [singleMonthChartData, setSingleMonthChartData] = useState<SingleMonthChartData[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<YearlyChartData[]>([]);
  const [viewMode, setViewMode] = useState<'12months' | 'single' | 'yearly'>('12months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('all');
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
      const data = await DashboardService.getOperationalSupervisorVisits(monthsRange);

      const supervisorsMap = new Map<string, SupervisorVisitsTableRow>();

      data.forEach((record) => {
        const key = `${record.company}_${record.supervisor_name}`;

        if (!supervisorsMap.has(key)) {
          supervisorsMap.set(key, {
            id: record.id,
            company: record.company,
            supervisor_name: record.supervisor_name,
          });
        }

        const row = supervisorsMap.get(key)!;
        row[record.month_ym] = record.visits_count;
      });

      setTableData(Array.from(supervisorsMap.values()));

      const chartDataByMonth = months.map((month) => {
        const monthRecords = data.filter((d) => d.month_ym === month.monthYm);

        const chartPoint: SupervisorVisitsChartData = {
          monthLabel: month.monthLabel,
        };

        monthRecords.forEach(record => {
          chartPoint[record.supervisor_name] = Number(record.visits_count);
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
        description: 'Não foi possível carregar os dados de visitas por supervisor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSingleMonthChart = (data: OperationalSupervisorVisits[], month: string) => {
    const monthRecords = data.filter((d) => d.month_ym === month);

    const chartData = monthRecords.map(record => ({
      supervisor_name: record.supervisor_name,
      visitas: Number(record.visits_count),
    }));

    chartData.sort((a, b) => b.visitas - a.visitas);

    setSingleMonthChartData(chartData);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth && tableData.length > 0) {
      DashboardService.getOperationalSupervisorVisits(months.map(m => m.monthYm))
        .then(data => updateSingleMonthChart(data, selectedMonth))
        .catch(console.error);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedYear && tableData.length > 0) {
      DashboardService.getOperationalSupervisorVisits(months.map(m => m.monthYm))
        .then(data => updateYearlyChart(data, selectedYear, selectedSupervisor))
        .catch(console.error);
    }
  }, [selectedYear, selectedSupervisor]);

  const updateYearlyChart = (data: OperationalSupervisorVisits[], year: string, supervisorFilter: string) => {
    let yearRecords = data.filter(d => d.month_ym.startsWith(year));

    if (supervisorFilter !== 'all') {
      yearRecords = yearRecords.filter(d => d.supervisor_name === supervisorFilter);
    }

    const supervisorMap = new Map<string, number>();

    yearRecords.forEach(record => {
      const key = record.supervisor_name;
      const current = supervisorMap.get(key) || 0;
      supervisorMap.set(key, current + Number(record.visits_count));
    });

    const chartData = Array.from(supervisorMap.entries()).map(([supervisor_name, visitas]) => ({
      supervisor_name,
      visitas
    }));

    chartData.sort((a, b) => b.visitas - a.visitas);

    setYearlyChartData(chartData);
  };

  const handleSave = async (data: SupervisorVisitsTableRow[], deletedRows: SupervisorVisitsTableRow[]) => {
    try {
      const records: Omit<OperationalSupervisorVisits, 'id' | 'created_at' | 'updated_at'>[] = [];

      data.forEach((row) => {
        if (!row.supervisor_name.trim()) {
          toast({
            title: 'Erro de validação',
            description: 'O nome do supervisor não pode estar vazio.',
            variant: 'destructive',
          });
          return;
        }

        months.forEach((month) => {
          const visitsCount = Number(row[month.monthYm]) || 0;

          records.push({
            company: row.company as 'WWS' | 'Worldwide',
            supervisor_name: row.supervisor_name,
            month_ym: month.monthYm,
            visits_count: visitsCount,
          });
        });
      });

      if (deletedRows.length > 0) {
        await DashboardService.deleteOperationalSupervisorVisits(deletedRows);
      }

      await DashboardService.upsertOperationalSupervisorVisits(records);
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

  const getUniqueSupervisors = () => {
    const supervisors = new Set<string>();
    chartData.forEach(month => {
      Object.keys(month).forEach(key => {
        if (key !== 'monthLabel') {
          supervisors.add(key);
        }
      });
    });
    return Array.from(supervisors);
  };

  const supervisorColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const uniqueSupervisors = getUniqueSupervisors();

  return (
    <IndicatorCard
      title="Total de Visitas por Supervisor"
      subtitle="Últimos 12 meses"
      accentColor="#eab308"
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
                <label className="text-sm font-medium text-gray-700">Supervisor:</label>
                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Supervisores</option>
                  {uniqueSupervisors.map((supervisor) => (
                    <option key={supervisor} value={supervisor}>
                      {supervisor}
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
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {uniqueSupervisors.map((supervisor, index) => (
                  <Bar
                    key={supervisor}
                    dataKey={supervisor}
                    stackId="a"
                    fill={supervisorColors[index % supervisorColors.length]}
                  />
                ))}
              </BarChart>
            ) : viewMode === 'single' ? (
              <BarChart data={singleMonthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supervisor_name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="visitas" name="Visitas" fill="#eab308" />
              </BarChart>
            ) : (
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supervisor_name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="visitas" name="Visitas" fill="#eab308" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <SupervisorVisitsTable
          data={tableData}
          months={months}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </IndicatorCard>
  );
}
