import React from 'react';
import { Calendar, Clock, AlertTriangle, Bell, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';
import { formatDateBR, formatTimeBR, getDaysUntil, isToday } from '../../utils/dateUtils';
import { STATUS_PERDIDOS, isPossivelComissao } from '../../constants/status';

export const ProximasLicitacoesCard: React.FC = () => {
  const { selectedYear } = useYear();
  const { data: licitacoesData = [], loading } = useSupabaseQuery('proposals');
  const [expandedEmAndamento, setExpandedEmAndamento] = React.useState(false);
  const [expandedAguardando, setExpandedAguardando] = React.useState(false);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        </div>
      </div>
    );
  }


  // Transformar dados e filtrar licitações com próxima ação definida
  const allLicitacoesProximas = licitacoesData
    .filter(p => {
      // Deve ter data_proxima_acao definida
      const hasProximaAcao = p.data_proxima_acao && p.data_proxima_acao.trim() !== '';
      // NOVO: Usar constantes para verificar se é situação perdida
      const isActive = !STATUS_PERDIDOS.includes(p.status) && p.status !== 'Contrato assinado';

      return hasProximaAcao && isActive;
    })
    .map(p => ({
      id: p.id,
      orgao: p.client,
      numeroPregao: p.numero_pregao || 'Sem número',
      situacao: p.status, // USAR STATUS DIRETO DO BANCO
      status: p.status, // Status real da proposta
      dataProximaAcao: p.data_proxima_acao,
      dataPregao: p.data_pregao || p.created_at, // CORRIGIDO: Usar data_pregao prioritariamente
      nossoLance: p.nosso_lance,
      valorEstimado: p.total_value,
      monthlyValue: p.monthly_value,
      months: p.months || 12
    }))
    .sort((a, b) => {
      // Ordenar por data da próxima ação (mais próxima primeiro)
      return new Date(a.dataProximaAcao).getTime() - new Date(b.dataProximaAcao).getTime();
    });

  // Separar por situação
  const licitacoesEmAndamento = allLicitacoesProximas
    .filter(l => l.situacao === 'Em andamento')
    .slice(0, 8);

  const licitacoesAguardando = allLicitacoesProximas
    .filter(l => l.situacao === 'Aguardando')
    .slice(0, 8);

  // Função para determinar cor baseada na urgência
  const getUrgencyClass = (dataProximaAcao: string) => {
    const daysUntil = getDaysUntil(dataProximaAcao);
    
    // Verificar se está atrasado
    if (daysUntil < 0) {
      return 'bg-red-100 border-red-300 border-l-4 border-l-red-600';
    }
    
    if (isToday(dataProximaAcao)) {
      return 'bg-red-100 border-red-300 border-l-4 border-l-red-600';
    }
    
    if (daysUntil === 1) {
      return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
    } else if (daysUntil <= 3) {
      return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
    } else if (daysUntil <= 7) {
      return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
    }
    return 'bg-white border-gray-200 border-l-4 border-l-gray-500';
  };
  const formatCurrency = (value: number | null | undefined) => {
    if (!value || value === 0) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getUrgencyIcon = (dataProximaAcao: string) => {
    const daysUntil = getDaysUntil(dataProximaAcao);
    
    // Atrasado
    if (daysUntil < 0) {
      return <AlertTriangle className="w-4 h-4 text-red-700" />;
    }
    
    if (isToday(dataProximaAcao)) {
      return <Bell className="w-4 h-4 text-red-700 animate-pulse" />;
    }
    
    if (daysUntil === 1) {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    } else if (daysUntil <= 3) {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
    return <Calendar className="w-4 h-4 text-blue-600" />;
  };

  const formatDaysUntil = (dataProximaAcao: string) => {
    const daysUntil = getDaysUntil(dataProximaAcao);
    
    // Atrasado
    if (daysUntil < 0) {
      return 'ATRASADO';
    }
    
    if (isToday(dataProximaAcao)) {
      return 'HOJE';
    }
    
    if (daysUntil === 1) return 'Amanhã';
    return `${daysUntil} dias`;
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'Contrato assinado': return 'bg-green-100 text-green-800';
      case 'Em andamento': return 'bg-blue-100 text-blue-800';
      case 'Aguardando': return 'bg-yellow-100 text-yellow-800';
      case 'Encerrado': return 'bg-purple-100 text-purple-800';
      case 'Perdido':
      case 'Desclassificado':
      case 'Inabilitado':
      case 'Fracassado':
      case 'Revogado': return 'bg-red-100 text-red-800';
      case 'Suspenso':
      case 'Vencido': return 'bg-orange-100 text-orange-800';
      case 'Declinamos': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para renderizar uma lista de licitações
  const renderLicitacoesList = (licitacoes: any[], emptyMessage: string, emptyIcon: React.ReactNode) => (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {licitacoes.length > 0 ? (
        licitacoes.map((licitacao) => {
          const isHoje = isToday(licitacao.dataProximaAcao);
          
          return (
            <div 
              key={licitacao.id} 
              className={`rounded-lg p-4 border transition-all ${getUrgencyClass(licitacao.dataProximaAcao)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getUrgencyIcon(licitacao.dataProximaAcao)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 leading-tight break-words md:truncate">{licitacao.orgao}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="truncate">Pregão: {licitacao.numeroPregao}</span>
                      </div>
                      <span className={`hidden md:inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSituacaoColor(licitacao.situacao)}`}>
                        {licitacao.situacao}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateBR(licitacao.dataProximaAcao)}</span>
                      <span>às {formatTimeBR(licitacao.dataProximaAcao)}</span>
                    </div>
                    {/* Valor do Nosso Lance */}
                    {(licitacao.nossoLance || licitacao.valorEstimado) && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        <DollarSign className="w-3 h-3" />
                        {licitacao.nossoLance ? (
                          <div>
                            <div className="font-medium text-green-600 text-xs">
                              Nosso Lance: {formatCurrency(licitacao.nossoLance)}
                            </div>
                            <div className="text-gray-500 font-normal text-xs">
                              {formatCurrency(licitacao.nossoLance / (licitacao.months || 12))}/mês
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-blue-600 text-xs">
                              Valor Est.: {formatCurrency(licitacao.valorEstimado)}
                            </div>
                            <div className="text-gray-500 font-normal text-xs">
                              {formatCurrency(licitacao.valorEstimado / (licitacao.months || 12))}/mês
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${
                    isHoje ? 'text-red-700 bg-red-200 px-3 py-1 rounded-full animate-pulse' :
                    getDaysUntil(licitacao.dataProximaAcao) === 1 ? 'text-yellow-600' :
                    getDaysUntil(licitacao.dataProximaAcao) <= 3 ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {formatDaysUntil(licitacao.dataProximaAcao)}
                  </div>
                  {!isHoje && (
                    <div className="text-xs text-gray-500 hidden md:block">p/ ação</div>
                  )}
                </div>
              </div>
              
              {isHoje && (
                <div className="mt-1 text-xs text-red-800 bg-red-200 rounded px-2 py-0.5 text-center font-bold hidden md:block">
                  🚨 AÇÃO AGENDADA PARA HOJE!
                </div>
              )}
              
              {getDaysUntil(licitacao.dataProximaAcao) <= 1 && !isHoje && (
                <div className="mt-1 text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-0.5 text-center hidden md:block">
                  ⚠️ Ação agendada para amanhã!
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {emptyIcon}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
          <p className="text-gray-500">Não há licitações nesta categoria com ações agendadas</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Card 1: Licitações Em Andamento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header com seta expansível */}
        <button
          onClick={() => setExpandedEmAndamento(!expandedEmAndamento)}
          className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Licitações em Andamento</span>
            </h3>
            <p className="text-sm text-gray-600 text-left">Licitações em negociação com ações agendadas</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{licitacoesEmAndamento.length}</div>
              <div className="hidden md:block text-sm text-gray-500">Em negociação</div>
            </div>
            {expandedEmAndamento ? (
              <ChevronDown className="w-5 h-5 text-blue-600 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 text-blue-600 transition-transform" />
            )}
          </div>
        </button>

        {/* Conteúdo expansível */}
        {expandedEmAndamento && (
          <div className="mt-4 space-y-4">
            {/* Valor Total das Licitações em Andamento */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Valor Total em Andamento</h4>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(licitacoesEmAndamento.reduce((sum, l) => {
                      const valorGlobal = l.nossoLance || l.valorEstimado || 0;
                      return sum + valorGlobal;
                    }, 0))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-700 mb-1">Valor Mensal</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(licitacoesEmAndamento.reduce((sum, l) => {
                      const valorGlobal = l.nossoLance || l.valorEstimado || 0;
                      const valorMensal = valorGlobal / (l.months || 12);
                      return sum + valorMensal;
                    }, 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Licitações */}
            {renderLicitacoesList(
              licitacoesEmAndamento,
              'Nenhuma licitação em andamento',
              <Clock className="w-8 h-8 text-blue-500" />
            )}

            {/* Summary para Em Andamento */}
            {licitacoesEmAndamento.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {licitacoesEmAndamento.filter(l => isToday(l.dataProximaAcao) || getDaysUntil(l.dataProximaAcao) <= 0).length}
                    </div>
                    <div className="text-gray-600">Hoje</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">
                      {licitacoesEmAndamento.filter(l => {
                        const days = getDaysUntil(l.dataProximaAcao);
                        return days > 0 && days <= 3;
                      }).length}
                    </div>
                    <div className="text-gray-600">≤ 3 dias</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {licitacoesEmAndamento.filter(l => {
                        const days = getDaysUntil(l.dataProximaAcao);
                        return days > 3 && days <= 7;
                      }).length}
                    </div>
                    <div className="text-gray-600">3-7 dias</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-600">
                      {licitacoesEmAndamento.filter(l => getDaysUntil(l.dataProximaAcao) > 7).length}
                    </div>
                    <div className="text-gray-600">&gt; 7 dias</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 2: Licitações Aguardando */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header com seta expansível */}
        <button
          onClick={() => setExpandedAguardando(!expandedAguardando)}
          className="w-full flex items-center justify-between p-3 hover:bg-yellow-50 rounded-lg transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-yellow-600" />
              <span>Licitações Aguardando</span>
            </h3>
            <p className="text-sm text-gray-600 text-left">Licitações aguardando com ações agendadas</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">{licitacoesAguardando.length}</div>
              <div className="hidden md:block text-sm text-gray-500">Aguardando</div>
            </div>
            {expandedAguardando ? (
              <ChevronDown className="w-5 h-5 text-yellow-600 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 text-yellow-600 transition-transform" />
            )}
          </div>
        </button>

        {/* Conteúdo expansível */}
        {expandedAguardando && (
          <div className="mt-4 space-y-4">
            {/* Valor Total das Licitações Aguardando */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Valor Total Aguardando</h4>
                  <div className="text-xl font-bold text-yellow-600">
                    {formatCurrency(licitacoesAguardando.reduce((sum, l) => {
                      const valorGlobal = l.nossoLance || l.valorEstimado || 0;
                      return sum + valorGlobal;
                    }, 0))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-yellow-700 mb-1">Valor Mensal</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {formatCurrency(licitacoesAguardando.reduce((sum, l) => {
                      const valorGlobal = l.nossoLance || l.valorEstimado || 0;
                      const valorMensal = valorGlobal / (l.months || 12);
                      return sum + valorMensal;
                    }, 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Licitações */}
            {renderLicitacoesList(
              licitacoesAguardando,
              'Nenhuma licitação aguardando',
              <Calendar className="w-8 h-8 text-yellow-500" />
            )}

            {/* Summary para Aguardando */}
            {licitacoesAguardando.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {allLicitacoesProximas.filter(l => getDaysUntil(l.dataProximaAcao) < 0).length}
                    </div>
                    <div className="text-gray-600">Atrasadas</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {licitacoesAguardando.filter(l => isToday(l.dataProximaAcao) || getDaysUntil(l.dataProximaAcao) <= 0).length}
                    </div>
                    <div className="text-gray-600">Hoje</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">
                      {licitacoesAguardando.filter(l => {
                        const days = getDaysUntil(l.dataProximaAcao);
                        return days > 0 && days <= 3;
                      }).length}
                    </div>
                    <div className="text-gray-600">≤ 3 dias</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};