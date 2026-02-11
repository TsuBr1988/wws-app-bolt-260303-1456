import { useState, useMemo, useEffect } from 'react';
import { Plus, FileText, AlertTriangle, DollarSign, Search, Filter, ArrowUpDown, X, Info, Users, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ContractCard } from '../components/contracts/ContractCard';
import { ContractForm } from '../components/contracts/ContractForm';
import { AddendumForm } from '../components/contracts/AddendumForm';
import { EditContractForm } from '../components/contracts/EditContractForm';
import { AddendumViewModal } from '../components/contracts/AddendumViewModal';
import { ContractChart } from '../components/contracts/ContractChart';
import { MonthlyRevenueModal } from '../components/contracts/MonthlyRevenueModal';
import { supabase } from '../lib/supabase';
import {
  ContractWithAddendums,
  getCurrentValue,
  getCurrentEndDate,
  isContractExpired,
  isContractEndingSoon,
  formatCurrency,
  formatDateBR,
  shouldShowDissidioReminder,
  shouldShowIPCAReminder,
} from '../lib/contractUtils';
import { useToast } from '../components/ui/use-toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseISO, addMonths } from 'date-fns';

interface EmployeeData {
  contract_id: string;
  position: string;
  quantity: number;
  empresa: string;
}

interface ReequilibrioData {
  contract: ContractWithAddendums;
  tipo: 'dissidio' | 'ipca';
  dataMaxima: Date;
}

