import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { EditableTable } from '@/components/dashboard/EditableTable';
import { StackedBars } from '@/components/charts/StackedBars';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { EditableRowData, ChartDataPoint } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

export function HrHeadcountCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<EditableRowData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const { toast } = useToast();

  const months = getLast12Months();

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getHrHeadcount(monthsRange);

      // Create table data structure
      const tableRows = months.map(month => {
        const wwsRecord = data.find(d => d.month_ym === month.monthYm && d.company === 'WWS');
        const worldwideRecord = data.find(d => d.month_ym === month.monthYm && d.company === 'Worldwide');

        return {
          monthYm: month.monthYm,
          monthLabel: month.monthLabel,
          WWS: wwsRecord?.qty || 0,
          Worldwide: worldwideRecord?.qty || 0,
        };
      });

      setTableData(tableRows);

      // Create chart data structure
      const chartRows = months.map(month => {
        const wwsRecord = data.find(d => d.month_ym === month.monthYm && d.company === 'WWS');
        const worldwideRecord = data.find(d => d.month_ym === month.monthYm && d.company === 'Worldwide');

        return {
          monthLabel: month.monthLabel,
          WWS: wwsRecord?.qty || 0,
          Worldwide: worldwideRecord?.qty || 0,
        };
      });

      setChartData(chartRows);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de funcionários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (data: EditableRowData[]) => {
    const records = data.flatMap(row => [
      {
        month_ym: row.monthYm,
        company: 'WWS' as const,
        qty: Number(row.WWS) || 0,
      },
      {
        month_ym: row.monthYm,
        company: 'Worldwide' as const,
        qty: Number(row.Worldwide) || 0,
      }
    ]);

    await DashboardService.upsertHrHeadcount(records);
    await loadData(); // Refresh data after save
  };

  const columns = [
    { key: 'monthLabel', label: 'Mês', type: 'text' as const, readonly: true },
    { key: 'WWS', label: 'WWS (Qtd)', type: 'number' as const },
    { key: 'Worldwide', label: 'Worldwide (Qtd)', type: 'number' as const },
  ];

  const chartSeries = [
    { key: 'WWS', name: 'WWS', color: '#2ECC71' },
    { key: 'Worldwide', name: 'Worldwide', color: '#3498DB' },
  ];

  return (
    <IndicatorCard
        title="Quantidade de Funcionários"
        subtitle="Últimos 12 meses por empresa"
        accentColor="#2ECC71"
        defaultExpanded={true}
      >
        <div className="space-y-6">
          <StackedBars
            data={chartData}
            series={chartSeries}
            yAxisLabel="Funcionários"
          />
          <EditableTable
            data={tableData}
            columns={columns}
            onSave={handleSave}
            loading={loading}
          />
        </div>
      </IndicatorCard>
  );
}