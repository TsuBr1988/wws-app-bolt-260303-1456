import { Plus, Edit, FileText, ChevronDown, ChevronUp, Loader, FileCheck, Printer, Search, Copy } from 'lucide-react';
import { NewBudgetModal } from '../NewBudgetModal';
import { PrintProposalModal } from '../PrintProposalModal';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { moeda } from '../../utils';

interface Budget {
  id: string;
  budget_number: string;
  client_name: string;
  description: string;
  vt_value: number;
  iss_rate: number;
  city: string;
  service_type?: 'facilities' | 'vigilancia';
  created_at: string;
  total_value?: number;
  functions_count?: number;
  has_proposal?: boolean;
  proposal_client?: string;
  proposal_id?: string;
  margem_lucro?: number;
  margem_adm?: number;
  _sourceKey?: 'orcamentos' | 'comercial_privado';
}

interface NewBudgetTabProps {
  activeBudget: {
    id: string;
    budget_number: string;
    client_name: string;
    description: string;
    address?: string;
    city_name?: string;
  } | null;
  onBudgetCreated: (budgetId: string, budgetNumber: string, clientName: string, description: string) => void;
  onBudgetUpdated: (budgetId: string, budgetNumber: string, clientName: string, description: string) => void;
  onGenerateProposal?: (budgetData: { id: string; clientName: string; monthlyValue: number; months: number }) => void;
  reloadTrigger?: number;
  supabaseClient?: any;
}