export function ContractsPage() {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<ContractWithAddendums[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear] = useState(new Date().getFullYear());
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);

  const [showContractForm, setShowContractForm] = useState(false);
  const [showAddendumForm, setShowAddendumForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddendumView, setShowAddendumView] = useState(false);
  const [showMonthlyRevenue, setShowMonthlyRevenue] = useState(false);
  const [showEndingSoonModal, setShowEndingSoonModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showReequilibrioModal, setShowReequilibrioModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithAddendums | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [empresaFilter, setEmpresaFilter] = useState<'all' | 'WWS' | 'Worldwide'>('all');
  const [tipoFilter, setTipoFilter] = useState<'all' | 'Publico' | 'Privado'>('all');
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'value' | 'client' | 'end_date'>('end_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);

      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      const { data: addendumsData, error: addendumsError } = await supabase
        .from('contract_addendums')
        .select('*')
        .order('start_date', { ascending: false });

      if (addendumsError) throw addendumsError;

      const contractsWithAddendums: ContractWithAddendums[] = (contractsData || []).map(
        (contract) => ({
          ...contract,
          addendums: (addendumsData || []).filter((a) => a.contract_id === contract.id),
        })
      );

      setContracts(contractsWithAddendums);

      const activeContractIds = contractsWithAddendums
        .filter((c) => c.is_active && !isContractExpired(c))
        .map((c) => c.id);

      if (activeContractIds.length > 0) {
        const { data: employeesDataRaw, error: employeesError } = await supabase
          .from('contract_employees')
          .select('id, contract_id, position')
          .in('contract_id', activeContractIds);

        if (employeesError) throw employeesError;

        const employeeIds = employeesDataRaw?.map((e) => e.id) || [];

        const { data: quantitiesData, error: quantitiesError } = await supabase
          .from('contract_employee_quantities')
          .select('contract_employee_id, addendum_number, quantity')
          .in('contract_employee_id', employeeIds);

        if (quantitiesError) throw quantitiesError;

        const employeesWithQuantities: EmployeeData[] = (employeesDataRaw || []).map((emp) => {
          const empQuantities = quantitiesData?.filter((q) => q.contract_employee_id === emp.id) || [];
          let quantity = 0;

          if (empQuantities.length > 0) {
            const maxAddendum = Math.max(...empQuantities.map((q) => q.addendum_number));
            quantity = empQuantities.find((q) => q.addendum_number === maxAddendum)?.quantity || 0;
          }

          const contract = contractsWithAddendums.find((c) => c.id === emp.contract_id);

          return {
            contract_id: emp.contract_id,
            position: emp.position,
            quantity,
            empresa: contract?.empresa || 'WWS',
          };
        });

        setEmployeesData(employeesWithQuantities);
      }
    } catch (error) {
      console.error('❌ Error fetching contracts:', error);
      toast({
        title: 'Erro ao carregar contratos',
        description: 'Não foi possível carregar os contratos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (contractData: any) => {
    try {
      const { error } = await supabase.from('contracts').insert([contractData]);

      if (error) throw error;

      toast({
        title: 'Contrato criado com sucesso!',
        description: `Contrato para ${contractData.client_name} foi criado.`,
      });

      setShowContractForm(false);
      fetchContracts();
    } catch (error) {
      console.error('❌ Error creating contract:', error);
      toast({
        title: 'Erro ao criar contrato',
        description: 'Não foi possível criar o contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAddendum = async (addendumData: any) => {
    try {
      console.log('📝 Creating addendum with data:', addendumData);

      const { data, error } = await supabase.from('contract_addendums').insert([addendumData]).select();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Addendum created successfully:', data);

      const message = addendumData.is_punctual
        ? 'Aditivo pontual criado com sucesso! O contrato retornará às condições anteriores após o término.'
        : addendumData.monthly_value === 0
        ? 'Aditivo informativo criado com sucesso! Registrado apenas como alteração de dados contratuais.'
        : 'Aditivo permanente criado com sucesso!';

      toast({
        title: message,
      });

      setShowAddendumForm(false);
      setSelectedContract(null);
      fetchContracts();
    } catch (error: any) {
      console.error('❌ Error creating addendum:', error);
      const errorMessage = error?.message || 'Não foi possível criar o aditivo.';
      toast({
        title: 'Erro ao criar aditivo',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateContract = async (contractId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: 'Contrato atualizado com sucesso!',
      });

      setShowEditForm(false);
      setSelectedContract(null);
      fetchContracts();
    } catch (error) {
      console.error('❌ Error updating contract:', error);
      toast({
        title: 'Erro ao atualizar contrato',
        description: 'Não foi possível atualizar o contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (contractId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ is_active: newStatus })
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: `Contrato marcado como ${newStatus ? 'ativo' : 'inativo'} com sucesso!`,
      });

      fetchContracts();
    } catch (error) {
      console.error('❌ Error updating status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do contrato.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAddendum = async (addendumId: string) => {
    try {
      const { error } = await supabase.from('contract_addendums').delete().eq('id', addendumId);

      if (error) throw error;

      toast({
        title: 'Aditivo excluído com sucesso!',
      });

      fetchContracts();
    } catch (error) {
      console.error('❌ Error deleting addendum:', error);
      toast({
        title: 'Erro ao excluir aditivo',
        description: 'Não foi possível excluir o aditivo.',
        variant: 'destructive',
      });
    }
  };

  const availableCities = useMemo(() => {
    const cities = new Set(contracts.map((c) => c.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    let filtered = contracts;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.client_name.toLowerCase().includes(search) ||
          (c.city && c.city.toLowerCase().includes(search))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => {
        const expired = isContractExpired(c);
        const active = c.is_active && !expired;
        return statusFilter === 'active' ? active : !active;
      });
    }

    if (empresaFilter !== 'all') {
      filtered = filtered.filter((c) => c.empresa === empresaFilter);
    }

    if (tipoFilter !== 'all') {
      filtered = filtered.filter((c) => (c.tipo || 'Publico') === tipoFilter);
    }

    if (cityFilter.length > 0) {
      filtered = filtered.filter((c) => cityFilter.includes(c.city || ''));
    }

    filtered.sort((a, b) => {
      const aActive = a.is_active && !isContractExpired(a);
      const bActive = b.is_active && !isContractExpired(b);

      if (aActive !== bActive) {
        return aActive ? -1 : 1;
      }

      let comparison = 0;
      if (sortBy === 'value') {
        comparison = getCurrentValue(b) - getCurrentValue(a);
      } else if (sortBy === 'client') {
        comparison = a.client_name.localeCompare(b.client_name);
      } else if (sortBy === 'end_date') {
        comparison =
          new Date(getCurrentEndDate(a)).getTime() - new Date(getCurrentEndDate(b)).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [contracts, searchTerm, statusFilter, empresaFilter, tipoFilter, cityFilter, sortBy, sortOrder]);

  const indicators = useMemo(() => {
    // Usar filteredContracts para refletir os filtros aplicados
    const activeContracts = filteredContracts.filter((c) => c.is_active && !isContractExpired(c));
    const endingSoonContracts = activeContracts.filter((c) => isContractEndingSoon(c, 90));

    const wwsContracts = activeContracts.filter((c) => c.empresa === 'WWS');
    const worldwideContracts = activeContracts.filter((c) => c.empresa === 'Worldwide');

    const wwsRevenue = wwsContracts.reduce((sum, c) => sum + getCurrentValue(c), 0);
    const worldwideRevenue = worldwideContracts.reduce((sum, c) => sum + getCurrentValue(c), 0);
    const monthlyRevenue = wwsRevenue + worldwideRevenue;

    // Filtrar employeesData pelos contratos filtrados
    const filteredContractIds = activeContracts.map(c => c.id);
    const filteredEmployeesData = employeesData.filter(e => filteredContractIds.includes(e.contract_id));

    const totalEmployees = filteredEmployeesData.reduce((sum, e) => sum + e.quantity, 0);
    const wwsEmployees = filteredEmployeesData
      .filter((e) => e.empresa === 'WWS')
      .reduce((sum, e) => sum + e.quantity, 0);
    const worldwideEmployees = filteredEmployeesData
      .filter((e) => e.empresa === 'Worldwide')
      .reduce((sum, e) => sum + e.quantity, 0);

    // Calcular reequilíbrios pendentes no mês atual
    const reequilibriosPendentes: ReequilibrioData[] = [];
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    activeContracts.forEach((contract) => {
      // Verificar Dissídio (Janeiro)
      if (contract.reequilibrio_dissidio && shouldShowDissidioReminder(contract)) {
        const dataMaxima = new Date(anoAtual, 0, 31); // 31 de janeiro
        if (mesAtual === 0) { // Janeiro
          reequilibriosPendentes.push({
            contract,
            tipo: 'dissidio',
            dataMaxima,
          });
        }
      }

      // Verificar IPCA (10 meses após início, depois anualmente)
      if (contract.reequilibrio_ipca && shouldShowIPCAReminder(contract)) {
        const startDate = parseISO(contract.start_date);
        let dataMaxima: Date;

        if (!contract.ultimo_lembrete_ipca) {
          // Primeiro reequilíbrio: 10 meses após início
          dataMaxima = addMonths(startDate, 10);
        } else {
          // Reequilíbrios subsequentes: 12 meses após último lembrete
          const ultimoLembrete = parseISO(contract.ultimo_lembrete_ipca);
          dataMaxima = addMonths(ultimoLembrete, 12);
        }

        // Verificar se o reequilíbrio é para este mês
        if (dataMaxima.getMonth() === mesAtual && dataMaxima.getFullYear() === anoAtual) {
          reequilibriosPendentes.push({
            contract,
            tipo: 'ipca',
            dataMaxima,
          });
        }
      }
    });

    const dissidioCount = reequilibriosPendentes.filter(r => r.tipo === 'dissidio').length;
    const ipcaCount = reequilibriosPendentes.filter(r => r.tipo === 'ipca').length;

    return {
      total: activeContracts.length,
      wwsCount: wwsContracts.length,
      worldwideCount: worldwideContracts.length,
      endingSoon: endingSoonContracts.length,
      endingSoonContracts: endingSoonContracts,
      revenue: monthlyRevenue,
      wwsRevenue,
      worldwideRevenue,
      totalEmployees,
      wwsEmployees,
      worldwideEmployees,
      reequilibriosPendentes,
      reequilibriosTotal: reequilibriosPendentes.length,
      dissidioCount,
      ipcaCount,
    };
  }, [filteredContracts, employeesData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parking mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1 py-4 relative">
            <div className="absolute inset-0 gradient-2ws opacity-10 rounded-2xl blur-3xl"></div>
            <h1 className="text-3xl font-bold text-brand-dark relative">Contratos</h1>
          </div>
          <Button onClick={() => setShowContractForm(true)} className="gradient-parking hover:opacity-90 text-white shadow-md transition-all ml-4">
            <Plus className="h-4 w-4 mr-2" />
            Incluir Contrato
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
            <div className="absolute inset-0 gradient-parking opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium mb-1">Contratos Vigentes</p>
                <p className="text-3xl font-bold text-brand-dark">{indicators.total}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-seguranca">WWS:</span> {indicators.wwsCount}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Worldwide:</span> {indicators.worldwideCount}
                  </div>
                </div>
              </div>
              <div className="gradient-parking p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
            <div className="absolute inset-0 gradient-tecnologia opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600 font-medium">Colaboradores</p>
                  <button
                    onClick={() => setShowEmployeesModal(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Ver distribuição por função"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-3xl font-bold text-brand-dark">{indicators.totalEmployees}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-seguranca">WWS:</span> {indicators.wwsEmployees}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Worldwide:</span> {indicators.worldwideEmployees}
                  </div>
                </div>
              </div>
              <div className="gradient-tecnologia p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
            <div className="absolute inset-0 gradient-facilities opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600 font-medium">Encerrando em 90 dias</p>
                  <button
                    onClick={() => setShowEndingSoonModal(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Ver detalhes"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-3xl font-bold text-brand-dark">{indicators.endingSoon}</p>
                <p className="text-xs text-gray-500 mt-2">Necessitam atenção</p>
              </div>
              <div className="gradient-facilities p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
            <div className="absolute inset-0 gradient-ambiental opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-medium mb-1">Receita mensal atual</p>
                <p className="text-xl font-bold text-brand-dark mb-2">
                  {formatCurrency(indicators.revenue)}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">WWS:</span>
                    <span className="text-seguranca font-semibold">
                      {formatCurrency(indicators.wwsRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Worldwide:</span>
                    <span className="text-gray-700 font-semibold">
                      {formatCurrency(indicators.worldwideRevenue)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="gradient-ambiental p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative cursor-pointer"
               onClick={() => setShowReequilibrioModal(true)}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600 font-medium">Reequilíbrio</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReequilibrioModal(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Ver detalhes dos reequilíbrios"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-3xl font-bold text-brand-dark">{indicators.reequilibriosTotal}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-green-600">Dissídio:</span> {indicators.dissidioCount}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-emerald-600">IPCA:</span> {indicators.ipcaCount}
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <ContractChart
          contracts={filteredContracts}
          selectedYear={selectedYear}
          onInfoClick={() => {
            setSelectedMonth(new Date());
            setShowMonthlyRevenue(true);
          }}
        />

        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente ou cidade"
                  className="pl-11"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>

            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Todas as Empresas</option>
              <option value="WWS">WWS</option>
              <option value="Worldwide">Worldwide</option>
            </select>

            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Todos os Tipos</option>
              <option value="Publico">Público</option>
              <option value="Privado">Privado</option>
            </select>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg pr-10"
              >
                <option value="value">Faturamento</option>
                <option value="client">Nome do Cliente</option>
                <option value="end_date">Data de Término</option>
              </select>
              <button
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onEditClick={() => {
                setSelectedContract(contract);
                setShowEditForm(true);
              }}
              onAddendumClick={() => {
                setSelectedContract(contract);
                setShowAddendumForm(true);
              }}
              onViewAddendumsClick={() => {
                setSelectedContract(contract);
                setShowAddendumView(true);
              }}
              onStatusChange={handleUpdateStatus}
              isAdmin={true}
            />
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              Nenhum contrato encontrado
            </p>
            <p className="text-gray-400 text-sm">
              {searchTerm || statusFilter !== 'all' || empresaFilter !== 'all'
                ? 'Tente ajustar os filtros'
                : "Clique em 'Incluir Contrato' para começar"}
            </p>
          </div>
        )}
      </div>

      {showContractForm && (
        <ContractForm onClose={() => setShowContractForm(false)} onSubmit={handleCreateContract} />
      )}

      {showAddendumForm && selectedContract && (
        <AddendumForm
          contract={selectedContract}
          onClose={() => {
            setShowAddendumForm(false);
            setSelectedContract(null);
          }}
          onSubmit={handleCreateAddendum}
        />
      )}

      {showEditForm && selectedContract && (
        <EditContractForm
          contract={selectedContract}
          onClose={() => {
            setShowEditForm(false);
            setSelectedContract(null);
          }}
          onSubmit={handleUpdateContract}
        />
      )}

      {showAddendumView && selectedContract && (
        <AddendumViewModal
          contract={selectedContract}
          onClose={() => {
            setShowAddendumView(false);
            setSelectedContract(null);
          }}
          onDelete={handleDeleteAddendum}
          isAdmin={true}
        />
      )}

      {showMonthlyRevenue && selectedMonth && (
        <MonthlyRevenueModal
          contracts={contracts}
          monthDate={selectedMonth}
          onClose={() => {
            setShowMonthlyRevenue(false);
            setSelectedMonth(null);
          }}
        />
      )}

      {showEndingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col border-2 border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-dark">Contratos Encerrando em 90 Dias</h2>
              <button
                onClick={() => setShowEndingSoonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {indicators.endingSoonContracts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum contrato encerrando nos próximos 90 dias</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {indicators.endingSoonContracts.map((contract) => {
                    const daysRemaining = Math.floor(
                      (new Date(getCurrentEndDate(contract)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={contract.id}
                        className={`p-4 rounded-lg border-2 ${
                          contract.empresa === 'WWS' ? 'bg-seguranca/10 border-seguranca/30' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900">{contract.client_name}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                contract.empresa === 'WWS'
                                  ? 'bg-seguranca/20 text-seguranca-dark'
                                  : 'bg-gray-200 text-gray-800'
                              }`}>
                                {contract.empresa}
                              </span>
                            </div>
                            {contract.city && (
                              <p className="text-sm text-gray-600 mb-2">{contract.city}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Término: </span>
                                <span className="font-medium text-facilities">
                                  {formatDateBR(getCurrentEndDate(contract))}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Valor: </span>
                                <span className="font-medium text-ambiental">
                                  {formatCurrency(getCurrentValue(contract))}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-2xl font-bold ${
                              daysRemaining <= 30 ? 'text-facilities' : daysRemaining <= 60 ? 'text-facilities-dark' : 'text-seguranca'
                            }`}>
                              {daysRemaining}
                            </div>
                            <div className="text-xs text-gray-500">dias restantes</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button onClick={() => setShowEndingSoonModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEmployeesModal && (
        <EmployeesDistributionModal
          employeesData={employeesData}
          onClose={() => setShowEmployeesModal(false)}
        />
      )}

      {showReequilibrioModal && (
        <ReequilibrioModal
          reequilibrios={indicators.reequilibriosPendentes}
          onClose={() => setShowReequilibrioModal(false)}
          onMarkComplete={async (reequilibrio) => {
            try {
              const campo = reequilibrio.tipo === 'dissidio'
                ? 'ultimo_lembrete_dissidio'
                : 'ultimo_lembrete_ipca';

              const hoje = new Date().toISOString().split('T')[0];

              const { error } = await supabase
                .from('contracts')
                .update({ [campo]: hoje })
                .eq('id', reequilibrio.contract.id);

              if (error) throw error;

              toast({
                title: 'Reequilíbrio marcado como concluído!',
                description: `${reequilibrio.contract.client_name} - ${reequilibrio.tipo === 'dissidio' ? 'Dissídio' : 'IPCA'}`,
              });

              fetchContracts();
            } catch (error) {
              console.error('❌ Error marking reequilibrio:', error);
              toast({
                title: 'Erro ao marcar reequilíbrio',
                description: 'Não foi possível marcar o reequilíbrio como concluído.',
                variant: 'destructive',
              });
            }
          }}
        />
      )}
    </div>
  );
}

interface EmployeesDistributionModalProps {
  employeesData: EmployeeData[];
  onClose: () => void;
}

function EmployeesDistributionModal({ employeesData, onClose }: EmployeesDistributionModalProps) {
  const positionData = useMemo(() => {
    const grouped = employeesData.reduce((acc, emp) => {
      const existing = acc.find(item => item.position === emp.position);
      if (existing) {
        existing.quantity += emp.quantity;
      } else {
        acc.push({ position: emp.position, quantity: emp.quantity });
      }
      return acc;
    }, [] as Array<{ position: string; quantity: number }>);

    return grouped
      .sort((a, b) => b.quantity - a.quantity)
      .map(item => ({
        name: item.position,
        value: item.quantity,
      }));
  }, [employeesData]);

  const COLORS = ['#3498DB', '#2ECC71', '#F1C40F', '#E74C3C', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col border-2 border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-dark">Distribuição de Colaboradores por Função</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {positionData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum colaborador cadastrado</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={positionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {positionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Detalhamento por Função</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {positionData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReequilibrioModalProps {
  reequilibrios: ReequilibrioData[];
  onClose: () => void;
  onMarkComplete: (reequilibrio: ReequilibrioData) => void;
}

function ReequilibrioModal({ reequilibrios, onClose, onMarkComplete }: ReequilibrioModalProps) {
  const getDaysRemaining = (dataMaxima: Date): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diff = dataMaxima.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const sortedReequilibrios = useMemo(() => {
    return [...reequilibrios].sort((a, b) => {
      return a.dataMaxima.getTime() - b.dataMaxima.getTime();
    });
  }, [reequilibrios]);

  const dissidioCount = reequilibrios.filter(r => r.tipo === 'dissidio').length;
  const ipcaCount = reequilibrios.filter(r => r.tipo === 'ipca').length;

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'border-red-500 bg-red-50';
    if (daysRemaining === 0) return 'border-orange-500 bg-orange-50';
    if (daysRemaining <= 7) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  const getUrgencyTextColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-red-700';
    if (daysRemaining === 0) return 'text-orange-700';
    if (daysRemaining <= 7) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col border-2 border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-dark">Reequilíbrios Pendentes</h2>
            <p className="text-sm text-gray-600">Contratos que precisam de reequilíbrio no mês atual</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{dissidioCount}</div>
              <div className="text-xs text-green-600 font-medium">Dissídio (Janeiro)</div>
            </div>
            <div className="bg-emerald-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-emerald-700">{ipcaCount}</div>
              <div className="text-xs text-emerald-600 font-medium">IPCA (10/12 meses)</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {sortedReequilibrios.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">
                Nenhum reequilíbrio pendente
              </p>
              <p className="text-gray-400 text-sm">
                Não há contratos que precisam de reequilíbrio no mês atual
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReequilibrios.map((reequilibrio) => {
                const daysRemaining = getDaysRemaining(reequilibrio.dataMaxima);
                return (
                  <div
                    key={`${reequilibrio.contract.id}-${reequilibrio.tipo}`}
                    className={`rounded-lg border-2 p-4 ${getUrgencyColor(daysRemaining)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 truncate">
                            {reequilibrio.contract.client_name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            reequilibrio.contract.empresa === 'WWS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {reequilibrio.contract.empresa}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Tipo:</span>
                            <span className={`font-semibold ${
                              reequilibrio.tipo === 'dissidio' ? 'text-green-600' : 'text-emerald-600'
                            }`}>
                              {reequilibrio.tipo === 'dissidio' ? 'Dissídio' : 'IPCA'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Data Máxima:</span>
                            <span className={`font-semibold ${getUrgencyTextColor(daysRemaining)}`}>
                              {formatDateBR(reequilibrio.dataMaxima.toISOString())}
                            </span>
                          </div>
                        </div>

                        {reequilibrio.contract.city && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Cidade:</span> {reequilibrio.contract.city}
                          </p>
                        )}

                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Valor Mensal:</span>
                          <span className="font-bold text-green-600 ml-2">
                            {formatCurrency(getCurrentValue(reequilibrio.contract))}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-lg font-bold ${getUrgencyTextColor(daysRemaining)}`}>
                          {daysRemaining < 0 ? 'Atrasado' : daysRemaining === 0 ? 'Hoje' : `${daysRemaining} dias`}
                        </div>
                        <Button
                          onClick={() => onMarkComplete(reequilibrio)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Marcar Concluído
                        </Button>
                      </div>
                    </div>

                    {daysRemaining < 0 && (
                      <div className="mt-3 text-xs text-red-700 bg-red-100 rounded px-3 py-2 font-medium">
                        ⚠️ ATENÇÃO: Data de reequilíbrio já passou!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
