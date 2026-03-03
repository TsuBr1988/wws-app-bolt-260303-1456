import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Licitacao } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { convertISOToLocalDateTimeExact, convertLocalDateTimeToISOExact } from '../../utils/dateUtils';
import { useDepartment } from '../../contexts/DepartmentContext';
import { STATUS_OPTIONS } from '../../constants/status';

interface LicitacaoFormProps {
  onSubmit: (licitacao: Omit<Licitacao, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  editingLicitacao?: Licitacao | null;
}

export const LicitacaoForm: React.FC<LicitacaoFormProps> = ({ onSubmit, onCancel, editingLicitacao }) => {
  const { data: employees = [] } = useSupabaseQuery('employees');
  const { selectedDepartment } = useDepartment();
  
  const [formData, setFormData] = useState(() => {
    if (editingLicitacao) {
      return {
        orgao: editingLicitacao.orgao,
        numeroPregao: editingLicitacao.numeroPregao,
        plataforma: editingLicitacao.plataforma,
        cidade: editingLicitacao.cidade || '',
        dataInclusao: editingLicitacao.dataInclusao,
        dataHoraPregao: editingLicitacao.dataHoraPregao ? convertISOToLocalDateTimeExact(editingLicitacao.dataHoraPregao) : '',
        dataProximaAcao: editingLicitacao.dataProximaAcao ? convertISOToLocalDateTimeExact(editingLicitacao.dataProximaAcao) : '',
        empresa: editingLicitacao.empresa,
        situacao: editingLicitacao.situacao,
        etapaMaxima: editingLicitacao.etapaMaxima,
        valorEstimado: editingLicitacao.valorEstimado,
        margemLucro: editingLicitacao.margemLucro ?? '',
        margemAdm: editingLicitacao.margemAdm ?? '',
        empresaVencedora: editingLicitacao.empresaVencedora,
        lanceVencedor: editingLicitacao.lanceVencedor,
        nossoLance: editingLicitacao.nossoLance,
        licitanteId: editingLicitacao.licitanteId,
        adlId: editingLicitacao.adlId,
        promotorId: editingLicitacao.promotorId || '',
        orcamentistaId: editingLicitacao.orcamentistaId,
        statusPlanilha: editingLicitacao.statusPlanilha,
        posicaoAtual: editingLicitacao.posicaoAtual || '',
        observacoes: editingLicitacao.observacoes,
        months: editingLicitacao.months || 12,
        naoGeraComissao: editingLicitacao.nao_gera_comissao || false,
        naoContaMetaComercial: editingLicitacao.nao_conta_meta_comercial || false
      };
    } else {
      return {
        orgao: '',
        numeroPregao: '',
        plataforma: '',
        cidade: '',
        dataInclusao: '',
        dataHoraPregao: '',
        dataProximaAcao: '',
        empresa: 'WWS' as const,
        situacao: 'Aguardando' as const,
        etapaMaxima: 'Proposta' as const,
        valorEstimado: 0,
        margemLucro: '',
        margemAdm: '',
        empresaVencedora: '',
        lanceVencedor: 0,
        nossoLance: 0,
        licitanteId: '',
        adlId: '',
        promotorId: '',
        orcamentistaId: '',
        statusPlanilha: 'Planilha a fazer' as const,
        posicaoAtual: '',
        observacoes: '',
        months: 12,
        naoGeraComissao: false,
        naoContaMetaComercial: false
      };
    }
  });

  const calculatePercentual = (lance: number, estimado: number) => {
    if (!estimado || estimado === 0) return 'Sem estimado';
    return ((lance / estimado) * 100).toFixed(2) + '%';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [LicitacaoForm] Submetendo formulário (edição ou criação?):', {
      editingLicitacao: !!editingLicitacao,
      editingId: editingLicitacao?.id,
      etapaMaxima: formData.etapaMaxima,
      orgao: formData.orgao,
      departamento: selectedDepartment,
      isEditing: !!editingLicitacao
    });
    
    const percentualVencedor = formData.lanceVencedor ? 
      calculatePercentual(formData.lanceVencedor, formData.valorEstimado) : 
      undefined;
    
