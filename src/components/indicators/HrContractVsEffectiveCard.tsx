import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { ContractTable } from '@/components/dashboard/ContractTable';
import { ContractVsEffectiveBars } from '@/components/charts/ContractVsEffectiveBars';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { ContractTableRow, HrContractEmployees } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { getDatabase } from '@/lib/databaseResolver';
import { ManualContractModal } from '@/components/dashboard/ManualContractModal';
import { Plus } from 'lucide-react';

const supabase = getDatabase('RH');

type GroupByType = 'tipo' | 'empresa' | 'cidade';

export function HrContractVsEffectiveCard() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<ContractTableRow[]>([]);
  const [chartData, setChartData] = useState<Array<{ monthLabel: string; [key: string]: number | string; contract: number; effective: number }>>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByType>('empresa');
  const [categories, setCategories] = useState<string[]>(['WWS', 'Worldwide']);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingManualContract, setEditingManualContract] = useState<{
    id: string;
    contract_name: string;
    empresa: string;
    tipo: string;
    city: string;
    contract_qty: number;
  } | null>(null);
  const { toast } = useToast();

  const months = getLast12Months();

  const loadData = async () => {
    setLoading(true);
    try {
      // Load regular contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('id, client_name, empresa, tipo, city, is_active')
        .eq('is_active', showInactive ? false : true)
        .order('client_name');

      if (contractsError) throw contractsError;

      const contractIds = contractsData?.map(c => c.id) || [];

      const { data: employeesData, error: employeesError } = await supabase
        .from('contract_employees')
        .select('id, contract_id, position')
        .in('contract_id', contractIds);

      if (employeesError) throw employeesError;

      const employeeIds = employeesData?.map(e => e.id) || [];

      const { data: quantitiesData, error: quantitiesError } = await supabase
        .from('contract_employee_quantities')
        .select('contract_employee_id, addendum_number, quantity')
        .in('contract_employee_id', employeeIds);

      if (quantitiesError) throw quantitiesError;

      const contractEmployeeCounts = new Map<string, number>();

      employeesData?.forEach(emp => {
        const empQuantities = quantitiesData?.filter(q => q.contract_employee_id === emp.id) || [];

        if (empQuantities.length > 0) {
          const maxAddendum = Math.max(...empQuantities.map(q => q.addendum_number));
          const latestQuantity = empQuantities.find(q => q.addendum_number === maxAddendum)?.quantity || 0;

          const current = contractEmployeeCounts.get(emp.contract_id) || 0;
          contractEmployeeCounts.set(emp.contract_id, current + latestQuantity);
        }
      });

      const monthsRange = months.map(m => m.monthYm);
      const effectiveData = await DashboardService.getHrContractEmployees(monthsRange);

      // Load manual contracts
      const { data: manualContractsData, error: manualError } = await supabase
        .from('hr_manual_contracts')
        .select('*')
        .order('contract_name');

      if (manualError) throw manualError;

      // Create table rows for regular contracts
      const regularRows: ContractTableRow[] = contractsData?.map(contract => {
        let companyValue: string;
        if (groupBy === 'empresa') {
          companyValue = contract.empresa || 'WWS';
        } else if (groupBy === 'tipo') {
          companyValue = contract.tipo || 'Publico';
        } else {
          companyValue = contract.city || 'Sem Cidade';
        }

        const row: ContractTableRow = {
          id: contract.id,
          company: companyValue,
          contract_name: contract.client_name,
          contract_qty: contractEmployeeCounts.get(contract.id) || 0,
          isManual: false,
        };

        months.forEach(month => {
          const monthData = effectiveData.find(
            d => d.contract_name === contract.client_name && d.month_ym === month.monthYm
          );

          if (monthData) {
            row[`${month.monthYm}_fixos`] = monthData.fixos;
            row[`${month.monthYm}_ferias`] = monthData.ferias_concedidas;
            row[`${month.monthYm}_feiristas`] = monthData.feiristas;
            row[`${month.monthYm}_afastados`] = monthData.afastados;
          }
        });

        return row;
      }) || [];

      // Create table rows for manual contracts
      const manualRows: ContractTableRow[] = manualContractsData?.map(contract => {
        let companyValue: string;
        if (groupBy === 'empresa') {
          companyValue = contract.empresa || 'WWS';
        } else if (groupBy === 'tipo') {
          companyValue = contract.tipo || 'Publico';
        } else {
          companyValue = contract.city || 'Sem Cidade';
        }

        const row: ContractTableRow = {
          id: contract.id,
          company: companyValue,
          contract_name: contract.contract_name,
          contract_qty: contract.contract_qty || 0,
          isManual: true,
        };

        months.forEach(month => {
          const monthData = effectiveData.find(
            d => d.contract_name === contract.contract_name && d.month_ym === month.monthYm
          );

          if (monthData) {
            row[`${month.monthYm}_fixos`] = monthData.fixos;
            row[`${month.monthYm}_ferias`] = monthData.ferias_concedidas;
            row[`${month.monthYm}_feiristas`] = monthData.feiristas;
            row[`${month.monthYm}_afastados`] = monthData.afastados;
          }
        });

        return row;
      }) || [];

      // Combine regular and manual contracts
      const allRows = [...regularRows, ...manualRows];
      setTableData(allRows);

      // Get unique groups for the selected groupBy
      const uniqueGroups = Array.from(new Set(allRows.map(r => r.company))).sort();
      setCategories(uniqueGroups);

      const chartDataByMonth = months.map((month) => {
        const monthRecords = effectiveData.filter((d) => d.month_ym === month.monthYm);

        const monthData: { monthLabel: string; [key: string]: number | string; contract: number; effective: number } = {
          monthLabel: month.monthLabel,
          contract: 0,
          effective: 0,
        };

        // Calculate contract quantities for each category
        let totalContract = 0;
        uniqueGroups.forEach(group => {
          const groupTotal = allRows
            .filter(r => r.company === group)
            .reduce((sum, r) => sum + (r.contract_qty || 0), 0);
          monthData[`contract_${group}`] = groupTotal;
          totalContract += groupTotal;
        });

        monthData.contract = totalContract;

        // Calculate effective total
        const totalEffective = monthRecords.reduce(
          (sum, r) => sum + r.fixos + r.ferias_concedidas + r.feiristas + r.afastados,
          0
        );
        monthData.effective = totalEffective;

        return monthData;
      });

      setChartData(chartDataByMonth);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de contratos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showInactive, groupBy]);

  const handleSave = async (data: ContractTableRow[]) => {
    try {
      const records: Omit<HrContractEmployees, 'id' | 'created_at' | 'updated_at'>[] = [];

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
          const fixos = Number(row[`${month.monthYm}_fixos`]) || 0;
          const ferias = Number(row[`${month.monthYm}_ferias`]) || 0;
          const feiristas = Number(row[`${month.monthYm}_feiristas`]) || 0;
          const afastados = Number(row[`${month.monthYm}_afastados`]) || 0;

          records.push({
            company: row.company as 'WWS' | 'Worldwide',
            contract_name: row.contract_name,
            contract_qty: Number(row.contract_qty) || 0,
            month_ym: month.monthYm,
            fixos,
            ferias_concedidas: ferias,
            feiristas,
            afastados,
          });
        });
      });

      await DashboardService.upsertHrContractEmployees(records);
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

  const handleEditManualContract = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('hr_manual_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) throw error;

      if (data) {
        setEditingManualContract({
          id: data.id,
          contract_name: data.contract_name,
          empresa: data.empresa,
          tipo: data.tipo,
          city: data.city || '',
          contract_qty: data.contract_qty,
        });
        setShowManualModal(true);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteManualContract = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato manual?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hr_manual_contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contrato manual excluído com sucesso.',
      });

      await loadData();
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o contrato manual.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseModal = () => {
    setShowManualModal(false);
    setEditingManualContract(null);
  };

  return (
    <IndicatorCard
        title="Funcionários do Contrato x Efetivos"
        subtitle="Últimos 12 meses - Comparação entre funcionários contratados e efetivos"
        accentColor="#3498DB"
        defaultExpanded={true}
    >
      <div className="space-y-6">
        <div className="flex gap-4 items-center mb-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Agrupar por:</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setGroupBy('tipo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupBy === 'tipo'
                  ? 'bg-parking text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Público x Privado
            </button>
            <button
              onClick={() => setGroupBy('empresa')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupBy === 'empresa'
                  ? 'bg-parking text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              WWS x Worldwide
            </button>
            <button
              onClick={() => setGroupBy('cidade')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupBy === 'cidade'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cidades
            </button>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar Contrato Manual
          </button>
        </div>
        <ContractVsEffectiveBars data={chartData} categories={categories} />
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <strong>Legenda:</strong> As barras coloridas representam os contratos agrupados por {groupBy === 'empresa' ? 'empresa' : groupBy === 'tipo' ? 'tipo (público/privado)' : 'cidade'} | Barra verde = Efetivos abaixo do contrato | Barra vermelha = Efetivos acima do contrato
          <br />
          <strong>Efetivos:</strong> Fixos + Férias Concedidas + Feiristas + Afastados
        </div>
        <ContractTable
          data={tableData}
          months={months}
          onSave={handleSave}
          loading={loading}
          showInactive={showInactive}
          onToggleInactive={() => setShowInactive(!showInactive)}
          onEditManualContract={handleEditManualContract}
          onDeleteManualContract={handleDeleteManualContract}
        />
      </div>

      <ManualContractModal
        isOpen={showManualModal}
        onClose={handleCloseModal}
        onSuccess={() => {
          loadData();
          handleCloseModal();
        }}
        editContract={editingManualContract}
      />
    </IndicatorCard>
  );
}
