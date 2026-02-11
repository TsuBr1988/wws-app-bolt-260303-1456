import React, { useState } from 'react';
import { Calendar, Clock, Building, FileText, Edit3, Trash2, Plus, AlertTriangle, MessageCircle, X, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { ObservacoesButton } from './ObservacoesButton';
import { ObservacoesModal } from './ObservacoesModal';
import { Licitacao } from '../../types';
import { formatDateBR, formatTimeBR, formatDateBRLiteral, formatTimeBRLiteral, getDaysUntil, convertISOToLocalDateTimeExact, convertLocalDateTimeToISOExact, formatToLocalDateExact, formatToLocalTimeExact } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProbabilityDisplay, getStatusPlanilhaColor } from '../../utils/licitacaoUtils';
import { STATUS_OPTIONS, getSituacaoColor } from '../../constants/status';
import { ProbabilityModal, ProbabilityScores } from './ProbabilityModal';
import { LicitacaoDetails } from './LicitacaoDetails';
import ColocacaoField from './ColocacaoField';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useDepartment } from '../../contexts/DepartmentContext';
import { supabase } from '../../lib/supabase';

interface LicitacaoCardProps {
  licitacao: Licitacao;
  onUpdateProbability?: (licitacaoId: string, scores: ProbabilityScores) => void;
  onUpdateLicitacao?: (licitacaoId: string, updates: Partial<{
    orgao: string;
    cidade: string | undefined;
    empresa: 'WWS' | 'Worldwide';
    dataProximaAcao: string | undefined;
    dataPregao: string;
    statusPlanilha: string;
    situacao: string;
    etapaMaxima: string;
    months: number;
    proximaAcaoTexto: string | null;
    observacaoProximaAcao: string | null;
  }>) => Promise<void>;
  onUpdated?: (updatedLicitacao: any) => void;
  onDeleteLicitacao?: (licitacaoId: string) => void;
  onEditLicitacao?: (licitacao: Licitacao) => void;
  readOnly?: boolean;
}

const getCloserColor = (closerId: string | undefined, employees: any[]): string => {
  if (!closerId) return 'transparent';

  const closer = employees.find(emp => emp.id === closerId);
  if (!closer) return 'transparent';

  // Nicoly = Rosa, Douglas = Azul-verde
  if (closer.name.toLowerCase().includes('nicoly')) {
    return 'bg-pink-500';
  } else if (closer.name.toLowerCase().includes('douglas')) {
    return 'bg-teal-500';
  }

  return 'transparent';
};

