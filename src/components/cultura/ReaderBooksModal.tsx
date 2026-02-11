import { X, BookOpen, Calendar, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface ReaderBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  readerName: string;
  loans: BookLoan[];
}

interface BookDetail {
  livro: string;
  autor: string;
  paginas: number;
  dataEmprestimo: string;
  dataDevolucao: string | null;
  diasLeitura: number | null;
  mediaPaginasDia: number | null;
}

export default function ReaderBooksModal({
  isOpen,
  onClose,
  readerName,
  loans,
}: ReaderBooksModalProps) {
  if (!isOpen) return null;

  const readerLoans = loans.filter((loan) => loan.pessoa === readerName);

  const bookDetails: BookDetail[] = readerLoans.map((loan) => {
    let diasLeitura: number | null = null;
    let mediaPaginasDia: number | null = null;

    if (loan.data_devolucao) {
      const start = new Date(loan.data_emprestimo);
      const end = new Date(loan.data_devolucao);
      diasLeitura = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasLeitura > 0) {
        mediaPaginasDia = loan.numero_paginas / diasLeitura;
      }
    }

    return {
      livro: loan.livro,
      autor: loan.autor,
      paginas: loan.numero_paginas,
      dataEmprestimo: loan.data_emprestimo,
      dataDevolucao: loan.data_devolucao,
      diasLeitura,
      mediaPaginasDia,
    };
  });

  const livrosConcluidos = bookDetails.filter((b) => b.dataDevolucao !== null);
  const livrosLendo = bookDetails.filter((b) => b.dataDevolucao === null);

  const totalPaginas = livrosConcluidos.reduce((sum, book) => sum + book.paginas, 0);
  const mediaPaginasGeral = livrosConcluidos.length > 0
    ? livrosConcluidos.reduce((sum, book) => sum + (book.mediaPaginasDia || 0), 0) / livrosConcluidos.length
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Histórico de Leitura
              </h2>
              <p className="text-sm text-gray-600">{readerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Total de Livros</p>
              <p className="text-2xl font-bold text-blue-600">
                {bookDetails.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">
                {livrosConcluidos.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Total de Páginas</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalPaginas}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Média p/dia</p>
              <p className="text-2xl font-bold text-orange-600">
                {mediaPaginasGeral.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {livrosLendo.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Lendo Atualmente ({livrosLendo.length})
              </h3>
              <div className="space-y-3">
                {livrosLendo.map((book, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{book.livro}</h4>
                        <p className="text-sm text-gray-600">{book.autor}</p>
                      </div>
                      <div className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                        Em Leitura
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          {book.paginas} páginas
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          Início: {format(new Date(book.dataEmprestimo), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {livrosConcluidos.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Livros Concluídos ({livrosConcluidos.length})
              </h3>
              <div className="space-y-3">
                {livrosConcluidos.map((book, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{book.livro}</h4>
                        <p className="text-sm text-gray-600">{book.autor}</p>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Concluído
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                        <BookOpen className="w-4 h-4 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600 mb-1">Páginas</span>
                        <span className="text-sm font-bold text-gray-900">
                          {book.paginas}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                        <Calendar className="w-4 h-4 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600 mb-1">Empréstimo</span>
                        <span className="text-xs font-medium text-gray-900">
                          {format(new Date(book.dataEmprestimo), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                        <Calendar className="w-4 h-4 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600 mb-1">Devolução</span>
                        <span className="text-xs font-medium text-gray-900">
                          {book.dataDevolucao && format(new Date(book.dataDevolucao), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                        <Clock className="w-4 h-4 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600 mb-1">Tempo</span>
                        <span className="text-sm font-bold text-blue-600">
                          {book.diasLeitura} {book.diasLeitura === 1 ? 'dia' : 'dias'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-blue-50 rounded border border-blue-200">
                        <TrendingUp className="w-4 h-4 text-blue-600 mb-1" />
                        <span className="text-xs text-gray-600 mb-1">Média/dia</span>
                        <span className="text-sm font-bold text-blue-600">
                          {book.mediaPaginasDia?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookDetails.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum livro encontrado para este leitor</p>
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
