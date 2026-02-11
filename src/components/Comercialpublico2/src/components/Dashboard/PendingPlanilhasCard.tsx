import React from 'react';
import { FileText, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';
import { formatDateBR, getDaysUntil } from '../../utils/dateUtils';

export const PendingPlanilhasCard: React.FC = () => {
  const { selectedYear } = useYear();
  const { data: licitacoesData = [], loading } = useSupabaseQuery('proposals');
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  // Transformar dados e filtrar licitações com planilha a fazer
  const licitacoesPendentes = licitacoesData
    .map(p => ({
      id: p.id,
      orgao: p.client,
      dataPregao: p.data_pregao || p.created_at, // CORRIGIDO: Usar data_pregao prioritariamente
      statusPlanilha: p.status_planilha || 'Planilha a fazer' // Usar valor real do Supabase
    }))
    .filter(licitacao => licitacao.statusPlanilha === 'Planilha a fazer')
    .sort((a, b) => new Date(a.dataPregao).getTime() - new Date(b.dataPregao).getTime());

  // Determinar cor baseada na urgência
  const getUrgencyClass = (dataPregao: string) => {
    const daysUntil = getDaysUntil(dataPregao);
    if (daysUntil <= 2) {
      return 'bg-red-50 border-red-200 border-l-4 border-l-red-500';
    } else if (daysUntil <= 5) {
      return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
    }
    return 'bg-white border-gray-200 border-l-4 border-l-blue-500';
  };

  const getUrgencyIcon = (dataPregao: string) => {
    const daysUntil = getDaysUntil(dataPregao);
    if (daysUntil <= 2) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (daysUntil <= 5) {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  const formatDaysUntil = (dataPregao: string) => {
    const daysUntil = getDaysUntil(dataPregao);
    if (daysUntil < 0) return 'Vencido';
    if (daysUntil === 0) return 'Hoje';
    if (daysUntil === 1) return 'Amanhã';
    return `${daysUntil} dias`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>Planilhas Pendentes</span>
          </h3>
          <p className="text-sm text-gray-600">Licitações aguardando elaboração de planilha</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">{licitacoesPendentes.length}</div>
          <div className="text-sm text-gray-500">Pendentes</div>
        </div>
      </div>

      {/* Lista de Licitações Pendentes */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {licitacoesPendentes.length > 0 ? (
          licitacoesPendentes.map((licitacao) => {
            return (
              <div 
                key={licitacao.id} 
                className={`rounded-lg p-4 border transition-all ${getUrgencyClass(licitacao.dataPregao)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getUrgencyIcon(licitacao.dataPregao)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 break-words md:truncate">{licitacao.orgao}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateBR(licitacao.dataPregao)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      getDaysUntil(licitacao.dataPregao) <= 2 ? 'text-red-600' :
                      getDaysUntil(licitacao.dataPregao) <= 5 ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {formatDaysUntil(licitacao.dataPregao)}
                    </div>
                    <div className="text-xs text-gray-500">para pregão</div>
                  </div>
                </div>
                
                {getDaysUntil(licitacao.dataPregao) <= 2 && (
                  <div className="mt-2 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
                    ⚠️ Urgente: Planilha deve ser feita em breve!
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Todas as planilhas em dia!</h3>
            <p className="text-gray-500">Não há licitações aguardando elaboração de planilha</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {licitacoesPendentes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-red-600">
                {licitacoesPendentes.filter(l => getDaysUntil(l.dataPregao) <= 2).length}
              </div>
              <div className="text-gray-600">Urgentes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {licitacoesPendentes.filter(l => {
                  const days = getDaysUntil(l.dataPregao);
                  return days > 2 && days <= 5;
                }).length}
              </div>
              <div className="text-gray-600">Atenção</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {licitacoesPendentes.filter(l => getDaysUntil(l.dataPregao) > 5).length}
              </div>
              <div className="text-gray-600">Normais</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};