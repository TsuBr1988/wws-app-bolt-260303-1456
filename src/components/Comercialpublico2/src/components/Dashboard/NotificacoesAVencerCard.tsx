import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, Clock, User, AlertTriangle } from 'lucide-react';
import { useNotificacoesAVencer } from '../../hooks/useNotificacoesDashboard';
import { formatDateTimeLocal, badgeByDeadline, colorBySituacao, daysDiffFromNow } from '../../utils/datetime';
import { NotificacaoDetalhesModal } from '../Notificacoes/NotificacaoDetalhesModal';

export const NotificacoesAVencerCard: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { items, loading, error } = useNotificacoesAVencer();

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSaveDetalhes = async (id: string, detalhes: string) => {
    // Modal somente leitura - não implementar edição
    console.log('Modal somente leitura - edição não permitida');
  };

  const getUrgencyClass = (dataLimite: string) => {
    const days = daysDiffFromNow(dataLimite);
    if (days <= 2) return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
    if (days <= 7) return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
    return 'bg-white border-gray-200 border-l-4 border-l-gray-500';
  };

  const getUrgencyIcon = (dataLimite: string) => {
    const days = daysDiffFromNow(dataLimite);
    if (days <= 2) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    if (days <= 7) return <Clock className="w-4 h-4 text-blue-600" />;
    return <Calendar className="w-4 h-4 text-gray-600" />;
  };

  const formatDaysUntil = (dataLimite: string) => {
    const days = daysDiffFromNow(dataLimite);
    if (days === 1) return 'Amanhã';
    return `${days} dias`;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header recolhível */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Notificações a Vencer</span>
            </h3>
            <p className="text-sm text-gray-600 text-left">Próximas notificações nos próximos 30 dias</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{items.length}</div>
              <div className="hidden md:block text-sm text-gray-500">A vencer</div>
            </div>
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-blue-600 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 text-blue-600 transition-transform" />
            )}
          </div>
        </button>

        {/* Conteúdo expansível */}
        {expanded && (
          <div className="mt-4">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600">Erro ao carregar: {error}</p>
                </div>
              ) : items.length > 0 ? (
                items.slice(0, 10).map((item) => {
                  const deadlineBadge = badgeByDeadline(item.data_limite);
                  const situacaoColor = colorBySituacao(item.situacao);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full rounded-lg p-4 transition-colors text-left ${getUrgencyClass(item.data_limite)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {getUrgencyIcon(item.data_limite)}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 leading-tight break-words md:truncate">
                              {item.cliente}
                            </h4>
                            <div className="text-xs text-gray-600 mb-1">
                              {item.assunto}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>Limite: {formatDateTimeLocal(item.data_limite)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-blue-600">
                              {formatDaysUntil(item.data_limite)}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${situacaoColor}`}>
                              {item.situacao}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação próxima!</h3>
                  <p className="text-gray-500">Não há notificações a vencer nos próximos 30 dias</p>
                </div>
              )}
              
              {items.length > 10 && (
                <div className="text-center pt-3 border-t border-blue-200">
                  <p className="text-sm text-blue-600">
                    +{items.length - 10} notificações adicionais
                  </p>
                  <button className="text-xs text-blue-500 hover:text-blue-700 mt-1">
                    Ver todas na aba Notificações →
                  </button>
                </div>
              )}
            </div>

            {/* Resumo por urgência */}
            {items.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-lg font-bold text-yellow-600">
                      {items.filter(n => daysDiffFromNow(n.data_limite) <= 2).length}
                    </div>
                    <div className="text-gray-600">≤ 2 dias</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {items.filter(n => {
                        const days = daysDiffFromNow(n.data_limite);
                        return days > 2 && days <= 7;
                      }).length}
                    </div>
                    <div className="text-gray-600">3-7 dias</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-600">
                      {items.filter(n => daysDiffFromNow(n.data_limite) > 7).length}
                    </div>
                    <div className="text-gray-600">&gt; 7 dias</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {showModal && selectedItem && (
        <NotificacaoDetalhesModal
          item={selectedItem}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
          }}
          onSaveDetalhes={handleSaveDetalhes}
        />
      )}
    </>
  );
};