import React from 'react';
import { CalendarDays, Clock, AlertTriangle, User, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { getDaysUntil, formatDateBR } from '../../utils/dateUtils';

interface Tarefa {
  id: string;
  nome: string;
  descricao?: string;
  status: 'A fazer' | 'Fazendo' | 'Feito';
  data_prazo: string;
  responsavel: string;
}

export const TarefasPendentesCard: React.FC = () => {
  const [expandido, setExpandido] = React.useState(false);
  const { data: tarefasData = [], loading } = useSupabaseQuery('tarefas' as any, {
    orderBy: { column: 'data_prazo', ascending: true }
  });
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Filtrar tarefas pendentes
  const tarefasPendentes = tarefasData.filter((tarefa: Tarefa) => tarefa.status !== 'Feito');
  
  // Agrupar tarefas por responsável
  const tarefasPorResponsavel = tarefasPendentes.reduce((acc: { [key: string]: Tarefa[] }, tarefa: Tarefa) => {
    if (!acc[tarefa.responsavel]) {
      acc[tarefa.responsavel] = [];
    }
    acc[tarefa.responsavel].push(tarefa);
    return acc;
  }, {});
  
  // Separar por urgência
  const tarefasVencidas = tarefasPendentes.filter((t: Tarefa) => getDaysUntil(t.data_prazo) < 0);
  const tarefasHoje = tarefasPendentes.filter((t: Tarefa) => getDaysUntil(t.data_prazo) === 0);
  const tarefasUrgentes = tarefasPendentes.filter((t: Tarefa) => {
    const days = getDaysUntil(t.data_prazo);
    return days > 0 && days <= 3;
  });

  // Calcular estatísticas
  const stats = {
    vencidas: tarefasVencidas.length,
    vencendoHoje: tarefasHoje.length,
    fazendo: tarefasPendentes.filter((t: Tarefa) => t.status === 'Fazendo').length
  };

  const getUrgencyClass = (tarefa: Tarefa) => {
    const days = getDaysUntil(tarefa.data_prazo);
    if (days < 0) return 'border-l-4 border-l-red-600 bg-red-50';
    if (days === 0) return 'border-l-4 border-l-orange-600 bg-orange-50';
    if (days <= 3) return 'border-l-4 border-l-yellow-600 bg-yellow-50';
    return 'border-l-4 border-l-blue-600 bg-blue-50';
  };

  const getUrgencyIcon = (tarefa: Tarefa) => {
    const days = getDaysUntil(tarefa.data_prazo);
    if (days < 0) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (days === 0) return <Clock className="w-4 h-4 text-orange-600 animate-pulse" />;
    if (days <= 3) return <Clock className="w-4 h-4 text-yellow-600" />;
    return <CalendarDays className="w-4 h-4 text-blue-600" />;
  };

  const formatDaysRemaining = (tarefa: Tarefa) => {
    const days = getDaysUntil(tarefa.data_prazo);
    if (days < 0) return `${Math.abs(days)} dias atrasada`;
    if (days === 0) return 'Vence hoje!';
    if (days === 1) return 'Vence amanhã';
    return `${days} dias restantes`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Header Compacto - Sempre Visível */}
      <button 
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
      >
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Tarefas Pendentes</span>
          </h3>
          <p className="text-xs text-gray-600">Tarefas em andamento e próximas do prazo</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xl font-bold text-blue-600">{tarefasPendentes.length}</div>
            <div className="text-xs text-gray-500">Pendentes</div>
          </div>
          <div className="text-blue-600">
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Estatísticas Compactas - Sempre Visíveis */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-red-600">{stats.vencidas}</div>
          <div className="text-xs text-red-700">Vencidas</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-orange-600">{stats.vencendoHoje}</div>
          <div className="text-xs text-orange-700">Hoje</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-yellow-600">{tarefasPendentes.filter((t: Tarefa) => {
            const diasRestantes = getDaysUntil(t.data_prazo);
            return diasRestantes > 0 && diasRestantes <= 3;
          }).length}</div>
          <div className="text-xs text-yellow-700">Urgentes</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-blue-600">{stats.fazendo}</div>
          <div className="text-xs text-blue-700">Em progresso</div>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      {expandido && (
        <div className="border-t pt-3 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">📋 Tarefas por Responsável</h4>
          
          {Object.keys(tarefasPorResponsavel).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(tarefasPorResponsavel)
                .sort(([, a], [, b]) => b.length - a.length) // Ordenar por quantidade (maior primeiro)
                .map(([responsavel, tarefasResponsavel]) => {
                  const tarefasVencidasResponsavel = tarefasResponsavel.filter(t => getDaysUntil(t.data_prazo) < 0);
                  const tarefasHojeResponsavel = tarefasResponsavel.filter(t => getDaysUntil(t.data_prazo) === 0);
                  const tarefasUrgentesResponsavel = tarefasResponsavel.filter(t => {
                    const days = getDaysUntil(t.data_prazo);
                    return days > 0 && days <= 3;
                  });
                  
                  return (
                    <div 
                      key={responsavel} 
                      className={`border-l-4 p-3 rounded-lg border-gray-200 transition-all ${
                        tarefasVencidasResponsavel.length > 0 
                          ? 'border-l-red-500 bg-red-50' 
                          : tarefasHojeResponsavel.length > 0
                          ? 'border-l-orange-500 bg-orange-50'
                          : tarefasUrgentesResponsavel.length > 0
                          ? 'border-l-yellow-500 bg-yellow-50'
                          : 'border-l-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3 text-gray-600" />
                          <h4 className="text-sm font-semibold text-gray-900">{responsavel}</h4>
                        </div>
                        <div className="text-base font-bold text-blue-600">
                          {tarefasResponsavel.length}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Resumo por urgência */}
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {tarefasVencidasResponsavel.length > 0 && (
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-center">
                              {tarefasVencidasResponsavel.length} vencida{tarefasVencidasResponsavel.length > 1 ? 's' : ''}
                            </div>
                          )}
                          {tarefasHojeResponsavel.length > 0 && (
                            <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-center">
                              {tarefasHojeResponsavel.length} hoje
                            </div>
                          )}
                          {tarefasUrgentesResponsavel.length > 0 && (
                            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-center">
                              {tarefasUrgentesResponsavel.length} urgente{tarefasUrgentesResponsavel.length > 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center">
                            {tarefasResponsavel.filter(t => t.status === 'Fazendo').length} fazendo
                          </div>
                        </div>
                        
                        {/* Tarefas mais urgentes (até 3) */}
                        <div className="space-y-0.5">
                          {tarefasResponsavel
                            .sort((a, b) => getDaysUntil(a.data_prazo) - getDaysUntil(b.data_prazo))
                            .slice(0, 3)
                            .map(tarefa => {
                              const dias = getDaysUntil(tarefa.data_prazo);
                              return (
                                <div key={tarefa.id} className="text-xs text-gray-700 truncate leading-tight">
                                  <span className={`font-medium ${
                                    dias < 0 ? 'text-red-600' :
                                    dias === 0 ? 'text-orange-600' :
                                    dias <= 3 ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`}>
                                    {dias < 0 ? 'VENCIDA' : dias === 0 ? 'HOJE' : `${dias}d`}
                                  </span>
                                  {' • '}
                                  <span className="truncate">{tarefa.nome}</span>
                                </div>
                              );
                            })}
                          {tarefasResponsavel.length > 3 && (
                            <div className="text-xs text-gray-500 text-center italic leading-tight">
                              +{tarefasResponsavel.length - 3} tarefas adicionais
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Todas as tarefas em dia!</h3>
              <p className="text-gray-500">Não há tarefas pendentes no momento</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};