    const percentualNossoLance = formData.nossoLance ? 
      calculatePercentual(formData.nossoLance, formData.valorEstimado) : 
      undefined;
    
    const licitacaoData = {
      ...formData,
      dataHoraPregao: formData.dataHoraPregao ? convertLocalDateTimeToISOExact(formData.dataHoraPregao) : new Date().toISOString(),
      dataProximaAcao: formData.dataProximaAcao ? convertLocalDateTimeToISOExact(formData.dataProximaAcao) : undefined,
      valorEstimado: formData.valorEstimado || undefined,
      margemLucro: formData.margemLucro === '' ? undefined : Number(formData.margemLucro),
      margemAdm: formData.margemAdm === '' ? undefined : Number(formData.margemAdm),
      lanceVencedor: formData.lanceVencedor || undefined,
      nossoLance: formData.nossoLance || undefined,
      cidade: formData.cidade || undefined,
      percentualVencedor,
      percentualNossoLance,
      adlId: formData.adlId || undefined,
      posicaoAtual: formData.posicaoAtual || undefined,
      promotorId: formData.promotorId || null,
      orcamentistaId: formData.orcamentistaId || undefined,
      statusPlanilha: formData.statusPlanilha,
      etapaMaxima: formData.etapaMaxima, // Associar diretamente à nova coluna
      plataforma: formData.plataforma && formData.plataforma.trim() !== '' ? formData.plataforma.trim() : null, // Garantir que plataforma seja salva
      empresa: formData.empresa,
      months: formData.months,
      nao_gera_comissao: formData.naoGeraComissao,
      nao_conta_meta_comercial: formData.naoContaMetaComercial
    };
    
    console.log('📊 [LicitacaoForm] Dados preparados para submissão:', licitacaoData);
    
