import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Chamado } from '../types';
import { Plus, Ticket, CheckCircle2, Clock, AlertCircle, Search, Filter, LayoutList, LayoutGrid, Eye, Pencil, Trash2, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { differenceInHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AbrirChamadoModal from './AbrirChamadoModal';
import VerChamadoModal from './VerChamadoModal';
import EditarChamadoModal from './EditarChamadoModal';

const ChamadosTab: React.FC = () => {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [draggedItem, setDraggedItem] = useState<Chamado | null>(null);
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [viewChamadoOpen, setViewChamadoOpen] = useState(false);
  const [editChamadoOpen, setEditChamadoOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [reopenFromList, setReopenFromList] = useState(false);

  const getCurrentUserMeta = () => {
    try {
      const storedUser = localStorage.getItem('app_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      return {
        by_name: user?.name as string | undefined,
        by_email: user?.email as string | undefined,
      };
    } catch {
      return { by_name: undefined, by_email: undefined };
    }
  };

  type SortKey = 'chamado_numero' | 'titulo' | 'tipo' | 'modulo' | 'prioridade' | 'prazo_estimado' | 'estimativa' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('chamado_numero');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadChamados();
  }, []);

  const loadChamados = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('ti_chamados')
        .select('*')
        .order('data_abertura', { ascending: false });

      if (!showArchived) {
        query = query.eq('arquivado', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setChamados(data || []);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Recarrega quando alterna exibição de arquivados.
    loadChamados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    try {
      return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const handleStatusChange = async (chamado: Chamado, novoStatus: Chamado['status']) => {
    try {
      const shouldSetDeliveredAt = novoStatus === 'Feito' && !chamado.data_conclusao;
      const shouldClearDeliveredAt = chamado.status === 'Feito' && novoStatus !== 'Feito';
      const shouldSetStartedAt = novoStatus === 'Fazendo' && !chamado.data_inicio;

      const nowIso = new Date().toISOString();

      const updatePayload: Partial<Chamado> & { data_conclusao?: string | null; data_inicio?: string | null } = {
        status: novoStatus,
      };

      if (shouldSetStartedAt) {
        updatePayload.data_inicio = nowIso;
      }

      if (shouldSetDeliveredAt) {
        updatePayload.data_conclusao = nowIso;
      }
      if (shouldClearDeliveredAt) {
        updatePayload.data_conclusao = null;
      }

      // Se a coluna `historico` existir (migration aplicada), registra a mudança de status.
      if (Array.isArray((chamado as any).historico)) {
        const userMeta = getCurrentUserMeta();
        (updatePayload as any).historico = [
          ...((chamado as any).historico as any[]),
          {
            at: nowIso,
            action: 'status',
            from_status: chamado.status,
            to_status: novoStatus,
            ...userMeta,
          },
        ];
      }

      const { error } = await supabase
        .from('ti_chamados')
        .update(updatePayload)
        .eq('id', chamado.id);

      if (error) throw error;

      // Atualizar localmente
      setChamados(prev => prev.map(c =>
        c.id === chamado.id
          ? {
            ...c,
            status: novoStatus,
            data_conclusao:
              shouldSetDeliveredAt ? (updatePayload.data_conclusao as string) :
                shouldClearDeliveredAt ? undefined :
                  c.data_conclusao,
            data_inicio:
              shouldSetStartedAt ? (updatePayload.data_inicio as string) :
                c.data_inicio,
            historico: (updatePayload as any).historico ?? (c as any).historico,
          }
          : c
      ));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const openView = (chamado: Chamado) => {
    setSelectedChamado(chamado);
    setReopenFromList(false);
    setViewChamadoOpen(true);
  };

  const openReopen = (chamado: Chamado) => {
    setSelectedChamado(chamado);
    setReopenFromList(true);
    setViewChamadoOpen(true);
  };

  const openEdit = (chamado: Chamado) => {
    setSelectedChamado(chamado);
    setEditChamadoOpen(true);
  };

  const handleArchive = async (chamado: Chamado) => {
    try {
      const now = new Date().toISOString();
      const updatePayload: any = { arquivado: true, data_arquivamento: now };

      // Se a coluna `historico` existir (migration aplicada), registra o arquivamento.
      if (Array.isArray((chamado as any).historico)) {
        const userMeta = getCurrentUserMeta();
        updatePayload.historico = [
          ...((chamado as any).historico as any[]),
          {
            at: now,
            action: 'arquivar',
            from_status: chamado.status,
            to_status: chamado.status,
            ...userMeta,
          },
        ];
      }

      const { error } = await supabase
        .from('ti_chamados')
        .update(updatePayload)
        .eq('id', chamado.id);

      if (error) throw error;
      setChamados((prev) => {
        if (!showArchived) {
          return prev.filter((c) => c.id !== chamado.id);
        }
        return prev.map((c) =>
          c.id === chamado.id
            ? { ...c, arquivado: true, data_arquivamento: now, historico: updatePayload.historico ?? (c as any).historico }
            : c
        );
      });
    } catch (error) {
      console.error('Erro ao arquivar chamado:', error);
    }
  };

  const handleLocalUpdated = (updated: Chamado) => {
    setChamados((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedChamado(updated);
  };

  const handleArchivedById = (id: string) => {
    setChamados((prev) => {
      if (!showArchived) {
        return prev.filter((c) => c.id !== id);
      }
      const now = new Date().toISOString();
      return prev.map((c) => (c.id === id ? { ...c, arquivado: true, data_arquivamento: now } : c));
    });
  };

  // Calcular indicadores
  const chamadosAtivos = chamados.filter(c => !c.arquivado);
  const chamadosAbertos = chamadosAtivos.filter(c => c.status === 'A fazer' || c.status === 'Fazendo');
  const chamadosConcluidos = chamadosAtivos.filter(c => c.status === 'Feito');

  // Tempo médio de conclusão (apenas dos concluídos)
  const tempoMedioConclusao = chamadosConcluidos.length > 0
    ? chamadosConcluidos.reduce((acc, c) => {
      if (c.data_conclusao) {
        const horas = differenceInHours(new Date(c.data_conclusao), new Date(c.data_abertura));
        return acc + horas;
      }
      return acc;
    }, 0) / chamadosConcluidos.length
    : 0;

  // Tempo médio dos chamados em aberto (tempo desde abertura até agora)
  const tempoMedioAtraso = chamadosAbertos.length > 0
    ? chamadosAbertos.reduce((acc, c) => {
      const horas = differenceInHours(new Date(), new Date(c.data_abertura));
      return acc + horas;
    }, 0) / chamadosAbertos.length
    : 0;

  // Filtrar chamados
  const chamadosFiltrados = chamados.filter(chamado => {
    const matchSearch = chamado.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chamado.solicitante_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chamado.modulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chamado.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'todos' || chamado.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const chamadosAtivosFiltrados = chamadosFiltrados.filter(c => !c.arquivado);
  const chamadosArquivadosFiltrados = chamadosFiltrados.filter(c => !!c.arquivado);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'chamado_numero' ? 'desc' : 'asc');
  };

  const getSortValue = (chamado: Chamado, key: SortKey): string | number | null => {
    switch (key) {
      case 'chamado_numero':
        return typeof chamado.chamado_numero === 'number' ? chamado.chamado_numero : Number(chamado.chamado_numero) || 0;
      case 'titulo':
        return chamado.titulo ?? '';
      case 'tipo':
        return chamado.tipo ?? '';
      case 'modulo':
        return chamado.modulo ?? '';
      case 'prazo_estimado':
        return chamado.prazo_estimado ? new Date(chamado.prazo_estimado).getTime() : null;
      case 'prioridade': {
        const prioridadeRank: Record<string, number> = {
          'Crítica': 1,
          'Alta': 2,
          'Média': 3,
          'Baixa': 4,
        };
        return prioridadeRank[chamado.prioridade] ?? 99;
      }
      case 'estimativa':
        return typeof chamado.estimativa === 'number' ? chamado.estimativa : null;

      case 'status':
        return chamado.status ?? '';
      default:
        return null;
    }
  };

  const chamadosAtivosOrdenados = useMemo(() => {
    const direction = sortDir === 'asc' ? 1 : -1;
    const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

    const compareValues = (a: string | number | null, b: string | number | null) => {
      // null/undefined sempre por último.
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;

      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return collator.compare(String(a), String(b));
    };

    return [...chamadosAtivosFiltrados].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      return direction * compareValues(aVal, bVal);
    });
  }, [chamadosAtivosFiltrados, sortDir, sortKey]);

  const chamadosArquivadosOrdenados = useMemo(() => {
    const direction = sortDir === 'asc' ? 1 : -1;
    const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

    const compareValues = (a: string | number | null, b: string | number | null) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return collator.compare(String(a), String(b));
    };

    return [...chamadosArquivadosFiltrados].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      return direction * compareValues(aVal, bVal);
    });
  }, [chamadosArquivadosFiltrados, sortDir, sortKey]);

  const chamadosVisiveisOrdenados = showArchived ? chamadosArquivadosOrdenados : chamadosAtivosOrdenados;

  const SortIndicator: React.FC<{ active: boolean; dir: 'asc' | 'desc' }> = ({ active, dir }) => {
    if (!active) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />;
    }
    return dir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-gray-700" />
      : <ChevronDown className="w-3.5 h-3.5 text-gray-700" />;
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Crítica': return 'bg-red-100 text-red-800 border-red-200';
      case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }

  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A fazer': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Fazendo': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Feito': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTempo = (horas: number) => {
    if (horas < 1) {
      return `${Math.round(horas * 60)}min`;
    } else if (horas < 24) {
      return `${Math.round(horas)}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = Math.round(horas % 24);
      return `${dias}d ${horasRestantes}h`;
    }
  };

  const handleDragStart = (e: React.DragEvent, chamado: Chamado) => {
    setDraggedItem(chamado);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, novoStatus: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.status === novoStatus) {
      setDraggedItem(null);
      return;
    }

    await handleStatusChange(draggedItem, novoStatus as Chamado['status']);
    setDraggedItem(null);
  };

  const getKanbanChamados = (status: string) => {
    return chamadosAtivosFiltrados.filter(c => c.status === status);
  };

  const stopKanbanAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando chamados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chamados em Aberto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Aberto</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{chamadosAbertos.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Chamados Concluídos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{chamadosConcluidos.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tempo Médio de Conclusão */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio (Conclusão)</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{formatTempo(tempoMedioConclusao)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tempo Médio de Atraso */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio (Abertos)</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{formatTempo(tempoMedioAtraso)}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Status - só mostrar no modo lista */}
          {viewMode === 'lista' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="todos">Todos os Status</option>
                <option value="A fazer">A fazer</option>
                <option value="Fazendo">Fazendo</option>
                <option value="Feito">Feito</option>
              </select>
            </div>
          )}

          {/* Toggle visualização */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${viewMode === 'lista'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="text-sm font-medium">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${viewMode === 'kanban'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Kanban</span>
            </button>
          </div>

          {/* Abas: Ativos / Arquivados */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${!showArchived ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${showArchived ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Arquivados
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Abrir Chamado
        </button>
      </div>

      {/* Lista de Chamados */}
      {viewMode === 'lista' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {chamadosVisiveisOrdenados.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum chamado encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile-first: lista em cards (sem overflow horizontal) */}
              <div className="block lg:hidden divide-y divide-gray-200">
                {chamadosVisiveisOrdenados.map((chamado) => (
                  <div key={chamado.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 break-words">#{chamado.chamado_numero} — {chamado.titulo}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${chamado.tipo === 'Estrutural' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            chamado.tipo === 'Melhoria' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                            {chamado.tipo}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                            Est.: {chamado.estimativa ?? '-'}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPrioridadeColor(chamado.prioridade)}`}>
                        {chamado.prioridade}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => openView(chamado)}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                        aria-label="Ver"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                      {!showArchived && (
                        <>
                          <button
                            onClick={() => openEdit(chamado)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                            aria-label="Editar"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleArchive(chamado)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                            aria-label="Arquivar"
                            title="Arquivar"
                          >
                            <Trash2 className="w-4 h-4 text-gray-700" />
                          </button>
                        </>
                      )}

                      {showArchived && (
                        <button
                          type="button"
                          onClick={() => openReopen(chamado)}
                          className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          Reabrir
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500">Módulo</p>
                        <p className="text-gray-800 break-words">{chamado.modulo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Data de entrega</p>
                        <p className="text-gray-800 break-words">{formatDate(chamado.prazo_estimado)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabela com colunas solicitadas, sem scroll horizontal */}
              <div className="hidden lg:block">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'chamado_numero' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('chamado_numero')} className="group inline-flex items-center gap-1">
                          Nº
                          <SortIndicator active={sortKey === 'chamado_numero'} dir={sortDir} />
                        </button>
                      </th>
                      <th
                        className="w-[18%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'titulo' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('titulo')} className="group inline-flex items-center gap-1">
                          Título
                          <SortIndicator active={sortKey === 'titulo'} dir={sortDir} />
                        </button>
                      </th>
                      <th
                        className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'tipo' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('tipo')} className="group inline-flex items-center gap-1">
                          Tipo
                          <SortIndicator active={sortKey === 'tipo'} dir={sortDir} />
                        </button>
                      </th>
                      <th
                        className="w-[14%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'modulo' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('modulo')} className="group inline-flex items-center gap-1">
                          Módulo
                          <SortIndicator active={sortKey === 'modulo'} dir={sortDir} />
                        </button>
                      </th>
                      <th
                        className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'prioridade' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('prioridade')} className="group inline-flex items-center gap-1">
                          Prioridade
                          <SortIndicator active={sortKey === 'prioridade'} dir={sortDir} />
                        </button>
                      </th>
                      <th
                        className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('status')} className="group inline-flex items-center gap-1">
                          Status
                          <SortIndicator active={sortKey === 'status'} dir={sortDir} />
                        </button>
                      </th>
                      <th
                        className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'prazo_estimado' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('prazo_estimado')} className="group inline-flex items-center gap-1">
                          Data de entrega
                          <SortIndicator active={sortKey === 'prazo_estimado'} dir={sortDir} />
                        </button>
                      </th>
                      <th
                        className="w-[8%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        aria-sort={sortKey === 'estimativa' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" onClick={() => handleSort('estimativa')} className="group inline-flex items-center gap-1">
                          Est.
                          <SortIndicator active={sortKey === 'estimativa'} dir={sortDir} />
                        </button>
                      </th>
                      <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chamadosVisiveisOrdenados.map((chamado) => (
                      <tr key={chamado.id} className="hover:bg-gray-50 transition-colors align-top">
                        <td className="px-3 py-3">
                          <span className="text-sm font-bold text-gray-900">#{chamado.chamado_numero}</span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-gray-900 whitespace-normal break-words">{chamado.titulo}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${chamado.tipo === 'Estrutural' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            chamado.tipo === 'Melhoria' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                            {chamado.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-700 whitespace-normal break-words">{chamado.modulo || '-'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPrioridadeColor(chamado.prioridade)}`}>
                            {chamado.prioridade}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(chamado.status)}`}>
                            {chamado.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-700 whitespace-normal break-words">{formatDate(chamado.prazo_estimado)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                            {chamado.estimativa ?? '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openView(chamado)}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                              aria-label="Ver"
                              title="Ver"
                            >
                              <Eye className="w-4 h-4 text-gray-700" />
                            </button>
                            {!showArchived && (
                              <>
                                <button
                                  onClick={() => openEdit(chamado)}
                                  className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                  aria-label="Editar"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  onClick={() => handleArchive(chamado)}
                                  className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                  aria-label="Arquivar"
                                  title="Arquivar"
                                >
                                  <Trash2 className="w-4 h-4 text-gray-700" />
                                </button>
                              </>
                            )}

                            {showArchived && (
                              <button
                                type="button"
                                onClick={() => openReopen(chamado)}
                                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                              >
                                Reabrir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Visualização Kanban */
        <div className={`grid grid-cols-1 md:grid-cols-3 ${showArchived ? 'xl:grid-cols-4' : ''} gap-4`}>
          {/* Coluna A Fazer */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'A fazer')}
            className="bg-gray-50 rounded-lg border-2 border-gray-200 border-dashed min-h-[600px]"
          >
            <div className="bg-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">A Fazer</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                  {getKanbanChamados('A fazer').length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-3">
              {getKanbanChamados('A fazer').map((chamado) => {
                return (
                  <div
                    key={chamado.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chamado)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-500">#{chamado.chamado_numero}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getPrioridadeColor(chamado.prioridade)}`}>
                          {chamado.prioridade}
                        </span>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            openView(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Ver"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            openEdit(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            handleArchive(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Arquivar"
                          title="Arquivar"
                        >
                          <Trash2 className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{chamado.titulo}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${chamado.tipo === 'Estrutural' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        chamado.tipo === 'Melhoria' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                        {chamado.tipo}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        Est.: {chamado.estimativa ?? '-'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Módulo</p>
                        <p className="text-gray-800 break-words">{chamado.modulo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Data de entrega</p>
                        <p className="text-gray-800 break-words">{formatDate(chamado.prazo_estimado)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Fazendo */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Fazendo')}
            className="bg-blue-50 rounded-lg border-2 border-blue-200 border-dashed min-h-[600px]"
          >
            <div className="bg-blue-100 px-4 py-3 rounded-t-lg border-b border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-blue-700">Fazendo</h3>
                <span className="bg-blue-200 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  {getKanbanChamados('Fazendo').length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-3">
              {getKanbanChamados('Fazendo').map((chamado) => {
                return (
                  <div
                    key={chamado.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chamado)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-500">#{chamado.chamado_numero}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getPrioridadeColor(chamado.prioridade)}`}>
                          {chamado.prioridade}
                        </span>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            openView(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Ver"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            openEdit(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            handleArchive(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Arquivar"
                          title="Arquivar"
                        >
                          <Trash2 className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{chamado.titulo}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${chamado.tipo === 'Estrutural' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        chamado.tipo === 'Melhoria' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                        {chamado.tipo}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        Est.: {chamado.estimativa ?? '-'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Módulo</p>
                        <p className="text-gray-800 break-words">{chamado.modulo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Data de entrega</p>
                        <p className="text-gray-800 break-words">{formatDate(chamado.prazo_estimado)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Feito */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Feito')}
            className="bg-green-50 rounded-lg border-2 border-green-200 border-dashed min-h-[600px]"
          >
            <div className="bg-green-100 px-4 py-3 rounded-t-lg border-b border-green-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-700">Feito</h3>
                <span className="bg-green-200 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                  {getKanbanChamados('Feito').length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-3">
              {getKanbanChamados('Feito').map((chamado) => {
                return (
                  <div
                    key={chamado.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chamado)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-green-200 cursor-move hover:shadow-md transition-shadow opacity-75"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-500">#{chamado.chamado_numero}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getPrioridadeColor(chamado.prioridade)}`}>
                          {chamado.prioridade}
                        </span>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            openView(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Ver"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            openEdit(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onMouseDown={stopKanbanAction}
                          onClick={(e) => {
                            stopKanbanAction(e);
                            handleArchive(chamado);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Arquivar"
                          title="Arquivar"
                        >
                          <Trash2 className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{chamado.titulo}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${chamado.tipo === 'Estrutural' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        chamado.tipo === 'Melhoria' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                        {chamado.tipo}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        Est.: {chamado.estimativa ?? '-'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Módulo</p>
                        <p className="text-gray-800 break-words">{chamado.modulo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Data de entrega</p>
                        <p className="text-gray-800 break-words">{formatDate(chamado.prazo_estimado)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Arquivados */}
          {showArchived && (
            <div className="bg-gray-50 rounded-lg border-2 border-gray-200 border-dashed min-h-[600px]">
              <div className="bg-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">Arquivados</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                    {chamadosArquivadosFiltrados.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {chamadosArquivadosFiltrados.map((chamado) => (
                  <div
                    key={chamado.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 opacity-75"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-500">#{chamado.chamado_numero}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getPrioridadeColor(chamado.prioridade)}`}>
                          {chamado.prioridade}
                        </span>
                        <button
                          onClick={() => openView(chamado)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          aria-label="Ver"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openReopen(chamado)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          Reabrir
                        </button>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2 break-words">{chamado.titulo}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${chamado.tipo === 'Estrutural' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        chamado.tipo === 'Melhoria' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                        {chamado.tipo}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        Est.: {chamado.estimativa ?? '-'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Módulo</p>
                        <p className="text-gray-800 break-words">{chamado.modulo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Data de entrega</p>
                        <p className="text-gray-800 break-words">{formatDate(chamado.prazo_estimado)}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Arquivado em: {formatDateTime(chamado.data_arquivamento || null)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Abertura de Chamado */}
      {showModal && (
        <AbrirChamadoModal
          onClose={() => setShowModal(false)}
          onSuccess={loadChamados}
        />
      )}

      {viewChamadoOpen && selectedChamado && (
        <VerChamadoModal
          chamado={selectedChamado}
          onClose={() => {
            setViewChamadoOpen(false);
            setReopenFromList(false);
          }}
          onUpdated={handleLocalUpdated}
          onArchived={handleArchivedById}
          initialReopenMode={reopenFromList}
        />
      )}

      {editChamadoOpen && selectedChamado && (
        <EditarChamadoModal
          chamado={selectedChamado}
          onClose={() => setEditChamadoOpen(false)}
          onUpdated={handleLocalUpdated}
        />
      )}
    </div>
  );
};

export default ChamadosTab;
