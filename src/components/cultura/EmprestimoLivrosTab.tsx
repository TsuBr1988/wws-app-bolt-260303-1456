import { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Clock, Trophy, Calendar, ArrowUpDown } from 'lucide-react';
import { getDatabase } from '../../lib/databaseResolver';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import BookLoanCard from './BookLoanCard';
import AddBookLoanModal from './AddBookLoanModal';
import RankingModal from './RankingModal';
import MonthlyRankingModal from './MonthlyRankingModal';
import ActiveLoansModal from './ActiveLoansModal';
import { startOfMonth, endOfMonth } from 'date-fns';

const supabase = getDatabase('CULTURA');

type SortType = 'avg_per_day' | 'book_name' | 'person_name';

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

export default function EmprestimoLivrosTab() {
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<BookLoan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<SortType>('avg_per_day');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isMonthlyRankingModalOpen, setIsMonthlyRankingModalOpen] = useState(false);
  const [isActiveLoansModalOpen, setIsActiveLoansModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    let filtered = loans;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = loans.filter(
        (loan) =>
          loan.pessoa.toLowerCase().includes(term) ||
          loan.livro.toLowerCase().includes(term) ||
          loan.autor.toLowerCase().includes(term)
      );
    }

    // Calculate average pages per day for active loans
    const calculateAvgPerDay = (loan: BookLoan) => {
      const start = new Date(loan.data_emprestimo);
      const end = loan.data_devolucao ? new Date(loan.data_devolucao) : new Date();
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return loan.numero_paginas / days;
    };

    // Sort based on selected sort type
    const sorted = filtered.sort((a, b) => {
      // Always prioritize active loans (without data_devolucao)
      if (!a.data_devolucao && b.data_devolucao) return -1;
      if (a.data_devolucao && !b.data_devolucao) return 1;

      // Within the same category (active or completed), apply the sort type
      switch (sortType) {
        case 'avg_per_day':
          // Lower average per day comes first (slower readers, longer with the book)
          return calculateAvgPerDay(a) - calculateAvgPerDay(b);

        case 'book_name':
          return a.livro.localeCompare(b.livro);

        case 'person_name':
          return a.pessoa.localeCompare(b.pessoa);

        default:
          return new Date(b.data_emprestimo).getTime() - new Date(a.data_emprestimo).getTime();
      }
    });

    setFilteredLoans(sorted);
  }, [searchTerm, loans, sortType]);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('book_loans')
        .select('*')
        .order('data_emprestimo', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching book loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeLoans = loans.filter((loan) => !loan.data_devolucao);
  const completedLoans = loans.filter((loan) => loan.data_devolucao);

  const livrosEmprestados = activeLoans.length;

  const tempoMedioLeitura =
    completedLoans.length > 0
      ? Math.round(
          completedLoans.reduce((acc, loan) => {
            const start = new Date(loan.data_emprestimo);
            const end = new Date(loan.data_devolucao!);
            const days = Math.ceil(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            );
            return acc + days;
          }, 0) / completedLoans.length
        )
      : 0;

  const pessoasLendo = new Set(activeLoans.map((loan) => loan.pessoa)).size;

  const mediaPaginasPorDia =
    completedLoans.length > 0
      ? Math.round(
          completedLoans.reduce((acc, loan) => {
            const start = new Date(loan.data_emprestimo);
            const end = new Date(loan.data_devolucao!);
            const days = Math.ceil(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            );
            const paginasPorDia = days > 0 ? loan.numero_paginas / days : 0;
            return acc + paginasPorDia;
          }, 0) / completedLoans.length
        )
      : 0;

  const calculateTopReaders = () => {
    const statsMap = new Map<string, { nome: string; mediaPaginasTempo: number }>();

    loans.forEach((loan) => {
      const pessoa = loan.pessoa;

      if (!statsMap.has(pessoa)) {
        statsMap.set(pessoa, {
          nome: pessoa,
          mediaPaginasTempo: 0,
        });
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

    return statsArray
      .sort((a, b) => b.mediaPaginasTempo - a.mediaPaginasTempo)
      .slice(0, 3);
  };

  const topReaders = calculateTopReaders();

  const calculateCurrentMonthTopReader = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const statsMap = new Map<string, { nome: string; paginasLidasNoMes: number }>();

    const monthLoans = loans.filter((loan) => {
      if (!loan.data_devolucao) return false;
      const returnDate = new Date(loan.data_devolucao);
      return returnDate >= monthStart && returnDate <= monthEnd;
    });

    monthLoans.forEach((loan) => {
      const pessoa = loan.pessoa;
      if (!statsMap.has(pessoa)) {
        statsMap.set(pessoa, {
          nome: pessoa,
          paginasLidasNoMes: 0,
        });
      }
      const stats = statsMap.get(pessoa)!;
      stats.paginasLidasNoMes += loan.numero_paginas;
    });

    const statsArray = Array.from(statsMap.values());
    const sorted = statsArray.sort((a, b) => b.paginasLidasNoMes - a.paginasLidasNoMes);
    return sorted.length > 0 ? sorted[0] : null;
  };

  const currentMonthTopReader = calculateCurrentMonthTopReader();

  return (
    <div>
      <div className="mb-8 text-center py-4 relative">
        <div className="absolute inset-0 gradient-2ws opacity-10 rounded-2xl blur-3xl"></div>
        <h1 className="text-3xl font-bold text-brand-dark mb-2 relative">
          Empréstimo de Livros
        </h1>
        <p className="text-gray-600 font-medium relative">
          Controle e acompanhe os empréstimos de livros
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 gradient-tecnologia opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="gradient-tecnologia p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 font-medium">Atividade de Leitura</p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Livros Emprestados</span>
                <span className="text-xl font-bold text-brand-dark">{livrosEmprestados}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Pessoas Lendo</span>
                <span className="text-xl font-bold text-brand-dark">{pessoasLendo}</span>
              </div>
            </div>
            <button
              onClick={() => setIsActiveLoansModalOpen(true)}
              className="w-full py-2 px-3 gradient-tecnologia hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-md"
            >
              Ver Detalhes
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 gradient-ambiental opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="gradient-ambiental p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 font-medium">Desempenho</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tempo Médio de Leitura</span>
                <span className="text-xl font-bold text-brand-dark">{tempoMedioLeitura} dias</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Média de páginas/dia</span>
                <span className="text-xl font-bold text-brand-dark">{mediaPaginasPorDia}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 gradient-facilities opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="gradient-facilities p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 font-medium">Ranking</p>
            {topReaders.length > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {topReaders.map((reader, index) => (
                    <div
                      key={reader.nome}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0
                          ? 'bg-yellow-50 border border-yellow-200'
                          : index === 1
                          ? 'bg-gray-50 border border-gray-200'
                          : 'bg-orange-50 border border-orange-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? 'bg-yellow-500 text-white'
                              : index === 1
                              ? 'bg-gray-400 text-white'
                              : 'bg-orange-500 text-white'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-brand-dark truncate max-w-[120px]">
                          {reader.nome}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-brand-dark">
                        {reader.mediaPaginasTempo > 0
                          ? reader.mediaPaginasTempo.toFixed(1)
                          : '0.0'}{' '}
                        p/d
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setIsRankingModalOpen(true)}
                  className="w-full py-2 px-3 gradient-facilities hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                >
                  Ver Mais
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">Nenhum leitor no ranking ainda</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden relative">
          <div className="absolute inset-0 gradient-parking opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="gradient-parking p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 font-medium">Ranking do Mês</p>
            {currentMonthTopReader ? (
              <>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mb-4 border-2 border-gray-200">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 gradient-parking text-white rounded-full font-bold text-lg mb-2 shadow-md">
                      1
                    </div>
                    <p className="font-bold text-brand-dark text-lg truncate">
                      {currentMonthTopReader.nome}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentMonthTopReader.paginasLidasNoMes} páginas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMonthlyRankingModalOpen(true)}
                  className="w-full py-2 px-3 gradient-parking hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                >
                  Ver Histórico
                </button>
              </>
            ) : (
              <>
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">Nenhum livro concluído este mês</p>
                </div>
                <button
                  onClick={() => setIsMonthlyRankingModalOpen(true)}
                  className="w-full py-2 px-3 gradient-parking hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                >
                  Ver Histórico
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar pessoa, livro ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
                className="appearance-none h-10 pl-10 pr-10 border-2 border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all font-medium text-sm"
              >
                <option value="avg_per_day">Média/Dia (menor primeiro)</option>
                <option value="book_name">Nome do Livro</option>
                <option value="person_name">Nome do Funcionário</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Empréstimo
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando empréstimos...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm
                ? 'Nenhum empréstimo encontrado'
                : 'Nenhum empréstimo cadastrado'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLoans.map((loan) => (
              <BookLoanCard
                key={loan.id}
                loan={loan}
                onUpdate={fetchLoans}
              />
            ))}
          </div>
        )}
      </div>

      <AddBookLoanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchLoans}
      />

      <RankingModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
        loans={loans}
      />

      <MonthlyRankingModal
        isOpen={isMonthlyRankingModalOpen}
        onClose={() => setIsMonthlyRankingModalOpen(false)}
        loans={loans}
      />

      <ActiveLoansModal
        isOpen={isActiveLoansModalOpen}
        onClose={() => setIsActiveLoansModalOpen(false)}
        loans={loans}
      />
    </div>
  );
}
