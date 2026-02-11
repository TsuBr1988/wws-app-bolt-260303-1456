import React, { useState, useEffect } from 'react';
import { X, DollarSign, Target, Users, Calendar, Award, TrendingUp } from 'lucide-react';
import { Challenge } from '../../types';
import { challengeService } from '../../services/challengeService';
import { formatCurrency } from '../../utils/formatCurrency';
import { supabase } from '../../lib/supabase';

interface ChallengeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  employees: any[];
  weeklyPerformance: any[];
  proposals: any[];
  currentProgress: number;
}

export const ChallengeProgressModal: React.FC<ChallengeProgressModalProps> = ({
  isOpen,
  onClose,
  challenge,
  employees,
  weeklyPerformance,
  proposals,
  currentProgress
}) => {
  const [progressDetails, setProgressDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadProgressDetails();
    }
  }, [isOpen, challenge]);

  const loadProgressDetails = async () => {
    setLoading(true);
    try {
      const startDate = new Date(challenge.startDate);
      const endDate = new Date(challenge.endDate);

      const participantIds = challenge.participantsIds && challenge.participantsIds.length > 0
        ? challenge.participantsIds
        : employees.filter(emp => emp.role !== 'Admin').map(emp => emp.id);

      if (challenge.targetType === 'sales') {
        const relevantProposals = proposals.filter(proposal => {
          if (proposal.status !== 'Contrato assinado') return false;

          const signatureDate = proposal.data_assinatura ?
            new Date(proposal.data_assinatura) :
            (proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at));

          const isInPeriod = signatureDate >= startDate && signatureDate <= endDate;

          const isParticipant = participantIds.includes(proposal.closer_id) ||
                               (proposal.sdr_id && participantIds.includes(proposal.sdr_id));

          return isInPeriod && isParticipant;
        });

        const details = relevantProposals.map(proposal => {
          const closer = employees.find(emp => emp.id === proposal.closer_id);
          const sdr = proposal.sdr_id ? employees.find(emp => emp.id === proposal.sdr_id) : null;

          const nossoLance = typeof proposal.nosso_lance === 'string'
            ? parseFloat(proposal.nosso_lance)
            : (proposal.nosso_lance || 0);

          return {
            id: proposal.id,
            client: proposal.client,
            value: nossoLance,
            monthlyValue: proposal.monthly_value || 0,
            months: proposal.months || 0,
            closer: closer?.name || 'Desconhecido',
            sdr: sdr?.name,
            closingDate: proposal.data_assinatura || proposal.closing_date || proposal.created_at,
            status: proposal.status
          };
        });

        setProgressDetails(details);
      } else if (challenge.targetType === 'monthly_value') {
        const relevantProposals = proposals.filter(proposal => {
          if (proposal.status !== 'Contrato assinado') return false;

          const signatureDate = proposal.data_assinatura ?
            new Date(proposal.data_assinatura) :
            (proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at));

          const isInPeriod = signatureDate >= startDate && signatureDate <= endDate;

          const isParticipant = participantIds.includes(proposal.closer_id) ||
                               (proposal.sdr_id && participantIds.includes(proposal.sdr_id));

          return isInPeriod && isParticipant;
        });

        const details = relevantProposals.map(proposal => {
          const closer = employees.find(emp => emp.id === proposal.closer_id);
          const sdr = proposal.sdr_id ? employees.find(emp => emp.id === proposal.sdr_id) : null;

          const monthlyValue = typeof proposal.monthly_value === 'string'
            ? parseFloat(proposal.monthly_value)
            : (proposal.monthly_value || 0);

          return {
            id: proposal.id,
            client: proposal.client,
            monthlyValue: monthlyValue,
            totalValue: proposal.nosso_lance || 0,
            months: proposal.months || 0,
            closer: closer?.name || 'Desconhecido',
            sdr: sdr?.name,
            closingDate: proposal.data_assinatura || proposal.closing_date || proposal.created_at,
            status: proposal.status
          };
        });

        setProgressDetails(details);
      } else if (challenge.targetType === 'points') {
        const relevantPerformance = weeklyPerformance.filter(perf => {
          const weekDate = new Date(perf.week_ending_date);
          const isParticipant = participantIds.includes(perf.employee_id);
          const isInPeriod = weekDate >= startDate && weekDate <= endDate;
          return isParticipant && isInPeriod;
        });

        const details = relevantPerformance.map(perf => {
          const employee = employees.find(emp => emp.id === perf.employee_id);
          return {
            id: perf.id,
            employeeName: employee?.name || 'Desconhecido',
            weekEndingDate: perf.week_ending_date,
            points: perf.total_points || 0
          };
        });

        setProgressDetails(details);
      } else if (challenge.targetType === 'mql') {
        const relevantPerformance = weeklyPerformance.filter(perf => {
          const weekDate = new Date(perf.week_ending_date);
          const isParticipant = participantIds.includes(perf.employee_id);
          const isInPeriod = weekDate >= startDate && weekDate <= endDate;
          return isParticipant && isInPeriod && (perf.mql || 0) > 0;
        });

        const details = relevantPerformance.map(perf => {
          const employee = employees.find(emp => emp.id === perf.employee_id);
          return {
            id: perf.id,
            employeeName: employee?.name || 'Desconhecido',
            weekEndingDate: perf.week_ending_date,
            mql: perf.mql || 0
          };
        });

        setProgressDetails(details);
      } else if (challenge.targetType === 'visitas_agendadas') {
        const relevantPerformance = weeklyPerformance.filter(perf => {
          const weekDate = new Date(perf.week_ending_date);
          const isParticipant = participantIds.includes(perf.employee_id);
          const isInPeriod = weekDate >= startDate && weekDate <= endDate;
          return isParticipant && isInPeriod && (perf.visitas_agendadas || 0) > 0;
        });

        const details = relevantPerformance.map(perf => {
          const employee = employees.find(emp => emp.id === perf.employee_id);
          return {
            id: perf.id,
            employeeName: employee?.name || 'Desconhecido',
            weekEndingDate: perf.week_ending_date,
            visitas: perf.visitas_agendadas || 0
          };
        });

        setProgressDetails(details);
      } else if (challenge.targetType === 'contratos_assinados') {
        const relevantPerformance = weeklyPerformance.filter(perf => {
          const weekDate = new Date(perf.week_ending_date);
          const isParticipant = participantIds.includes(perf.employee_id);
          const isInPeriod = weekDate >= startDate && weekDate <= endDate;
          return isParticipant && isInPeriod && (perf.contrato_assinado || 0) > 0;
        });

        const details = relevantPerformance.map(perf => {
          const employee = employees.find(emp => emp.id === perf.employee_id);
          return {
            id: perf.id,
            employeeName: employee?.name || 'Desconhecido',
            weekEndingDate: perf.week_ending_date,
            contratos: perf.contrato_assinado || 0
          };
        });

        setProgressDetails(details);
      } else if (challenge.targetType === 'pontos_educacao') {
        const relevantPerformance = weeklyPerformance.filter(perf => {
          const weekDate = new Date(perf.week_ending_date);
          const isParticipant = participantIds.includes(perf.employee_id);
          const isInPeriod = weekDate >= startDate && weekDate <= endDate;
          return isParticipant && isInPeriod && (perf.pontos_educacao || 0) > 0;
        });

        const details = relevantPerformance.map(perf => {
          const employee = employees.find(emp => emp.id === perf.employee_id);
          return {
            id: perf.id,
            employeeName: employee?.name || 'Desconhecido',
            weekEndingDate: perf.week_ending_date,
            pontosEducacao: perf.pontos_educacao || 0
          };
        });

        setProgressDetails(details);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getIcon = () => {
    switch (challenge.targetType) {
      case 'sales':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'monthly_value':
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'points':
        return <Target className="w-5 h-5 text-purple-600" />;
      case 'mql':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'visitas_agendadas':
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'contratos_assinados':
        return <Award className="w-5 h-5 text-orange-600" />;
      case 'pontos_educacao':
        return <TrendingUp className="w-5 h-5 text-teal-600" />;
      default:
        return <Target className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTitle = () => {
    switch (challenge.targetType) {
      case 'sales':
        return 'Detalhamento de Vendas (Valor Total)';
      case 'monthly_value':
        return 'Detalhamento de Valor Mensal';
      case 'points':
        return 'Detalhamento de Pontos';
      case 'mql':
        return 'Detalhamento de MQLs';
      case 'visitas_agendadas':
        return 'Detalhamento de Visitas Agendadas';
      case 'contratos_assinados':
        return 'Detalhamento de Contratos Assinados';
      case 'pontos_educacao':
        return 'Detalhamento de Pontos de Educação';
      default:
        return 'Detalhamento do Progresso';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
              <p className="text-sm text-gray-600">{challenge.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Progresso Atual</div>
              <div className="text-2xl font-bold text-gray-900">
                {(challenge.targetType === 'sales' || challenge.targetType === 'monthly_value')
                  ? formatCurrency(currentProgress)
                  : currentProgress.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Meta</div>
              <div className="text-2xl font-bold text-gray-900">
                {(challenge.targetType === 'sales' || challenge.targetType === 'monthly_value')
                  ? formatCurrency(challenge.targetValue)
                  : challenge.targetValue.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Percentual</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.min((currentProgress / challenge.targetValue) * 100, 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Carregando detalhes...</div>
            </div>
          ) : progressDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {getIcon()}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
              <p className="text-gray-600 text-center">
                Não há registros que compõem o progresso deste desafio no período selecionado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenge.targetType === 'sales' ? (
                progressDetails.map((detail) => (
                  <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <h4 className="font-medium text-gray-900">{detail.client}</h4>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Closer: {detail.closer}</div>
                          {detail.sdr && <div>SDR: {detail.sdr}</div>}
                          <div>Data de Assinatura: {formatDate(detail.closingDate)}</div>
                          <div>Status: <span className="text-green-600 font-medium">{detail.status}</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Nosso Lance</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(detail.value)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : challenge.targetType === 'monthly_value' ? (
                progressDetails.map((detail) => (
                  <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-medium text-gray-900">{detail.client}</h4>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Closer: {detail.closer}</div>
                          {detail.sdr && <div>SDR: {detail.sdr}</div>}
                          <div>Data de Assinatura: {formatDate(detail.closingDate)}</div>
                          <div>Duração: {detail.months} meses</div>
                          <div>Status: <span className="text-emerald-600 font-medium">{detail.status}</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Valor Mensal</div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(detail.monthlyValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : challenge.targetType === 'points' ? (
                progressDetails.map((detail) => (
                  <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Target className="w-4 h-4 text-purple-600" />
                          <h4 className="font-medium text-gray-900">{detail.employeeName}</h4>
                        </div>
                        <div className="text-sm text-gray-600">
                          Semana terminando em {formatDate(detail.weekEndingDate)}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {detail.points} pts
                      </div>
                    </div>
                  </div>
                ))
              ) : challenge.targetType === 'mql' ? (
                progressDetails.map((detail) => (
                  <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-gray-900">{detail.employeeName}</h4>
                        </div>
                        <div className="text-sm text-gray-600">
                          Semana terminando em {formatDate(detail.weekEndingDate)}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {detail.mql} MQLs
                      </div>
                    </div>
                  </div>
                ))
              ) : challenge.targetType === 'visitas_agendadas' ? (
                progressDetails.map((detail) => (
                  <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-medium text-gray-900">{detail.employeeName}</h4>
                        </div>
                        <div className="text-sm text-gray-600">
                          Semana terminando em {formatDate(detail.weekEndingDate)}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {detail.visitas} visitas
                      </div>
                    </div>
                  </div>
                ))
              ) : challenge.targetType === 'contratos_assinados' ? (
                progressDetails.map((detail) => (
                  <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Award className="w-4 h-4 text-orange-600" />
                          <h4 className="font-medium text-gray-900">{detail.employeeName}</h4>
                        </div>
                        <div className="text-sm text-gray-600">
                          Semana terminando em {formatDate(detail.weekEndingDate)}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {detail.contratos} contratos
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                progressDetails.map((detail) => (
                  <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-teal-600" />
                          <h4 className="font-medium text-gray-900">{detail.employeeName}</h4>
                        </div>
                        <div className="text-sm text-gray-600">
                          Semana terminando em {formatDate(detail.weekEndingDate)}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-teal-600">
                        {detail.pontosEducacao} pts
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
