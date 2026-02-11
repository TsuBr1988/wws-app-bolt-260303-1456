import React, { useState, useEffect } from 'react';
import { Plus, Filter, Award, Star, Clock, AlertTriangle } from 'lucide-react';
import { ChallengeCard } from './ChallengeCard';
import { AddChallengeModal } from './AddChallengeModal';
import { AssignWinnersModal } from './AssignWinnersModal';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { challengeService } from '../../services/challengeService';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { Challenge } from '../../types';

export const Challenges: React.FC = () => {
  const { canEdit, canView } = useSystemVersion();
  const canEditChallenges = canEdit('challenges');
  const canViewChallenges = canView('challenges');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any | null>(null);
  const [selectedChallengeForWinners, setSelectedChallengeForWinners] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [evaluationMessage, setEvaluationMessage] = useState('');

  // Buscar dados necessários
  const { data: challengesData = [], loading, refetch } = useSupabaseQuery('challenges', {
    orderBy: { column: 'end_date', ascending: true }
  });
  
  const { data: employees = [] } = useSupabaseQuery('employees');
  const { data: weeklyPerformance = [] } = useSupabaseQuery('weekly_performance');
  const { data: proposals = [] } = useSupabaseQuery('proposals');

  // Transformar dados do banco para o formato da aplicação
  const challenges: Challenge[] = challengesData.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description || undefined,
    startDate: c.start_date,
    endDate: c.end_date,
    prize: c.prize,
    targetType: c.target_type as 'points' | 'sales',
    targetValue: c.target_value,
    status: c.status as 'active' | 'completed' | 'expired',
    participantsIds: c.participants_ids || undefined,
    winnerIds: c.winner_ids || undefined,
    completionDate: c.completion_date || undefined,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  }));

  // Avaliação automática de desafios
  const evaluateChallenges = async () => {
    try {
      const activeChallenges = challenges.filter(c => c.status === 'active');
      let completedCount = 0;
      let expiredCount = 0;
      
      for (const challenge of activeChallenges) {
        const currentDate = new Date();
        const endDate = new Date(challenge.endDate);
        
        // Verificar se expirou
        if (currentDate > endDate) {
          await challengeService.markChallengeExpired(challenge.id);
          expiredCount++;
          continue;
        }
        
        // Calcular progresso atual
        const currentProgress = await challengeService.calculateChallengeProgress(
          challengesData.find(c => c.id === challenge.id)!,
          employees,
          weeklyPerformance,
          proposals
        );
        
        // Verificar se meta foi atingida
        if (currentProgress >= challenge.targetValue) {
          await challengeService.markChallengeCompleted(challenge.id, new Date().toISOString());
          completedCount++;
        }
      }
      
      if (completedCount > 0 || expiredCount > 0) {
        const messages = [];
        if (completedCount > 0) {
          messages.push(`🎉 ${completedCount} desafio${completedCount > 1 ? 's' : ''} concluído${completedCount > 1 ? 's' : ''}!`);
        }
        if (expiredCount > 0) {
          messages.push(`⏰ ${expiredCount} desafio${expiredCount > 1 ? 's' : ''} expirado${expiredCount > 1 ? 's' : ''}`);
        }
        setEvaluationMessage(messages.join(' • '));
        
        // Atualizar dados
        await refetch();
        
        // Limpar mensagem após 5 segundos
        setTimeout(() => setEvaluationMessage(''), 5000);
      }
      
    } catch (error) {
      console.error('Erro ao avaliar desafios:', error);
    }
  };

  // Avaliar desafios na montagem e periodicamente
  useEffect(() => {
    if (challenges.length > 0 && employees.length > 0) {
      evaluateChallenges();
      
      // Avaliar a cada 5 minutos
      const interval = setInterval(evaluateChallenges, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [challenges.length, employees.length, weeklyPerformance.length, proposals.length]);

  // Filtrar desafios
  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'all') return true;
    return challenge.status === filter;
  });

  // Ordenação inteligente: Ativos primeiro (por proximidade), depois expirados, por último concluídos
  const sortedChallenges = filteredChallenges.sort((a, b) => {
    // 1. Prioridade por status: active > expired > completed
    const statusPriority = { 'active': 1, 'expired': 2, 'completed': 3 };
    const aPriority = statusPriority[a.status] || 999;
    const bPriority = statusPriority[b.status] || 999;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // 2. Para desafios com mesmo status, ordenar por data de término (mais próxima primeiro)
    const dateA = new Date(a.endDate);
    const dateB = new Date(b.endDate);
    return dateA.getTime() - dateB.getTime();
  });

  const handleAddChallenge = () => {
    setEditingChallenge(null);
    setShowAddModal(true);
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setShowAddModal(true);
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const confirmation = prompt(
      `⚠️ EXCLUIR DESAFIO\n\nTem certeza que deseja excluir o desafio "${challenge.title}"?\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`
    );

    if (confirmation === 'EXCLUIR') {
      try {
        await challengeService.deleteChallenge(challengeId);
        await refetch();
        alert('✅ Desafio excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir desafio:', error);
        alert(`❌ Erro ao excluir desafio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const handleAssignWinners = (challenge: Challenge) => {
    setSelectedChallengeForWinners(challenge);
    setShowWinnersModal(true);
  };

  const handleDuplicateChallenge = (challenge: Challenge) => {
    // Criar uma cópia do desafio para edição
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const duplicatedChallenge = {
      ...challenge,
      id: '', // Limpar ID para criar como novo
      title: `${challenge.title} (Cópia)`,
      startDate: today.toISOString().split('T')[0], // Data de hoje
      endDate: nextWeek.toISOString().split('T')[0], // Uma semana a partir de hoje
      status: 'active' as const,
      winnerIds: undefined, // Limpar vencedores
      completionDate: undefined, // Limpar data de conclusão
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    };
    
    // Abrir modal de edição com os dados duplicados
    setEditingChallenge(duplicatedChallenge);
    setShowAddModal(true);
  };
  const handleModalClose = () => {
    setShowAddModal(false);
    setShowWinnersModal(false);
    setEditingChallenge(null);
    setSelectedChallengeForWinners(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Desafios e Prêmios</h1>
          <p className="text-gray-600">
            {canViewChallenges && canEditChallenges 
              ? 'Gerencie desafios de performance e premie sua equipe'
              : canViewChallenges
              ? 'Visualize os desafios ativos e acompanhe seu progresso'
              : 'Acesso restrito aos desafios'
            }
          </p>
        </div>
        {canViewChallenges && canEditChallenges ? (
          <button
            onClick={handleAddChallenge}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Desafio</span>
          </button>
        ) : canViewChallenges ? (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Modo Somente Leitura</span>
          </div>
        ) : null
        }
      </div>

      {/* Mensagem de avaliação */}
      {evaluationMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{evaluationMessage}</span>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Desafios</p>
              <p className="text-2xl font-bold text-gray-900">{challenges.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Desafios Ativos</p>
              <p className="text-2xl font-bold text-blue-600">
                {challenges.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">
                {challenges.filter(c => c.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expirados</p>
              <p className="text-2xl font-bold text-red-600">
                {challenges.filter(c => c.status === 'expired').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Filtrar por status:</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="completed">Concluídos</option>
          <option value="expired">Expirados</option>
        </select>
        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          Mostrando {sortedChallenges.length} de {challenges.length} desafios
        </div>
      </div>

      {/* Cards de Desafios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            employees={employees}
            weeklyPerformance={weeklyPerformance}
            proposals={proposals}
            onEdit={canEditChallenges ? handleEditChallenge : undefined}
            onDelete={canEditChallenges ? handleDeleteChallenge : undefined}
            onAssignWinners={canEditChallenges ? handleAssignWinners : undefined}
            onDuplicate={canEditChallenges ? handleDuplicateChallenge : undefined}
            readOnly={!canEditChallenges}
          />
        ))}
      </div>

      {sortedChallenges.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'Nenhum desafio criado' : `Nenhum desafio ${filter === 'active' ? 'ativo' : filter === 'completed' ? 'concluído' : 'expirado'}`}
          </h3>
          <p className="text-gray-500">
            {canEditChallenges && filter === 'all' 
              ? 'Clique em "Adicionar Novo Desafio" para começar a engajar sua equipe!'
              : `Não há desafios ${filter === 'active' ? 'ativos' : filter === 'completed' ? 'concluídos' : 'expirados'} no momento.`
            }
          </p>
        </div>
      )}

      {/* Modais */}
      {showAddModal && (
        <AddChallengeModal
          isOpen={showAddModal}
          onClose={handleModalClose}
          challenge={editingChallenge}
          employees={employees}
        />
      )}

      {showWinnersModal && selectedChallengeForWinners && (
        <AssignWinnersModal
          isOpen={showWinnersModal}
          onClose={handleModalClose}
          challenge={selectedChallengeForWinners}
          employees={employees}
        />
      )}

    </div>
  );
};