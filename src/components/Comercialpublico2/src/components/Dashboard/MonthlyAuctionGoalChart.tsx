import React from 'react';
import { Target } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';

export const MonthlyAuctionGoalChart: React.FC = () => {
  const { selectedYear } = useYear();
  const { data: licitacoesData = [], loading } = useSupabaseQuery('proposals');

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const MONTHLY_GOAL = 12;

  const generateMonthlyData = () => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    return months.map((month, index) => {
      const monthLicitacoes = licitacoesData.filter(licitacao => {
        const licitacaoDate = new Date(licitacao.created_at);
        return licitacaoDate.getMonth() === index && licitacaoDate.getFullYear() === selectedYear;
      });

      const count = monthLicitacoes.length;
      const percentage = (count / MONTHLY_GOAL) * 100;

      return {
        month,
        count,
        goal: MONTHLY_GOAL,
        percentage: Math.min(percentage, 100),
        status: count >= MONTHLY_GOAL ? 'achieved' : count >= MONTHLY_GOAL * 0.8 ? 'close' : 'below'
      };
    });
  };

  const monthlyData = generateMonthlyData();
  const maxCount = Math.max(...monthlyData.map(d => d.count), MONTHLY_GOAL);

  const totalLicitacoes = monthlyData.reduce((sum, d) => sum + d.count, 0);
  const monthsWithGoal = monthlyData.filter(d => d.count >= MONTHLY_GOAL).length;
  const averageMonthly = totalLicitacoes / 12;
  const annualGoal = MONTHLY_GOAL * 12;
  const annualProgress = (totalLicitacoes / annualGoal) * 100;

  const getBarColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-500';
      case 'close': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Meta de Licitações {selectedYear}</span>
          </h3>
          <p className="text-sm text-gray-600">Meta: {MONTHLY_GOAL} licitações por mês</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{totalLicitacoes}</div>
          <div className="text-sm text-gray-500">Total no Ano</div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-blue-600">{totalLicitacoes}</div>
          <div className="text-sm text-gray-600">Total {selectedYear}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-green-600">{monthsWithGoal}</div>
          <div className="text-sm text-gray-600">Meses com Meta</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-purple-600">{averageMonthly.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Média Mensal</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-orange-600">{annualProgress.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Progresso Anual</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative pl-6 md:pl-12">
        <div className="flex items-end justify-between space-x-0.5 md:space-x-1 h-24 md:h-48 mb-4">
          {monthlyData.map((data, index) => {
            const height = maxCount > 0 ? (data.count / maxCount) * 80 : 0;
            const goalHeight = maxCount > 0 ? (MONTHLY_GOAL / maxCount) * 80 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full h-16 md:h-40 flex items-end justify-center min-w-[16px] md:min-w-[30px]">
                  {/* Meta Line */}
                  <div
                    className="absolute w-full border-t-2 border-dashed border-gray-400 z-10"
                    style={{ bottom: `${goalHeight}%` }}
                    title={`Meta: ${MONTHLY_GOAL}`}
                  />

                  {/* Actual Bar */}
                  <div
                    className={`w-3 md:w-6 rounded-t transition-all group cursor-pointer ${getBarColor(data.status)} hover:opacity-80`}
                    style={{ height: `${Math.max(height, 3)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 md:mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 hidden md:block">
                      <div className="text-center">
                        <div className="font-medium">{data.count} licitações</div>
                        <div>Meta: {MONTHLY_GOAL}</div>
                        <div>{data.percentage.toFixed(1)}% da meta</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Month Label */}
                <div className="text-xs md:text-sm text-gray-600 mt-1 font-medium">{data.month}</div>
                <div className="text-xs text-gray-500 hidden md:block">
                  {data.count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-24 md:h-48 flex flex-col justify-between text-xs text-gray-500 w-4 md:w-10 text-right pr-1 md:pr-2">
          <span className="hidden md:block">{maxCount}</span>
          <span className="hidden md:block">{Math.ceil(maxCount * 0.75)}</span>
          <span className="hidden md:block">{Math.ceil(maxCount * 0.5)}</span>
          <span className="hidden md:block">{Math.ceil(maxCount * 0.25)}</span>
          <span>0</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-1 md:gap-6 pt-4 border-t border-gray-200 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">
            <span className="md:hidden">Atingida</span>
            <span className="hidden md:inline">Meta Atingida (≥{MONTHLY_GOAL})</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">
            <span className="md:hidden">Próxima</span>
            <span className="hidden md:inline">Próximo à Meta (≥{Math.ceil(MONTHLY_GOAL * 0.8)})</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">
            <span className="md:hidden">Abaixo</span>
            <span className="hidden md:inline">Abaixo da Meta (&lt;{Math.ceil(MONTHLY_GOAL * 0.8)})</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 md:w-8 h-0.5 border-t-2 border-dashed border-gray-400"></div>
          <span className="text-gray-600">
            <span className="md:hidden">Meta</span>
            <span className="hidden md:inline">Meta Mensal</span>
          </span>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 text-center">
        {annualProgress >= 100 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 font-medium">
              Parabéns! Meta anual de {annualGoal} licitações já foi atingida!
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800">
              <strong>Progresso:</strong> {totalLicitacoes} de {annualGoal} licitações ({annualProgress.toFixed(1)}%)
              • <strong>Faltam:</strong> {annualGoal - totalLicitacoes} licitações para a meta anual
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
