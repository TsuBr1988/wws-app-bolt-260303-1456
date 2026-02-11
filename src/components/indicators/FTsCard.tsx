import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { FTsTable } from '@/components/dashboard/FTsTable';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { FTsTableRow, OperationalFTs, Client } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface FTsChartData {
  monthLabel: string;
  WWS: number;
  Worldwide: number;
}

interface SingleMonthChartData {
  contract: string;
  orcado: number;
  gasto: number;
}

interface YearlyChartData {
  contract: string;
  orcado: number;
  gasto: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
      <p className="text-sm font-semibold mb-2">{data.monthLabel || data.contract}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: R$ {Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export function FTsCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<FTsTableRow[]>([]);
  const [chartData, setChartData] = useState<FTsChartData[]>([]);
  const [singleMonthChartData, setSingleMonthChartData] = useState<SingleMonthChartData[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<YearlyChartData[]>([]);
  const [viewMode, setViewMode] = useState<'12months' | 'single' | 'yearly'>('12months');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedCompany, setSelectedCompany] = useState<'all' | 'WWS' | 'Worldwide'>('all');
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

  const months = getLast12Months();
  const availableYears = ['2024', '2025', '2026'];

  useEffect(() => {
    if (months.length > 0) {
      setSelectedMonth(months[months.length - 1].monthYm);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientsData = await DashboardService.getClients();
      setClients(clientsData);
    } catch (error) {
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'destructive',
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const monthsRange = months.map(m => m.monthYm);
      const data = await DashboardService.getOperationalFTs(monthsRange);

      const contractsMap = new Map<string, FTsTableRow>();

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

      updateChartData(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de FTs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = (data: OperationalFTs[]) => {
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

      const chartPoint: FTsChartData = {
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

  const updateSingleMonthChart = (data: OperationalFTs[], monthYm: string) => {
    const monthRecords = data.filter(d => d.month_ym === monthYm);

    const chartData = monthRecords.map(record => ({
      contract: record.contract_name,
      orcado: Number(record.budget_2025) / 12,
      gasto: Number(record.amount_spent),
    }));

    chartData.sort((a, b) => b.gasto - a.gasto);

    setSingleMonthChartData(chartData);
  };

  useEffect(() => {
    if (clients.length > 0) {
      loadData();
    }
  }, [clients]);

  useEffect(() => {
    if (tableData.length > 0) {
      DashboardService.getOperationalFTs(months.map(m => m.monthYm))
        .then(data => updateChartData(data))
        .catch(console.error);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedMonth && tableData.length > 0) {
      DashboardService.getOperationalFTs(months.map(m => m.monthYm))
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
      DashboardService.getOperationalFTs(months.map(m => m.monthYm))
        .then(data => {
          const filteredData = selectedCompany === 'all' ? data : data.filter(d => d.company === selectedCompany);
          updateYearlyChart(filteredData, selectedYear, selectedContract);
        })
        .catch(console.error);
    }
  }, [selectedYear, selectedContract]);

  const updateYearlyChart = (data: OperationalFTs[], year: string, contractFilter: string) => {
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

    const chartData = Array.from(contractMap.entries()).map(([contract, values]) => ({
      contract,
      orcado: values.orcado,
      gasto: values.gasto
    }));

    chartData.sort((a, b) => b.gasto - a.gasto);

    setYearlyChartData(chartData);
  };

  const handleSave = async (data: FTsTableRow[], deletedRows: { company: string; contract_name: string }[]) => {
    try {
      const records: Omit<OperationalFTs, 'id' | 'created_at' | 'updated_at'>[] = [];

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

      if (deletedRows.length > 0) {
        await DashboardService.deleteOperationalFTs(deletedRows);
      }

      await DashboardService.upsertOperationalFTs(records);
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
      title="FTs"
      subtitle="Orçado vs Gasto - Últimos 12 meses"
      accentColor="#eab308"
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
                <label className="text-sm font-medium text-gray-700">Contrato:</label>
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Contratos</option>
                  {Array.from(new Set(tableData.map(d => d.contract_name))).map((contract) => (
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
                <Bar dataKey="WWS" name="WWS" fill="#3b82f6" />
                <Bar dataKey="Worldwide" name="Worldwide" fill="#ef4444" />
              </BarChart>
            ) : viewMode === 'single' ? (
              <BarChart data={singleMonthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contract" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="orcado" name="Orçado" fill="#3b82f6" />
                <Bar dataKey="gasto" name="Gasto" fill="#ef4444" />
              </BarChart>
            ) : (
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contract" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="orcado" name="Orçado" fill="#3b82f6" />
                <Bar dataKey="gasto" name="Gasto" fill="#ef4444" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <FTsTable
          data={tableData}
          months={months}
          clients={clients}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </IndicatorCard>
  );
}
