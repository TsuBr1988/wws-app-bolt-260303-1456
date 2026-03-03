import { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, BookOpen, Calendar, Clock, FileText, TrendingUp, Check, Pen, X } from 'lucide-react';
import { getDatabase } from '../../lib/databaseResolver';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';

const supabase = getDatabase('CULTURA');

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

interface BookLoanCardProps {
  loan: BookLoan;
  onUpdate: () => void;
}

export default function BookLoanCard({ loan, onUpdate }: BookLoanCardProps) {
  const { toast } = useToast();
  const [isReturning, setIsReturning] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

  const startDate = new Date(loan.data_emprestimo);
  const endDate = loan.data_devolucao ? new Date(loan.data_devolucao) : new Date();
  const daysWithBook = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const pagesPerDay = (loan.numero_paginas / daysWithBook).toFixed(1);

  const handleReturn = async () => {
    try {
      setIsReturning(true);
      const { error } = await supabase
        .from('book_loans')
        .update({ data_devolucao: returnDate })
        .eq('id', loan.id);

      if (error) throw error;

      toast({
        title: 'Livro devolvido',
        description: 'O livro foi marcado como devolvido com sucesso.',
      });

      setShowReturnModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error returning book:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar o livro como devolvido.',
        variant: 'destructive',
      });
    } finally {
      setIsReturning(false);
    }
  };

  const handleReopen = async () => {
    try {
      setIsReturning(true);
      const { error } = await supabase
        .from('book_loans')
        .update({ data_devolucao: null })
        .eq('id', loan.id);

      if (error) throw error;

      toast({
        title: 'Livro reaberto',
        description: 'O livro foi marcado como em aberto novamente.',
      });

      setShowReopenModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error reopening book:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reabrir o livro.',
        variant: 'destructive',
      });
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div
      className={`p-3 rounded-xl border-2 transition-all ${
        loan.data_devolucao
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-xl transform hover:scale-[1.02]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-bold text-brand-dark truncate">{loan.livro}</span>
            <span className="text-xs text-gray-500">-</span>
            <span className="text-xs text-gray-600 truncate">{loan.autor}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-6">
            <User className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="text-xs text-gray-700 font-medium truncate">{loan.pessoa}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600">Empréstimo:</span>
            <span className="font-medium text-gray-900">
              {new Date(loan.data_emprestimo).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            <FileText className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600">Páginas:</span>
            <span className="font-medium text-gray-900">{loan.numero_paginas}</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            <Clock className="w-3 h-3 text-green-600" />
            <span className="text-gray-600">Dias com livro:</span>
            <span className="font-medium text-gray-900">{daysWithBook}</span>
          </div>
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-gray-600">Média/dia:</span>
            <span className="font-bold text-green-700">{pagesPerDay} pág</span>
          </div>
        </div>

        <div className="flex items-center">
          {loan.data_devolucao ? (
            <button
              onClick={() => setShowReopenModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                <span>{daysWithBook} {daysWithBook === 1 ? 'dia' : 'dias'}</span>
              </div>
            </button>
          ) : (
            <Button
              onClick={() => setShowReturnModal(true)}
              variant="outline"
              size="sm"
              className="whitespace-nowrap text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Devolver
            </Button>
          )}
        </div>
      </div>

      {showReturnModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-2 border-gray-200 relative z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-dark">Marcar como Devolvido</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Devolução
              </label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={loan.data_emprestimo}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Selecione a data em que o livro foi devolvido
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowReturnModal(false)}
                variant="outline"
                className="flex-1"
                disabled={isReturning}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReturn}
                className="flex-1"
                disabled={isReturning}
              >
                {isReturning ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showReopenModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-2 border-gray-200 relative z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-dark">Reabrir Livro</h3>
              <button
                onClick={() => setShowReopenModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Tem certeza que quer reabrir o livro <span className="font-semibold">"{loan.livro}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                O livro voltará para o estado "Em Aberto" e a data de devolução será removida.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowReopenModal(false)}
                variant="outline"
                className="flex-1"
                disabled={isReturning}
              >
                Não
              </Button>
              <Button
                onClick={handleReopen}
                className="flex-1"
                disabled={isReturning}
              >
                {isReturning ? 'Reabrindo...' : 'Sim, Reabrir'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
