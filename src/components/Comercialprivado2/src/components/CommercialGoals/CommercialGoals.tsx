import React, { useState, useEffect } from 'react';
import { Plus, Filter, Target, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { ChallengeCard } from '../Challenges/ChallengeCard';
import { AddCommercialGoalModal } from './AddCommercialGoalModal';
import { AssignWinnersModal } from './AssignWinnersModal';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { commercialGoalsService } from '../../services/commercialGoalsService';
import { useSystemVersion } from '../../contexts/SystemVersionContext';

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

export const CommercialGoals: React.FC = () => {
  const { canEdit, canView } = useSystemVersion();
  const canEditGoals = canEdit('challenges');
  const canViewGoals = canView('challenges');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [selectedGoalForWinners, setSelectedGoalForWinners] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [evaluationMessage, setEvaluationMessage] = useState('');

  const { data: goalsData = [], loading, refetch } = useSupabaseQuery('commercial_goals', {
    orderBy: { column: 'end_date', ascending: true }
  });

  const { data: employees = [] } = useSupabaseQuery('employees');
  const { data: weeklyPerformance = [] } = useSupabaseQuery('weekly_performance');
  const { data: proposals = [] } = useSupabaseQuery('proposals');

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

  const evaluateGoals = async () => {
    try {
      const activeGoals = goals.filter(g => g.status === 'active');
      let completedCount = 0;
      let expiredCount = 0;

      for (const goal of activeGoals) {
        const currentDate = new Date();
        const endDate = new Date(goal.endDate);

        if (currentDate > endDate) {
          await commercialGoalsService.markGoalExpired(goal.id);
          expiredCount++;
          continue;
        }

        const currentProgress = await commercialGoalsService.calculateGoalProgress(
          goalsData.find(g => g.id === goal.id)!,
          employees,
          weeklyPerformance,
          proposals
        );

        if (currentProgress >= goal.targetValue) {
          await commercialGoalsService.markGoalCompleted(goal.id, new Date().toISOString());
          completedCount++;
        }
      }

      if (completedCount > 0 || expiredCount > 0) {
        const messages = [];
        if (completedCount > 0) {
          messages.push(`${completedCount} meta${completedCount > 1 ? 's' : ''} alcançada${completedCount > 1 ? 's' : ''}!`);
        }
        if (expiredCount > 0) {
          messages.push(`${expiredCount} meta${expiredCount > 1 ? 's' : ''} expirada${expiredCount > 1 ? 's' : ''}`);
        }
        setEvaluationMessage(messages.join(' • '));

        await refetch();

        setTimeout(() => setEvaluationMessage(''), 5000);
      }

    } catch (error) {
      console.error('Erro ao avaliar metas comerciais:', error);
    }
  };

  useEffect(() => {
    if (goals.length > 0 && employees.length > 0) {
      evaluateGoals();

      const interval = setInterval(evaluateGoals, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [goals.length, employees.length, weeklyPerformance.length, proposals.length]);

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  const sortedGoals = filteredGoals.sort((a, b) => {
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

  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowAddModal(true);
  };

  const handleEditGoal = (goal: CommercialGoal) => {
    setEditingGoal(goal);
    setShowAddModal(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const confirmation = prompt(
      `EXCLUIR META COMERCIAL\n\nTem certeza que deseja excluir a meta "${goal.title}"?\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`
    );

    if (confirmation?.trim() === 'EXCLUIR') {
      try {
        await commercialGoalsService.deleteGoal(goalId);
        await refetch();
        alert('Meta excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir meta:', error);
        alert(`Erro ao excluir meta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const handleAssignWinners = (goal: CommercialGoal) => {
    setSelectedGoalForWinners(goal);
    setShowWinnersModal(true);
  };

  const handleDuplicateGoal = (goal: CommercialGoal) => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const duplicatedGoal = {
      ...goal,
      id: '',
      title: `${goal.title} (Cópia)`,
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      status: 'active' as const,
      winnerIds: undefined,
      completionDate: undefined,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    };

    setEditingGoal(duplicatedGoal);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowWinnersModal(false);
    setEditingGoal(null);
    setSelectedGoalForWinners(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas Comerciais</h1>
          <p className="text-gray-600">
            {canViewGoals && canEditGoals
              ? 'Gerencie metas comerciais e acompanhe o desempenho da equipe'
              : canViewGoals
              ? 'Visualize as metas ativas e acompanhe o progresso'
              : 'Acesso restrito às metas'
            }
          </p>
        </div>
        {canViewGoals && canEditGoals ? (
          <button
            onClick={handleAddGoal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta Comercial</span>
          </button>
        ) : canViewGoals ? (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Modo Somente Leitura</span>
          </div>
        ) : null
        }
      </div>

      {evaluationMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{evaluationMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Metas</p>
              <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Metas Ativas</p>
              <p className="text-2xl font-bold text-blue-600">
                {goals.filter(g => g.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-cyan-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alcançadas</p>
              <p className="text-2xl font-bold text-green-600">
                {goals.filter(g => g.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiradas</p>
              <p className="text-2xl font-bold text-red-600">
                {goals.filter(g => g.status === 'expired').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Filtrar por status:</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas</option>
          <option value="active">Ativas</option>
          <option value="completed">Alcançadas</option>
          <option value="expired">Expiradas</option>
        </select>
        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          Mostrando {sortedGoals.length} de {goals.length} metas
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedGoals.map((goal) => (
          <ChallengeCard
            key={goal.id}
            challenge={goal as any}
            employees={employees}
            weeklyPerformance={weeklyPerformance}
            proposals={proposals}
            onEdit={canEditGoals ? (handleEditGoal as any) : undefined}
            onDelete={canEditGoals ? handleDeleteGoal : undefined}
            onAssignWinners={canEditGoals ? (handleAssignWinners as any) : undefined}
            onDuplicate={canEditGoals ? (handleDuplicateGoal as any) : undefined}
            readOnly={!canEditGoals}
          />
        ))}
      </div>

      {sortedGoals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'Nenhuma meta criada' : `Nenhuma meta ${filter === 'active' ? 'ativa' : filter === 'completed' ? 'alcançada' : 'expirada'}`}
          </h3>
          <p className="text-gray-500">
            {canEditGoals && filter === 'all'
              ? 'Clique em "Nova Meta Comercial" para começar a definir objetivos para sua equipe!'
              : `Não há metas ${filter === 'active' ? 'ativas' : filter === 'completed' ? 'alcançadas' : 'expiradas'} no momento.`
            }
          </p>
        </div>
      )}

      {showAddModal && (
        <AddCommercialGoalModal
          isOpen={showAddModal}
          onClose={handleModalClose}
          goal={editingGoal}
          employees={employees}
        />
      )}

      {showWinnersModal && selectedGoalForWinners && (
        <AssignWinnersModal
          isOpen={showWinnersModal}
          onClose={handleModalClose}
          goal={selectedGoalForWinners}
          employees={employees}
        />
      )}

    </div>
  );
};
