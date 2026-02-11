import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Award, Calendar, Target, DollarSign, Trophy } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { challengeService } from '../../services/challengeService';
import { formatCurrency } from '../../utils/formatCurrency';
import { Challenge } from '../../types';
import { ChallengeProgressModal } from '../Challenges/ChallengeProgressModal';

export const DashboardChallengesCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [challengeProgresses, setChallengeProgresses] = useState<Record<string, number>>({});

  const { data: challengesData = [], loading } = useSupabaseQuery('challenges', {
    orderBy: { column: 'end_date', ascending: true },
    includeDepartmentFilter: true
  });

  const { data: employees = [] } = useSupabaseQuery('employees');
  const { data: weeklyPerformance = [] } = useSupabaseQuery('weekly_performance');
  const { data: proposals = [] } = useSupabaseQuery('proposals');

  const challenges: Challenge[] = challengesData
    .filter(c => c.status === 'active')
    .map(c => ({
      id: c.id,
      title: c.title,
      description: c.description || undefined,
      startDate: c.start_date,
      endDate: c.end_date,
      rewardAmount: c.reward_amount,
      targetType: c.target_type as 'points' | 'sales' | 'monthly_value' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao',
      targetValue: c.target_value,
      status: c.status as 'active' | 'completed' | 'expired',
      participantsIds: c.participants_ids || undefined,
      winnerIds: c.winner_ids || undefined,
      completionDate: c.completion_date || undefined,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }))
    .sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      const getMetaOrder = (title: string) => {
        if (title.includes('meta 2026') && !title.includes('super') && !title.includes('mega') && !title.includes('ultra')) return 1;
        if (title.includes('supermeta 2026')) return 2;
        if (title.includes('megameta 2026')) return 3;
        if (title.includes('ultrameta 2026')) return 4;
        return 999;
      };

      const orderA = getMetaOrder(titleA);
      const orderB = getMetaOrder(titleB);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      const dateA = new Date(a.endDate);
      const dateB = new Date(b.endDate);
      return dateA.getTime() - dateB.getTime();
    });

  useEffect(() => {
    const calculateAllProgresses = async () => {
      const progresses: Record<string, number> = {};

      for (const challenge of challenges) {
        try {
          const challengeData = challengesData.find(c => c.id === challenge.id);
          if (challengeData) {
            const progress = await challengeService.calculateChallengeProgress(
              challengeData,
              employees,
              weeklyPerformance,
              proposals
            );
            progresses[challenge.id] = progress;
          }
        } catch (error) {
          console.error('Erro ao calcular progresso:', error);
          progresses[challenge.id] = 0;
        }
      }

      setChallengeProgresses(progresses);
    };

    if (challenges.length > 0) {
      calculateAllProgresses();
    }
  }, [challenges.length, employees.length, weeklyPerformance.length, proposals.length]);

  const visibleChallenges = challenges.slice(currentIndex, currentIndex + 3);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex + 3 < challenges.length;

  const handlePrevious = () => {
    if (canGoLeft) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const handleNext = () => {
    if (canGoRight) {
      setCurrentIndex(Math.min(challenges.length - 3, currentIndex + 1));
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTargetLabel = (targetType: string) => {
    const labels: Record<string, string> = {
      points: 'Pontos',
      sales: 'Vendas',
      monthly_value: 'Valor Mensal',
      mql: 'MQLs',
      visitas_agendadas: 'Visitas Agendadas',
      contratos_assinados: 'Contratos Assinados',
      pontos_educacao: 'Pontos Educação'
    };
    return labels[targetType] || targetType;
  };

  const formatTargetValue = (value: number, targetType: string) => {
    if (targetType === 'monthly_value' || targetType === 'sales') {
      return formatCurrency(value);
    }
    return value.toFixed(0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-sm border-2 border-blue-200 p-8">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum desafio ativo</h3>
          <p className="text-gray-600">Não há desafios ativos no momento</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Desafios Ativos</h2>
              <p className="text-gray-600">{challenges.length} desafio{challenges.length !== 1 ? 's' : ''} em andamento</p>
            </div>
          </div>

          {challenges.length > 3 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                disabled={!canGoLeft}
                className={`p-2 rounded-lg transition-colors ${
                  canGoLeft
                    ? 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                {currentIndex + 1}-{Math.min(currentIndex + 3, challenges.length)} de {challenges.length}
              </span>
              <button
                onClick={handleNext}
                disabled={!canGoRight}
                className={`p-2 rounded-lg transition-colors ${
                  canGoRight
                    ? 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleChallenges.map((challenge) => {
            const progress = challengeProgresses[challenge.id] || 0;
            const progressPercentage = (progress / challenge.targetValue) * 100;
            const daysRemaining = getDaysRemaining(challenge.endDate);

            const getMotivationalMessage = () => {
              if (progressPercentage >= 100) return '🎉 Meta alcançada! Parabéns!';
              if (progressPercentage >= 90) return '🔥 Quase lá! Falta muito pouco!';
              if (progressPercentage >= 75) return '💪 Você está indo muito bem!';
              if (progressPercentage >= 50) return '⚡ Continue firme! Você consegue!';
              if (progressPercentage >= 25) return '🚀 Bom começo! Mantenha o ritmo!';
              return '💡 Hora de começar com tudo!';
            };

            const getUrgencyColor = () => {
              if (daysRemaining <= 3) return 'from-red-500 to-red-600';
              if (daysRemaining <= 7) return 'from-orange-500 to-orange-600';
              return 'from-blue-500 to-blue-600';
            };

            return (
              <button
                key={challenge.id}
                onClick={() => setSelectedChallenge(challenge)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left overflow-hidden border-2 border-gray-100 flex flex-col"
              >
                <div className={`bg-gradient-to-r ${getUrgencyColor()} p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1 line-clamp-2">
                        {challenge.title}
                      </h3>
                      {daysRemaining > 0 && (
                        <div className="flex items-center space-x-1 text-white/90 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <Trophy className="w-8 h-8 text-white/90 flex-shrink-0 ml-2" />
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border-2 border-yellow-200 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Prêmio</span>
                    </div>
                    <p className="text-xl font-bold text-yellow-900 leading-tight">
                      {challenge.rewardAmount}
                    </p>
                  </div>

                  {challenge.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {challenge.description}
                    </p>
                  )}

                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{getTargetLabel(challenge.targetType)}</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatTargetValue(challenge.targetValue, challenge.targetType)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Seu progresso:</span>
                      <span className="font-bold text-blue-600">
                        {formatTargetValue(progress, challenge.targetType)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">{getMotivationalMessage()}</span>
                      <span className="font-bold text-lg text-gray-900">
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                          progressPercentage >= 100
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : progressPercentage >= 75
                            ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                            : progressPercentage >= 50
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : 'bg-gradient-to-r from-orange-400 to-orange-600'
                        }`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>

                    {progressPercentage >= 100 && (
                      <div className="mt-3 bg-green-50 border-2 border-green-300 rounded-lg p-2 text-center">
                        <span className="text-sm font-bold text-green-700">🏆 OBJETIVO CONQUISTADO! 🏆</span>
                      </div>
                    )}

                    {progressPercentage < 100 && daysRemaining <= 3 && daysRemaining > 0 && (
                      <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-2 text-center">
                        <span className="text-xs font-bold text-red-700">⏰ ÚLTIMA CHANCE! DÊ TUDO DE SI!</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedChallenge && (
        <ChallengeProgressModal
          challenge={selectedChallenge}
          challengeRaw={challengesData.find(c => c.id === selectedChallenge.id)!}
          employees={employees}
          weeklyPerformance={weeklyPerformance}
          proposals={proposals}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </>
  );
};
