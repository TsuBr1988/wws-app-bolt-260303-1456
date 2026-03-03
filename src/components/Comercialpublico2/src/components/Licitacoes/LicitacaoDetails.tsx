import React, { useState } from 'react';
import { X, Calendar, Clock, Building, FileText, Edit3, Save } from 'lucide-react';
import { Licitacao } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { ProbabilityModal, ProbabilityScores } from './ProbabilityModal';
import { getProbabilityDisplay } from '../../utils/licitacaoUtils';
import { formatDateBR, formatTimeBR, formatDateBRLiteral, formatTimeBRLiteral, formatDateTimeBR, convertISOToLocalDateTimeExact, formatToLocalDateExact, formatToLocalTimeExact } from '../../utils/dateUtils';
import { useDepartment } from '../../contexts/DepartmentContext';

interface LicitacaoDetailsProps {
  licitacao: Licitacao;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProbability?: (scores: ProbabilityScores) => void;
  onUpdateLicitacao?: (licitacaoId: string, updates: Partial<{ orgao: string; cidade: string | undefined; dataProximaAcao: string | undefined; dataPregao: string; statusPlanilha: string; situacao: string; etapaMaxima: string; months: number; proximaAcaoTexto: string | null; observacaoProximaAcao: string | null }>) => Promise<void>;
  readOnly?: boolean;
}

