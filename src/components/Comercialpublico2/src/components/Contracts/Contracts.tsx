import React, { useState, useMemo } from 'react';
import { Plus, FileText, AlertTriangle, Calendar, DollarSign, Clock, ArrowUpDown, Filter, Power, Search } from 'lucide-react';
import { ContractCard } from './ContractCard';
import { ContractForm } from './ContractForm';
import { ContractChart } from './ContractChart';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { ContractWithAddendums } from '../../types/contracts';

export const Contracts: React.FC = () => {
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const { canEdit } = useSystemVersion();
  const canEditContracts = canEdit('contracts');
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'faturamento' | 'cliente' | 'termino'>('termino');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [empresaFilter, setEmpresaFilter] = useState<'all' | 'WWS' | 'Worldwide'>('all');
  const [searchText, setSearchText] = useState('');

  // Buscar contratos e aditivos
  const { data: contracts = [], loading: contractsLoading, refetch } = useSupabaseQuery('contracts', {
    orderBy: { column: 'end_date', ascending: true },
    includeDepartmentFilter: true
  });
  
  const { data: addendums = [], loading: addendumsLoading } = useSupabaseQuery('contract_addendums', {
    orderBy: { column: 'created_at', ascending: false }
  });

  // Processar contratos com aditivos
  const contractsWithAddendums: ContractWithAddendums[] = useMemo(() => {
    return contracts.map(contract => {
      // Buscar aditivos deste contrato
      const contractAddendums = addendums.filter(a => a.contract_id === contract.id);
      
      // Função para identificar aditivos informativos
      const isInformativeAddendum = (addendum: any) => {
        return addendum.monthly_value === 0 && 
               addendum.observations && 
               addendum.observations.startsWith('[ADITIVO INFORMATIVO]');
      };
      
      // Assumir que contratos sem campo is_active são ativos por padrão
      const isActive = contract.is_active !== undefined ? contract.is_active : true;
      
      const today = new Date();
      
      // Separar aditivos pontuais dos permanentes (ignorando informativos)
      const punctualAddendums = contractAddendums.filter(a => a.is_punctual && !isInformativeAddendum(a));
      const permanentAddendums = contractAddendums.filter(a => !a.is_punctual && !isInformativeAddendum(a));
      
      // 1. DETERMINAR DATA DE TÉRMINO: Sempre do aditivo permanente mais distante
      let currentEndDate = contract.end_date; // Padrão: contrato original
      
      if (permanentAddendums.length > 0) {
        // Buscar aditivo permanente com data de término mais distante
        const furthestPermanentAddendum = permanentAddendums
          .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
        currentEndDate = furthestPermanentAddendum.end_date;
      }
      
      // 2. DETERMINAR VALOR ATUAL: Considerando aditivos pontuais ativos
      let currentValue = contract.monthly_value;
      let activePunctualAddendum: ContractAddendum | undefined = undefined;
      
      // Verificar se há aditivo pontual ativo
      if (punctualAddendums.length > 0) {
        activePunctualAddendum = punctualAddendums.find(addendum => {
          const startDate = new Date(addendum.effective_start_date || addendum.start_date);
          const endDate = new Date(addendum.effective_end_date || addendum.end_date);
          return today >= startDate && today <= endDate;
        });
      }
      
      if (activePunctualAddendum) {
        // Se há aditivo pontual ativo, usar seu valor
        currentValue = activePunctualAddendum.monthly_value;
      } else {
        // Se não há aditivo pontual ativo, usar valor do aditivo permanente mais recente
        if (permanentAddendums.length > 0) {
          const latestPermanentAddendum = permanentAddendums
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          currentValue = latestPermanentAddendum.monthly_value;
        }
      }
      
      // 3. CALCULAR DIAS ATÉ O FIM DO CONTRATO (baseado na data permanente)
      const endDate = new Date(currentEndDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysUntilEnd = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Verificar se contrato está próximo ao fim (90 dias)
      const isEndingSoon = daysUntilEnd <= 90 && daysUntilEnd > 0;
      
      // 4. CALCULAR DIAS ATÉ O FIM DO ADITIVO PONTUAL MAIS RECENTE (se houver)
      let punctualEndingSoon = false;
      let daysUntilPunctualEnd = 0;
      let latestPunctualAddendum: ContractAddendum | undefined = undefined;
      
      // Buscar o aditivo pontual mais recente (independente de estar ativo)
      if (punctualAddendums.length > 0) {
        latestPunctualAddendum = punctualAddendums
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const punctualEndDate = new Date(latestPunctualAddendum.end_date);
        
        // Debug: Log das datas para verificar o cálculo
        console.log('🔍 Debug Aditivo Pontual:', {
          today: today.toISOString().split('T')[0],
          punctualEndDate: punctualEndDate.toISOString().split('T')[0],
          end_date: latestPunctualAddendum.end_date,
          isLatestPunctual: true
        });
        
        const punctualTimeDiff = punctualEndDate.getTime() - today.getTime();
        daysUntilPunctualEnd = Math.ceil(punctualTimeDiff / (1000 * 3600 * 24));
        
        console.log('📅 Cálculo de dias:', {
          punctualTimeDiff,
          daysUntilPunctualEnd,
          calculation: `${punctualEndDate.toDateString()} - ${today.toDateString()}`
        });
        
        // Aditivo pontual próximo ao fim (5 dias)
        punctualEndingSoon = daysUntilPunctualEnd <= 5 && daysUntilPunctualEnd > 0;
      }
      
      return {
        ...contract,
        is_active: isActive,
        addendums: contractAddendums,
        current_value: currentValue,
        current_end_date: currentEndDate,
        days_until_end: daysUntilEnd,
        is_ending_soon: isEndingSoon,
        active_punctual_addendum: activePunctualAddendum, // Para o valor atual
        latest_punctual_addendum: latestPunctualAddendum, // Para o cálculo de dias
        punctual_ending_soon: punctualEndingSoon,
        days_until_punctual_end: daysUntilPunctualEnd
      };
    });
  }, [contracts, addendums]);

  // Buscar cidades únicas dos contratos
  const availableCities = useMemo(() => {
    const cities = [...new Set(
      contractsWithAddendums
        .map(contract => contract.city)
        .filter(city => city && city.trim() !== '')
    )].sort();
    return cities;
  }, [contractsWithAddendums]);

  const filterByStatus = (contract: ContractWithAddendums) => {
    // Determinar se contrato está efetivamente ativo
    const isExpiredByDate = contract.days_until_end <= 0;
    const isEffectivelyActive = contract.is_active && !isExpiredByDate;
    
    switch (statusFilter) {
      case 'all':
        return true;
      case 'active':
        return isEffectivelyActive; // Apenas contratos ativos E não vencidos
      case 'inactive':
        return !isEffectivelyActive; // Contratos inativos OU vencidos
      default:
        return true;
    }
  };

  // Filtrar contratos por status, cidade, empresa e texto de busca
  const filteredContracts = useMemo(() => {
    return contractsWithAddendums.filter(contract => {
      // Filtro por status
      const statusMatch = filterByStatus(contract);

      // Filtro por cidade
      const cityMatch = cityFilter.length === 0 ||
        cityFilter.includes(contract.city || '') ||
        (cityFilter.includes('sem-cidade') && (!contract.city || contract.city.trim() === ''));

      // Filtro por empresa
      const empresaMatch = empresaFilter === 'all' ||
        (contract as any).empresa === empresaFilter ||
        (!((contract as any).empresa) && empresaFilter === 'WWS');

      // Filtro por texto de busca (nome do cliente ou cidade)
      const searchMatch = searchText.trim() === '' ||
        contract.client_name.toLowerCase().includes(searchText.toLowerCase()) ||
        (contract.city && contract.city.toLowerCase().includes(searchText.toLowerCase()));

      return statusMatch && cityMatch && empresaMatch && searchMatch;
    });
  }, [contractsWithAddendums, statusFilter, cityFilter, empresaFilter, searchText]);

  // Ordenar contratos: ATIVOS PRIMEIRO, INATIVOS NO FINAL
  const contractsOrderedByStatus = useMemo(() => {
    return [...filteredContracts].sort((a, b) => {
      // Unificar vencidos e inativos como "inativos"
      const aIsInactive = !a.is_active || a.days_until_end <= 0;
      const bIsInactive = !b.is_active || b.days_until_end <= 0;
      
      // Primeiro critério: contratos ativos antes dos inativos (incluindo vencidos)
      if (!aIsInactive && bIsInactive) return -1; // a (ativo) antes de b (inativo)
      if (aIsInactive && !bIsInactive) return 1;  // a (inativo) depois de b (ativo)
      
      // Segundo critério: dentro do mesmo grupo, manter ordenação original ou por data
      const aEndDate = new Date(a.current_end_date).getTime();
      const bEndDate = new Date(b.current_end_date).getTime();
      return aEndDate - bEndDate;
    });
  }, [filteredContracts]);

  const handleCityToggle = (city: string) => {
    setCityFilter(prev => {
      if (prev.includes(city)) {
        return prev.filter(c => c !== city);
      } else {
        return [...prev, city];
      }
    });
  };

  const clearCityFilter = () => {
    setCityFilter([]);
  };

  const selectAllCities = () => {
    const allCityOptions = [...availableCities];
    if (contractsWithAddendums.some(c => !c.city || c.city.trim() === '')) {
      allCityOptions.push('sem-cidade');
    }
    setCityFilter(allCityOptions);
  };

  // Ordenar contratos
  const sortedContracts = useMemo(() => {
    return [...contractsOrderedByStatus].sort((a, b) => {
      // Determinar se contratos estão efetivamente ativos (não inativos E não vencidos)
      const aIsEffectivelyActive = a.is_active && a.days_until_end > 0;
      const bIsEffectivelyActive = b.is_active && b.days_until_end > 0;

      // SEMPRE manter ativos primeiro, inativos/vencidos no final
      if (aIsEffectivelyActive && !bIsEffectivelyActive) return -1;
      if (!aIsEffectivelyActive && bIsEffectivelyActive) return 1;

      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'faturamento':
          aValue = a.current_value;
          bValue = b.current_value;
          break;
        case 'cliente':
          aValue = a.client_name.toLowerCase();
          bValue = b.client_name.toLowerCase();
          break;
        case 'termino':
          aValue = new Date(a.current_end_date).getTime();
          bValue = new Date(b.current_end_date).getTime();
          break;
        default:
          aValue = new Date(a.current_end_date).getTime();
          bValue = new Date(b.current_end_date).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [contractsOrderedByStatus, sortBy, sortOrder]);

  // Calcular indicadores
  const indicators = useMemo(() => {
    // Usar a mesma lógica do filtro para consistência
    const activeContracts = (contractsWithAddendums || []).filter(c => {
      const isExpiredByDate = c.days_until_end <= 0;
      return c.is_active && !isExpiredByDate; // Efetivamente ativo
    });
    
    const totalContracts = activeContracts.length;
    const contractsEndingSoon = activeContracts.filter(c => c.is_ending_soon).length;
    
    // Faturamento mensal atual
    const monthlyRevenue = activeContracts.reduce((sum, contract) => {
      return sum + contract.current_value;
    }, 0);
    
    return {
      totalContracts,
      contractsEndingSoon,
      monthlyRevenue
    };
  }, [contractsWithAddendums]);

  if (contractsLoading || addendumsLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Contratos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos {selectedYear} - {selectedDepartment}</h1>
          <p className="text-gray-600">
            Gerencie seus contratos e aditivos do {selectedDepartment} para {selectedYear}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Incluir Contrato</span>
        </button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Número de Contratos</p>
              <p className="text-2xl font-bold text-blue-600">{indicators.totalContracts}</p>
              <p className="text-xs text-gray-500">Contratos vigentes</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Encerrando em 90 dias</p>
              <p className="text-2xl font-bold text-red-600">{indicators.contractsEndingSoon}</p>
              <p className="text-xs text-gray-500">Necessitam atenção</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Faturamento Mensal</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(indicators.monthlyRevenue)}</p>
              <p className="text-xs text-gray-500">Receita mensal atual</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Faturamento */}
      <ContractChart contracts={contractsWithAddendums.filter(c => c.is_active)} selectedYear={selectedYear} />

      {/* Lista de Contratos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Filtros e Controles */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lista de Contratos</h2>
            <p className="text-sm text-gray-600">
              Mostrando {sortedContracts.length} de {contractsWithAddendums.length} contratos
              {searchText && (
                <span className="text-blue-600 font-medium">
                  {` • Buscando: "${searchText}"`}
                </span>
              )}
              {cityFilter.length > 0 && (
                <span className="text-green-600 font-medium">
                  {` • Filtrado por ${cityFilter.length} cidade${cityFilter.length > 1 ? 's' : ''}`}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Campo de Busca */}
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar nome ou cidade..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtro por Status */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            {/* Filtro por Empresa */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Empresa:</span>
              <select
                value={empresaFilter}
                onChange={(e) => setEmpresaFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todas</option>
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            {/* Filtro por Cidade */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Cidade:</span>
              <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white hover:bg-gray-50 transition-colors min-w-[150px] text-left flex items-center justify-between"
              >
                <span>
                  {cityFilter.length === 0 
                    ? 'Todas as cidades' 
                    : cityFilter.length === 1 
                    ? (cityFilter[0] === 'sem-cidade' ? 'Sem cidade' : cityFilter[0])
                    : `${cityFilter.length} selecionadas`
                  }
                </span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={selectAllCities}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Selecionar Todas
                      </button>
                      <button
                        onClick={clearCityFilter}
                        className="text-gray-600 hover:text-gray-700 font-medium"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    {availableCities.map(city => (
                      <label
                        key={city}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={cityFilter.includes(city)}
                          onChange={() => handleCityToggle(city)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-900">{city}</span>
                      </label>
                    ))}
                    
                    {/* Opção para contratos sem cidade */}
                    {contractsWithAddendums.some(c => !c.city || c.city.trim() === '') && (
                      <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cityFilter.includes('sem-cidade')}
                          onChange={() => handleCityToggle('sem-cidade')}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-500 italic">Sem cidade informada</span>
                      </label>
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
                    {cityFilter.length} de {availableCities.length + (contractsWithAddendums.some(c => !c.city || c.city.trim() === '') ? 1 : 0)} opções selecionadas
                  </div>
                </div>
              )}
            </div>
          </div>

            {/* Ordenar por */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="faturamento">Faturamento</option>
                <option value="cliente">Nome do Cliente</option>
                <option value="termino">Data de Término</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                title={`Ordenação ${sortOrder === 'asc' ? 'crescente' : 'decrescente'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        {sortedContracts.length > 0 ? (
          <div className="space-y-4">
            {sortedContracts.map((contract) => (
              <ContractCard 
                key={contract.id} 
                contract={contract}
                onUpdate={() => refetch()}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato cadastrado</h3>
            <p className="text-gray-500">
              Clique em "Incluir Contrato" para começar
            </p>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <ContractForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            refetch();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};