    onSubmit(licitacaoData);
  };

  const licitantes = employees.filter(emp => emp.role === 'Closer');
  const adls = employees.filter(emp => emp.role === 'SDR');
  const promotores = employees.filter(emp => emp.role === 'Promotor');
  const orcamentistas = employees.filter(emp => emp.role === 'Orcamentista');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingLicitacao ? 'Editar Licitação' : 'Nova Licitação'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Órgão *
              </label>
              <input
                type="text"
                value={formData.orgao}
                onChange={(e) => setFormData({ ...formData, orgao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Pregão *
              </label>
              <input
                type="text"
                value={formData.numeroPregao}
                onChange={(e) => setFormData({ ...formData, numeroPregao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma *
              </label>
              <input
                type="text"
                value={formData.plataforma}
                onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade (Opcional)
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: São Paulo, Rio de Janeiro, Brasília..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Local onde o contrato será executado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Inclusão *
              </label>
              <input
                type="date"
                value={formData.dataInclusao}
                onChange={(e) => setFormData({ ...formData, dataInclusao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora do Pregão *
              </label>
              <input
                type="datetime-local"
                value={formData.dataHoraPregao}
                onChange={(e) => setFormData({ ...formData, dataHoraPregao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Data e horário de abertura do pregão
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora da Próxima Ação
              </label>
              <input
                type="datetime-local"
                value={formData.dataProximaAcao}
                onChange={(e) => setFormData({ ...formData, dataProximaAcao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Data e horário da próxima ação no pregão (opcional)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <select
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Situação *
              </label>
              <select
                value={formData.situacao}
                onChange={(e) => setFormData({ ...formData, situacao: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etapa Máxima *
              </label>
              <select
                value={formData.etapaMaxima}
                onChange={(e) => setFormData({ ...formData, etapaMaxima: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {selectedDepartment === 'Petrobras' ? (
                  <>
                    <option value="Suspenso">Suspenso</option>
                    <option value="Encerrado">Encerrado</option>
                    <option value="Edital não qualificado">Edital não qualificado</option>
                    <option value="Em montagem">Em montagem</option>
                    <option value="Classificação">Classificação</option>
                    <option value="Avaliação de efetividade (avaliação de planilha)">Avaliação de efetividade (avaliação de planilha)</option>
                    <option value="Negociação">Negociação</option>
                    <option value="Habilitação">Habilitação</option>
                    <option value="Relatório de divulgação">Relatório de divulgação</option>
                    <option value="Abertura de recursos">Abertura de recursos</option>
                    <option value="Relatório final / Homologação">Relatório final / Homologação</option>
                  </>
                ) : (
                  <>
                    <option value="Desclassificados no início">Desclassificados no início</option>
                    <option value="Edital não qualificado">Edital não qualificado</option>
                    <option value="Em negociação">Em negociação</option>
                    <option value="Proposta">Proposta</option>
                    <option value="Lances">Lances</option>
                    <option value="Declinamos/ Não teve pregão">Declinamos/ Não teve pregão</option>
                    <option value="Desclassificado na planilha">Desclassificado na planilha</option>
                    <option value="Inabilitado">Inabilitado</option>
                    <option value="Planilha aceita / Aguardando habilitação">Planilha aceita / Aguardando habilitação</option>
                    <option value="Habilitado/ Aguardando recurso">Habilitado/ Aguardando recurso</option>
                    <option value="Contrato assinado">Contrato assinado</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Estimado do Pregão
              </label>
              <input
                type="number"
                value={formData.valorEstimado || ''}
                onChange={(e) => setFormData({ ...formData, valorEstimado: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                step="0.01"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem de lucro (%)
              </label>
              <input
                type="number"
                value={formData.margemLucro}
                onChange={(e) => setFormData({ ...formData, margemLucro: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                max="100"
                step="0.01"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem adm (%)
              </label>
              <input
                type="number"
                value={formData.margemAdm}
                onChange={(e) => setFormData({ ...formData, margemAdm: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                max="100"
                step="0.01"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo do Contrato (meses) *
              </label>
              <input
                type="number"
                value={formData.months}
                onChange={(e) => setFormData({ ...formData, months: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="120"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Duração do contrato em meses (usado para calcular valor mensal)
              </p>
              {formData.valorEstimado > 0 && formData.months > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Valor mensal estimado: {formatCurrency(formData.valorEstimado / formData.months)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa Vencedora
              </label>
              <input
                type="text"
                value={formData.empresaVencedora}
                onChange={(e) => setFormData({ ...formData, empresaVencedora: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lance Vencedor
              </label>
              <input
                type="number"
                value={formData.lanceVencedor || ''}
                onChange={(e) => setFormData({ ...formData, lanceVencedor: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                step="0.01"
              />
              {formData.lanceVencedor > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  % em relação ao estimado: {calculatePercentual(formData.lanceVencedor, formData.valorEstimado)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nosso Lance
              </label>
              <input
                type="number"
                value={formData.nossoLance || ''}
                onChange={(e) => setFormData({ ...formData, nossoLance: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                step="0.01"
              />
              {formData.nossoLance > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  % em relação ao estimado: {calculatePercentual(formData.nossoLance, formData.valorEstimado)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Licitante *
              </label>
              <select
                value={formData.licitanteId}
                onChange={(e) => setFormData({ ...formData, licitanteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Selecione um licitante</option>
                {licitantes.map(licitante => (
                  <option key={licitante.id} value={licitante.id}>
                    {licitante.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ADL (Opcional)
              </label>
              <select
                value={formData.adlId}
                onChange={(e) => setFormData({ ...formData, adlId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecione um ADL</option>
                {adls.map(adl => (
                  <option key={adl.id} value={adl.id}>
                    {adl.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotor (Opcional)
              </label>
              <select
                value={formData.promotorId}
                onChange={(e) => setFormData({ ...formData, promotorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecione um Promotor</option>
                {employees.filter(emp => emp.role === 'Promotor').map(promotor => (
                  <option key={promotor.id} value={promotor.id}>
                    {promotor.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-red-500 mt-1">
                ⚠️ Licitações com Promotor: comissão fixa 0,01% (não conta para metas)
              </p>
            </div>

            {selectedDepartment === 'Petrobras' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posição Atual (Petrobras)
                </label>
                <textarea
                  value={formData.posicaoAtual}
                  onChange={(e) => setFormData({ ...formData, posicaoAtual: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Aguardando habilitação, Em fase de recursos, Documentação em análise..."
                />
                <p className="text-xs text-yellow-600 mt-1">
                  📝 Campo específico para Petrobras - descreva a situação atual da empresa na licitação
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamentista (Opcional)
              </label>
              <select
                value={formData.orcamentistaId}
                onChange={(e) => setFormData({ ...formData, orcamentistaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecione um Orçamentista</option>
                {orcamentistas.map(orcamentista => (
                  <option key={orcamentista.id} value={orcamentista.id}>
                    {orcamentista.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status da Planilha *
              </label>
              <select
                value={formData.statusPlanilha}
                onChange={(e) => setFormData({ ...formData, statusPlanilha: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Planilha a fazer">Planilha a fazer</option>
                <option value="Planilha feita">Planilha feita</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Observações importantes sobre esta licitação..."
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.naoGeraComissao}
                onChange={(e) => setFormData({ ...formData, naoGeraComissao: e.target.checked })}
                className="mt-1 w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-orange-900">
                  Não gera comissão nem conta para meta comercial
                </span>
                <p className="text-xs text-orange-700 mt-1">
                  Marque esta opção para licitações especiais que devem aparecer nos controles mas não devem gerar comissão nem contribuir para as metas comerciais. Útil para contratos de teste, parcerias especiais, etc.
                </p>
              </div>
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.naoContaMetaComercial}
                onChange={(e) => setFormData({ ...formData, naoContaMetaComercial: e.target.checked })}
                className="mt-1 w-5 h-5 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-yellow-900">
                  Não conta para meta comercial
                </span>
                <p className="text-xs text-yellow-700 mt-1">
                  Marque esta opção para licitações que geram comissão mas não devem contribuir para as metas comerciais. A comissão será calculada normalmente, mas o contrato não contará para as metas do dashboard.
                </p>
              </div>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Resumo</h3>
            <div className="text-sm text-blue-600 space-y-1">
              <p><strong>Órgão:</strong> {formData.orgao || 'Não informado'}</p>
              <p><strong>Pregão:</strong> {formData.numeroPregao || 'Não informado'}</p>
              <p><strong>Cidade:</strong> {formData.cidade || 'Não informada'}</p>
              <p><strong>Data/Hora do Pregão:</strong> {formData.dataHoraPregao ? new Date(formData.dataHoraPregao).toLocaleString('pt-BR') : 'Não informada'}</p>
              <p><strong>Situação:</strong> {formData.situacao}</p>
              <p><strong>Etapa:</strong> {formData.etapaMaxima}</p>
              <p><strong>Tempo do contrato:</strong> {formData.months} meses</p>
              {formData.cidade && (
                <p><strong>Cidade:</strong> {formData.cidade}</p>
              )}
              {formData.promotorId && (
                <p><strong>⚠️ Promotor:</strong> Comissão fixa 0,1% (não conta para metas)</p>
              )}
              {selectedDepartment === 'Petrobras' && formData.posicaoAtual && (
                <p><strong>Posição Atual:</strong> {formData.posicaoAtual}</p>
              )}
              {formData.valorEstimado > 0 && (
                <p><strong>Valor mensal:</strong> {formatCurrency(formData.valorEstimado / formData.months)}</p>
              )}
              {formData.naoGeraComissao && (
                <p className="text-orange-700 font-bold">⚠️ NÃO GERA COMISSÃO NEM CONTA PARA META</p>
              )}
              {formData.naoContaMetaComercial && !formData.naoGeraComissao && (
                <p className="text-yellow-700 font-bold">⚠️ NÃO CONTA PARA META COMERCIAL (gera comissão)</p>
              )}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className={`flex-1 text-white py-3 px-4 rounded-lg font-medium transition-colors ${
                editingLicitacao 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {editingLicitacao ? 'Atualizar Licitação' : 'Criar Licitação'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};