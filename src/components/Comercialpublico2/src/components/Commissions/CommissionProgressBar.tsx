import React from 'react';
import { Trophy, Target, Star, TrendingUp } from 'lucide-react';
import { calculateCurrentMonthTotal, formatProgressInfo } from '../../utils/commissionUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';
import { Department } from '../../contexts/DepartmentContext';

interface CommissionProgressBarProps {
  employeeId: string;
  employeeRole: 'closer' | 'sdr';
  proposals: any[];
  employeeName: string;
  selectedYear: number;
  department: Department;
}

export const CommissionProgressBar: React.FC<CommissionProgressBarProps> = ({
  employeeId,
  employeeRole,
  proposals,
  employeeName,
  selectedYear,
  department
}) => {
  const currentMonthTotal = calculateCurrentMonthTotal(proposals, employeeId, employeeRole, department);
  const progressInfo = formatProgressInfo(currentMonthTotal, department);

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  
  // Calcular posições dos marcos na barra (0-100%)
  const milestone1200kPosition = (1200000 / 3000000) * 100; // Usar 3M como máximo para visualização
  const milestone2400kPosition = (2400000 / 3000000) * 100;
  const currentPosition = Math.min((currentMonthTotal / 3000000) * 100, 100);
  
  const getAchievementMessage = () => {
    if (currentMonthTotal >= 2400000) {
      return {
        icon: <Trophy className="w-6 h-6 text-yellow-500" />,
        message: "🚀 MEGAMETA CONQUISTADA! Parabéns!",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200"
      };
    } else if (currentMonthTotal >= 1200000) {
      return {
        icon: <Star className="w-6 h-6 text-orange-500" />,
        message: "🎯 SUPERMETA CONQUISTADA! Continue assim!",
        color: "text-orange-600",
        bgColor: "bg-orange-50 border-orange-200"
      };
    }
    return null;
  };
  
  const achievement = getAchievementMessage();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Progresso das Metas - {employeeName}</span>
          </h3>
          <p className="text-sm text-gray-600 capitalize">Performance em {currentMonth} {selectedYear}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${progressInfo.currentTier.color}`}>
            {progressInfo.currentRate}%
          </div>
          <div className="text-sm text-gray-500">Taxa Atual</div>
        </div>
      </div>
      
      {/* Achievement Banner */}
      {achievement && (
        <div className={`${achievement.bgColor} border rounded-lg p-4 mb-6`}>
          <div className="flex items-center space-x-3">
            {achievement.icon}
            <div>
              <p className={`font-bold ${achievement.color}`}>{achievement.message}</p>
              <p className="text-sm text-gray-600">
                Você atingiu {formatCurrency(currentMonthTotal)} em vendas este mês!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso do Mês</span>
          <span className="text-sm text-gray-600">{formatCurrency(currentMonthTotal)}</span>
        </div>
        
        <div className="relative">
          {/* Background Bar */}
          <div className="w-full bg-gray-200 rounded-full h-6">
            {/* Progress Fill */}
            <div 
              className={`h-6 rounded-full transition-all duration-500 ${
                currentMonthTotal >= 1200000 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                currentMonthTotal >= 600000 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}
              style={{ width: `${currentPosition}%` }}
            />
            
            {/* Milestone Markers */}
            <div 
              className="absolute top-0 w-1 h-6 bg-red-500 rounded"
              style={{ left: `${milestone1200kPosition}%` }}
              title="Meta R$ 1,2M"
            />
            <div 
              className="absolute top-0 w-1 h-6 bg-purple-500 rounded"
              style={{ left: `${milestone2400kPosition}%` }}
              title="Meta R$ 2,4M"
            />
          </div>
          
          {/* Milestone Labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>R$ 0</span>
            <span 
              className="text-red-600 font-medium"
              style={{ position: 'absolute', left: `${milestone1200kPosition - 5}%` }}
            >
              1,2M
            </span>
            <span 
              className="text-purple-600 font-medium"
              style={{ position: 'absolute', left: `${milestone2400kPosition - 5}%` }}
            >
              2,4M
            </span>
            <span>3M+</span>
          </div>
        </div>
      </div>
      
      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${progressInfo.currentTier.bgColor} rounded-lg p-4 text-center`}>
          <div className={`text-xl font-bold ${progressInfo.currentTier.color}`}>
            {progressInfo.currentTier.label}
          </div>
          <div className="text-sm text-gray-600">Meta Atual</div>
          <div className={`text-lg font-bold ${progressInfo.currentTier.color} mt-1`}>
            {progressInfo.currentRate}%
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(currentMonthTotal)}
          </div>
          <div className="text-sm text-gray-600">Vendido no Mês</div>
          <div className="text-sm text-blue-600 mt-1">
            {progressInfo.progressPercentage.toFixed(1)}% da meta atual
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-blue-600">
            {progressInfo.nextMilestone ? formatCurrency(progressInfo.remainingToNext) : '🎉'}
          </div>
          <div className="text-sm text-gray-600">
            {progressInfo.nextMilestone ? 'Falta para próxima meta' : 'Todas as metas atingidas!'}
          </div>
          {progressInfo.nextMilestone && (
            <div className="text-xs text-blue-600 mt-1">
              Próxima: {formatCurrency(progressInfo.nextMilestone)}
            </div>
          )}
        </div>
      </div>
      
      {/* Motivation Message */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <p className="text-sm font-medium text-blue-900">
            {progressInfo.nextMilestone ? (
              <>💪 Continue focado! Faltam apenas {formatCurrency(progressInfo.remainingToNext)} para a próxima meta!</>
            ) : (
              <>🏆 Parabéns! Você atingiu todas as metas disponíveis este mês!</>
            )}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            0,1% → 0,15% → 0,2% • Cada meta atingida aumenta sua comissão!
          </p>
        </div>
      </div>
    </div>
  );
};