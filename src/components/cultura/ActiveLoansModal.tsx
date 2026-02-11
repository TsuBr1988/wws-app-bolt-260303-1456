import { X, BookOpen, User, Clock } from 'lucide-react';
import { Button } from '../ui/button';

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

interface ActiveLoansModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: BookLoan[];
}

export default function ActiveLoansModal({
  isOpen,
  onClose,
  loans,
}: ActiveLoansModalProps) {
  if (!isOpen) return null;

  const activeLoans = loans.filter((loan) => !loan.data_devolucao);

  const loansWithDays = activeLoans.map((loan) => {
    const startDate = new Date(loan.data_emprestimo);
    const today = new Date();
    const daysWithBook = Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { ...loan, daysWithBook };
  });

  const sortedLoans = loansWithDays.sort((a, b) => b.daysWithBook - a.daysWithBook);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Livros Emprestados ({sortedLoans.length})
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
          {sortedLoans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum livro emprestado no momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedLoans.map((loan, index) => (
                <div
                  key={loan.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    index === 0
                      ? 'bg-red-50 border-red-300'
                      : loan.daysWithBook > 30
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {loan.livro}
                        </h3>
                        <span className="text-xs text-gray-500">-</span>
                        <p className="text-xs text-gray-600 truncate">{loan.autor}</p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-6">
                        <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{loan.pessoa}</span>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0 ${
                        loan.daysWithBook > 30
                          ? 'bg-red-100 text-red-700'
                          : loan.daysWithBook > 15
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold whitespace-nowrap">
                        {loan.daysWithBook} {loan.daysWithBook === 1 ? 'dia' : 'dias'}
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
    </div>
  );
}
