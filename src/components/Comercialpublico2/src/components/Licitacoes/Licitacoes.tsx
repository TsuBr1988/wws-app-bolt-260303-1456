import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Filter, Search, ArrowUpDown, Calendar, DollarSign, TrendingUp, Users, AlertTriangle, Eye, EyeOff, List, CalendarDays, Printer } from 'lucide-react';
import { LicitacaoCard } from './LicitacaoCard';
import { LicitacaoForm } from './LicitacaoForm';
import { ProbabilityScores } from './ProbabilityModal';
import { CalendarView } from './CalendarView';
import { LicitacaoDetails } from './LicitacaoDetails';
import { PrintModal } from './PrintModal';
import { useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete, clearQueryCache, useSupabaseQuery } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { Licitacao } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { STATUS_OPTIONS, STATUS_POSSIVEL_COMISSAO, STATUS_VENCEU_CONTRATO, isPossivelComissao, isContratoAssinado } from '../../constants/status';
import { uniqueById, upsertInMap } from '../../utils/uniqueById';
import { applyDefaultOrder } from '../../utils/sortPropostas';

interface LicitacoesProps {
  onDataChange?: () => void;
}

export const Licitacoes: React.FC<LicitacoesProps> = ({ onDataChange }) => {
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const { canEdit } = useSystemVersion();
  const canEditLicitacoes = canEdit('proposals');

  // Estado normalizado: Map por ID evita duplicação
  const [proposalMap, setProposalMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLicitacao, setEditingLicitacao] = useState<Licitacao | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [licitanteFilter, setLicitanteFilter] = useState('all');
  const [useDefaultSort, setUseDefaultSort] = useState(true);
  const [sortBy, setSortBy] = useState<'data' | 'orgao' | 'valor'>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showWithoutProbability, setShowWithoutProbability] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper para atualizar estado normalizado (SEMPRE substitui, nunca duplica)
  const upsertProposals = (items: any[]) => {
    console.log('🔄 [Licitacoes] upsertProposals chamado com', items.length, 'itens');
    setProposalMap(prev => {
      const newMap = new Map(prev);
      for (const item of uniqueById(items)) {
        if (item && item.id) {
          newMap.set(item.id, item);
          console.log('✅ [Licitacoes] Item upserted:', item.id, '-', item.client);
        }
      }
      console.log('📊 [Licitacoes] Estado atualizado. Total no Map:', newMap.size);
      return newMap;
    });
  };

  const upsertSingleProposal = (item: any) => {
    console.log('🔄 [Licitacoes] upsertSingleProposal chamado para:', item.id, '-', item.client);
    setProposalMap(prev => upsertInMap(prev, item));
  };

  // Buscar dados iniciais do Supabase
  const fetchProposals = async (signal?: AbortSignal) => {
    try {
      console.log('🔄 [Licitacoes] Buscando propostas do Supabase...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id, client, city, numero_pregao, plataforma, monthly_value, months, total_value,
          status, commission, closer_id, sdr_id, closing_date, data_proxima_acao,
          data_pregao, lance_vencedor, nosso_lance, empresa_vencedora, percentual_vencedor,
          percentual_nosso_lance, promotor_id, orcamentista_id, status_planilha,
          posicao_atual, etapa_maxima, data_assinatura, notes, observacao_proxima_acao,
          proxima_acao_texto, empresa, nao_gera_comissao, nao_conta_meta_comercial, created_at, updated_at
        `)
        .eq('department', selectedDepartment)
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      
      if (error) {
        console.error('❌ [Licitacoes] Erro ao buscar propostas:', error);
        return;
      }
      
      console.log('✅ [Licitacoes] Propostas carregadas do Supabase:', data?.length || 0);
      
      // Deduplicar e inserir no estado normalizado
      upsertProposals(data || []);
      
    } catch (error) {
      // Handle AbortError differently - it's expected when component unmounts
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('ℹ️ [Licitacoes] Busca cancelada (componente desmontado)');
        return;
      } else {
        console.error('❌ [Licitacoes] Erro na função fetchProposals:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const { data: employees = [] } = useSupabaseQuery('employees');
  const { data: probabilityScores = [] } = useSupabaseQuery('probability_scores');
  
  const { insert: insertProposal, loading: insertLoading } = useSupabaseInsert('proposals');
  const { update: updateProposal, loading: updateLoading } = useSupabaseUpdate('proposals');
  const { deleteRecord: deleteProposal, loading: deleteLoading } = useSupabaseDelete('proposals');

  // Fetch inicial e cleanup
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    fetchProposals(controller.signal);
    
    return () => {
      controller.abort('Component unmounting');
      abortControllerRef.current = null;
    };
  }, [selectedYear, selectedDepartment]);

  // Realtime subscription para updates em tempo real SEM duplicação
  useEffect(() => {
    console.log('🔔 [Licitacoes] Configurando subscription realtime para department:', selectedDepartment);
    
    const channel = supabase
      .channel('proposals-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'proposals',
          filter: `department=eq.${selectedDepartment}`
        },
        (payload) => {
          console.log('🔔 [Licitacoes] Evento realtime recebido:', {
            event: payload.eventType,
            id: payload.new?.id || payload.old?.id,
            client: payload.new?.client || payload.old?.client
          });
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              console.log('✅ [Licitacoes] Realtime upsert:', payload.new.id, payload.new.client);
              upsertSingleProposal(payload.new);
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old) {
              console.log('🗑️ [Licitacoes] Realtime delete:', payload.old.id);
              setProposalMap(prev => {
                const newMap = new Map(prev);
                newMap.delete(payload.old.id);
                console.log('📊 [Licitacoes] Map size após delete:', newMap.size);
                return newMap;
              });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('🧹 [Licitacoes] Removendo subscription realtime...');
      supabase.removeChannel(channel);
    };
  }, [selectedDepartment]);

  // Converter Map para array com deduplicação e ordenação
  const proposalsList = useMemo(() => {
    const arrayFromMap = Array.from(proposalMap.values());
    
    // CRÍTICO: Sempre deduplicar antes de qualquer processamento
    const deduplicatedArray = uniqueById(arrayFromMap);
    
    console.log('🔄 [Licitacoes] Convertendo Map para Array:', {
      mapSize: proposalMap.size,
      arrayLength: arrayFromMap.length,
      deduplicatedLength: deduplicatedArray.length,
      hasDuplicates: arrayFromMap.length !== deduplicatedArray.length
    });
    
    return deduplicatedArray;
  }, [proposalMap]);

  console.log('🔍 [Licitacoes] Estado atual:', {
    proposalMapSize: proposalMap.size,
    proposalsListLength: proposalsList?.length || 0,
    employees: employees?.length || 0,
    probabilityScores: probabilityScores?.length || 0,
    loading,
    selectedYear,
    selectedDepartment
  });

  // Transformar dados do Supabase para o formato da aplicação
  const propostas = useMemo(() => {
    if (!Array.isArray(proposalsList)) {
      console.warn('⚠️ proposalsList não é um array:', proposalsList);
      return [];
    }

    const transformedData = proposalsList.map(p => {
      // Buscar probability scores para esta proposta
      const propProbability = probabilityScores.find(ps => ps.proposal_id === p.id);
      
      return {
        id: p.id,
        orgao: p.client, // client → orgao
        cidade: p.city,
        numeroPregao: p.numero_pregao || '',
        pregaoNumero: p.numero_pregao || '', // Alias para compatibilidade
        plataforma: p.plataforma || '',
        dataInclusao: p.created_at.split('T')[0], // created_at → dataInclusao
        dataHoraPregao: p.data_pregao || p.created_at, // data_pregao → dataHoraPregao
        dataPregao: p.data_pregao || p.created_at, // Compatibilidade
        dataProximaAcao: p.data_proxima_acao,
        empresa: p.empresa || 'WWS', // Usar valor do banco ou padrão
        situacao: p.status, // USAR STATUS DIRETO DO BANCO (sem mapeamento)
        etapaMaxima: p.etapa_maxima || 'Proposta',
        valorEstimado: p.total_value || 0,
        empresaVencedora: p.empresa_vencedora,
        lanceVencedor: p.lance_vencedor,
        percentualVencedor: p.percentual_vencedor,
        nossoLance: p.nosso_lance,
        percentualNossoLance: p.percentual_nosso_lance,
        posicaoAtual: p.posicao_atual,
        colocacaoAtual: p.posicao_atual, // Alias para compatibilidade
        months: p.months || 12,
        statusPlanilha: p.status_planilha || 'Planilha a fazer',
        observacoes: p.notes,
        observacaoProximaAcao: p.observacao_proxima_acao,
        proximaAcaoTexto: p.proxima_acao_texto,
        licitanteId: p.closer_id || '',
        adlId: p.sdr_id,
        promotorId: p.promotor_id,
        orcamentistaId: p.orcamentista_id,
        dataAssinatura: p.data_assinatura,
        probabilityScores: propProbability ? {
          requisitos_habilitacao: propProbability.requisitos_habilitacao || 1,
          processo_contratacao: propProbability.processo_contratacao || 1,
          plataforma: propProbability.plataforma || 1,
          postura_pregoeiro: propProbability.postura_pregoeiro || 1,
          planilha_preco: propProbability.planilha_preco || 1,
          modelo_planilha: propProbability.modelo_planilha || 1,
          influencia: propProbability.influencia || 1,
          requisitos_diferenciacao: propProbability.requisitos_diferenciacao || 1,
          posicao_apos_lances: propProbability.posicao_apos_lances || 1
        } : undefined,
        nao_gera_comissao: p.nao_gera_comissao || false,
        nao_conta_meta_comercial: p.nao_conta_meta_comercial || false,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      } as Licitacao;
    });
    
    // CRÍTICO: Remove duplicatas por ID
    return uniqueById(transformedData);
  }, [proposalsList, probabilityScores]);

  console.log('🔄 [Licitacoes] Propostas transformadas:', {
    original: proposalsList?.length || 0,
    transformed: propostas?.length || 0,
    firstProposal: propostas[0] ? {
      id: propostas[0].id,
      orgao: propostas[0].orgao,
      numeroPregao: propostas[0].numeroPregao,
      situacao: propostas[0].situacao
    } : null
  });

  // Mostrar todas as propostas (sem filtro de ano)
  const propostasDoAno = useMemo(() => {
    return propostas;
  }, [propostas]);

  // Filtros e busca
  const propostasSeguras = Array.isArray(propostasDoAno) ? propostasDoAno : [];
  
  const propostasFiltradas = useMemo(() => {
    return propostasSeguras.filter(proposta => {
      // Filtro de busca
      const searchMatch = searchTerm.toLowerCase() === '' ||
        proposta.orgao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.numeroPregao.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const statusMatch = statusFilter === 'all' || proposta.situacao === statusFilter;

      // Filtro de licitante
      const licitanteMatch = licitanteFilter === 'all' || proposta.licitanteId === licitanteFilter;

      // Filtro de probabilidade
      const probabilityMatch = !showWithoutProbability || !proposta.probabilityScores;
      
      return searchMatch && statusMatch && licitanteMatch && probabilityMatch;
    });
  }, [propostasSeguras, searchTerm, statusFilter, licitanteFilter, showWithoutProbability]);

  // Calcular comissões usando a mesma lógica do Dashboard
  const calculateCommissions = () => {
    // NOVO: Usar constantes para filtrar
    const closedProposals = propostasDoAno.filter(p => isContratoAssinado(p.situacao));
    
    const activeProposals = propostasDoAno.filter(p => isPossivelComissao(p.situacao));
    
    let totalGuaranteedCommissions = 0;
    let totalPossibleCommissions = 0;
    
    // Calcular comissões garantidas (contratos fechados)
    closedProposals.forEach(proposta => {
      const proposalValue = proposta.nossoLance || proposta.valorEstimado || 0;
      
      if (proposta.promotorId) {
        // Com promotor: sempre 0,01% fixo
        totalGuaranteedCommissions += (proposalValue * 0.01) / 100;
      } else if (selectedDepartment === 'Petrobras') {
        // Para Petrobras: taxa individual por contrato
        const contractRate = proposalValue <= 50000000 ? 2.8 : 
                           proposalValue <= 100000000 ? 1.8 : 1.3;
        totalGuaranteedCommissions += (proposalValue * contractRate) / 100;
      } else {
        // Para Comercial Público: usar taxa de 0,2% (Megameta - máximo possível)
        totalGuaranteedCommissions += (proposalValue * 0.2) / 100;
      }
    });
    
    // Calcular comissões possíveis (contratos em aberto)
    activeProposals.forEach(proposta => {
      const proposalValue = proposta.nossoLance || proposta.valorEstimado || 0;
      
      let baseCommission = 0;
      
      if (proposta.promotorId) {
        // Com promotor: sempre 0,01% fixo
        baseCommission = (proposalValue * 0.01) / 100;
      } else if (selectedDepartment === 'Petrobras') {
        // Para Petrobras: taxa individual por contrato
        const contractRate = proposalValue <= 50000000 ? 2.8 : 
                           proposalValue <= 100000000 ? 1.8 : 1.3;
        baseCommission = (proposalValue * contractRate) / 100;
      } else {
        // Para Comercial Público: usar taxa de 0,2% (Megameta - máximo possível)
        baseCommission = (proposalValue * 0.2) / 100;
      }
      
      // Cada contrato pode gerar comissão para Closer E SDR (mesma taxa)
      if (proposta.licitanteId) {
        totalPossibleCommissions += baseCommission; // Closer
      }
      if (proposta.adlId) {
        totalPossibleCommissions += baseCommission; // SDR (mesma comissão)
      }
    });
    
    return {
      totalGuaranteedCommissions,
      totalPossibleCommissions
    };
  };

  const { totalGuaranteedCommissions, totalPossibleCommissions } = calculateCommissions();
  // Ordenação
  const propostasOrdenadas = useMemo(() => {
    const base = [...propostasFiltradas];
    
    if (useDefaultSort) {
      // Ordenação padrão: Em andamento > Aguardando > Contrato assinado > Demais
      return applyDefaultOrder(base);
    } else {
      // Ordenação manual do usuário
      return base.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'data':
            aValue = new Date(a.dataHoraPregao).getTime();
            bValue = new Date(b.dataHoraPregao).getTime();
            break;
          case 'orgao':
            aValue = a.orgao.toLowerCase();
            bValue = b.orgao.toLowerCase();
            break;
          case 'valor':
            aValue = a.valorEstimado || 0;
            bValue = b.valorEstimado || 0;
            break;
          default:
            aValue = new Date(a.dataHoraPregao).getTime();
            bValue = new Date(b.dataHoraPregao).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }
  }, [propostasFiltradas, useDefaultSort, sortBy, sortOrder]);

  // Calcular estatísticas
  const statistics = useMemo(() => {
    const ativas = propostasDoAno.filter(p => p.situacao === 'Aguardando' || p.situacao === 'Em andamento');

    // Usar nosso lance quando disponível, senão valor estimado
    const valorTotal = propostasDoAno.reduce((sum, p) => sum + (p.nossoLance || p.valorEstimado || 0), 0);

    // Usar a mesma lógica de cálculo do Dashboard
    const comissaoTotal = totalPossibleCommissions;

    // Calcular efetividade de licitações
    const totalLicitacoes = propostasDoAno.length;
    const licitacoesComContrato = propostasDoAno.filter(p => p.situacao === 'Contrato assinado').length;
    const efetividadeLicitacoes = totalLicitacoes > 0 ? (licitacoesComContrato / totalLicitacoes) * 100 : 0;

    return {
      valorTotal,
      comissaoTotal,
      licitacoesAtivas: ativas.length,
      efetividadeLicitacoes,
      licitacoesComContrato,
      totalLicitacoes
    };
  }, [propostasDoAno, totalPossibleCommissions]);

  // Funções de CRUD
  const handleSubmitLicitacao = async (licitacaoData: Omit<Licitacao, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dataToInsert = {
        client: licitacaoData.orgao,
        city: licitacaoData.cidade,
        numero_pregao: licitacaoData.numeroPregao,
        empresa: licitacaoData.empresa,
        plataforma: licitacaoData.plataforma,
        monthly_value: licitacaoData.valorEstimado ? licitacaoData.valorEstimado / (licitacaoData.months || 12) : 0,
        months: licitacaoData.months || 12,
        total_value: licitacaoData.valorEstimado || 0,
        status: licitacaoData.situacao, // SALVAR DIRETO SEM MAPEAMENTO
        commission: 0,
        closer_id: licitacaoData.licitanteId,
        sdr_id: licitacaoData.adlId,
        data_pregao: licitacaoData.dataHoraPregao,
        data_proxima_acao: licitacaoData.dataProximaAcao,
        lance_vencedor: licitacaoData.lanceVencedor,
        nosso_lance: licitacaoData.nossoLance,
        empresa_vencedora: licitacaoData.empresaVencedora,
        percentual_vencedor: licitacaoData.percentualVencedor,
        percentual_nosso_lance: licitacaoData.percentualNossoLance,
        promotor_id: licitacaoData.promotorId,
        orcamentista_id: licitacaoData.orcamentistaId,
        status_planilha: licitacaoData.statusPlanilha,
        posicao_atual: licitacaoData.posicaoAtual,
        etapa_maxima: licitacaoData.etapaMaxima,
        data_assinatura: licitacaoData.dataAssinatura,
        notes: licitacaoData.observacoes,
        observacao_proxima_acao: licitacaoData.observacaoProximaAcao,
        proxima_acao_texto: licitacaoData.proximaAcaoTexto,
        nao_gera_comissao: licitacaoData.nao_gera_comissao || false,
        nao_conta_meta_comercial: licitacaoData.nao_conta_meta_comercial || false,
        department: selectedDepartment
      };

      if (editingLicitacao) {
        // EDITANDO LICITAÇÃO EXISTENTE
        console.log('✏️ [Licitacoes] Atualizando licitação existente:', editingLicitacao.id, dataToInsert);
        
        await updateProposal(editingLicitacao.id, dataToInsert);
        
        // Buscar proposta atualizada
        const { data: updatedProposal, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', editingLicitacao.id)
          .single();
          
        if (!error && updatedProposal) {
          console.log('✅ [Licitacoes] Proposta atualizada:', updatedProposal.id);
          upsertSingleProposal(updatedProposal);
        }
        
        alert('✅ Licitação atualizada com sucesso!');
      } else {
        // CRIANDO NOVA LICITAÇÃO
        console.log('🚀 [Licitacoes] Criando nova licitação:', dataToInsert);
        
        await insertProposal(dataToInsert);
        
        // Buscar a proposta recém-criada
        const { data: newProposal, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('client', dataToInsert.client)
          .eq('numero_pregao', dataToInsert.numero_pregao)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!error && newProposal) {
          console.log('✅ [Licitacoes] Nova proposta criada:', newProposal.id);
          upsertSingleProposal(newProposal);
        }
        
        alert('✅ Licitação criada com sucesso!');
      }
      
      onDataChange?.();
      
      setShowForm(false);
      setEditingLicitacao(null);
    } catch (error) {
      console.error('❌ Erro ao salvar licitação:', error);
      alert(`❌ Erro ao salvar licitação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleUpdateLicitacao = async (licitacaoId: string, updates: Partial<any>) => {
    try {
      console.log('🔄 [Licitacoes] handleUpdateLicitacao iniciado:', { 
        licitacaoId, 
        updates,
        updateKeys: Object.keys(updates),
        timestamp: new Date().toISOString()
      });
      
      // Converter updates para formato do banco
      const dbUpdates: any = {};
      
      if (updates.situacao) dbUpdates.status = updates.situacao; // SALVAR DIRETO SEM MAPEAMENTO
      if (updates.statusPlanilha) dbUpdates.status_planilha = updates.statusPlanilha;
      if (updates.dataProximaAcao !== undefined) dbUpdates.data_proxima_acao = updates.dataProximaAcao;
      if (updates.dataPregao) dbUpdates.data_pregao = updates.dataPregao;
      if (updates.observacaoProximaAcao !== undefined) dbUpdates.observacao_proxima_acao = updates.observacaoProximaAcao;
      if (updates.proximaAcaoTexto !== undefined) dbUpdates.proxima_acao_texto = updates.proximaAcaoTexto;
      if (updates.posicaoAtual !== undefined) dbUpdates.posicao_atual = updates.posicaoAtual;
      if (updates.months) dbUpdates.months = updates.months;
      if (updates.etapaMaxima) dbUpdates.etapa_maxima = updates.etapaMaxima;
      if (updates.empresa !== undefined) {
        dbUpdates.empresa = updates.empresa;
      }
      
      console.log('💾 [Licitacoes] Executando updateProposal:', {
        licitacaoId,
        dbUpdates
      });
      
      await updateProposal(licitacaoId, dbUpdates);
      
      console.log('✅ [Licitacoes] updateProposal concluído');
      
      // Buscar a proposta atualizada diretamente do banco
      console.log('🔄 [Licitacoes] Buscando proposta atualizada do banco...');
      const { data: updatedProposal, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', licitacaoId)
        .single();
        
      if (!error && updatedProposal) {
        console.log('✅ [Licitacoes] Proposta atualizada recebida:', updatedProposal.id);
        upsertSingleProposal(updatedProposal);
      }
      
      console.log('✅ [Licitacoes] handleUpdateLicitacao concluído');
      onDataChange?.();
      
    } catch (error) {
      console.error('❌ [Licitacoes] handleUpdateLicitacao falhou:', {
        licitacaoId,
        updates,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };

  const handleEditLicitacao = (licitacao: Licitacao) => {
    setEditingLicitacao(licitacao);
    setShowForm(true);
  };

  const handleDeleteLicitacao = async (licitacaoId: string) => {
    const licitacao = propostas.find(l => l.id === licitacaoId);
    const confirmMessage = `⚠️ CONFIRMAR EXCLUSÃO\n\nTem certeza que deseja excluir a licitação:\n"${licitacao?.orgao}"\nPregão: ${licitacao?.numeroPregao}\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR') {
      try {
        await deleteProposal(licitacaoId);
        
        // Remover do estado local
        console.log('🗑️ [Licitacoes] Removendo proposta do estado:', licitacaoId);
        setProposalMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(licitacaoId);
          return newMap;
        });
        
        onDataChange?.();
        
        alert('✅ Licitação excluída com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao excluir licitação:', error);
        alert(`❌ Erro ao excluir licitação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  // Callback para atualizar licitação in-place (evita duplicação)
  const handleLicitacaoUpdated = (updatedProposal: any) => {
    console.log('🔄 [Licitacoes] handleLicitacaoUpdated recebido - substituindo registro existente:', {
      id: updatedProposal.id,
      client: updatedProposal.client,
      status: updatedProposal.status,
      timestamp: new Date().toISOString()
    });
    
    // CRÍTICO: Substituir registro existente sem duplicação
    upsertSingleProposal(updatedProposal);
    
    console.log('✅ [Licitacoes] Proposta substituída no Map. Novo size:', proposalMap.size);
  };

  const handleUpdateProbability = async (licitacaoId: string, scores: ProbabilityScores) => {
    try {
      console.log('🎯 Atualizando probability scores:', { licitacaoId, scores });
      
      // Upsert probability scores
      const { error } = await supabase
        .from('probability_scores')
        .upsert({
          proposal_id: licitacaoId,
          ...scores
        });

      if (error) throw error;
      
      // Buscar proposta atualizada com os novos scores
      const { data: updatedProposal } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', licitacaoId)
        .single();
        
      if (updatedProposal) {
        upsertSingleProposal(updatedProposal);
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar probability scores:', error);
      alert('❌ Erro ao salvar avaliação de probabilidade');
    }
  };

  // Disponibilizar situações para filtro
  const availableSituacoes = STATUS_OPTIONS;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Licitações...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Licitações {selectedYear} - {selectedDepartment}
            </h1>
            <p className="text-gray-600">
              {canEditLicitacoes
                ? `Gerencie suas licitações e pregões do ${selectedDepartment} para ${selectedYear}`
                : 'Visualize as licitações cadastradas (modo somente leitura)'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm font-medium">Calendário</span>
              </button>
            </div>
            {/* Print Button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            {canEditLicitacoes && (
              <button
                onClick={() => setShowForm(true)}
                disabled={insertLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{insertLoading ? 'Criando...' : 'Nova Licitação'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total de Licitações</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.valorTotal)}</p>
                <p className="text-xs text-gray-500">Nosso lance ou valor estimado</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comissão Total Possível</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(statistics.comissaoTotal)}</p>
                <p className="text-xs text-gray-500">0,1% do valor total</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Licitações Ativas</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.licitacoesAtivas}</p>
                <p className="text-xs text-gray-500">Aguardando + Em andamento</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efetividade de Licitações</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.efetividadeLicitacoes.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {statistics.licitacoesComContrato} de {statistics.totalLicitacoes} com contrato assinado
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome do órgão..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as situações</option>
                {availableSituacoes.map(situacao => (
                  <option key={situacao} value={situacao}>
                    {situacao}
                  </option>
                ))}
              </select>
            </div>

            {/* Licitante Filter */}
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={licitanteFilter}
                onChange={(e) => setLicitanteFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os licitantes</option>
                {employees
                  .filter(emp => emp.role === 'Closer')
                  .map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setUseDefaultSort(false); // Desabilitar ordenação padrão
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="data">Data de Inclusão</option>
                <option value="orgao">Nome do Órgão</option>
                <option value="valor">Valor</option>
              </select>
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  setUseDefaultSort(false); // Desabilitar ordenação padrão
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Probability Filter */}
            <button
              onClick={() => setShowWithoutProbability(!showWithoutProbability)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                showWithoutProbability 
                  ? 'bg-orange-50 border-orange-300 text-orange-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showWithoutProbability ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm">Sem avaliação</span>
            </button>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Mostrando {propostasOrdenadas.length} de {propostasDoAno.length} licitações • Ano: {selectedYear} • Estado: {proposalMap.size} no Map
              {useDefaultSort && (
                <span className="text-blue-600 font-medium"> • Ordem padrão por prioridade</span>
              )}
            </div>
            <div className="text-gray-500">
              {propostasOrdenadas.length > 0 && (
                <>
                  {useDefaultSort ? (
                    <span>Ordenação: Em andamento → Aguardando → Contrato assinado → Demais</span>
                  ) : (
                    <span>
                      Ordenado por {sortBy === 'data' ? 'Data' : sortBy === 'orgao' ? 'Órgão' : 'Valor'} • 
                      {sortOrder === 'asc' ? ' Crescente' : ' Decrescente'}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Licitações List or Calendar */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {propostasOrdenadas.length > 0 ? (
              propostasOrdenadas.map((licitacao) => (
                <LicitacaoCard
                  key={licitacao.id}
                  licitacao={licitacao}
                  onUpdated={handleLicitacaoUpdated}
                  onUpdateProbability={canEditLicitacoes ? handleUpdateProbability : undefined}
                  onUpdateLicitacao={canEditLicitacoes ? handleUpdateLicitacao : undefined}
                  onDeleteLicitacao={canEditLicitacoes ? handleDeleteLicitacao : undefined}
                  onEditLicitacao={canEditLicitacoes ? handleEditLicitacao : undefined}
                  readOnly={!canEditLicitacoes}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || showWithoutProbability
                    ? 'Nenhuma licitação encontrada'
                    : 'Nenhuma licitação'
                  }
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || showWithoutProbability
                    ? 'Tente ajustar os filtros de busca'
                    : canEditLicitacoes
                      ? 'Clique em "Nova Licitação" para começar'
                      : 'Não há licitações cadastradas'
                  }
                </p>
                {(searchTerm || statusFilter !== 'all' || showWithoutProbability) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setShowWithoutProbability(false);
                      setUseDefaultSort(true); // Voltar para ordenação padrão
                      setSortBy('data'); // Reset sort options
                      setSortOrder('desc');

                      // Aplicar ordenação padrão imediatamente
                      const reordered = applyDefaultOrder(propostasDoAno);
                    // Note: isso seria mais elegante se tivéssemos um useEffect que reage a useDefaultSort
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}
          </div>
        ) : (
          <CalendarView
            licitacoes={propostasOrdenadas}
            onLicitacaoClick={(licitacao) => {
              // Abrir detalhes da licitação quando clicar no card do calendário
              setSelectedLicitacao(licitacao);
            }}
          />
        )}

        {/* Modal de Detalhes da Licitação (quando clicado no calendário) */}
        {selectedLicitacao && (
          <LicitacaoDetails
            licitacao={selectedLicitacao}
            isOpen={!!selectedLicitacao}
            onClose={() => setSelectedLicitacao(null)}
            onUpdateProbability={canEditLicitacoes ? handleUpdateProbability : undefined}
            onUpdateLicitacao={canEditLicitacoes ? handleUpdateLicitacao : undefined}
            readOnly={!canEditLicitacoes}
          />
        )}

        {/* Modal de Formulário */}
        {showForm && canEditLicitacoes && (
          <LicitacaoForm
            onSubmit={handleSubmitLicitacao}
            onCancel={() => {
              setShowForm(false);
              setEditingLicitacao(null);
            }}
            editingLicitacao={editingLicitacao}
          />
        )}

        {/* Modal de Impressão */}
        {showPrintModal && (
          <PrintModal
            licitacoes={propostasOrdenadas}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};