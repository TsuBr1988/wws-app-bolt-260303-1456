import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { EditableTable } from '@/components/dashboard/EditableTable';
import { SimpleBars } from '@/components/charts/SimpleBars';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { EditableRowData, ChartDataPoint } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';

interface AbsenteeismTooltipData {
  monthLabel: string;
  index: number;
  justified: number;
  unjustified: number;
  workload: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as AbsenteeismTooltipData;
  const totalAbsences = data.justified + data.unjustified;

  const tooltipChartData = [
    { name: 'Falta Justificada', value: data.justified },
    { name: 'Falta Injustificada', value: data.unjustified },
    { name: 'Faltas Totais', value: totalAbsences },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[350px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel}</p>
      <p className="text-sm text-gray-600 mb-3">Índice: {(data.index * 100).toFixed(2)}%</p>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tooltipChartData} margin={{ top: 5, right: 10, left: 10, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-25}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export function HrAbsenteeismCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<EditableRowData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const { toast } = useToast();

  const months = getLast12Months();

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getHrAbsenteeism(monthsRange);

      const tableRows = months.map(month => {
        const record = data.find(d => d.month_ym === month.monthYm);
        const justifiedAbsence = record?.justified_absence || 0;
        const unjustifiedAbsence = record?.unjustified_absence || 0;
        const expectedWorkload = record?.expected_workload || 0;
        const index = expectedWorkload > 0
          ? (justifiedAbsence + unjustifiedAbsence) / expectedWorkload
          : 0;

        return {
          monthYm: month.monthYm,
          monthLabel: month.monthLabel,
          justifiedAbsence,
          unjustifiedAbsence,
          expectedWorkload,
          index,
        };
      });

      setTableData(tableRows);

      const chartRows = months.map(month => {
        const record = data.find(d => d.month_ym === month.monthYm);
        const justifiedAbsence = record?.justified_absence || 0;
        const unjustifiedAbsence = record?.unjustified_absence || 0;
        const expectedWorkload = record?.expected_workload || 0;
        const index = expectedWorkload > 0
          ? (justifiedAbsence + unjustifiedAbsence) / expectedWorkload
          : 0;

        return {
          monthLabel: month.monthLabel,
          index,
          justified: justifiedAbsence,
          unjustified: unjustifiedAbsence,
          workload: expectedWorkload,
        };
      });

      setChartData(chartRows);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de absenteísmo.",
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
      justified_absence: Number(row.justifiedAbsence) || 0,
      unjustified_absence: Number(row.unjustifiedAbsence) || 0,
      expected_workload: Number(row.expectedWorkload) || 0,
    }));

    await DashboardService.upsertHrAbsenteeism(records);
    await loadData();
  };

  const columns = [
    { key: 'monthLabel', label: 'Mês', type: 'text' as const, readonly: true },
    { key: 'justifiedAbsence', label: 'Falta Justificada', type: 'number' as const },
    { key: 'unjustifiedAbsence', label: 'Falta Injustificada', type: 'number' as const },
    { key: 'expectedWorkload', label: 'Carga Mensal', type: 'number' as const },
    { key: 'index', label: 'Índice', type: 'calculated' as const, readonly: true },
  ];

  return (
    <IndicatorCard
        title="Absenteísmo"
        subtitle="Índice de ausências nos últimos 12 meses"
        accentColor="#E74C3C"
        defaultExpanded={true}
      >
      <div className="space-y-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="index" fill="#E74C3C" />
            </BarChart>
          </ResponsiveContainer>
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
