import { useState } from 'react';
import { X, Trophy, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReaderBooksModal from './ReaderBooksModal';

interface BookLoan {
  id: string;
  pessoa: string;
  livro: string;
  autor: string;
  data_emprestimo: string;
  data_devolucao: string | null;
  numero_paginas: number;
  created_at: string;
}

interface MonthlyRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: BookLoan[];
}

interface MonthlyPersonStats {
  nome: string;
  livrosLendo: number;
  livrosConcluidos: number;
  paginasLidasNoMes: number;
  mediaPaginasDia: number;
}

export default function MonthlyRankingModal({
  isOpen,
  onClose,
  loans,
}: MonthlyRankingModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReader, setSelectedReader] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculateMonthlyStats = (date: Date): MonthlyPersonStats[] => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const statsMap = new Map<string, MonthlyPersonStats>();

    loans.forEach((loan) => {
      const loanStart = new Date(loan.data_emprestimo);
      const pessoa = loan.pessoa;

      const isActiveInMonth = loan.data_devolucao
        ? new Date(loan.data_devolucao) >= monthStart && new Date(loan.data_devolucao) <= monthEnd
        : loanStart <= monthEnd && loanStart >= monthStart;

      if (isActiveInMonth) {
        if (!statsMap.has(pessoa)) {
          statsMap.set(pessoa, {
            nome: pessoa,
            livrosLendo: 0,
            livrosConcluidos: 0,
            paginasLidasNoMes: 0,
            mediaPaginasDia: 0,
          });
        }

        const stats = statsMap.get(pessoa)!;

        if (loan.data_devolucao) {
          const returnDate = new Date(loan.data_devolucao);
          if (returnDate >= monthStart && returnDate <= monthEnd) {
            stats.livrosConcluidos++;
            stats.paginasLidasNoMes += loan.numero_paginas;

            const start = new Date(loan.data_emprestimo);
            const end = returnDate;
            const days = Math.ceil(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            );
            const paginasPorDia = days > 0 ? loan.numero_paginas / days : 0;
            stats.mediaPaginasDia += paginasPorDia;
          }
        } else {
          stats.livrosLendo++;
        }
      }
    });

    const statsArray = Array.from(statsMap.values());

    statsArray.forEach((stats) => {
      if (stats.livrosConcluidos > 0) {
        stats.mediaPaginasDia = stats.mediaPaginasDia / stats.livrosConcluidos;
      }
    });

    return statsArray.sort((a, b) => {
      if (b.paginasLidasNoMes !== a.paginasLidasNoMes) {
        return b.paginasLidasNoMes - a.paginasLidasNoMes;
      }
      return b.livrosLendo - a.livrosLendo;
    });
  };

  const ranking = calculateMonthlyStats(selectedDate);
  const winner = ranking.length > 0 && ranking[0].paginasLidasNoMes > 0 ? ranking[0] : null;

  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear()
    );
  };

  const isPastMonth = () => {
    const now = new Date();
    return selectedDate < startOfMonth(now);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Ranking Mensal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 capitalize">
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              {isCurrentMonth() && (
                <span className="text-xs text-blue-600 font-medium">Mês Atual</span>
              )}
            </div>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth()}
              className={`p-2 rounded-lg transition-colors ${
                isCurrentMonth()
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isPastMonth() && winner && (
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
            <div className="flex items-center justify-center gap-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Vencedor do Mês</p>
                <p className="text-2xl font-bold text-gray-900">{winner.nome}</p>
                <p className="text-sm text-gray-600">
                  {winner.paginasLidasNoMes} páginas lidas
                </p>
              </div>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {ranking.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma atividade de leitura neste mês</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.map((person, index) => (
                <div
                  key={person.nome}
                  className={`p-5 rounded-lg border-2 transition-all ${
                    index === 0
                      ? 'bg-yellow-50 border-yellow-300'
                      : index === 1
                      ? 'bg-gray-50 border-gray-300'
                      : index === 2
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : index === 1
                            ? 'bg-gray-400 text-white'
                            : index === 2
                            ? 'bg-orange-500 text-white'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <button
                        onClick={() => setSelectedReader(person.nome)}
                        className="flex items-center gap-2 group flex-1"
                      >
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                          {person.nome}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    </div>
                    {index < 3 && (
                      <Trophy
                        className={`w-8 h-8 ${
                          index === 0
                            ? 'text-yellow-500'
                            : index === 1
                            ? 'text-gray-400'
                            : 'text-orange-500'
                        }`}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-600 mb-1">Lendo</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {person.livrosLendo}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-600 mb-1">Concluídos</span>
                      <span className="text-2xl font-bold text-green-600">
                        {person.livrosConcluidos}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-600 mb-1">Páginas</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {person.paginasLidasNoMes}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-600 mb-1">Média p/dia</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {person.mediaPaginasDia.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>

      <ReaderBooksModal
        isOpen={selectedReader !== null}
        onClose={() => setSelectedReader(null)}
        readerName={selectedReader || ''}
        loans={loans}
      />
    </div>
  );
}
