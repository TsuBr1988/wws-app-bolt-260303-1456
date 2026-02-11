import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Licitacao } from '../../types';
import { formatDateBR, formatTimeBR } from '../../utils/dateUtils';
import { useSupabaseQuery } from '../../hooks/useSupabase';

interface CalendarViewProps {
  licitacoes: Licitacao[];
  onLicitacaoClick?: (licitacao: Licitacao) => void;
}

const getCloserColorBorder = (closerId: string | undefined, employees: any[]): string => {
  if (!closerId) return '';

  const closer = employees.find(emp => emp.id === closerId);
  if (!closer) return '';

  // Nicoly = Rosa, Douglas = Azul-verde
  if (closer.name.toLowerCase().includes('nicoly')) {
    return 'border-t-4 border-t-pink-500';
  } else if (closer.name.toLowerCase().includes('douglas')) {
    return 'border-t-4 border-t-teal-500';
  }

  return '';
};

const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    'Aguardando': 'bg-blue-100 text-blue-800 border-blue-200',
    'Em andamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Vencido': 'bg-green-100 text-green-800 border-green-200',
    'Contrato assinado': 'bg-green-100 text-green-800 border-green-200',
    'Perdido': 'bg-red-100 text-red-800 border-red-200',
    'Desclassificado': 'bg-red-100 text-red-800 border-red-200',
    'Inabilitado': 'bg-red-100 text-red-800 border-red-200',
    'Declinamos': 'bg-gray-100 text-gray-800 border-gray-200',
    'Suspenso': 'bg-orange-100 text-orange-800 border-orange-200',
    'Encerrado': 'bg-gray-100 text-gray-800 border-gray-200',
    'Fracassado': 'bg-gray-100 text-gray-800 border-gray-200',
    'Revogado': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getCalendarDays = (startDate: Date, weeks: number = 5): Date[][] => {
  const allWeeks: Date[][] = [];
  const currentDay = new Date(startDate);

  // Ajustar para começar no domingo (0) da semana
  const dayOfWeek = currentDay.getDay();
  currentDay.setDate(currentDay.getDate() - dayOfWeek);

  for (let week = 0; week < weeks; week++) {
    const weekDays: Date[] = [];
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    allWeeks.push(weekDays);
  }

  return allWeeks;
};

const getDayName = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
};

const formatDayMonth = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

export const CalendarView: React.FC<CalendarViewProps> = ({ licitacoes, onLicitacaoClick }) => {
  const { data: employees = [] } = useSupabaseQuery('employees');

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    return weekStart;
  });

  const calendarWeeks = useMemo(() => getCalendarDays(currentWeekStart, 5), [currentWeekStart]);

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    setCurrentWeekStart(weekStart);
  };

  // Agrupar licitações por data da próxima ação (usando horário local)
  const licitacoesByDate = useMemo(() => {
    const grouped: { [key: string]: Licitacao[] } = {};

    licitacoes.forEach(licitacao => {
      // SEMPRE usar dataProximaAcao como prioridade, senão dataPregao
      const dateToUse = licitacao.dataProximaAcao || licitacao.dataPregao;

      if (dateToUse) {
        const date = new Date(dateToUse);
        // Usar getFullYear, getMonth, getDate para pegar a data no timezone local
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(licitacao);
      }
    });

    console.log('📅 Licitações agrupadas por data da próxima ação:', grouped);
    return grouped;
  }, [licitacoes]);

  const getLicitacoesForDay = (date: Date): Licitacao[] => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return licitacoesByDate[dateKey] || [];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const firstDay = calendarWeeks[0][0];
  const lastDay = calendarWeeks[calendarWeeks.length - 1][6];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header de navegação */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <span className="text-sm text-gray-500">
            {formatDayMonth(firstDay)} - {formatDayMonth(lastDay)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={goToPreviousWeek}
            className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cabeçalhos dos dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, idx) => (
          <div key={idx} className="text-center">
            <div className="text-sm font-semibold text-gray-700 py-2">
              {dayName}
            </div>
          </div>
        ))}
      </div>

      {/* Grade de calendário - 5 semanas */}
      <div className="space-y-2">
        {calendarWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day, dayIndex) => {
              const dayLicitacoes = getLicitacoesForDay(day);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dayIndex}
                  className={`border rounded-lg overflow-hidden flex flex-col ${
                    isTodayDate ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Cabeçalho do dia */}
                  <div className={`p-2 border-b ${
                    isTodayDate ? 'bg-blue-100 border-blue-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`text-sm font-bold text-center ${
                      isTodayDate ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Licitações do dia */}
                  <div className="p-1 space-y-1 flex-1 overflow-y-auto max-h-[180px]">
                    {dayLicitacoes.length > 0 ? (
                      dayLicitacoes.map((licitacao) => {
                        const closerBorderClass = getCloserColorBorder(licitacao.licitanteId, employees);
                        return (
                          <button
                            key={licitacao.id}
                            onClick={() => onLicitacaoClick?.(licitacao)}
                            className={`w-full text-left p-1.5 rounded border text-xs transition-all hover:shadow-md ${getStatusColor(licitacao.situacao)} ${closerBorderClass}`}
                          >
                            <div className="font-semibold truncate">{licitacao.orgao}</div>
                            {(licitacao.dataProximaAcao || licitacao.dataPregao) && (
                              <div className="text-xs opacity-75 mt-0.5">
                                {formatTimeBR(licitacao.dataProximaAcao || licitacao.dataPregao)}
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-2">
                        -
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legenda de Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
            <span className="text-xs text-gray-600">Aguardando</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
            <span className="text-xs text-gray-600">Em andamento</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
            <span className="text-xs text-gray-600">Vencido/Contrato</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
            <span className="text-xs text-gray-600">Perdido/Desclassificado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
