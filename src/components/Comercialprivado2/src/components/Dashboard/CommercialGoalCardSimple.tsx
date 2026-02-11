import React from 'react';
import { Trophy, Calendar, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
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

interface CommercialGoalCardSimpleProps {
  goal: CommercialGoal;
  employees: any[];
  weeklyPerformance: any[];
  proposals: any[];
}

export const CommercialGoalCardSimple: React.FC<CommercialGoalCardSimpleProps> = ({
  goal,
  employees,
  weeklyPerformance,
  proposals
}) => {
  const targetTypeLabels = {
    points: 'Pontos',
    sales: 'Vendas',
    mql: 'MQLs',
    visitas_agendadas: 'Visitas Agendadas',
    contratos_assinados: 'Contratos Assinados',
    pontos_educacao: 'Pontos de Educação',
    valores_mensais_contratos: 'Valor Mensal de Contratos'
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(goal.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const [currentProgress, setCurrentProgress] = React.useState(0);
  const [progressPercentage, setProgressPercentage] = React.useState(0);

  React.useEffect(() => {
    const calculateProgress = async () => {
      try {
        const dbGoal = {
          id: goal.id,
          title: goal.title,
          description: goal.description || null,
          start_date: goal.startDate,
          end_date: goal.endDate,
          prize: goal.prize,
          target_type: goal.targetType,
          target_value: goal.targetValue,
          status: goal.status,
          participants_ids: goal.participantsIds || null,
          winner_ids: goal.winnerIds || null,
          completion_date: goal.completionDate || null,
          created_at: goal.createdAt,
          updated_at: goal.updatedAt
        };

        const participantIds = goal.participantsIds && goal.participantsIds.length > 0
          ? goal.participantsIds
          : employees.filter(emp => emp.role !== 'Admin').map(emp => emp.id);

        let maxProgress = 0;

        for (const participantId of participantIds) {
          const individualProgress = await commercialGoalsService.calculateGoalProgress(
            dbGoal,
            employees,
            weeklyPerformance,
            proposals,
            participantId
          );

          if (individualProgress > maxProgress) {
            maxProgress = individualProgress;
          }
        }

        setCurrentProgress(maxProgress);
        const percentage = Math.min((maxProgress / goal.targetValue) * 100, 100);
        setProgressPercentage(percentage);
      } catch (error) {
        console.error('Erro ao calcular progresso:', error);
        setCurrentProgress(0);
        setProgressPercentage(0);
      }
    };

    if (goal.status === 'active') {
      calculateProgress();
    }
  }, [goal, employees, weeklyPerformance, proposals]);
  const daysRemaining = getDaysRemaining();

  const getStatusColor = () => {
    if (goal.status === 'completed') return 'bg-green-600';
    if (goal.status === 'expired') return 'bg-gray-600';
    return 'bg-blue-600';
  };

  const getMotivationalMessage = () => {
    if (progressPercentage === 0) return 'Hora de começar com tudo!';
    if (progressPercentage < 25) return 'Você consegue! Continue assim!';
    if (progressPercentage < 50) return 'Bom trabalho! Está no caminho certo!';
    if (progressPercentage < 75) return 'Ótimo progresso! Não pare agora!';
    if (progressPercentage < 100) return 'Quase lá! Falta pouco!';
    return 'Meta atingida! Parabéns!';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header azul */}
      <div className={`${getStatusColor()} text-white p-4 relative`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">{goal.title}</h3>
            <div className="flex items-center text-sm opacity-90">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{daysRemaining} dias restantes</span>
            </div>
          </div>
          <Trophy className="w-8 h-8 opacity-90" />
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-4">
        {/* Seção Prêmio - fundo amarelo claro */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <Trophy className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
              PRÊMIO
            </span>
          </div>
          <p className="text-amber-900 font-semibold text-sm leading-relaxed">
            {goal.prize}
          </p>
        </div>

        {/* Descrição da meta */}
        {goal.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {goal.description}
          </p>
        )}

        {/* Seção de valores e progresso */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Target className="w-4 h-4 mr-2" />
              <span>
                {goal.targetType === 'valores_mensais_contratos'
                  ? 'Valor Mensal'
                  : targetTypeLabels[goal.targetType]}
              </span>
            </div>
            <span className="font-bold text-gray-900">
              {goal.targetType === 'valores_mensais_contratos' || goal.targetType === 'sales'
                ? formatCurrency(goal.targetValue)
                : `${goal.targetValue} ${targetTypeLabels[goal.targetType]}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Seu progresso:</span>
            <span className="font-bold text-blue-600">
              {goal.targetType === 'valores_mensais_contratos' || goal.targetType === 'sales'
                ? formatCurrency(currentProgress)
                : currentProgress}
            </span>
          </div>
        </div>

        {/* Footer com motivação e progresso */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">💡</span>
              <span>{getMotivationalMessage()}</span>
            </div>
            <span className="font-bold text-gray-900">{progressPercentage.toFixed(0)}%</span>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progressPercentage >= 100
                  ? 'bg-green-500'
                  : progressPercentage >= 75
                  ? 'bg-blue-500'
                  : progressPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
