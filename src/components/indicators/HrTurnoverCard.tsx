import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { EditableTable } from '@/components/dashboard/EditableTable';
import { SimpleBars } from '@/components/charts/SimpleBars';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { EditableRowData, ChartDataPoint } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

export function HrTurnoverCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<EditableRowData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const { toast } = useToast();

  const months = getLast12Months();

  const calculateTurnover = (ativos: number, admissao: number, demissao: number): number => {
    const denominator = (ativos + ativos + admissao - demissao) / 2;
    if (denominator === 0) return 0;
    const numerator = (admissao + demissao) / 2;
    return (numerator / denominator) * 100;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getHrTurnover(monthsRange);

      // Create table data structure
      const tableRows = months.map(month => {
        const record = data.find(d => d.month_ym === month.monthYm);
        const ativos = record?.ativos || 0;
        const admissao = record?.admissao || 0;
        const demissao = record?.demissao || 0;
        const turnover = calculateTurnover(ativos, admissao, demissao);

        return {
          monthYm: month.monthYm,
          monthLabel: month.monthLabel,
          ativos,
          admissao,
          demissao,
          turnover: Number(turnover.toFixed(2)),
        };
      });

      setTableData(tableRows);

      // Create chart data structure
      const chartRows = months.map(month => {
        const record = data.find(d => d.month_ym === month.monthYm);
        const ativos = record?.ativos || 0;
        const admissao = record?.admissao || 0;
        const demissao = record?.demissao || 0;
        const turnover = calculateTurnover(ativos, admissao, demissao);

        return {
          monthLabel: month.monthLabel,
          turnover: Number(turnover.toFixed(2)),
        };
      });

      setChartData(chartRows);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de turnover.",
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
    const records = data.map(row => ({
      month_ym: row.monthYm,
      ativos: Number(row.ativos) || 0,
      admissao: Number(row.admissao) || 0,
      demissao: Number(row.demissao) || 0,
    }));

    await DashboardService.upsertHrTurnover(records);
    await loadData(); // Refresh data after save
  };

  const columns = [
    { key: 'monthLabel', label: 'Mês', type: 'text' as const, readonly: true },
    { key: 'ativos', label: 'Ativos', type: 'number' as const },
    { key: 'admissao', label: 'Admissão', type: 'number' as const },
    { key: 'demissao', label: 'Demissão', type: 'number' as const },
    { key: 'turnover', label: 'Turnover (%)', type: 'number' as const, readonly: true },
  ];

  // Update table data when values change to recalculate turnover
  const handleTableDataChange = (newData: EditableRowData[]) => {
    const updatedData = newData.map(row => {
      const ativos = Number(row.ativos) || 0;
      const admissao = Number(row.admissao) || 0;
      const demissao = Number(row.demissao) || 0;
      const turnover = calculateTurnover(ativos, admissao, demissao);

      return {
        ...row,
        turnover: Number(turnover.toFixed(2)),
      };
    });
    
    setTableData(updatedData);
  };

  return (
    <IndicatorCard
        title="Turnover"
        subtitle="Últimos 12 meses - Taxa de rotatividade de funcionários"
        accentColor="#F1C40F"
        defaultExpanded={true}
    >
      <div className="space-y-6">
        <SimpleBars
          data={chartData}
          dataKey="turnover"
          name="Turnover"
          color="#F1C40F"
          yAxisLabel="Turnover (%)"
          valueFormat="percent"
        />
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <strong>Fórmula:</strong> Turnover = [((Admissão + Demissão) / 2) / ((Ativos + Ativos + Admissão - Demissão) / 2)] × 100%
        </div>
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