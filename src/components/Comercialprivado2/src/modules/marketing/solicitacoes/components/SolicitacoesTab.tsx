import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Filter,
  LayoutGrid,
  LayoutList,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Ticket,
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import type { Solicitacao } from '../types';
import { canCreateMarketingRequests, canEditMarketingRequests, getCurrentUserMeta } from '../permissions';
import AbrirSolicitacaoModal from './AbrirSolicitacaoModal';
import VerSolicitacaoModal from './VerSolicitacaoModal';
import EditarSolicitacaoModal from './EditarSolicitacaoModal';

type ViewMode = 'lista' | 'kanban';

type SortKey = 'solicitacao_numero' | 'data_abertura' | 'prioridade' | 'status' | 'pontos' | 'departamento';

type SortDir = 'asc' | 'desc';

type SolicitacaoStatusType = Solicitacao['status'];

const safeString = (value: unknown) => (value == null ? '' : String(value));

const toLowerNoAccents = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const safeHistorico = (value: unknown): any[] => {
  if (!Array.isArray(value)) return [];
  return value as any[];
};

const formatDurationShortPt = (ms: number) => {
  if (!Number.isFinite(ms)) return '-';
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.round(safeMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const parseIsoDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const average = (values: number[]) => {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const SolicitacoesTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [missingTable, setMissingTable] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | SolicitacaoStatusType>('todos');
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('data_abertura');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [selected, setSelected] = useState<Solicitacao | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Solicitacao | null>(null);

  const loadPermissions = async () => {
    const userMeta = getCurrentUserMeta();
    const [allowedCreate, allowedEdit] = await Promise.all([
      canCreateMarketingRequests(userMeta.app_user_id, userMeta.is_admin),
      canEditMarketingRequests(userMeta.app_user_id, userMeta.is_admin),
    ]);
    setCanCreate(allowedCreate);
    setCanEdit(allowedEdit);
  };

  const loadSolicitacoes = async (opts?: { force?: boolean }) => {
    if (missingTable && !opts?.force) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sb = supabase as any;
      let query = sb
        .from('marketing_solicitacoes' as any)
        .select('*')
        .order('data_abertura', { ascending: false });

      // Sempre carregamos todas (ativas + arquivadas) para manter contagens globais (ex.: refações totais)

      const { data, error } = await query;
      if (error) throw error;
      setSolicitacoes((data || []) as Solicitacao[]);
    } catch (error) {
      const err = error as any;
      console.error('Erro ao carregar solicitações:', err);

      const code = err?.code as string | undefined;
      const message = (err?.message as string | undefined) ?? '';
      const isMissing = code === '42P01' || message.includes('marketing_solicitacoes') || message.includes('does not exist');
      if (isMissing) {
        setMissingTable(true);
      }
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSolicitacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleString('pt-BR');
    } catch {
      return '-';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Crítica':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Média':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixa':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A fazer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Fazendo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Feito':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Refação':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const solicitacoesFiltradas = useMemo(() => {
    const search = toLowerNoAccents(searchTerm.trim());

    return solicitacoes.filter((s) => {
      if (filterStatus !== 'todos' && s.status !== filterStatus) return false;
      if (!search) return true;

      const hay = toLowerNoAccents(
        [
          s.solicitacao_numero,
          s.titulo,
          s.tipo,
          s.departamento,
          s.prioridade,
          s.status,
          s.solicitante_nome,
          s.solicitante_email,
          s.descricao,
        ]
          .map(safeString)
          .join(' ')
      );
      return hay.includes(search);
    });
  }, [solicitacoes, searchTerm, filterStatus]);

  const solicitacoesAtivasFiltradas = useMemo(() => solicitacoesFiltradas.filter((s) => !s.arquivado), [solicitacoesFiltradas]);
  const solicitacoesArquivadasFiltradas = useMemo(() => solicitacoesFiltradas.filter((s) => !!s.arquivado), [solicitacoesFiltradas]);

  const compareValues = (a: unknown, b: unknown) => {
    const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return collator.compare(String(a), String(b));
  };

  const getSortValue = (s: Solicitacao, key: SortKey) => {
    switch (key) {
      case 'data_abertura':
        return s.data_abertura;
      default:
        return (s as any)[key];
    }
  };

  const sortSolicitacoes = (items: Solicitacao[]) => {
    const direction = sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => direction * compareValues(getSortValue(a, sortKey), getSortValue(b, sortKey)));
  };

  const solicitacoesAtivasOrdenadas = useMemo(
    () => sortSolicitacoes(solicitacoesAtivasFiltradas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [solicitacoesAtivasFiltradas, sortDir, sortKey]
  );

  const solicitacoesArquivadasOrdenadas = useMemo(
    () => sortSolicitacoes(solicitacoesArquivadasFiltradas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [solicitacoesArquivadasFiltradas, sortDir, sortKey]
  );

  const solicitacoesVisiveisOrdenadas = showArchived ? solicitacoesArquivadasOrdenadas : solicitacoesAtivasOrdenadas;

  const SortIndicator: React.FC<{ active: boolean; dir: 'asc' | 'desc' }> = ({ active, dir }) => {
    if (!active) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />;
    }
    return dir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-gray-700" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-gray-700" />
    );
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleStatusChange = async (solicitacao: Solicitacao, novoStatus: Solicitacao['status']) => {
    if (!canEdit) return;

    try {
      const shouldSetDeliveredAt = novoStatus === 'Feito' && !solicitacao.data_conclusao;
      const shouldClearDeliveredAt = solicitacao.status === 'Feito' && novoStatus !== 'Feito';
      const shouldSetStartedAt = novoStatus === 'Fazendo' && !solicitacao.data_inicio;

      const nowIso = new Date().toISOString();

      const updatePayload: Partial<Solicitacao> & { data_conclusao?: string | null; data_inicio?: string | null } = {
        status: novoStatus,
      };

      if (shouldSetStartedAt) updatePayload.data_inicio = nowIso;
      if (shouldSetDeliveredAt) updatePayload.data_conclusao = nowIso;
      if (shouldClearDeliveredAt) updatePayload.data_conclusao = null;

      const userMeta = getCurrentUserMeta();
      const currentHistory = Array.isArray((solicitacao as any).historico) ? ((solicitacao as any).historico as any[]) : [];
      (updatePayload as any).historico = [
        ...currentHistory,
        {
          at: nowIso,
          action: 'status',
          from_status: solicitacao.status,
          to_status: novoStatus,
          by_name: userMeta.by_name,
          by_email: userMeta.by_email,
        },
      ];

      const sb = supabase as any;
      const { error } = await sb
        .from('marketing_solicitacoes' as any)
        .update(updatePayload)
        .eq('id', solicitacao.id);

      if (error) throw error;

      setSolicitacoes((prev) =>
        prev.map((s) =>
          s.id === solicitacao.id
            ? {
                ...s,
                status: novoStatus,
                data_conclusao:
                  shouldSetDeliveredAt ? (updatePayload.data_conclusao as string) : shouldClearDeliveredAt ? undefined : s.data_conclusao,
                data_inicio: shouldSetStartedAt ? (updatePayload.data_inicio as string) : s.data_inicio,
                historico: (updatePayload as any).historico ?? (s as any).historico,
              }
            : s
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleArchive = async (solicitacao: Solicitacao) => {
    if (!canEdit) return;

    try {
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const currentHistory = Array.isArray((solicitacao as any).historico) ? ((solicitacao as any).historico as any[]) : [];
      const historico = [
        ...currentHistory,
        {
          at: now,
          action: 'arquivar',
          from_status: solicitacao.status,
          to_status: solicitacao.status,
          by_name: userMeta.by_name,
          by_email: userMeta.by_email,
        },
      ];

      const sb = supabase as any;
      const { error } = await sb
        .from('marketing_solicitacoes' as any)
        .update({ arquivado: true, data_arquivamento: now, historico } as any)
        .eq('id', solicitacao.id);

      if (error) throw error;

      setSolicitacoes((prev) => {
        if (!showArchived) {
          return prev.filter((s) => s.id !== solicitacao.id);
        }
        return prev.map((s) => (s.id === solicitacao.id ? { ...s, arquivado: true, data_arquivamento: now, historico } : s));
      });
    } catch (error) {
      console.error('Erro ao arquivar:', error);
    }
  };

  const openView = (solicitacao: Solicitacao) => {
    setSelected(solicitacao);
    setOpenEdit(false);
  };

  const handleLocalUpdated = (updated: Solicitacao) => {
    setSolicitacoes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  };

  const handleArchivedById = (id: string) => {
    setSolicitacoes((prev) => {
      if (!showArchived) return prev.filter((s) => s.id !== id);
      const now = new Date().toISOString();
      return prev.map((s) => (s.id === id ? { ...s, arquivado: true, data_arquivamento: now } : s));
    });
  };

  const handleReopened = (updated: Solicitacao) => {
    setSolicitacoes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDragStart = (e: React.DragEvent, solicitacao: Solicitacao) => {
    if (!canEdit) return;
    setDraggedItem(solicitacao);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, novoStatus: SolicitacaoStatusType) => {
    if (!canEdit) return;
    e.preventDefault();
    if (!draggedItem || draggedItem.status === novoStatus) {
      setDraggedItem(null);
      return;
    }
    await handleStatusChange(draggedItem, novoStatus);
    setDraggedItem(null);
  };

  const getKanbanSolicitacoes = (status: SolicitacaoStatusType) => {
    return solicitacoesAtivasOrdenadas.filter((s) => s.status === status);
  };

  const solicitacoesAtivas = solicitacoes.filter((s) => !s.arquivado);
  const abertas = solicitacoesAtivas.filter((s) => s.status === 'A fazer' || s.status === 'Fazendo' || s.status === 'Refação');
  const concluidas = solicitacoesAtivas.filter((s) => s.status === 'Feito');

  const refacoesTotal = useMemo(() => {
    let total = 0;

    solicitacoes.forEach((s) => {
      const historico = safeHistorico((s as any).historico);
      historico.forEach((item) => {
        if (!item) return;
        if (item.action !== 'refazer') return;
        total += 1;
      });
    });

    return total;
  }, [solicitacoes]);

  const tempoMedioConclusaoMs = useMemo(() => {
    const durations = concluidas
      .map((s) => {
        const openedAt = parseIsoDate(s.data_abertura);
        const closedAt = parseIsoDate(s.data_conclusao);
        if (!openedAt || !closedAt) return null;
        return closedAt.getTime() - openedAt.getTime();
      })
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);

    return average(durations);
  }, [concluidas]);

  const tempoMedioAbertoMs = useMemo(() => {
    const nowMs = Date.now();
    const durations = abertas
      .map((s) => {
        const openedAt = parseIsoDate(s.data_abertura);
        if (!openedAt) return null;
        return nowMs - openedAt.getTime();
      })
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);

    return average(durations);
  }, [abertas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  if (missingTable) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <div className="font-semibold mb-1">Configuração do banco pendente</div>
          <div>
            A tabela <span className="font-mono">public.marketing_solicitacoes</span> não existe no Supabase deste ambiente.
            Aplique a migration <span className="font-mono">supabase/migrations/20260220120000_create_marketing_solicitacoes.sql</span> e recarregue a página.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setMissingTable(false);
            loadSolicitacoes({ force: true });
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600"># de tarefas abertas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{abertas.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600"># de tarefas concluídas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{concluidas.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo médio de conclusão</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {tempoMedioConclusaoMs == null ? '-' : formatDurationShortPt(tempoMedioConclusaoMs)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo médio aberto</p>
              <p className="text-3xl font-bold text-gray-700 mt-2">
                {tempoMedioAbertoMs == null ? '-' : formatDurationShortPt(tempoMedioAbertoMs)}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Refações</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{refacoesTotal}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <RotateCcw className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar solicitações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {viewMode === 'lista' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="todos">Todos os Status</option>
                <option value="A fazer">A fazer</option>
                <option value="Fazendo">Fazendo</option>
                <option value="Feito">Feito</option>
                <option value="Refação">Refação</option>
              </select>
            </div>
          )}

          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                viewMode === 'lista' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Lista"
            >
              <LayoutList className="w-4 h-4" />
              <span className="text-sm font-medium">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Kanban</span>
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                !showArchived ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                showArchived ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Arquivados
            </button>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova solicitação
          </button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Você pode abrir e acompanhar solicitações. Apenas Marketing (ou admin) pode editar/mover status/arquivar.
        </div>
      )}

      {viewMode === 'lista' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('solicitacao_numero')} className="group inline-flex items-center gap-1">
                      Nº
                      <SortIndicator active={sortKey === 'solicitacao_numero'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('departamento')} className="group inline-flex items-center gap-1">
                      Depto
                      <SortIndicator active={sortKey === 'departamento'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('prioridade')} className="group inline-flex items-center gap-1">
                      Prioridade
                      <SortIndicator active={sortKey === 'prioridade'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('pontos')} className="group inline-flex items-center gap-1">
                      Pts
                      <SortIndicator active={sortKey === 'pontos'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('status')} className="group inline-flex items-center gap-1">
                      Status
                      <SortIndicator active={sortKey === 'status'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('data_abertura')} className="group inline-flex items-center gap-1">
                      Abertura
                      <SortIndicator active={sortKey === 'data_abertura'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitacoesVisiveisOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Nenhuma solicitação encontrada.</td>
                  </tr>
                ) : (
                  solicitacoesVisiveisOrdenadas.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{s.solicitacao_numero}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{s.titulo}</div>
                        <div className="text-xs text-gray-500">{s.tipo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.departamento}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPrioridadeColor(s.prioridade)}`}>{s.prioridade}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.pontos ?? '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(s.status)}`}>{s.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDateTime(s.data_abertura)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openView(s)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(s);
                                setOpenEdit(true);
                              }}
                              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit && !s.arquivado && (
                            <button
                              type="button"
                              onClick={() => handleArchive(s)}
                              className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Arquivar"
                            >
                              <Ticket className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-4 ${showArchived ? 'xl:grid-cols-5' : ''} gap-4`}>
          {(['A fazer', 'Fazendo', 'Feito', 'Refação'] as SolicitacaoStatusType[]).map((status) => {
            const colunaClassName =
              status === 'Fazendo'
                ? 'bg-blue-50 border-2 border-blue-200 border-dashed'
                : status === 'Feito'
                  ? 'bg-green-50 border-2 border-green-200 border-dashed'
                  : status === 'Refação'
                    ? 'bg-orange-50 border-2 border-orange-200 border-dashed'
                  : 'bg-gray-50 border-2 border-gray-200 border-dashed';

            const headerClassName =
              status === 'Fazendo'
                ? 'bg-blue-100 border-b border-blue-200'
                : status === 'Feito'
                  ? 'bg-green-100 border-b border-green-200'
                  : status === 'Refação'
                    ? 'bg-orange-100 border-b border-orange-200'
                  : 'bg-gray-100 border-b border-gray-200';

            const titleClassName =
              status === 'Fazendo'
                ? 'text-blue-700'
                : status === 'Feito'
                  ? 'text-green-700'
                  : status === 'Refação'
                    ? 'text-orange-700'
                    : 'text-gray-700';

            const badgeClassName =
              status === 'Fazendo'
                ? 'bg-blue-200 text-blue-700'
                : status === 'Feito'
                  ? 'bg-green-200 text-green-700'
                  : status === 'Refação'
                    ? 'bg-orange-200 text-orange-700'
                  : 'bg-gray-200 text-gray-700';

            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className={`${colunaClassName} rounded-lg min-h-[600px]`}
              >
                <div className={`${headerClassName} px-4 py-3 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${titleClassName}`}>{status}</h3>
                    <span className={`${badgeClassName} text-xs font-bold px-2 py-1 rounded-full`}>
                      {getKanbanSolicitacoes(status).length}
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {getKanbanSolicitacoes(status).map((s) => (
                    <div
                      key={s.id}
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(e, s)}
                      onClick={() => openView(s)}
                      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-pointer hover:shadow-md transition-all ${
                        canEdit ? 'active:cursor-grabbing' : ''
                      }`}
                      title={canEdit ? 'Arraste para mover de status' : 'Ver'}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs text-gray-500">#{s.solicitacao_numero} • {s.departamento}</div>
                          <div className="font-medium text-gray-900 mt-1">{s.titulo}</div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPrioridadeColor(s.prioridade)}`}>{s.prioridade}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 flex justify-between">
                        <span>{s.tipo}</span>
                        <span>Pts: {s.pontos ?? '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {!canEdit && <div className="px-3 pb-3 text-xs text-gray-500">Sem permissão para arrastar/editar.</div>}
              </div>
            );
          })}

          {showArchived && (
            <div className="bg-gray-50 rounded-lg border-2 border-gray-200 border-dashed min-h-[600px]">
              <div className="bg-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">Arquivados</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                    {solicitacoesArquivadasFiltradas.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {solicitacoesArquivadasOrdenadas.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openView(s)}
                    className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-pointer hover:shadow-md transition-all opacity-75"
                    title="Ver"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500">#{s.solicitacao_numero} • {s.departamento}</div>
                        <div className="font-medium text-gray-900 mt-1 break-words">{s.titulo}</div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPrioridadeColor(s.prioridade)}`}>{s.prioridade}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 flex justify-between">
                      <span>{s.tipo}</span>
                      <span>Pts: {s.pontos ?? '-'}</span>
                    </div>
                  </div>
                ))}

                {solicitacoesArquivadasOrdenadas.length === 0 && (
                  <div className="text-sm text-gray-600">Nenhuma solicitação arquivada.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {openCreate && canCreate && (
        <AbrirSolicitacaoModal
          onClose={() => setOpenCreate(false)}
          onSuccess={() => loadSolicitacoes()}
        />
      )}

      {selected && !openEdit && (
        <VerSolicitacaoModal
          solicitacao={selected}
          canManage={canEdit}
          onClose={() => setSelected(null)}
          onUpdated={handleLocalUpdated}
          onArchived={handleArchivedById}
          onReopened={handleReopened}
        />
      )}

      {selected && openEdit && canEdit && (
        <EditarSolicitacaoModal
          solicitacao={selected}
          onClose={() => setOpenEdit(false)}
          onUpdated={(u) => {
            handleLocalUpdated(u);
            setOpenEdit(false);
          }}
        />
      )}
    </div>
  );
};

export default SolicitacoesTab;
