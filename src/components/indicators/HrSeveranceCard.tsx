import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { SeveranceTable } from '@/components/dashboard/SeveranceTable';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { SeveranceTableRow, HrSeverance } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';

interface SeveranceChartData {
  monthLabel: string;
  total: number;
  contracts: Array<{
    contract_name: string;
    amount: number;
    qty: number;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as SeveranceChartData;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel}</p>
      <p className="text-sm text-gray-600 mb-3">
        Total: R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
      <div className="space-y-2">
        {data.contracts.map((contract, idx) => (
          <div key={idx} className="text-xs border-t pt-2">
            <p className="font-medium">{contract.contract_name}</p>
            <p className="text-gray-600">
              R$ {contract.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-gray-600">Quantidade: {contract.qty}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export function HrSeveranceCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<SeveranceTableRow[]>([]);
  const [chartData, setChartData] = useState<SeveranceChartData[]>([]);
  const [contracts, setContracts] = useState<string[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const { toast } = useToast();

  const months = getLast12Months();

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getHrSeverance(monthsRange);

      const contractsMap = new Map<string, SeveranceTableRow>();
      const uniqueContracts = new Set<string>();

      data.forEach((record) => {
        const key = `${record.company}_${record.contract_name}`;
        uniqueContracts.add(record.contract_name);

        if (!contractsMap.has(key)) {
          contractsMap.set(key, {
            id: record.id,
            company: record.company,
            contract_name: record.contract_name,
          });
        }

        const row = contractsMap.get(key)!;
        row[`${record.month_ym}_amount`] = record.severance_amount;
        row[`${record.month_ym}_qty`] = record.severance_qty;
      });

      setTableData(Array.from(contractsMap.values()));
      setContracts(Array.from(uniqueContracts).sort());

      const chartDataByMonth = months.map((month) => {
        const monthRecords = data.filter((d) => d.month_ym === month.monthYm);

        let filteredRecords = monthRecords;
        if (selectedContract !== 'all') {
          filteredRecords = monthRecords.filter(d => d.contract_name === selectedContract);
        }

        const totalAmount = filteredRecords.reduce((sum, r) => sum + Number(r.severance_amount), 0);

        const contractsInfo = filteredRecords.map(r => ({
          contract_name: r.contract_name,
          amount: Number(r.severance_amount),
          qty: r.severance_qty,
        }));

        return {
          monthLabel: month.monthLabel,
          total: totalAmount,
          contracts: contractsInfo,
        };
      });

      setChartData(chartDataByMonth);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de rescisões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedContract]);

  const handleSave = async (data: SeveranceTableRow[], deletedRows: { company: string; contract_name: string }[]) => {
    try {
      const records: Omit<HrSeverance, 'id' | 'created_at' | 'updated_at'>[] = [];

      const validRows = data.filter(row => row.contract_name && row.contract_name.trim() !== '');

      if (data.length > validRows.length) {
        toast({
          title: 'Aviso',
          description: 'Linhas sem contrato selecionado não serão salvas.',
          variant: 'destructive',
        });
      }

      validRows.forEach((row) => {
        months.forEach((month) => {
          const amount = Number(row[`${month.monthYm}_amount`]) || 0;
          const qty = Number(row[`${month.monthYm}_qty`]) || 0;

          records.push({
            company: row.company as 'WWS' | 'Worldwide',
            contract_name: row.contract_name,
            month_ym: month.monthYm,
            severance_amount: amount,
            severance_qty: qty,
          });
        });
      });

      if (deletedRows.length > 0) {
        await DashboardService.deleteHrSeverance(deletedRows);
      }

      if (records.length > 0) {
        await DashboardService.upsertHrSeverance(records);
      }

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
        title="Rescisões"
        subtitle="Últimos 12 meses - Valores e quantidades de rescisões por contrato"
        accentColor="#9B59B6"
        defaultExpanded={true}
      >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por contrato:</label>
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os contratos</option>
            {contracts.map((contract) => (
              <option key={contract} value={contract}>
                {contract}
              </option>
            ))}
          </select>
        </div>

        <div className="h-[300px] min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SeveranceTable
          data={tableData}
          months={months}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </IndicatorCard>
  );
}