export const LicitacaoCard: React.FC<LicitacaoCardProps> = ({
  licitacao,
  onUpdateProbability,
  onUpdateLicitacao,
  onDeleteLicitacao,
  onEditLicitacao,
  onUpdated,
  readOnly = false
}) => {
  const { selectedDepartment } = useDepartment();
  const { data: employees = [] } = useSupabaseQuery('employees');
  
  const [showProbabilityModal, setShowProbabilityModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showObservacaoModal, setShowObservacaoModal] = useState(false);
  const [editingObservacao, setEditingObservacao] = useState(false);
  const [tempObservacao, setTempObservacao] = useState(licitacao.observacaoProximaAcao || '');
  const [savingObservacao, setSavingObservacao] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingDataPregao, setEditingDataPregao] = useState(false);
  const [tempDataPregao, setTempDataPregao] = useState('');
  const [savingDataPregao, setSavingDataPregao] = useState(false);
  const [localColocacao, setLocalColocacao] = useState(licitacao.colocacaoAtual || '');
  const [showObservacoesModal, setShowObservacoesModal] = useState(false);
  const [editingProximaAcao, setEditingProximaAcao] = useState(false);
  const [tempProximaAcao, setTempProximaAcao] = useState('');
  const [savingProximaAcao, setSavingProximaAcao] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [localEmpresa, setLocalEmpresa] = useState(licitacao.empresa);
  const [localSituacao, setLocalSituacao] = useState(licitacao.situacao);
  const [savingSituacao, setSavingSituacao] = useState(false);
  
  const canEditCard = !readOnly && (onUpdateLicitacao || onUpdateProbability);
  
  // Sincronizar estados locais com props sempre que licitacao mudar
  React.useEffect(() => {
    console.log('🔄 [LicitacaoCard] Sincronizando TODOS os estados locais:', {
      licitacaoId: licitacao.id,
      empresaAnterior: localEmpresa,
      empresaNova: licitacao.empresa,
      colocacaoAnterior: localColocacao,
      colocacaoNova: licitacao.colocacaoAtual || '',
      situacaoAnterior: localSituacao,
      situacaoNova: licitacao.situacao,
      needsEmpresaUpdate: localEmpresa !== licitacao.empresa,
      needsColocacaoUpdate: localColocacao !== (licitacao.colocacaoAtual || '')
    });
    
    // Sempre sincronizar com os valores vindos do banco
    const novaColocacao = licitacao.colocacaoAtual || '';
    const novaEmpresa = licitacao.empresa;
    const novaSituacao = licitacao.situacao;
    
    if (localColocacao !== novaColocacao) {
      console.log('📝 [LicitacaoCard] Atualizando colocação local:', localColocacao, '→', novaColocacao);
      setLocalColocacao(novaColocacao);
    }
    
    if (localEmpresa !== novaEmpresa) {
      console.log('🏢 [LicitacaoCard] Atualizando empresa local:', localEmpresa, '→', novaEmpresa);
      setLocalEmpresa(novaEmpresa);
    }
    
    if (localSituacao !== novaSituacao) {
      console.log('📊 [LicitacaoCard] Atualizando situação local:', localSituacao, '→', novaSituacao);
      setLocalSituacao(novaSituacao);
    }
  }, [licitacao.colocacaoAtual, licitacao.empresa, licitacao.situacao]);
  
  // Atualizar observação separadamente para evitar reset durante edição
  React.useEffect(() => {
    if (!editingObservacao) {
      setTempObservacao(licitacao.observacaoProximaAcao || '');
    }
  }, [licitacao.observacaoProximaAcao, editingObservacao]);
  
  // Inicializar data do pregão quando edição começar
  React.useEffect(() => {
    if (editingDataPregao && licitacao.dataHoraPregao) {
      // Usar conversão exata sem mudança de timezone
      setTempDataPregao(convertISOToLocalDateTimeExact(licitacao.dataHoraPregao));
    } else if (!editingDataPregao) {
      setTempDataPregao('');
    }
  }, [editingDataPregao, licitacao.dataHoraPregao]);
  
  // Inicializar próxima ação quando edição começar
  React.useEffect(() => {
    if (editingProximaAcao && licitacao.dataProximaAcao) {
      setTempProximaAcao(convertISOToLocalDateTimeExact(licitacao.dataProximaAcao));
    } else if (editingProximaAcao && !licitacao.dataProximaAcao) {
      // Para nova próxima ação, usar data/hora atual como padrão
      const agora = new Date();
      const agoraBrasil = new Date(agora.getTime() - 3 * 60 * 60 * 1000); // UTC-3
      const localDateTime = agoraBrasil.toISOString().slice(0, 16);
      setTempProximaAcao(localDateTime);
    } else if (!editingProximaAcao) {
      setTempProximaAcao('');
    }
  }, [editingProximaAcao, licitacao.dataProximaAcao]);

  // Calcular urgência da próxima ação
  const getProximaAcaoUrgency = () => {
    if (!licitacao.dataProximaAcao) return null;
    
    const daysUntil = getDaysUntil(licitacao.dataProximaAcao);
    if (daysUntil < 0) {
      return { message: 'Atrasada', color: 'text-red-600 bg-red-100', icon: <AlertTriangle className="w-4 h-4" /> };
    } else if (daysUntil === 0) {
      return { message: 'Hoje', color: 'text-orange-600 bg-orange-100 animate-pulse', icon: <Clock className="w-4 h-4" /> };
    } else if (daysUntil === 1) {
      return { message: 'Amanhã', color: 'text-yellow-600 bg-yellow-100', icon: <Clock className="w-4 h-4" /> };
    }
    return null;
  };

  const proximaAcaoUrgency = getProximaAcaoUrgency();
  const probabilityDisplay = getProbabilityDisplay(licitacao.probabilityScores);

  const handleStatusPlanilhaUpdate = async (newStatus: string) => {
    if (!onUpdateLicitacao || readOnly) return;
    
    try {
      await onUpdateLicitacao(licitacao.id, { statusPlanilha: newStatus });
    } catch (error) {
      console.error('Erro ao atualizar status da planilha:', error);
      alert('❌ Erro ao atualizar status da planilha');
    }
  };

  // CRÍTICO: Função para atualizar situação com retorno completo do registro
  const handleSituacaoUpdate = async (novoStatus: string) => {
    if (!canEditCard || readOnly) return;

    console.log('🔄 [LicitacaoCard] Atualizando situação diretamente:', {
      licitacaoId: licitacao.id,
      situacaoAtual: licitacao.situacao,
      novaSituacao: novoStatus
    });

    // Atualizar estado local imediatamente para feedback visual
    setLocalSituacao(novoStatus);
    setSavingSituacao(true);

    try {
      // Preparar atualizações
      const updates: any = { status: novoStatus };

      // Se mudando para "Contrato assinado" e não tem closing_date, definir agora
      if (novoStatus === 'Contrato assinado' && !licitacao.closing_date) {
        updates.closing_date = new Date().toISOString();
        console.log('📅 [LicitacaoCard] Definindo closing_date automaticamente:', updates.closing_date);
      }

      // CRÍTICO: Salvar e retornar registro completo
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', licitacao.id)
        .select('*')
        .single();
      
      if (error) {
        console.error('❌ [LicitacaoCard] Erro ao atualizar situação:', error);
        // Reverter estado local em caso de erro
        setLocalSituacao(licitacao.situacao);
        throw error;
      }
      
      console.log('✅ [LicitacaoCard] Situação atualizada com sucesso. Notificando container...');
      
      // CRÍTICO: Notificar componente pai com registro COMPLETO para substituição
      if (onUpdated) {
        onUpdated(data);
        console.log('✅ [LicitacaoCard] Container notificado com sucesso - substituição garantida');
      } else {
        console.warn('⚠️ [LicitacaoCard] onUpdated não disponível - possível duplicação');
      }
      
    } catch (error) {
      console.error('❌ [LicitacaoCard] Falha ao atualizar situação:', error);
      setLocalSituacao(licitacao.situacao); // Reverter
      alert('❌ Erro ao atualizar situação. Tente novamente.');
    } finally {
      setSavingSituacao(false);
    }
  };

  const handleProbabilityUpdate = (scores: ProbabilityScores) => {
    if (onUpdateProbability) {
      onUpdateProbability(licitacao.id, scores);
      setShowProbabilityModal(false);
    }
  };

  const handleColocacaoCommit = async (proposalId: string, value: string) => {
    if (!onUpdateLicitacao || readOnly) return;
    
    console.log('🔄 [LicitacaoCard] handleColocacaoCommit iniciado:', {
      proposalId,
      value,
      timestamp: new Date().toISOString()
    });
    
    try {
      // CRÍTICO: Sempre buscar registro completo após update
      await onUpdateLicitacao(proposalId, { posicaoAtual: value.trim() || undefined });
      
      // Buscar registro atualizado e notificar container
      const { data: updatedProposal, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();
        
      if (!error && updatedProposal && onUpdated) {
        console.log('✅ [LicitacaoCard] Colocação salva, notificando container...');
        onUpdated(updatedProposal);
      }
      
      console.log('✅ [LicitacaoCard] handleColocacaoCommit concluído com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar colocação atual:', error);
      console.error('🚫 [LicitacaoCard] handleColocacaoCommit falhou:', {
        proposalId,
        value,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error; // ColocacaoField vai lidar com o erro
    }
  };

  const handleObservacaoSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    setSavingObservacao(true);
    
    try {
      console.log('🔄 Salvando observação da próxima ação:', {
        licitacaoId: licitacao.id,
        observacaoAtual: licitacao.observacaoProximaAcao,
        novaObservacao: tempObservacao.trim()
      });
      
      const observacaoParaSalvar = tempObservacao.trim() || null;
      await onUpdateLicitacao(licitacao.id, { observacaoProximaAcao: observacaoParaSalvar });
      
      // Buscar registro atualizado
      const { data: updatedProposal } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', licitacao.id)
        .single();
        
      if (updatedProposal && onUpdated) {
        onUpdated(updatedProposal);
      }
      
      console.log('✅ Observação salva com sucesso');
      setEditingObservacao(false);
    } catch (error) {
      console.error('Erro ao atualizar observação da próxima ação:', error);
      alert('❌ Erro ao atualizar observação');
      setTempObservacao(licitacao.observacaoProximaAcao || ''); // Reset on error
    } finally {
      setSavingObservacao(false);
    }
  };

  const handleObservacaoBlur = () => {
    if (tempObservacao.trim() !== (licitacao.observacaoProximaAcao || '')) {
      handleObservacaoSave();
    } else {
      setEditingObservacao(false);
    }
  };

  const handleDataPregaoSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    setSavingDataPregao(true);
    
    try {
      console.log('🔄 Salvando data do pregão:', {
        licitacaoId: licitacao.id,
        dataAtual: licitacao.dataHoraPregao,
        novaData: tempDataPregao
      });
      
      // CORRIGIDO: Converter mantendo horário exato
      const novaDataISO = tempDataPregao ? convertLocalDateTimeToISOExact(tempDataPregao) : licitacao.dataHoraPregao;
      
      await onUpdateLicitacao(licitacao.id, { dataPregao: novaDataISO });
      
      // Buscar registro atualizado
      const { data: updatedProposal } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', licitacao.id)
        .single();
        
      if (updatedProposal && onUpdated) {
        onUpdated(updatedProposal);
      }
      
      console.log('✅ Data do pregão salva com sucesso');
      alert('✅ Data do pregão atualizada com sucesso!');
      setEditingDataPregao(false);
    } catch (error) {
      console.error('Erro ao atualizar data do pregão:', error);
      alert('❌ Erro ao atualizar data do pregão');
      setTempDataPregao(''); // Reset on error
    } finally {
      setSavingDataPregao(false);
    }
  };

  const handleDataPregaoCancel = () => {
    setTempDataPregao('');
    setEditingDataPregao(false);
  };
  
  const handleProximaAcaoSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    setSavingProximaAcao(true);
    
    try {
      console.log('🔄 Salvando próxima ação do card:', {
        licitacaoId: licitacao.id,
        dataAtual: licitacao.dataProximaAcao,
        novaData: tempProximaAcao
      });
      
      // Converter para ISO mantendo horário exato
      const novaDataISO = tempProximaAcao ? convertLocalDateTimeToISOExact(tempProximaAcao) : undefined;
      
      await onUpdateLicitacao(licitacao.id, { dataProximaAcao: novaDataISO });
      
     // Buscar registro atualizado
     const { data: updatedProposal } = await supabase
       .from('proposals')
       .select('*')
       .eq('id', licitacao.id)
       .single();
       
     if (updatedProposal && onUpdated) {
       onUpdated(updatedProposal);
     }
     
      console.log('✅ Próxima ação salva com sucesso no card');
      setEditingProximaAcao(false);
    } catch (error) {
      console.error('Erro ao atualizar próxima ação:', error);
      alert('❌ Erro ao atualizar próxima ação');
      setTempProximaAcao(''); // Reset on error
    } finally {
      setSavingProximaAcao(false);
    }
  };

  const handleProximaAcaoCancel = () => {
    setTempProximaAcao('');
    setEditingProximaAcao(false);
  };

  const handleProximaAcaoDelete = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    if (confirm('⚠️ Tem certeza que deseja remover a data da próxima ação?')) {
      setSavingProximaAcao(true);
      
      try {
        console.log('🗑️ Removendo próxima ação:', licitacao.id);
        await onUpdateLicitacao(licitacao.id, { dataProximaAcao: undefined });
        
        // Buscar registro atualizado
        const { data: updatedProposal } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', licitacao.id)
          .single();
          
        if (updatedProposal && onUpdated) {
          onUpdated(updatedProposal);
        }
        
        console.log('✅ Próxima ação removida com sucesso');
        setEditingProximaAcao(false);
      } catch (error) {
        console.error('Erro ao remover próxima ação:', error);
        alert('❌ Erro ao remover próxima ação');
      } finally {
        setSavingProximaAcao(false);
      }
    }
  };
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };
  const licitante = employees.find(emp => emp.id === licitacao.licitanteId);
  const adl = licitacao.adlId ? employees.find(emp => emp.id === licitacao.adlId) : null;
  const promotor = licitacao.promotorId ? employees.find(emp => emp.id === licitacao.promotorId) : null;
  const orcamentista = licitacao.orcamentistaId ? employees.find(emp => emp.id === licitacao.orcamentistaId) : null;

  const closerColorClass = getCloserColor(licitacao.licitanteId, employees);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
        {/* Faixa do Closer */}
        {closerColorClass !== 'transparent' && (
          <div className={`h-1 ${closerColorClass}`} />
        )}

        <div className="p-4">
          {/* Layout Tabular - 8 Colunas Uniformes */}
          <div className="mb-4">
          {/* Layout Mobile - 3 Linhas */}
          <div className="md:hidden space-y-3">
            {/* Linha 1: Situação, Cliente, Pregão Número */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Situação</span>
                {canEditCard ? (
                  <select
                    value={localSituacao}
                    onChange={(e) => handleSituacaoUpdate(e.target.value)}
                    disabled={savingSituacao}
                    className={`w-full px-1 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getSituacaoColor(localSituacao)}`}
                  >
                    {STATUS_OPTIONS.map(situacao => (
                      <option key={situacao} value={situacao}>
                        {situacao}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getSituacaoColor(localSituacao)}`}>
                    {localSituacao}
                  </span>
                )}
              </div>

              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Cliente</span>
                <p className="font-semibold text-blue-800 text-xs leading-tight break-words" title={licitacao.orgao}>
                  {licitacao.orgao}
                </p>
              </div>

              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Pregão Nº</span>
                <p className="font-medium text-gray-900 text-xs truncate" title={licitacao.numeroPregao}>
                  {licitacao.numeroPregao}
                </p>
              </div>
            </div>

            {/* Linha 2: Data do Pregão, Próxima Ação */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Data do Pregão</span>
                {editingDataPregao && canEditCard ? (
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={tempDataPregao}
                      onChange={(e) => setTempDataPregao(e.target.value)}
                      className="w-full text-xs p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={savingDataPregao}
                    />
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <button
                        onClick={handleDataPregaoSave}
                        disabled={savingDataPregao}
                        className="p-1 text-green-600 hover:text-green-800 rounded"
                        title="Salvar"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleDataPregaoCancel}
                        disabled={savingDataPregao}
                        className="p-1 text-red-600 hover:text-red-800 rounded"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`text-xs text-gray-900 ${canEditCard ? 'cursor-pointer hover:bg-blue-50 rounded p-1' : ''}`}
                    onClick={() => canEditCard && setEditingDataPregao(true)}
                    title={canEditCard ? 'Clique para editar' : undefined}
                  >
                    <div className="text-xs">{formatToLocalDateExact(licitacao.dataHoraPregao)}</div>
                    <div className="text-xs text-red-600">{formatToLocalTimeExact(licitacao.dataHoraPregao)}</div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Próxima Ação</span>
                {editingProximaAcao && canEditCard ? (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 space-y-2">
                    <input
                      type="datetime-local"
                      value={tempProximaAcao}
                      onChange={(e) => setTempProximaAcao(e.target.value)}
                      className="w-full text-xs p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={savingProximaAcao}
                    />
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={handleProximaAcaoSave}
                        disabled={savingProximaAcao}
                        className="p-1 text-green-600 hover:text-green-800 rounded disabled:opacity-50"
                        title="Salvar"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleProximaAcaoCancel}
                        disabled={savingProximaAcao}
                        className="p-1 text-red-600 hover:text-red-800 rounded disabled:opacity-50"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {licitacao.dataProximaAcao && (
                        <button
                          onClick={handleProximaAcaoDelete}
                          disabled={savingProximaAcao}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded disabled:opacity-50"
                          title="Remover próxima ação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {savingProximaAcao && (
                      <div className="text-xs text-blue-600 text-center">Salvando...</div>
                    )}
                  </div>
                ) : (
                  <div 
                    className={`${canEditCard ? 'cursor-pointer hover:bg-blue-50 rounded p-1' : ''} transition-colors`}
                    onClick={() => canEditCard && setEditingProximaAcao(true)}
                    title={canEditCard ? 'Clique para editar próxima ação' : undefined}
                  >
                    {licitacao.dataProximaAcao ? (
                      <div>
                        <div className="text-xs">{formatToLocalDateExact(licitacao.dataProximaAcao)}</div>
                        <div className="text-xs text-red-600">{formatToLocalTimeExact(licitacao.dataProximaAcao)}</div>
                        {(() => {
                          const diasRestantes = getDaysUntil(licitacao.dataProximaAcao);
                          if (diasRestantes <= 3) {
                            return (
                              <div className={`text-xs px-1 py-0.5 rounded font-medium ${
                                diasRestantes < 0 ? 'bg-red-100 text-red-800' :
                                diasRestantes === 0 ? 'bg-orange-100 text-orange-800 animate-pulse' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {diasRestantes < 0 ? 'Atrasado' :
                                 diasRestantes === 0 ? 'Hoje' :
                                 'Amanhã'}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <div className={`text-xs italic ${canEditCard ? 'text-blue-500' : 'text-gray-400'}`}>
                        {canEditCard ? 'Clique para definir' : 'Não definida'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Linha 3: Nosso Lance, Colocação, Planilha */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Nosso Lance</span>
                <div className="bg-purple-50 border border-purple-200 rounded p-2">
                  <p className="text-purple-700 font-bold text-xs">
                    {licitacao.nossoLance ? formatCurrency(licitacao.nossoLance) : 'Não informado'}
                  </p>
                  {licitacao.nossoLance && licitacao.months && (
                    <p className="text-xs text-purple-600">
                      {formatCurrency(licitacao.nossoLance / licitacao.months)}/mês
                    </p>
                  )}
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Colocação</span>
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <ColocacaoField
                    proposalId={licitacao.id}
                    value={localColocacao}
                    onLocalChange={setLocalColocacao}
                    onCommit={handleColocacaoCommit}
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Planilha</span>
                {canEditCard ? (
                  <select
                    value={licitacao.statusPlanilha}
                    onChange={(e) => handleStatusPlanilhaUpdate(e.target.value)}
                    className={`w-full px-2 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-green-500 ${getStatusPlanilhaColor(licitacao.statusPlanilha)}`}
                  >
                    <option value="Planilha a fazer">A fazer</option>
                    <option value="Planilha feita">Feita</option>
                  </select>
                ) : (
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getStatusPlanilhaColor(licitacao.statusPlanilha)}`}>
                    {licitacao.statusPlanilha === 'Planilha a fazer' ? 'A fazer' : 'Feita'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Layout Desktop - 9 Colunas */}
          <div className="hidden md:grid grid-cols-9 gap-3 items-center">
          {/* Coluna 1: Situação */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Situação</span>
            {canEditCard ? (
              <select
                value={localSituacao}
                onChange={(e) => handleSituacaoUpdate(e.target.value)}
                disabled={savingSituacao}
                className={`w-full px-1 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getSituacaoColor(localSituacao)}`}
              >
                {STATUS_OPTIONS.map(situacao => (
                  <option key={situacao} value={situacao}>
                    {situacao}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getSituacaoColor(localSituacao)}`}>
                {localSituacao}
              </span>
            )}
          </div>

          {/* Coluna 2: Cliente */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Cliente</span>
            <p className="font-semibold text-blue-800 text-sm leading-tight break-words" title={licitacao.orgao}>
              {licitacao.orgao}
            </p>
          </div>

          {/* Coluna 3: Pregão Nº */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Pregão Nº</span>
            <p className="font-medium text-gray-900 text-sm truncate" title={licitacao.numeroPregao}>
              {licitacao.numeroPregao}
            </p>
          </div>

          {/* Coluna 4: Data do Pregão */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Data do Pregão</span>
            {editingDataPregao && canEditCard ? (
              <div className="relative">
                <input
                  type="datetime-local"
                  value={tempDataPregao}
                  onChange={(e) => setTempDataPregao(e.target.value)}
                  className="w-full text-xs p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={savingDataPregao}
                />
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <button
                    onClick={handleDataPregaoSave}
                    disabled={savingDataPregao}
                    className="p-1 text-green-600 hover:text-green-800 rounded"
                    title="Salvar"
                  >
                    <Save className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleDataPregaoCancel}
                    disabled={savingDataPregao}
                    className="p-1 text-red-600 hover:text-red-800 rounded"
                    title="Cancelar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={`text-sm text-gray-900 ${canEditCard ? 'cursor-pointer hover:bg-blue-50 rounded p-1' : ''}`}
                onClick={() => canEditCard && setEditingDataPregao(true)}
                title={canEditCard ? 'Clique para editar' : undefined}
              >
                <div className="text-xs">{formatToLocalDateExact(licitacao.dataHoraPregao)}</div>
                <div className="text-xs text-red-600">{formatToLocalTimeExact(licitacao.dataHoraPregao)}</div>
              </div>
            )}
          </div>

          {/* Coluna 5: Próxima Ação */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Próxima Ação</span>
            {editingProximaAcao && canEditCard ? (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 space-y-2">
                <input
                  type="datetime-local"
                  value={tempProximaAcao}
                  onChange={(e) => setTempProximaAcao(e.target.value)}
                  className="w-full text-xs p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={savingProximaAcao}
                />
                <div className="flex items-center justify-center space-x-1">
                  <button
                    onClick={handleProximaAcaoSave}
                    disabled={savingProximaAcao}
                    className="p-1 text-green-600 hover:text-green-800 rounded disabled:opacity-50"
                    title="Salvar"
                  >
                    <Save className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleProximaAcaoCancel}
                    disabled={savingProximaAcao}
                    className="p-1 text-red-600 hover:text-red-800 rounded disabled:opacity-50"
                    title="Cancelar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {licitacao.dataProximaAcao && (
                    <button
                      onClick={handleProximaAcaoDelete}
                      disabled={savingProximaAcao}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded disabled:opacity-50"
                      title="Remover próxima ação"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {savingProximaAcao && (
                  <div className="text-xs text-blue-600 text-center">Salvando...</div>
                )}
              </div>
            ) : (
              <div 
                className={`${canEditCard ? 'cursor-pointer hover:bg-blue-50 rounded p-1' : ''} transition-colors`}
                onClick={() => canEditCard && setEditingProximaAcao(true)}
                title={canEditCard ? 'Clique para editar próxima ação' : undefined}
              >
                {licitacao.dataProximaAcao ? (
                  <div>
                    <div className="text-xs">{formatToLocalDateExact(licitacao.dataProximaAcao)}</div>
                    <div className="text-xs text-red-600">{formatToLocalTimeExact(licitacao.dataProximaAcao)}</div>
                    {(() => {
                      const diasRestantes = getDaysUntil(licitacao.dataProximaAcao);
                      if (diasRestantes <= 3 && (licitacao.situacao === 'Aguardando' || licitacao.situacao === 'Em andamento')) {
                        return (
                          <div className={`text-xs px-1 py-0.5 rounded font-medium ${
                            diasRestantes < 0 ? 'bg-red-100 text-red-800' :
                            diasRestantes === 0 ? 'bg-orange-100 text-orange-800 animate-pulse' :
                           diasRestantes === 1 ? 'bg-yellow-100 text-yellow-800' :
                           diasRestantes === 1 ? 'bg-yellow-100 text-yellow-800' :
                           'bg-blue-100 text-blue-800'
                          }`}>
                            {diasRestantes < 0 ? 'Atrasado' :
                             diasRestantes === 0 ? 'Hoje' :
                             diasRestantes === 1 ? 'Amanhã' :
                             `${diasRestantes} dias`}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <div className={`text-xs italic ${canEditCard ? 'text-blue-500' : 'text-gray-400'}`}>
                    {canEditCard ? 'Clique para definir' : 'Não definida'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coluna 6: Observações */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Observações</span>
            <div className="flex justify-center">
              <ObservacoesButton
                proposalId={licitacao.id}
                onClick={() => setShowObservacoesModal(true)}
              />
            </div>
          </div>

          {/* Coluna 7: Nosso Lance */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Nosso Lance</span>
            <div className="bg-purple-50 border border-purple-200 rounded p-2">
              <p className="text-purple-700 font-bold text-sm">
                {licitacao.nossoLance ? formatCurrency(licitacao.nossoLance) : 'Não informado'}
              </p>
              {licitacao.nossoLance && licitacao.months && (
                <p className="text-xs text-purple-600">
                  {formatCurrency(licitacao.nossoLance / licitacao.months)}/mês
                </p>
              )}
            </div>
          </div>

          {/* Coluna 8: Colocação */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Colocação</span>
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <ColocacaoField
                proposalId={licitacao.id}
                value={localColocacao}
                onLocalChange={setLocalColocacao}
                onCommit={handleColocacaoCommit}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Coluna 9: Planilha */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block mb-1">Planilha</span>
            {canEditCard ? (
              <select
                value={licitacao.statusPlanilha}
                onChange={(e) => handleStatusPlanilhaUpdate(e.target.value)}
                className={`w-full px-2 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-green-500 ${getStatusPlanilhaColor(licitacao.statusPlanilha)}`}
              >
                <option value="Planilha a fazer">A fazer</option>
                <option value="Planilha feita">Feita</option>
              </select>
            ) : (
              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getStatusPlanilhaColor(licitacao.statusPlanilha)}`}>
                {licitacao.statusPlanilha === 'Planilha a fazer' ? 'A fazer' : 'Feita'}
              </span>
            )}
          </div>
          </div>
        </div>

        {/* Segunda linha: Botão Ver Detalhes alinhado à direita */}
        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={expanded ? 'Contrair' : 'Expandir detalhes'}
          >
            <span className="text-sm text-gray-700 font-medium">Ver Detalhes</span>
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Conteúdo Expandido - Todas as outras informações */}
        {expanded && (
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-6">
            {/* Linha única com todas as informações */}
            <div className="grid grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
              {/* Probabilidade */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Probabilidade</span>
                {canEditCard && onUpdateProbability ? (
                  <button
                    onClick={() => setShowProbabilityModal(true)}
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border hover:opacity-80 transition-opacity ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current`}
                  >
                    {probabilityDisplay.level}
                  </button>
                ) : (
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current`}>
                    {probabilityDisplay.level}
                  </span>
                )}
              </div>

              {/* Planilha */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Planilha</span>
                {canEditCard ? (
                  <select
                    value={licitacao.statusPlanilha}
                    onChange={(e) => handleStatusPlanilhaUpdate(e.target.value)}
                    className={`w-auto px-2 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-green-500 ${getStatusPlanilhaColor(licitacao.statusPlanilha)}`}
                  >
                    <option value="Planilha a fazer">A fazer</option>
                    <option value="Planilha feita">Feita</option>
                  </select>
                ) : (
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusPlanilhaColor(licitacao.statusPlanilha)}`}>
                    {licitacao.statusPlanilha === 'Planilha a fazer' ? 'A fazer' : 'Feita'}
                  </span>
                )}
              </div>

              {/* Valor Estimado */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Valor Estimado</span>
                <p className="text-blue-600 text-xs font-medium">
                  {licitacao.valorEstimado ? formatCurrency(licitacao.valorEstimado) : 'Não informado'}
                </p>
              </div>

              {/* Valor Mensal */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Valor Mensal</span>
                <p className="text-blue-600 text-xs font-medium">
                  {licitacao.valorEstimado && licitacao.months ? 
                    formatCurrency(licitacao.valorEstimado / licitacao.months) : 
                    'Não informado'
                  }
                </p>
                {licitacao.months && (
                  <p className="text-xs text-gray-500">{licitacao.months} meses</p>
                )}
              </div>

              {/* Lance Vencedor */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Lance Vencedor</span>
                <p className="text-green-600 text-xs font-medium">
                  {licitacao.lanceVencedor ? formatCurrency(licitacao.lanceVencedor) : 'Não informado'}
                </p>
                {licitacao.empresaVencedora && (
                  <p className="text-xs text-gray-500 truncate">{licitacao.empresaVencedora}</p>
                )}
              </div>

              {/* Plataforma */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Plataforma</span>
                <p className="text-gray-700 text-xs font-medium">{licitacao.plataforma}</p>
              </div>

              {/* Empresa */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Empresa</span>
                {canEditCard ? (
                  <div className="relative">
                  <select
                      value={localEmpresa}
                      onChange={async (e) => {
                        if (!onUpdateLicitacao) return;
                        
                        const novaEmpresa = e.target.value as 'WWS' | 'Worldwide';
                        
                        // Atualizar estado local imediatamente para feedback visual
                        console.log('🏢 [LicitacaoCard] Mudança de empresa iniciada:', {
                          licitacaoId: licitacao.id,
                          empresaAtual: licitacao.empresa,
                          empresaLocal: localEmpresa,
                          novaEmpresa: novaEmpresa
                        });
                        
                        setLocalEmpresa(novaEmpresa);
                        setSavingEmpresa(true);
                        
                        try {
                          console.log('💾 [LicitacaoCard] Salvando empresa no Supabase...');
                          
                          await onUpdateLicitacao(licitacao.id, { empresa: novaEmpresa });
                          
                          console.log('✅ [LicitacaoCard] Empresa salva no Supabase com sucesso');
                          console.log('🔄 [LicitacaoCard] Aguardando refetch automático...');
                          
                        } catch (error) {
                          console.error('❌ [LicitacaoCard] Erro ao atualizar empresa:', error);
                          // Reverter estado local em caso de erro
                          console.log('🔄 [LicitacaoCard] Revertendo empresa local para:', licitacao.empresa);
                          setLocalEmpresa(licitacao.empresa);
                          alert('❌ Erro ao atualizar empresa. Tente novamente.');
                        } finally {
                          console.log('🏁 [LicitacaoCard] Finalizando update da empresa');
                          setSavingEmpresa(false);
                        }
                      }}
                      className="w-full px-2 py-1 rounded text-xs font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                      disabled={savingEmpresa}
                  >
                    <option value="WWS">WWS</option>
                    <option value="Worldwide">Worldwide</option>
                  </select>
                    {savingEmpresa && (
                      <div className="absolute -bottom-4 left-0 text-xs text-blue-600 bg-white px-1 rounded shadow-sm">
                        Salvando...
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-700 text-xs font-medium">{localEmpresa}</p>
                )}
              </div>

              {/* Etapa Máxima */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Etapa Máxima</span>
                <p className="text-gray-700 text-xs font-medium">{licitacao.etapaMaxima}</p>
              </div>
            </div>
            
            {/* Equipe Responsável */}
            {(licitante || adl || promotor || orcamentista) && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center flex-wrap gap-4 text-sm">
                  {licitante && (
                    <div className="flex items-center space-x-2">
                      <img src={licitante.avatar} alt={licitante.name} className="w-6 h-6 rounded-full" />
                      <span className="text-blue-600 font-medium">{licitante.name}</span>
                      <span className="text-gray-500">(Licitante)</span>
                    </div>
                  )}
                  {orcamentista && (
                    <div className="flex items-center space-x-2">
                      <img src={orcamentista.avatar} alt={orcamentista.name} className="w-6 h-6 rounded-full" />
                      <span className="text-purple-600 font-medium">{orcamentista.name}</span>
                      <span className="text-gray-500">(Orçamentista)</span>
                    </div>
                  )}
                  {adl && (
                    <div className="flex items-center space-x-2">
                      <img src={adl.avatar} alt={adl.name} className="w-6 h-6 rounded-full" />
                      <span className="text-green-600 font-medium">{adl.name}</span>
                      <span className="text-gray-500">(ADL)</span>
                    </div>
                  )}
                  {promotor && (
                    <div className="flex items-center space-x-2">
                      <img src={promotor.avatar} alt={promotor.name} className="w-6 h-6 rounded-full" />
                      <span className="text-red-600 font-medium">{promotor.name}</span>
                      <span className="text-red-500">(Promotor - Closer: 0,01% / Orçamentista: 0,005%)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Ações - Apenas quando expandido */}
            {canEditCard && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {onEditLicitacao && (
                  <button
                    onClick={() => onEditLicitacao(licitacao)}
                    className="text-blue-500 hover:underline text-sm flex items-center space-x-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                )}
                {onDeleteLicitacao && (
                  <button
                    onClick={() => onDeleteLicitacao(licitacao.id)}
                    className="text-red-500 hover:underline text-sm flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-gray-500 hover:underline text-sm"
                >
                  Ver detalhes
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Modal de Probabilidade */}
      {!readOnly && onUpdateProbability && (
        <ProbabilityModal
          isOpen={showProbabilityModal}
          onClose={() => setShowProbabilityModal(false)}
          onSave={handleProbabilityUpdate}
          currentScores={licitacao.probabilityScores}
          orgaoName={licitacao.orgao}
        />
      )}

      {/* Modal de Observações Completas */}
      {showObservacaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Observações da Próxima Ação</h2>
                  <p className="text-sm text-gray-600">{licitacao.orgao}</p>
                </div>
              </div>
              <button
                onClick={() => setShowObservacaoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 whitespace-pre-line leading-relaxed">
                  {licitacao.observacaoProximaAcao}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <LicitacaoDetails
        licitacao={licitacao}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onUpdateProbability={onUpdateProbability}
        onUpdateLicitacao={onUpdateLicitacao}
        readOnly={readOnly}
      />
      
      {/* Modal de Observações */}
      <ObservacoesModal
        proposalId={licitacao.id}
        orgaoName={licitacao.orgao}
        open={showObservacoesModal}
        onClose={() => setShowObservacoesModal(false)}
        onSaved={() => {
          // Opcional: forçar refresh do card se necessário
        }}
      />
    </>
  );
};