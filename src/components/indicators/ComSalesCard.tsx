import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { EditableTable } from '@/components/dashboard/EditableTable';
import { SimpleBars } from '@/components/charts/SimpleBars';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { EditableRowData, ChartDataPoint } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ComSalesCardProps {
  segment: 'publico' | 'privado';
  title: string;
  color?: string;
  embedUrl?: string;
}

export function ComSalesCard({ segment, title, color = '#3B82F6', embedUrl }: ComSalesCardProps) {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<EditableRowData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const { toast } = useToast();

  const months = getLast12Months();

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getComSales(monthsRange, segment);

      // Create table data structure
      const tableRows = months.map(month => {
        const record = data.find(d => d.month_ym === month.monthYm);
        
        return {
          monthYm: month.monthYm,
          monthLabel: month.monthLabel,
          amount: record?.amount || 0,
        };
      });

      setTableData(tableRows);

      // Create chart data structure
      const chartRows = months.map(month => {
        const record = data.find(d => d.month_ym === month.monthYm);

        return {
          monthLabel: month.monthLabel,
          value: Number(record?.amount) || 0,
        };
      });

      setChartData(chartRows);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: `Não foi possível carregar os dados de vendas ${segment}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [segment]);

  const handleSave = async (data: EditableRowData[]) => {
    const records = data.map(row => ({
      month_ym: row.monthYm,
      segment,
      amount: Number(row.amount) || 0,
    }));

    await DashboardService.upsertComSales(records);
    await loadData(); // Refresh data after save
  };

  const columns = [
    { key: 'monthLabel', label: 'Mês', type: 'text' as const, readonly: true },
    { key: 'amount', label: 'Valor (R$)', type: 'currency' as const },
  ];

  return (
    <IndicatorCard
      title={title}
      subtitle="Últimos 12 meses"
      accentColor="#22c55e"
    >
      <div className="space-y-6">
        {embedUrl ? (
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">Dashboard Externo</p>
              <p className="text-xs text-gray-500 mt-1">
                Este dashboard não pode ser carregado diretamente por restrições de segurança
              </p>
            </div>
            <Button
              onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Dashboard
            </Button>
          </div>
        ) : (
          <>
            <SimpleBars
              data={chartData}
              dataKey="value"
              name={title}
              color={color}
              yAxisLabel="Vendas (R$)"
            />
            <EditableTable
              data={tableData}
              columns={columns}
              onSave={handleSave}
              loading={loading}
            />
          </>
        )}
      </div>
    </IndicatorCard>
  );
}