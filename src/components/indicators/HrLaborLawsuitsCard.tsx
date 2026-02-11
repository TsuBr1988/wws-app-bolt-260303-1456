import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { LaborLawsuitsTable } from '@/components/dashboard/LaborLawsuitsTable';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { HrLaborLawsuits } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LawsuitsChartData {
  monthLabel: string;
  quantidade: number;
  valor: number;
}

interface SimpleLawsuitsData {
  [key: string]: number;
}

export function HrLaborLawsuitsCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<SimpleLawsuitsData>({});
  const [chartData, setChartData] = useState<LawsuitsChartData[]>([]);
  const { toast } = useToast();

  const months = getLast12Months();

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getHrLaborLawsuits(monthsRange);

      const aggregatedData: SimpleLawsuitsData = {};

      data.forEach((record) => {
        const qtyKey = `${record.month_ym}_qty`;
        const amountKey = `${record.month_ym}_amount`;

        aggregatedData[qtyKey] = (aggregatedData[qtyKey] || 0) + record.lawsuits_qty;
        aggregatedData[amountKey] = (aggregatedData[amountKey] || 0) + Number(record.lawsuits_amount);
      });

      setTableData(aggregatedData);

      const chartDataByMonth = months.map((month) => {
        const monthRecords = data.filter((d) => d.month_ym === month.monthYm);

        const totalQty = monthRecords.reduce((sum, r) => sum + r.lawsuits_qty, 0);
        const totalAmount = monthRecords.reduce((sum, r) => sum + Number(r.lawsuits_amount), 0);

        return {
          monthLabel: month.monthLabel,
          quantidade: totalQty,
          valor: totalAmount,
        };
      });

      setChartData(chartDataByMonth);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de ações trabalhistas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (data: SimpleLawsuitsData) => {
    try {
      const records: Omit<HrLaborLawsuits, 'id' | 'created_at' | 'updated_at'>[] = [];

      months.forEach((month) => {
        const qty = Number(data[`${month.monthYm}_qty`]) || 0;
        const amount = Number(data[`${month.monthYm}_amount`]) || 0;

        records.push({
          company: 'WWS',
          contract_name: 'Consolidado',
          month_ym: month.monthYm,
          lawsuits_qty: qty,
          lawsuits_amount: amount,
        });
      });

      await DashboardService.upsertHrLaborLawsuits(records);
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

  return (
    <IndicatorCard
        title="Tendência Ações Trabalhistas"
        subtitle="Últimos 12 meses - Quantidade e valor estimado de ações trabalhistas"
        accentColor="#E74C3C"
        defaultExpanded={true}
        className="w-full"
      >
      <div className="space-y-6 w-full">
        <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12 }}
                angle={window.innerWidth < 640 ? -45 : 0}
                textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                height={window.innerWidth < 640 ? 60 : 30}
              />
              <YAxis
                yAxisId="left"
                label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Valor (R$)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'Valor Estimado (R$)') {
                    return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name];
                  }
                  return [value, name];
                }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="left"
                dataKey="quantidade"
                name="Quantidade de Ações"
                fill="#f97316"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="valor"
                name="Valor Estimado (R$)"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <LaborLawsuitsTable
          data={tableData}
          months={months}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </IndicatorCard>
  );
}
