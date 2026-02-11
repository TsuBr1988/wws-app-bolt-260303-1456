/**
 * Componente: ChallengesAndRewardsCard
 * 
 * Propósito: Exibir resumo de desafios e prêmios no Dashboard principal
 * - Status dos desafios em andamento (ativos, concluídos, expirados)
 * - Lista detalhada de desafios com informações essenciais
 * - Rolagem interna para suportar muitos desafios
 * - Visual consistente com outros cards do dashboard
 */

import React from 'react';
import { Award, Users, Calendar, Trophy, Clock, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const ChallengesAndRewardsCard: React.FC = () => {
  // Dados simulados - podem ser substituídos por dados do Supabase
  const challenges = [
    {
      id: '1',
      title: 'A educação é o caminho',
      description: 'Meta: 70 pts educação | 17 dias restantes | André Silva e mais 2',
      participants: ['André Silva', '+2 outros'],
      prize: 'R$ 200,00',
      status: 'active',
      daysRemaining: 17,
      progress: 'Com a meta atingida: 1º colocado em pontos: R$ 200,00 • 1 dia de folga: 2º colocado em pontos: R$ 50,00 • 1 dia de folga: 3º',
      type: 'education'
    },
    {
      id: '2',
      title: 'Competição sadia',
      description: 'Meta: 100 pontos | 17 dias restantes | André Silva e mais 2',
      participants: ['André Silva', '+2 outros'],
      prize: 'R$ 150,00',
      status: 'active',
      daysRemaining: 17,
      progress: 'Prêmio de R$ 150,00',
      type: 'points'
    },
    {
      id: '3',
      title: 'Quem agenda mais?',
      description: 'Meta: 15 visitas | 48 dias restantes | Pedro Domingues, Andressa Cordeiro',
      participants: ['Pedro Domingues', 'Andressa Cordeiro'],
      prize: '150,00',
      status: 'active',
      daysRemaining: 48,
      progress: '',
      type: 'meetings'
    },
    {
      id: '4',
      title: 'Liberação do fundo de bonificação',
      description: 'Fundo: 600 pontos | 48 dias restantes | André Silva e mais 2',
      participants: ['André Silva', '+2 outros'],
      prize: 'No momento da meta conquistada, liberamos o valor que tem no fundo de bonificação',
      status: 'active',
      daysRemaining: 48,
      progress: '',
      type: 'bonus'
    }
  ];

  const activeChallenges = challenges.filter(c => c.status === 'active').length;
  const completedChallenges = 0; // Baseado na imagem
  const expiredChallenges = 2; // Baseado na imagem

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'education': return <Trophy className="w-4 h-4 text-purple-500" />;
      case 'points': return <Target className="w-4 h-4 text-blue-500" />;
      case 'meetings': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'bonus': return <Award className="w-4 h-4 text-orange-500" />;
      default: return <Award className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Award className="w-6 h-6 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Desafios e Prêmios</h2>
        </div>
        <p className="text-sm text-gray-500">Status dos desafios em andamento</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{activeChallenges}</div>
          <div className="text-sm text-blue-700">Ativos</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600">{completedChallenges}</div>
          <div className="text-sm text-green-700">Concluídos</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{expiredChallenges}</div>
          <div className="text-sm text-red-700">Expirados</div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-4">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
            {/* Challenge Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getChallengeIcon(challenge.type)}
                <h3 className="font-semibold text-gray-900 text-sm">{challenge.title}</h3>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">
                  {challenge.daysRemaining} dias
                </span>
              </div>
            </div>

            {/* Challenge Description */}
            <div className="text-xs text-gray-600 mb-3">
              {challenge.description}
            </div>

            {/* Participants */}
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {challenge.participants.join(', ')}
              </span>
            </div>

            {/* Prize */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
              <div className="text-xs font-medium text-yellow-800">
                🏆 Prêmio: {challenge.prize}
              </div>
            </div>

            {/* Progress/Notes */}
            {challenge.progress && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                {challenge.progress}
              </div>
            )}
          </div>
        ))}

        {/* Empty State (se não houver desafios) */}
        {challenges.length === 0 && (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum desafio ativo</h3>
            <p className="text-gray-500">Crie desafios para engajar sua equipe</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-4 border-t border-orange-200">
        <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
          Ver Todos os Desafios
        </button>
      </div>
    </div>
  );
};