export const LicitacaoDetails: React.FC<LicitacaoDetailsProps> = ({
  licitacao,
  isOpen,
  onClose,
  onUpdateProbability,
  onUpdateLicitacao,
  readOnly = false
}) => {
  if (!isOpen) return null;

  const { data: employees = [] } = useSupabaseQuery('employees');
  const { selectedDepartment } = useDepartment();
  const [showProbabilityModal, setShowProbabilityModal] = useState(false);
  const [editingProximaAcao, setEditingProximaAcao] = useState(false);
  const [tempProximaAcaoDateTime, setTempProximaAcaoDateTime] = useState('');
  const [editingDataPregao, setEditingDataPregao] = useState(false);
  const [tempDataPregaoDateTime, setTempDataPregaoDateTime] = useState('');
  const [editingMeses, setEditingMeses] = useState(false);
  const [tempMeses, setTempMeses] = useState(licitacao.months);
  const [editingPosicaoAtual, setEditingPosicaoAtual] = useState(false);
  const [tempPosicaoAtual, setTempPosicaoAtual] = useState(licitacao.posicaoAtual || '');
  const [editingProximaAcaoTexto, setEditingProximaAcaoTexto] = useState(false);
  const [tempProximaAcaoTexto, setTempProximaAcaoTexto] = useState(licitacao.proximaAcaoTexto || '');
  const [expandedProximaAcaoTexto, setExpandedProximaAcaoTexto] = useState(false);

  // Inicializar valor do datetime quando modal abre
  React.useEffect(() => {
    if (isOpen && licitacao.dataProximaAcao) {
      // Converter ISO para datetime-local no fuso horário de São Paulo
      setTempProximaAcaoDateTime(convertISOToLocalDateTimeExact(licitacao.dataProximaAcao));
    } else if (isOpen) {
      setTempProximaAcaoDateTime('');
    }
    
    if (isOpen && licitacao.dataHoraPregao) {
      // Converter ISO para datetime-local no fuso horário de São Paulo
      setTempDataPregaoDateTime(convertISOToLocalDateTimeExact(licitacao.dataHoraPregao));
    } else if (isOpen) {
      setTempDataPregaoDateTime('');
    }
    
    if (isOpen) {
      setTempMeses(licitacao.months);
    }
    
    if (isOpen) {
      setTempPosicaoAtual(licitacao.posicaoAtual || '');
    }
    
    if (isOpen) {
      setTempProximaAcaoTexto(licitacao.proximaAcaoTexto || '');
    }
  }, [isOpen, licitacao.dataProximaAcao]);

  const handleProximaAcaoSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    try {
      // CORRIGIDO: Converter mantendo horário exato
      const newDateTime = tempProximaAcaoDateTime ? convertLocalDateTimeToISOExact(tempProximaAcaoDateTime) : undefined;
      
      console.log('🔄 Salvando data/hora da próxima ação:', {
        licitacaoId: licitacao.id,
        novoDateTime: newDateTime
      });
      
      await onUpdateLicitacao(licitacao.id, { dataProximaAcao: newDateTime });
      console.log('✅ Data/hora da próxima ação salva com sucesso no modal');
      
      setEditingProximaAcao(false);
    } catch (error) {
      console.error('❌ Erro ao salvar data/hora:', error);
      alert('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const handleDataPregaoSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    try {
      // Converter datetime-local para ISO string mantendo valores exatos
      const newDateTime = tempDataPregaoDateTime ? new Date(tempDataPregaoDateTime).toISOString() : licitacao.dataHoraPregao;
      
      console.log('🔄 Salvando data/hora do pregão no modal:', {
        licitacaoId: licitacao.id,
        novoDateTime: newDateTime,
        tempValue: tempDataPregaoDateTime
      });
      
      await onUpdateLicitacao(licitacao.id, { dataPregao: newDateTime });
      console.log('✅ Data/hora do pregão salva com sucesso no modal');
      
      setEditingDataPregao(false);
    } catch (error) {
      console.error('❌ Erro ao salvar data/hora do pregão:', error);
      alert('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const handleMesesSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    try {
      console.log('🔄 Salvando meses do contrato:', {
        licitacaoId: licitacao.id,
        novosMeses: tempMeses
      });
      
      await onUpdateLicitacao(licitacao.id, { months: tempMeses });
      console.log('✅ Meses do contrato salvos com sucesso no modal');
      
      setEditingMeses(false);
    } catch (error) {
      console.error('❌ Erro ao salvar meses do contrato:', error);
      alert('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const handlePosicaoAtualSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    try {
      console.log('🔄 Salvando posição atual no modal:', {
        licitacaoId: licitacao.id,
        novaPosicao: tempPosicaoAtual
      });
      
      await onUpdateLicitacao(licitacao.id, { posicaoAtual: tempPosicaoAtual || null });
      console.log('✅ Posição atual salva com sucesso no modal');
      
      setEditingPosicaoAtual(false);
    } catch (error) {
      console.error('❌ Erro ao salvar posição atual no modal:', error);
      alert('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const handleProximaAcaoTextoSave = async () => {
    if (!onUpdateLicitacao || readOnly) return;
    
    try {
      console.log('🔄 Salvando texto da próxima ação no modal:', {
        licitacaoId: licitacao.id,
        novoTexto: tempProximaAcaoTexto
      });
      
      await onUpdateLicitacao(licitacao.id, { proximaAcaoTexto: tempProximaAcaoTexto || null });
      console.log('✅ Texto da próxima ação salvo com sucesso no modal');
      
      setEditingProximaAcaoTexto(false);
    } catch (error) {
      console.error('❌ Erro ao salvar texto da próxima ação no modal:', error);
      alert('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const needsTruncation = (text: string, maxLength: number = 100) => {
    return text && text.length > maxLength;
  };

  const licitante = employees.find(emp => emp.id === licitacao.licitanteId);
  const adl = licitacao.adlId ? employees.find(emp => emp.id === licitacao.adlId) : null;
  const promotor = licitacao.promotorId ? employees.find(emp => emp.id === licitacao.promotorId) : null;
  const orcamentista = licitacao.orcamentistaId ? employees.find(emp => emp.id === licitacao.orcamentistaId) : null;

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'Contrato assinado': return 'bg-green-100 text-green-800 border-green-200';
      case 'Em andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Aguardando': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Encerrado': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Perdido':
      case 'Desclassificado':
      case 'Inabilitado':
      case 'Fracassado':
      case 'Revogado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProbabilityDisplayLocal = (probabilityScores?: ProbabilityScores) => {
    if (!probabilityScores) {
      return { level: 'Não avaliada', bgColor: 'bg-gray-100', color: 'text-gray-800' };
    }
    return getProbabilityDisplay(probabilityScores);
  };
  
  const probabilityDisplay = getProbabilityDisplayLocal(licitacao.probabilityScores);

  const handleProbabilityUpdate = (scores: ProbabilityScores) => {
    onUpdateProbability?.(scores);
    setTimeout(() => {
      setShowProbabilityModal(false);
    }, 500);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value?: number) => {
    if (value == null) return '-';
    if (!Number.isFinite(value)) return '-';
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{licitacao.orgao}</h2>
              <p className="text-gray-600">Pregão Nº {licitacao.numeroPregao}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status e Info Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Situação</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getSituacaoColor(licitacao.situacao)}`}>
                      {licitacao.situacao}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Probabilidade</label>
                  <div className="mt-1">
                    {!readOnly && onUpdateProbability ? (
                      <button
                        onClick={() => setShowProbabilityModal(true)}
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border hover:opacity-80 transition-opacity ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current`}
                      >
                        {probabilityDisplay.level}
                      </button>
                    ) : (
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current`}>
                        {probabilityDisplay.level}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Etapa Máxima</label>
                  <div className="mt-1 text-gray-900">{licitacao.etapaMaxima}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Inclusão</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {formatDateBR(licitacao.dataInclusao)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Data do Pregão</label>
                  {editingDataPregao && !readOnly ? (
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="datetime-local"
                        value={tempDataPregaoDateTime}
                        onChange={(e) => setTempDataPregaoDateTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleDataPregaoSave}
                        className="p-2 text-green-600 hover:text-green-800"
                        title="Salvar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingDataPregao(false)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-900">
                            {formatToLocalDateExact(licitacao.dataHoraPregao)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatToLocalTimeExact(licitacao.dataHoraPregao)}
                          </div>
                        </div>
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => setEditingDataPregao(true)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                          title="Editar data e horário do pregão"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Tempo do Contrato</label>
                  {editingMeses && !readOnly ? (
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="number"
                        value={tempMeses}
                        onChange={(e) => setTempMeses(Number(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="120"
                      />
                      <span className="text-sm text-gray-600">meses</span>
                      <button
                        onClick={handleMesesSave}
                        className="p-2 text-green-600 hover:text-green-800"
                        title="Salvar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMeses(false)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-gray-900">
                        {licitacao.months} meses
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => setEditingMeses(true)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                          title="Editar tempo do contrato"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {licitacao.dataProximaAcao && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data da Próxima Ação</label>
                    {editingProximaAcao && !readOnly ? (
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="datetime-local"
                          value={tempProximaAcaoDateTime}
                          onChange={(e) => setTempProximaAcaoDateTime(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleProximaAcaoSave}
                          className="p-2 text-green-600 hover:text-green-800"
                          title="Salvar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingProximaAcao(false)}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-900">
                              {formatToLocalDateExact(licitacao.dataProximaAcao)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatToLocalTimeExact(licitacao.dataProximaAcao)}
                            </div>
                          </div>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => setEditingProximaAcao(true)}
                            className="p-2 text-blue-600 hover:text-blue-800"
                            title="Editar data e horário"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {!licitacao.dataProximaAcao && !readOnly && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data da Próxima Ação</label>
                    {editingProximaAcao ? (
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="datetime-local"
                          value={tempProximaAcaoDateTime}
                          onChange={(e) => setTempProximaAcaoDateTime(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleProximaAcaoSave}
                          className="p-2 text-green-600 hover:text-green-800"
                          title="Salvar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingProximaAcao(false)}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <button
                          onClick={() => setEditingProximaAcao(true)}
                          className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          + Definir data e horário da próxima ação
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Campo de Texto da Próxima Ação */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Detalhes da Próxima Ação</label>
                  {editingProximaAcaoTexto && !readOnly ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={tempProximaAcaoTexto}
                        onChange={(e) => setTempProximaAcaoTexto(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Descreva os detalhes da próxima ação..."
                        autoFocus
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleProximaAcaoTextoSave}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingProximaAcaoTexto(false)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 group">
                      {licitacao.proximaAcaoTexto && licitacao.proximaAcaoTexto.trim() !== '' ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm text-blue-800">
                            {expandedProximaAcaoTexto 
                              ? licitacao.proximaAcaoTexto 
                              : truncateText(licitacao.proximaAcaoTexto, 100)
                            }
                            {needsTruncation(licitacao.proximaAcaoTexto, 100) && (
                              <button
                                onClick={() => setExpandedProximaAcaoTexto(!expandedProximaAcaoTexto)}
                                className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {expandedProximaAcaoTexto ? 'menos' : 'mais'}
                              </button>
                            )}
                          </div>
                          {!readOnly && (
                            <button
                              onClick={() => setEditingProximaAcaoTexto(true)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✏️ Editar detalhes
                            </button>
                          )}
                        </div>
                      ) : !readOnly ? (
                        <button
                          onClick={() => setEditingProximaAcaoTexto(true)}
                          className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          + Adicionar detalhes da próxima ação
                        </button>
                      ) : (
                        <div className="text-sm text-gray-400 italic">Sem detalhes informados</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Campo Posição Atual - apenas para Petrobras */}
                {selectedDepartment === 'Petrobras' && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Posição Atual (Petrobras)</label>
                    {editingPosicaoAtual && !readOnly ? (
                      <div className="mt-1 flex items-start space-x-2">
                        <textarea
                          value={tempPosicaoAtual}
                          onChange={(e) => setTempPosicaoAtual(e.target.value)}
                          rows={3}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="Ex: Aguardando habilitação da nossa empresa, Em fase de recursos, Documentação sendo analisada pela Petrobras..."
                        />
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={handlePosicaoAtualSave}
                            className="p-2 text-green-600 hover:text-green-800"
                            title="Salvar"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPosicaoAtual(false)}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-start justify-between">
                        <div className={`${licitacao.posicaoAtual ? 'text-yellow-600' : 'text-gray-400'} max-w-md`}>
                          {licitacao.posicaoAtual && licitacao.posicaoAtual.trim() !== '' ? licitacao.posicaoAtual : 'Posição não definida'}
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => setEditingPosicaoAtual(true)}
                            className="p-2 text-yellow-600 hover:text-yellow-800"
                            title="Editar posição atual"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Hora de Abertura</label>
                  <div className="mt-1 text-gray-900">
                    {formatToLocalTimeExact(licitacao.dataPregao || licitacao.dataHoraPregao)}
                  </div>
                </div>
                
                {licitacao.licitacaoPrioritaria && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Licitação Prioritária</label>
                    <div className="mt-1">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        ✓ Com Promotor - Closer: 0,01% / Orçamentista: 0,005%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações do Pregão */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Pregão</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plataforma</label>
                  <div className="mt-1 text-gray-900">{licitacao.plataforma}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Empresa</label>
                  <div className="mt-1 text-gray-900">{licitacao.empresa}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor Estimado</label>
                  <div className="mt-1 text-gray-900">{formatCurrency(licitacao.valorEstimado)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Margem de lucro (%)</label>
                  <div className="mt-1 text-gray-900">{formatPercent(licitacao.margemLucro)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Margem adm (%)</label>
                  <div className="mt-1 text-gray-900">{formatPercent(licitacao.margemAdm)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tempo do Contrato</label>
                  <div className="mt-1 text-gray-900">{licitacao.months} meses</div>
                  {licitacao.valorEstimado && (
                    <div className="text-sm text-gray-600 mt-1">
                      Valor mensal: {formatCurrency(licitacao.valorEstimado / licitacao.months)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Valores e Lances */}
            {(licitacao.lanceVencedor || licitacao.nossoLance) && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lances e Resultados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {licitacao.lanceVencedor && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lance Vencedor</label>
                      <div className="mt-1">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(licitacao.lanceVencedor)}</div>
                        {licitacao.percentualVencedor && (
                          <div className="text-sm text-gray-600">
                            {licitacao.percentualVencedor} do valor estimado
                          </div>
                        )}
                        {licitacao.empresaVencedora && (
                          <div className="text-sm text-gray-600">
                            Vencedor: {licitacao.empresaVencedora}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {licitacao.nossoLance && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nosso Lance</label>
                      <div className="mt-1">
                        <div className="text-lg font-bold text-blue-600">{formatCurrency(licitacao.nossoLance)}</div>
                        {licitacao.percentualNossoLance && (
                          <div className="text-sm text-gray-600">
                            {licitacao.percentualNossoLance} do valor estimado
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Equipe Responsável */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipe Responsável</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {licitante && (
                  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={licitante.avatar}
                      alt={licitante.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{licitante.name}</p>
                      <p className="text-sm text-gray-500">Licitante</p>
                      <p className="text-xs text-gray-400">{licitante.email}</p>
                    </div>
                  </div>
                )}

                {adl ? (
                  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={adl.avatar}
                      alt={adl.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{adl.name}</p>
                      <p className="text-sm text-gray-500">ADL</p>
                      <p className="text-xs text-gray-400">{adl.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 border-dashed">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhum ADL atribuído</p>
                    </div>
                  </div>
                )}
                
                {promotor ? (
                  <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <img
                      src={promotor.avatar}
                      alt={promotor.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-red-900">{promotor.name}</p>
                      <p className="text-sm text-red-700">Promotor</p>
                      <p className="text-xs text-red-600">Closer: 0,01% / Orçamentista: 0,005%</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 border-dashed">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhum Promotor atribuído</p>
                    </div>
                  </div>
                )}
                
                {orcamentista ? (
                  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={orcamentista.avatar}
                      alt={orcamentista.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{orcamentista.name}</p>
                      <p className="text-sm text-gray-500">Orçamentista</p>
                      <p className="text-xs text-gray-400">{orcamentista.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 border-dashed">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhum Orçamentista atribuído</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {licitacao.observacoes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Observações</h4>
                <p className="text-sm text-yellow-800">{licitacao.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!readOnly && onUpdateProbability && (
        <ProbabilityModal
          isOpen={showProbabilityModal}
          onClose={() => setShowProbabilityModal(false)}
          onSave={handleProbabilityUpdate}
          currentScores={licitacao.probabilityScores}
          orgaoName={licitacao.orgao}
        />
      )}
    </>
  );
};