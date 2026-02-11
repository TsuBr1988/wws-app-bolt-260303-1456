import React, { useState, useEffect } from 'react';
import { Award, Calendar, Target, DollarSign, Star, Clock, AlertTriangle, Edit, Trash2, Users, Trophy, X, Copy } from 'lucide-react';
import { Challenge } from '../../types';
import { challengeService } from '../../services/challengeService';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

interface ChallengeCardProps {
  challenge: Challenge;
  employees: any[];
  weeklyPerformance: any[];
  proposals: any[];
  onEdit?: (challenge: Challenge) => void;
  onDelete?: (challengeId: string) => void;
  onAssignWinners?: (challenge: Challenge) => void;
  onDuplicate?: (challenge: Challenge) => void;
  readOnly?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  employees,
  weeklyPerformance,
  proposals,
  onEdit,
  onDelete,
  onAssignWinners,
  onDuplicate,
  readOnly = false
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [individualContributions, setIndividualContributions] = useState<{ employeeId: string, name: string, progress: number }[]>([]);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedPrize, setExpandedPrize] = useState(false);

  // Calcular progresso atual e dias restantes
  useEffect(() => {
    const calculateProgress = async () => {
      try {
        console.log('🎯 [ChallengeCard] Calculando progresso para:', {
          challengeTitle: challenge.title,
          challengeId: challenge.id,
          targetType: challenge.targetType,
          targetValue: challenge.targetValue,
          participantsIds: challenge.participantsIds,
          hasSpecificParticipants: challenge.participantsIds && challenge.participantsIds.length > 0
        });
        
        // Encontrar dados do desafio no formato do banco
        const dbChallenge = {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description || null,
          start_date: challenge.startDate,
          end_date: challenge.endDate,
          prize: challenge.prize,
          target_type: challenge.targetType,
          target_value: challenge.targetValue,
          status: challenge.status,
          participants_ids: challenge.participantsIds || null,
          winner_ids: challenge.winnerIds || null,
          completion_date: challenge.completionDate || null,
          created_at: challenge.createdAt,
          updated_at: challenge.updatedAt
        };

        const progress = await challengeService.calculateChallengeProgress(
          dbChallenge,
          employees,
          weeklyPerformance,
          proposals
        );
        
        console.log('📊 [ChallengeCard] Progresso calculado:', {
          challengeTitle: challenge.title,
          currentProgress: progress,
          targetValue: challenge.targetValue,
          progressPercentage: Math.min((progress / challenge.targetValue) * 100, 100).toFixed(1) + '%'
        });
        
        setCurrentProgress(progress);
        
        // Calcular contribuições individuais
        if (challenge.status === 'active') {
          const participantIds = challenge.participantsIds && challenge.participantsIds.length > 0 
            ? challenge.participantsIds 
            : employees.filter(emp => emp.role !== 'Admin').map(emp => emp.id);
          
          const contributions = [];
          
          for (const participantId of participantIds) {
            const participant = employees.find(emp => emp.id === participantId);
            if (participant) {
              const individualProgress = await challengeService.calculateChallengeProgress(
                dbChallenge,
                employees,
                weeklyPerformance,
                proposals,
                participantId // Calcular apenas para este funcionário específico
              );
              
              contributions.push({
                employeeId: participantId,
                name: participant.name,
                progress: individualProgress
              });
            }
          }
          
          // Ordenar por maior contribuição
          contributions.sort((a, b) => b.progress - a.progress);
          setIndividualContributions(contributions);
        }
      } catch (error) {
        console.error('Erro ao calcular progresso:', error);
        setCurrentProgress(0);
        setIndividualContributions([]);
      }
    };

    // Calcular dias restantes
    const endDate = new Date(challenge.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays);

    if (challenge.status === 'active') {
      calculateProgress();
    }
  }, [challenge, employees, weeklyPerformance, proposals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'expired': return 'Expirado';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return displayDate(dateString);
  };

  const getProgressPercentage = () => {
    return Math.min((currentProgress / challenge.targetValue) * 100, 100);
  };

  const getParticipantsText = () => {
    if (!challenge.participantsIds || challenge.participantsIds.length === 0) {
      return 'Todos os funcionários';
    }
    
    const participantNames = challenge.participantsIds
      .map(id => employees.find(emp => emp.id === id)?.name)
      .filter(Boolean);
    
    if (participantNames.length <= 2) {
      return participantNames.join(', ');
    }
    
    return `${participantNames[0]} e mais ${participantNames.length - 1}`;
  };

  const getWinnersDisplay = () => {
    if (!challenge.winnerIds || challenge.winnerIds.length === 0) {
      return null;
    }

    const winners = challenge.winnerIds
      .map(id => employees.find(emp => emp.id === id))
      .filter(Boolean);

    return winners;
  };

  const winners = getWinnersDisplay();

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim();
  };

  // Verificar se texto precisa ser truncado
  const needsTruncation = (text: string, maxLength: number = 80) => {
    return text.length > maxLength;
  };
  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 h-[520px] flex flex-col ${
      challenge.status === 'completed' ? 'border-green-200' :
      challenge.status === 'expired' ? 'border-red-200' :
      daysRemaining <= 5 && challenge.status === 'active' ? 'border-orange-200' :
      'border-gray-200'
    } overflow-hidden hover:shadow-md transition-all relative`}>
      
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(challenge.status)}`}>
          {getStatusIcon(challenge.status)}
          <span>{getStatusText(challenge.status)}</span>
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2 pr-20">{challenge.title}</h3>
          {challenge.description && (
            <div className="text-sm text-gray-600 mb-3">
              <p>
                {expandedDescription 
                  ? challenge.description 
                  : truncateText(challenge.description)
                }
                {needsTruncation(challenge.description) && (
                  <button
                    onClick={() => setExpandedDescription(!expandedDescription)}
                    className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedDescription ? 'menos' : '... mais'}
                  </button>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Prize */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Prêmio</span>
          </div>
          <div className="text-sm text-yellow-900 font-medium">
            <p>
              {expandedPrize 
                ? challenge.prize 
                : truncateText(challenge.prize, 60)
              }
              {needsTruncation(challenge.prize, 60) && (
                <button
                  onClick={() => setExpandedPrize(!expandedPrize)}
                  className="ml-1 text-yellow-700 hover:text-yellow-900 font-medium"
                >
                  {expandedPrize ? 'menos' : '... mais'}
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Target and Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {challenge.targetType === 'points' ? (
                <Target className="w-4 h-4 text-purple-600" />
              ) : challenge.targetType === 'sales' ? (
                <DollarSign className="w-4 h-4 text-green-600" />
              ) : challenge.targetType === 'valores_mensais_contratos' ? (
                <DollarSign className="w-4 h-4 text-emerald-600" />
              ) : challenge.targetType === 'mql' ? (
                <Users className="w-4 h-4 text-blue-600" />
              ) : challenge.targetType === 'visitas_agendadas' ? (
                <Calendar className="w-4 h-4 text-indigo-600" />
              ) : (
                <Award className="w-4 h-4 text-orange-600" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Meta: {
                  challenge.targetType === 'points' ? `${challenge.targetValue.toLocaleString()} pontos` :
                  challenge.targetType === 'sales' ? formatCurrency(challenge.targetValue) :
                  challenge.targetType === 'valores_mensais_contratos' ? `${formatCurrency(challenge.targetValue)} (mensal)` :
                  challenge.targetType === 'mql' ? `${challenge.targetValue.toLocaleString()} MQLs` :
                  challenge.targetType === 'visitas_agendadas' ? `${challenge.targetValue.toLocaleString()} visitas` :
                  challenge.targetType === 'pontos_educacao' ? `${challenge.targetValue.toLocaleString()} pontos de educação` :
                  `${challenge.targetValue.toLocaleString()} contratos`
                }
              </span>
            </div>
            {challenge.status === 'active' && (
              <span className="text-sm text-gray-600">
                {
                  challenge.targetType === 'points' ? `${currentProgress.toLocaleString()} pts` :
                  challenge.targetType === 'sales' ? formatCurrency(currentProgress) :
                  challenge.targetType === 'valores_mensais_contratos' ? `${formatCurrency(currentProgress)} (mensal)` :
                  challenge.targetType === 'mql' ? `${currentProgress.toLocaleString()} MQLs` :
                  challenge.targetType === 'visitas_agendadas' ? `${currentProgress.toLocaleString()} visitas` :
                  challenge.targetType === 'pontos_educacao' ? `${currentProgress.toLocaleString()} pts educação` :
                  `${currentProgress.toLocaleString()} contratos`
                }
              </span>
            )}
          </div>

          {challenge.status === 'active' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  getProgressPercentage() >= 100 ? 'bg-green-500' :
                  getProgressPercentage() >= 75 ? 'bg-blue-500' :
                  getProgressPercentage() >= 50 ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Início:</span>
            <div className="font-medium">{formatDate(challenge.startDate)}</div>
          </div>
          <div>
            <span className="text-gray-500">Fim:</span>
            <div className="font-medium">{formatDate(challenge.endDate)}</div>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Participantes</span>
          </div>
          <button
            onClick={() => setShowParticipantsModal(true)}
            className="text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors text-left w-full"
            title="Clique para ver todos os participantes"
          >
            {getParticipantsText()}
          </button>
        </div>

        {/* Winners Display */}
        {winners && winners.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Vencedor{winners.length > 1 ? 'es' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              {winners.slice(0, 3).map((winner, index) => (
                <div key={winner.id} className="flex items-center space-x-2">
                  <img
                    src={winner.avatar}
                    alt={winner.name}
                    className="w-8 h-8 rounded-full border-2 border-green-300"
                  />
                  {index === 0 && (
                    <span className="text-sm font-medium text-green-900">{winner.name}</span>
                  )}
                </div>
              ))}
              {winners.length > 3 && (
                <span className="text-xs text-green-700">+{winners.length - 3} mais</span>
              )}
            </div>
            {challenge.completionDate && (
              <p className="text-xs text-green-700 mt-1">
                Concluído em {displayDate(challenge.completionDate)}
              </p>
            )}
          </div>
        )}

        {/* Expired without winner */}
        {challenge.status === 'expired' && (!challenge.winnerIds || challenge.winnerIds.length === 0) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Desafio Expirado sem Vencedor</span>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="mt-auto">
          {!readOnly && (onEdit || onDelete || onAssignWinners || onDuplicate) && (
            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(challenge)}
                className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
                title="Duplicar este desafio"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicar</span>
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={() => onEdit(challenge)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}
            
            {onAssignWinners && challenge.status === 'completed' && (!challenge.winnerIds || challenge.winnerIds.length === 0) && (
              <button
                onClick={() => onAssignWinners(challenge)}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Users className="w-4 h-4" />
                <span>Vencedor</span>
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(challenge.id)}
                className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Participantes do Desafio</h2>
                  <p className="text-sm text-gray-600">{challenge.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {!challenge.participantsIds || challenge.participantsIds.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Todos os Funcionários</h3>
                  <p className="text-gray-600 mb-4">Este desafio está aberto para todos os funcionários da empresa</p>
                  
                  <div className="space-y-3">
                    {employees.filter(emp => emp.role !== 'Admin').map(employee => (
                      <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.role} • {employee.department}</div>
                        </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">
                              {(() => {
                                const contribution = individualContributions.find(contrib => contrib.employeeId === employee.id);
                                if (contribution) {
                                  return challenge.targetType === 'sales' || challenge.targetType === 'valores_mensais_contratos' ?
                                    formatCurrency(contribution.progress) :
                                    `${contribution.progress.toLocaleString()} ${
                                      challenge.targetType === 'points' ? 'pts' :
                                      challenge.targetType === 'mql' ? 'MQLs' :
                                      challenge.targetType === 'visitas_agendadas' ? 'visitas' :
                                      challenge.targetType === 'pontos_educacao' ? 'pts edu' :
                                      'contratos'
                                    }`;
                                }
                                return '0';
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">contribuição</div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.role === 'Closer' ? 'bg-blue-100 text-blue-800' :
                            employee.role === 'SDR' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {employee.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Participantes Selecionados ({challenge.participantsIds.length})
                    </h3>
                    <p className="text-sm text-gray-600">
                      Apenas os funcionários listados abaixo podem participar deste desafio
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {challenge.participantsIds.map(participantId => {
                      const participant = employees.find(emp => emp.id === participantId);
                      const contribution = individualContributions.find(contrib => contrib.employeeId === participantId);
                      if (!participant) return null;
                      
                      return (
                        <div key={participant.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-10 h-10 rounded-full border-2 border-blue-300"
                          />
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                            <div className="text-xs text-gray-500">{participant.role} • {participant.department}</div>
                          </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-bold text-blue-600">
                                {contribution ? (
                                  challenge.targetType === 'sales' || challenge.targetType === 'valores_mensais_contratos' ?
                                    formatCurrency(contribution.progress) :
                                    `${contribution.progress.toLocaleString()} ${
                                      challenge.targetType === 'points' ? 'pts' :
                                      challenge.targetType === 'mql' ? 'MQLs' :
                                      challenge.targetType === 'visitas_agendadas' ? 'visitas' :
                                      challenge.targetType === 'pontos_educacao' ? 'pts edu' :
                                      'contratos'
                                    }`
                                ) : '0'}
                              </div>
                              <div className="text-xs text-gray-500">contribuição</div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              participant.role === 'Closer' ? 'bg-blue-100 text-blue-800' :
                              participant.role === 'SDR' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {participant.role}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Countdown Alert Banner */}
      {challenge.status === 'active' && daysRemaining <= 5 && daysRemaining > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 text-center">
          <div className="flex items-center justify-center space-x-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold">
              {daysRemaining === 1 ? 'ÚLTIMO DIA!' : `Faltam ${daysRemaining} dias!`}
            </span>
          </div>
        </div>
      )}

      {/* Completed Banner */}
      {challenge.status === 'completed' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 text-center">
          <div className="flex items-center justify-center space-x-1">
            <Star className="w-4 h-4" />
            <span className="text-sm font-bold">DESAFIO CONCLUÍDO!</span>
          </div>
        </div>
      )}
    </div>
  );
};