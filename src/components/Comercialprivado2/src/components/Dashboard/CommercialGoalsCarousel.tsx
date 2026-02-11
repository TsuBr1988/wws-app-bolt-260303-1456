import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Target, Trophy } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { CommercialGoalCardSimple } from './CommercialGoalCardSimple';
import { commercialGoalsService } from '../../services/commercialGoalsService';

type CommercialGoal = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  prize: string;
  targetType: 'points' | 'sales' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao' | 'valores_mensais_contratos';
  targetValue: number;
  status: 'active' | 'completed' | 'expired';
  participantsIds?: string[];
  winnerIds?: string[];
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
};

export const CommercialGoalsCarousel: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const CARDS_PER_PAGE = 3;

  const { data: goalsData = [], loading: goalsLoading, refetch } = useSupabaseQuery('commercial_goals');
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');
  const { data: weeklyPerformance = [], loading: performanceLoading } = useSupabaseQuery('weekly_performance');
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');

  const goals: CommercialGoal[] = goalsData.map(g => ({
    id: g.id,
    title: g.title,
    description: g.description || undefined,
    startDate: g.start_date,
    endDate: g.end_date,
    prize: g.prize,
    targetType: g.target_type as 'points' | 'sales' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao' | 'valores_mensais_contratos',
    targetValue: g.target_value,
    status: g.status as 'active' | 'completed' | 'expired',
    participantsIds: g.participants_ids || undefined,
    winnerIds: g.winner_ids || undefined,
    completionDate: g.completion_date || undefined,
    createdAt: g.created_at,
    updatedAt: g.updated_at
  }));

  const sortedGoals = goals.sort((a, b) => {
    const statusPriority = { 'active': 1, 'expired': 2, 'completed': 3 };
    const aPriority = statusPriority[a.status] || 999;
    const bPriority = statusPriority[b.status] || 999;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    const dateA = new Date(a.endDate);
    const dateB = new Date(b.endDate);
    return dateA.getTime() - dateB.getTime();
  });

  const totalPages = Math.ceil(sortedGoals.length / CARDS_PER_PAGE);
  const startIndex = currentPage * CARDS_PER_PAGE;
  const visibleGoals = sortedGoals.slice(startIndex, startIndex + CARDS_PER_PAGE);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const loading = goalsLoading || employeesLoading || performanceLoading || proposalsLoading;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (sortedGoals.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Desafios Ativos</h2>
              <p className="text-gray-500 text-sm">{sortedGoals.length} {sortedGoals.length === 1 ? 'desafio' : 'desafios'} em andamento</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Nenhuma meta comercial cadastrada</p>
          <p className="text-gray-400 text-sm mt-2">Acesse a aba "Metas Comerciais" para criar novas metas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Desafios Ativos</h2>
            <p className="text-gray-500 text-sm">{sortedGoals.length} {sortedGoals.length === 1 ? 'desafio' : 'desafios'} em andamento</p>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-sm text-gray-700 font-medium min-w-[80px] text-center">
              {startIndex + 1}-{Math.min(startIndex + CARDS_PER_PAGE, sortedGoals.length)} de {sortedGoals.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleGoals.map((goal) => (
          <CommercialGoalCardSimple
            key={goal.id}
            goal={goal}
            employees={employees}
            weeklyPerformance={weeklyPerformance}
            proposals={proposals}
          />
        ))}
      </div>
    </div>
  );
};
