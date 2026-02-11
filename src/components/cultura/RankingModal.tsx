import { useState } from 'react';
import { X, Trophy, BookOpen, CheckCircle2, FileText, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
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

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: BookLoan[];
}

interface PersonStats {
  nome: string;
  livrosLendo: number;
  livrosConcluidos: number;
  paginasConcluidas: number;
  mediaPaginasTempo: number;
}

export default function RankingModal({
  isOpen,
  onClose,
  loans,
}: RankingModalProps) {
  const [selectedReader, setSelectedReader] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculateStats = (): PersonStats[] => {
    const statsMap = new Map<string, PersonStats>();

    loans.forEach((loan) => {
      const pessoa = loan.pessoa;

      if (!statsMap.has(pessoa)) {
        statsMap.set(pessoa, {
          nome: pessoa,
          livrosLendo: 0,
          livrosConcluidos: 0,
          paginasConcluidas: 0,
          mediaPaginasTempo: 0,
        });
      }

      const stats = statsMap.get(pessoa)!;

      if (loan.data_devolucao) {
        stats.livrosConcluidos++;
        stats.paginasConcluidas += loan.numero_paginas;
      } else {
        stats.livrosLendo++;
      }
    });

    const statsArray = Array.from(statsMap.values());

    statsArray.forEach((stats) => {
      const completedLoans = loans.filter(
        (loan) => loan.pessoa === stats.nome && loan.data_devolucao
      );

      if (completedLoans.length > 0) {
        const totalPages = completedLoans.reduce(
          (sum, loan) => sum + loan.numero_paginas,
          0
        );
        const totalDays = completedLoans.reduce((sum, loan) => {
          const start = new Date(loan.data_emprestimo);
          const end = new Date(loan.data_devolucao!);
          const days = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);

        stats.mediaPaginasTempo = totalPages / totalDays;
      }
    });

    return statsArray.sort((a, b) => b.mediaPaginasTempo - a.mediaPaginasTempo);
  };

  const ranking = calculateStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Trophy className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Ranking de Leitores
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {ranking.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum leitor encontrado</p>
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

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <BookOpen className="w-5 h-5 text-blue-600 mb-2" />
                      <span className="text-xs text-gray-600 mb-1">Lendo</span>
                      <span className="text-lg font-bold text-gray-900">
                        {person.livrosLendo}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
                      <span className="text-xs text-gray-600 mb-1">
                        Concluídos
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {person.livrosConcluidos}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <FileText className="w-5 h-5 text-purple-600 mb-2" />
                      <span className="text-xs text-gray-600 mb-1">
                        Páginas
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {person.paginasConcluidas}
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-200 col-span-2 md:col-span-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
                      <span className="text-xs text-gray-600 mb-1">
                        Média páginas/dia
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {person.mediaPaginasTempo > 0
                          ? person.mediaPaginasTempo.toFixed(1)
                          : '0.0'}
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