export const NewBudgetTab = ({ activeBudget, onBudgetCreated, onBudgetUpdated, onGenerateProposal, reloadTrigger, supabaseClient }: NewBudgetTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);
  const [budgetFunctions, setBudgetFunctions] = useState<Record<string, any[]>>({});
  const [budgetFunctionTotals, setBudgetFunctionTotals] = useState<Record<string, number>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<Budget | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<('facilities' | 'vigilancia')[]>(['facilities', 'vigilancia']);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [budgetToCopy, setBudgetToCopy] = useState<Budget | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [budgetsClientInUse, setBudgetsClientInUse] = useState<any>(supabase);
  const [legacySchemaAvailable, setLegacySchemaAvailable] = useState(true);
  const [sourceStatusMessage, setSourceStatusMessage] = useState<string | null>(null);

  const normalizeServiceType = (serviceType?: string): 'facilities' | 'vigilancia' | 'unknown' => {
    if (!serviceType) return 'facilities';
    const normalized = serviceType
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (normalized.includes('vigil')) return 'vigilancia';
    if (normalized.includes('facilit')) return 'facilities';
    if (normalized === 'vigilancia') return 'vigilancia';
    if (normalized === 'facilities') return 'facilities';

    return 'unknown';
  };

  const isMissingTableError = (error: any) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    return code === '42P01' || message.includes('does not exist');
  };

  const supportsLegacyBudgetsSchema = async (client: any): Promise<boolean> => {
    const { error } = await client
      .from('budget_functions')
      .select('id')
      .limit(1);

    if (!error) return true;
    if (isMissingTableError(error)) return false;
    return true;
  };

  useEffect(() => {
    loadBudgets();
  }, [activeBudget]);

  // Recarregar quando uma proposta for criada
  useEffect(() => {
    if (reloadTrigger !== undefined && reloadTrigger > 0) {
      console.log('🔄 ReloadTrigger alterado:', reloadTrigger, '- Recarregando orçamentos...');
      loadBudgets();
    }
  }, [reloadTrigger]);

  const loadBudgets = async () => {
    setIsLoading(true);
    const candidates: Array<{ key: 'orcamentos' | 'comercial_privado'; label: string; client: any }> = [
      { key: 'orcamentos', label: 'Orçamentos', client: supabase },
    ];

    if (supabaseClient && supabaseClient !== supabase) {
      candidates.push({ key: 'comercial_privado', label: 'Comercial Privado', client: supabaseClient });
    }

    const sourceResults = await Promise.all(
      candidates.map(async (source) => {
        const [{ data, error }, legacyCompatible] = await Promise.all([
          source.client
            .from('budgets')
            .select('*')
            .order('created_at', { ascending: false }),
          supportsLegacyBudgetsSchema(source.client),
        ]);

        return {
          ...source,
          data: Array.isArray(data) ? data : [],
          error,
          legacyCompatible,
        };
      })
    );

    const successfulSources = sourceResults.filter((source) => !source.error);

    if (successfulSources.length === 0) {
      const primaryError = sourceResults.find((source) => source.error)?.error;
      console.error('Erro ao carregar orçamentos:', primaryError);
      alert(`❌ Erro ao carregar orçamentos: ${primaryError?.message || 'Erro desconhecido'}`);
      setIsLoading(false);
      return;
    }

    const compatibleSources = successfulSources.filter((source) => source.legacyCompatible);
    const preferredPool = compatibleSources.length > 0 ? compatibleSources : successfulSources;

    const selectedSource = preferredPool
      .sort((a, b) => b.data.length - a.data.length)[0];

    setBudgetsClientInUse(selectedSource.client);
    setLegacySchemaAvailable(selectedSource.legacyCompatible);

    const sourceSummary = successfulSources
      .map((source) => `${source.label}: ${source.data.length}`)
      .join(' | ');

    if (!selectedSource.legacyCompatible) {
      setSourceStatusMessage(`Fonte ativa: ${selectedSource.label}. Esquema de orçamento diferente detectado (${sourceSummary}).`);
    } else if (successfulSources.length > 1) {
      setSourceStatusMessage(`Dados detectados em múltiplas bases (${sourceSummary}). Exibindo ${selectedSource.label} por compatibilidade.`);
    } else {
      setSourceStatusMessage(`Fonte ativa: ${selectedSource.label} (${selectedSource.data.length} orçamentos).`);
    }

    const data = selectedSource.data.map((budget: any) => ({
      ...budget,
      _sourceKey: selectedSource.key,
    }));

    if (data) {
      const budgetsWithTotals = await Promise.all(
        data.map(async (budget) => {
          const { data: functions, error: funcError } = await selectedSource.client
            .from('budget_functions')
            .select('*')
            .eq('budget_id', budget.id);

          if (funcError) {
            console.error('Erro ao carregar funções:', funcError);
            return { ...budget, total_value: 0, functions_count: 0, has_proposal: false };
          }

          const { data: calculation } = await selectedSource.client
            .from('budget_calculations')
            .select('total_contract')
            .eq('budget_id', budget.id)
            .maybeSingle();

          const totalBudget = calculation ? parseFloat(calculation.total_contract) : 0;

          // Verifica se existe proposta vinculada a este orçamento
          // Usa o cliente Supabase do Comercial Privado se fornecido
          const clientToUse = supabaseClient || selectedSource.client;
          const { data: proposal } = await clientToUse
            .from('proposals')
            .select('id, client')
            .eq('budget_id', budget.id)
            .maybeSingle();

          console.log(`📋 Orçamento ${budget.budget_number} (${budget.client_name}):`, {
            budget_id: budget.id,
            has_proposal: !!proposal,
            proposal_found: proposal,
            using_external_client: !!supabaseClient,
            source: selectedSource.label,
          });

          return {
            ...budget,
            total_value: totalBudget,
            functions_count: functions?.length || 0,
            has_proposal: !!proposal,
            proposal_client: proposal?.client,
            proposal_id: proposal?.id,
          };
        })
      );

      setBudgets(budgetsWithTotals);
    }
    setIsLoading(false);
  };

  const loadBudgetFunctions = async (budgetId: string) => {
    if (!legacySchemaAvailable) {
      alert('Este orçamento está em uma base com esquema diferente e não pode ser aberto neste módulo atual.');
      return;
    }

    if (budgetFunctions[budgetId]) {
      setExpandedBudget(expandedBudget === budgetId ? null : budgetId);
      return;
    }

    const { data: calculation } = await budgetsClientInUse
      .from('budget_calculations')
      .select('function_data')
      .eq('budget_id', budgetId)
      .maybeSingle();

    const functionTotals: Record<string, number> = {};
    const functionsFromCalc: any[] = [];

    if (calculation && calculation.function_data) {
      const funcData = calculation.function_data as any[];
      funcData.forEach((func) => {
        functionTotals[func.id] = func.totalComBDI;
        functionsFromCalc.push(func);
      });
    }

    setBudgetFunctions((prev) => ({ ...prev, [budgetId]: functionsFromCalc }));
    setBudgetFunctionTotals((prev) => ({ ...prev, ...functionTotals }));
    setExpandedBudget(budgetId);
  };

  const handleLoadBudget = async (budget: Budget) => {
    if (!legacySchemaAvailable) {
      alert('Este orçamento está em uma base com esquema diferente e não pode ser carregado no fluxo atual.');
      return;
    }

    onBudgetCreated(
      budget.id,
      budget.budget_number,
      budget.client_name,
      budget.description
    );
  };

  const handleOpenNewBudget = () => {
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditBudget = () => {
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = (budgetId: string, budgetNumber: string, clientName: string, description: string) => {
    if (isEditing) {
      onBudgetUpdated(budgetId, budgetNumber, clientName, description);
    } else {
      onBudgetCreated(budgetId, budgetNumber, clientName, description);
    }
    setIsModalOpen(false);
  };

  const handleGenerateProposal = (budget: Budget) => {
    if (!budget.total_value || budget.total_value === 0) {
      alert('Este orçamento ainda não possui um cálculo realizado.\n\nPor favor, gere a planilha completa na aba "Orçamento Geral" antes de criar uma proposta.');
      return;
    }

    if (onGenerateProposal) {
      onGenerateProposal({
        id: budget.id,
        clientName: budget.client_name,
        monthlyValue: budget.total_value,
        months: 12,
        proposalId: budget.proposal_id
      });
    }
  };

  const handlePrintProposal = (budget: Budget) => {
    if (!budget.total_value || budget.total_value === 0) {
      alert('Este orçamento ainda não possui um cálculo realizado.\n\nPor favor, gere a planilha completa na aba "Orçamento Geral" antes de imprimir a proposta.');
      return;
    }
    setSelectedBudgetForPrint(budget);
    setIsPrintModalOpen(true);
  };

  const handleOpenCopyModal = (budget: Budget) => {
    setBudgetToCopy(budget);
    setIsCopyModalOpen(true);
  };

  const handleCopyBudget = async () => {
    if (!budgetToCopy) return;
    if (!legacySchemaAvailable) {
      alert('Cópia indisponível para orçamento com esquema diferente do módulo atual.');
      return;
    }

    setIsCopying(true);
    try {
      const { data, error } = await budgetsClientInUse.rpc('copy_budget_as_new', {
        p_original_budget_id: budgetToCopy.id,
        p_new_client_name: null,
        p_new_description: null,
        p_new_city_name: null,
        p_new_cnpj: null,
        p_new_email: null,
        p_new_phone: null,
        p_new_address: null,
        p_new_lead_source: null
      });

      if (error) throw error;

      const newBudgetId = data;

      // Buscar o novo orçamento criado
      const { data: newBudget, error: fetchError } = await budgetsClientInUse
        .from('budgets')
        .select('*')
        .eq('id', newBudgetId)
        .single();

      if (fetchError) throw fetchError;

      alert(`✅ Orçamento copiado com sucesso!\n\nNovo número: ${newBudget.budget_number}\n\nTodos os postos, materiais, equipamentos e configurações foram copiados.\n\nVocê pode editar as informações do cliente no modal que será aberto.`);

      // Fechar modal de cópia
      setIsCopyModalOpen(false);
      setBudgetToCopy(null);

      // Recarregar lista de orçamentos
      await loadBudgets();

      // Abrir modal de edição do novo orçamento
      onBudgetCreated(newBudget.id, newBudget.budget_number, newBudget.client_name, newBudget.description);
      setIsEditing(true);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Erro ao copiar orçamento:', error);
      alert(`❌ Erro ao copiar orçamento:\n\n${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsCopying(false);
    }
  };

  const toggleServiceFilter = (type: 'facilities' | 'vigilancia') => {
    setServiceFilter((prev) => {
      if (prev.includes(type)) {
        const newFilter = prev.filter((t) => t !== type);
        return newFilter.length === 0 ? [type] : newFilter;
      } else {
        return [...prev, type];
      }
    });
  };

  const filteredBudgets = budgets.filter((budget) => {
    const search = searchTerm.toLowerCase();
    const budgetNumber = String(budget.budget_number ?? '').toLowerCase();
    const clientName = String(budget.client_name ?? '').toLowerCase();
    const description = String(budget.description ?? '').toLowerCase();
    const matchesSearch = (
      budgetNumber.includes(search) ||
      clientName.includes(search) ||
      description.includes(search)
    );
    const normalizedType = normalizeServiceType(budget.service_type);
    const matchesType = normalizedType === 'unknown' ? true : serviceFilter.includes(normalizedType);
    return matchesSearch && matchesType;
  });

  const facilitiesTotalValue = budgets
    .filter((b) => normalizeServiceType(b.service_type) === 'facilities')
    .reduce((acc, b) => acc + (budgetFunctionTotals[b.id] || 0), 0);

  const vigilanciaTotalValue = budgets
    .filter((b) => normalizeServiceType(b.service_type) === 'vigilancia')
    .reduce((acc, b) => acc + (budgetFunctionTotals[b.id] || 0), 0);

  // Cálculo dos indicadores
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const budgetsThisMonth = budgets.filter((b) => {
    const budgetDate = new Date(b.created_at);
    return budgetDate.getMonth() === currentMonth && budgetDate.getFullYear() === currentYear;
  });

  const budgetsThisYear = budgets.filter((b) => {
    const budgetDate = new Date(b.created_at);
    return budgetDate.getFullYear() === currentYear;
  });

  const facilitiesThisMonth = budgetsThisMonth
    .filter((b) => normalizeServiceType(b.service_type) === 'facilities')
    .reduce((acc, b) => acc + (b.total_value || 0), 0);

  const facilitiesThisYear = budgetsThisYear
    .filter((b) => normalizeServiceType(b.service_type) === 'facilities')
    .reduce((acc, b) => acc + (b.total_value || 0), 0);

  const vigilanciaThisMonth = budgetsThisMonth
    .filter((b) => normalizeServiceType(b.service_type) === 'vigilancia')
    .reduce((acc, b) => acc + (b.total_value || 0), 0);

  const vigilanciaThisYear = budgetsThisYear
    .filter((b) => normalizeServiceType(b.service_type) === 'vigilancia')
    .reduce((acc, b) => acc + (b.total_value || 0), 0);

  // Calcular dias desde o último orçamento
  const sortedBudgets = [...budgets].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastBudgetDate = sortedBudgets.length > 0 ? new Date(sortedBudgets[0].created_at) : null;
  const daysSinceLastBudget = lastBudgetDate
    ? Math.floor((now.getTime() - lastBudgetDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">
          Gerenciar Orçamentos
        </h2>
        <button
          onClick={handleOpenNewBudget}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          <Plus size={20} />
          Novo Orçamento
        </button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quantidade de Orçamentos */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-900">Orçamentos</h3>
            <FileText className="text-blue-600" size={20} />
          </div>
          <div className="flex items-baseline gap-3 mb-3">
            <div>
              <p className="text-3xl font-bold text-blue-700">{budgetsThisMonth.length}</p>
              <p className="text-xs text-blue-600">este mês</p>
            </div>
            <div className="border-l border-blue-300 pl-3">
              <p className="text-xl font-semibold text-blue-600">{budgetsThisYear.length}</p>
              <p className="text-xs text-blue-500">este ano</p>
            </div>
          </div>
          <div className="border-t border-blue-200 pt-2">
            <div className="flex items-baseline gap-3">
              <div>
                <p className="text-base font-bold text-blue-700">{moeda(facilitiesThisMonth + vigilanciaThisMonth)}</p>
                <p className="text-xs text-blue-600">mês</p>
              </div>
              <div className="border-l border-blue-300 pl-3">
                <p className="text-sm font-semibold text-blue-600">{moeda(facilitiesThisYear + vigilanciaThisYear)}</p>
                <p className="text-xs text-blue-500">ano</p>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-5 border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-indigo-900">Facilities</h3>
            <span className="text-2xl">🏢</span>
          </div>
          <div>
            <p className="text-lg font-bold text-indigo-700 mb-1">{moeda(facilitiesThisMonth)}</p>
            <p className="text-xs text-indigo-600 mb-2">este mês</p>
            <div className="border-t border-indigo-200 pt-2">
              <p className="text-base font-semibold text-indigo-600">{moeda(facilitiesThisYear)}</p>
              <p className="text-xs text-indigo-500">este ano</p>
            </div>
          </div>
        </div>

        {/* Vigilância */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-amber-900">Vigilância</h3>
            <span className="text-2xl">🛡️</span>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-700 mb-1">{moeda(vigilanciaThisMonth)}</p>
            <p className="text-xs text-amber-600 mb-2">este mês</p>
            <div className="border-t border-amber-200 pt-2">
              <p className="text-base font-semibold text-amber-600">{moeda(vigilanciaThisYear)}</p>
              <p className="text-xs text-amber-500">este ano</p>
            </div>
          </div>
        </div>

        {/* Dias desde último orçamento */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-green-900">Último Orçamento</h3>
            <span className="text-2xl">📅</span>
          </div>
          <div>
            {daysSinceLastBudget !== null ? (
              <>
                <p className="text-3xl font-bold text-green-700">{daysSinceLastBudget}</p>
                <p className="text-xs text-green-600">
                  {daysSinceLastBudget === 0 ? 'hoje' : daysSinceLastBudget === 1 ? 'dia atrás' : 'dias atrás'}
                </p>
                {lastBudgetDate && (
                  <p className="text-xs text-green-500 mt-2">
                    {lastBudgetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-green-600">Nenhum orçamento ainda</p>
            )}
          </div>
        </div>
      </div>

      {activeBudget && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
                  {activeBudget.budget_number}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  Ativo
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {activeBudget.client_name}
              </h3>
              {(activeBudget.address || activeBudget.city_name) && (
                <div className="mb-2 text-sm text-slate-600">
                  {activeBudget.address && (
                    <p>{activeBudget.address}</p>
                  )}
                  {activeBudget.city_name && (
                    <p>{activeBudget.city_name}</p>
                  )}
                </div>
              )}
              {activeBudget.description && (
                <p className="text-slate-700 leading-relaxed">
                  {activeBudget.description}
                </p>
              )}
            </div>
            <button
              onClick={handleOpenEditBudget}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-blue-600 font-semibold rounded-md border border-blue-200 transition-colors"
            >
              <Edit size={18} />
              Editar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        {sourceStatusMessage && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm">
            {sourceStatusMessage}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Orçamentos Salvos
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => toggleServiceFilter('facilities')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  serviceFilter.includes('facilities')
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Facilities
                <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-bold">
                  {moeda(facilitiesTotalValue)}
                </span>
              </button>
              <button
                onClick={() => toggleServiceFilter('vigilancia')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  serviceFilter.includes('vigilancia')
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vigilância
                <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-bold">
                  {moeda(vigilanciaTotalValue)}
                </span>
              </button>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por número, cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-blue-600" size={40} />
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <FileText size={48} className="mx-auto mb-4 text-slate-400" />
            <p>{searchTerm ? 'Nenhum orçamento encontrado com esse termo' : 'Nenhum orçamento salvo ainda'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBudgets.map((budget) => (
              <div key={budget.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div
                    className={`flex-1 ${legacySchemaAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                    onClick={() => legacySchemaAvailable && loadBudgetFunctions(budget.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {(() => {
                        const normalizedType = normalizeServiceType(budget.service_type);
                        const isFacilities = normalizedType !== 'vigilancia';
                        return (
                          <>
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {budget.budget_number}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          isFacilities
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isFacilities
                          ? 'Facilities'
                          : 'Vigilância'}
                      </span>
                          </>
                        );
                      })()}
                      {activeBudget?.id === budget.id && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Ativo
                        </span>
                      )}
                      {budget.has_proposal && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                          ✓ Com Proposta
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {budget.functions_count} {budget.functions_count === 1 ? 'posto' : 'postos'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{budget.client_name}</h3>
                    {budget.description && (
                      <p className="text-sm text-slate-600 mt-1">{budget.description}</p>
                    )}
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {moeda(budget.total_value || 0)}
                    </p>
                    {budget.margem_lucro != null && budget.total_value && (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-slate-600">
                          Taxa de Lucro: <span className="font-medium">{Number(budget.margem_lucro).toFixed(1)}%</span>{' '}
                          <span className="text-green-600">
                            ({moeda(budget.total_value * (Number(budget.margem_lucro) / 100))})
                          </span>
                        </p>
                        {budget.margem_adm != null && (
                          <p className="text-xs text-slate-600">
                            Taxa de Adm: <span className="font-medium">{Number(budget.margem_adm).toFixed(1)}%</span>{' '}
                            <span className="text-green-600">
                              ({moeda(budget.total_value * (Number(budget.margem_adm) / 100))})
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCopyModal(budget)}
                      disabled={!legacySchemaAvailable}
                      className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-md transition-colors text-sm ${
                        legacySchemaAvailable
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-slate-400 cursor-not-allowed'
                      }`}
                      title="Copiar este orçamento"
                    >
                      <Copy size={16} />
                      Copiar
                    </button>
                    {budget.total_value && budget.total_value > 0 && (
                      <>
                        <button
                          onClick={() => handlePrintProposal(budget)}
                          disabled={!legacySchemaAvailable}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-md transition-colors text-sm"
                          title="Imprimir Proposta"
                        >
                          <Printer size={16} />
                          Imprimir Proposta
                        </button>
                        <button
                          onClick={() => handleGenerateProposal(budget)}
                          disabled={!legacySchemaAvailable}
                          className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-md transition-colors text-sm ${
                            budget.has_proposal
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          title={budget.has_proposal ? 'Proposta já criada - Clique para atualizar' : 'Gerar Proposta'}
                        >
                          <FileCheck size={16} />
                          {budget.has_proposal ? 'Atualizar Proposta' : 'Gerar Proposta'}
                        </button>
                      </>
                    )}
                    {activeBudget?.id !== budget.id && (
                      <button
                        onClick={() => handleLoadBudget(budget)}
                        disabled={!legacySchemaAvailable}
                        className={`px-4 py-2 text-white font-semibold rounded-md transition-colors text-sm ${
                          legacySchemaAvailable
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Carregar
                      </button>
                    )}
                    <button
                      onClick={() => legacySchemaAvailable && loadBudgetFunctions(budget.id)}
                      disabled={!legacySchemaAvailable}
                      className={`p-2 rounded-full transition-colors ${
                        legacySchemaAvailable
                          ? 'text-slate-600 hover:bg-slate-200'
                          : 'text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {expandedBudget === budget.id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {expandedBudget === budget.id && budgetFunctions[budget.id] && (
                  <div className="p-4 bg-white border-t border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3">Postos/Funções (Dados utilizados no cálculo):</h4>
                    {budgetFunctions[budget.id].length === 0 ? (
                      <p className="text-slate-600 text-sm">Nenhum cálculo realizado ainda</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="px-3 py-2 text-left">Função</th>
                              <th className="px-3 py-2 text-center">Qtd</th>
                              <th className="px-3 py-2 text-right">Salário</th>
                              <th className="px-3 py-2 text-right">VT</th>
                              <th className="px-3 py-2 text-left">Cidade</th>
                              <th className="px-3 py-2 text-center">Escala</th>
                              <th className="px-3 py-2 text-center">Horário</th>
                              <th className="px-3 py-2 text-center">Peric.</th>
                              <th className="px-3 py-2 text-center">Insal.</th>
                              <th className="px-3 py-2 text-center">Grat.</th>
                              <th className="px-3 py-2 text-center">Intra</th>
                              <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {budgetFunctions[budget.id].map((func: any) => {
                              const config = func.config || {};
                              return (
                                <tr key={func.id} className="border-b border-slate-200">
                                  <td className="px-3 py-2 font-medium">{func.nome}</td>
                                  <td className="px-3 py-2 text-center">{func.q}</td>
                                  <td className="px-3 py-2 text-right">{moeda(func.s)}</td>
                                  <td className="px-3 py-2 text-right">
                                    {config.vtValue ? moeda(config.vtValue) : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-left text-xs">
                                    {config.city || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center text-xs">{config.escala || '-'}</td>
                                  <td className="px-3 py-2 text-center text-xs capitalize">
                                    {config.horarioTipo || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center text-xs">
                                    {config.peric ? `${config.peric}%` : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center text-xs">
                                    {config.insal ? `${config.insal}%` : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center text-xs">
                                    {config.grat ? `${config.grat}%` : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center text-xs">
                                    {config.hasIntra === 'sim' ? `${config.intraPerc}%` : 'Não'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-blue-600">
                                    {moeda(func.totalComBDI)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <NewBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editBudget={isEditing && activeBudget ? activeBudget : null}
      />

      {selectedBudgetForPrint && (
        <PrintProposalModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedBudgetForPrint(null);
          }}
          budgetId={selectedBudgetForPrint.id}
          budgetNumber={selectedBudgetForPrint.budget_number}
          clientName={selectedBudgetForPrint.client_name}
          description={selectedBudgetForPrint.description}
        />
      )}

      {/* Modal de Confirmação de Cópia */}
      {isCopyModalOpen && budgetToCopy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Copy className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Copiar Orçamento</h2>
                <p className="text-sm text-slate-600">Criar uma cópia completa do orçamento</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6 border border-indigo-200">
              <h3 className="font-bold text-slate-800 mb-3">Orçamento Original:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
                    {budgetToCopy.budget_number}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    normalizeServiceType(budgetToCopy.service_type) !== 'vigilancia'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {normalizeServiceType(budgetToCopy.service_type) !== 'vigilancia' ? 'Facilities' : 'Vigilância'}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-800">{budgetToCopy.client_name}</p>
                {budgetToCopy.description && (
                  <p className="text-sm text-slate-600">{budgetToCopy.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <FileText size={16} />
                    {budgetToCopy.functions_count} {budgetToCopy.functions_count === 1 ? 'posto' : 'postos'}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {moeda(budgetToCopy.total_value || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  ℹ
                </span>
                O que será copiado:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-8">
                <li>• Todas as configurações de postos/funções</li>
                <li>• Materiais de consumo</li>
                <li>• Equipamentos e uniformes</li>
                <li>• Itens de CAPEX e outros</li>
                <li>• Benefícios diferenciados</li>
                <li>• Todas as personalizações (overrides)</li>
                <li>• Cálculos e resultados</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Após copiar:</span> O novo orçamento receberá um número sequencial automático e você poderá editar o nome do cliente e outras informações no modal de edição que será aberto.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsCopyModalOpen(false);
                  setBudgetToCopy(null);
                }}
                disabled={isCopying}
                className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopyBudget}
                disabled={isCopying}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCopying ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Copiando...
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Confirmar Cópia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
