import React from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

interface KPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  formula: string;
  currentValue: string;
  chartData: { month: string; value: number; contractCount?: number }[];
  insights: string[];
}

export const KPIModal: React.FC<KPIModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  formula,
  currentValue,
  chartData,
  insights
}) => {
  if (!isOpen) return null;

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  const calculateTrend = () => {
    if (chartData.length < 2) return 'neutral';
    const current = chartData[chartData.length - 1].value;
    const previous = chartData[chartData.length - 2].value;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const trend = calculateTrend();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Valor Atual</h3>
            <div className="flex items-center space-x-3">
              <div className="text-3xl font-bold text-blue-600">{currentValue}</div>
              {trend === 'up' && <TrendingUp className="w-6 h-6 text-green-600" />}
              {trend === 'down' && <TrendingDown className="w-6 h-6 text-red-600" />}
              {trend === 'neutral' && <Minus className="w-6 h-6 text-gray-600" />}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Fórmula de Cálculo</h3>
            <code className="text-sm text-gray-700 bg-white px-3 py-2 rounded border border-gray-200 block">
              {formula}
            </code>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Evolução Mensal</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-end justify-between gap-2 h-64 mb-4 bg-white rounded-lg p-4 border border-gray-100">
                {chartData.map((data, index) => {
                  const height = (data.value / maxValue) * 100;
                  const hasValue = data.value > 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center min-w-0">
                      <div className="relative w-full h-full flex items-end justify-center">
                        {hasValue ? (
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 cursor-pointer group relative shadow-sm"
                            style={{ height: `${Math.max(height, 8)}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                              <div className="font-semibold">{formatCurrency(data.value)}</div>
                              {data.contractCount !== undefined && (
                                <div className="text-gray-300 mt-1">
                                  {data.contractCount} contrato{data.contractCount !== 1 ? 's' : ''} acumulado{data.contractCount !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-1 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-xs text-gray-700 mt-3 font-medium truncate w-full text-center">
                        {data.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {chartData.some(d => d.contractCount !== undefined) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Evolução Detalhada</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Mês</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Ticket Médio</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Contratos Acumulados</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((data, index) => {
                      const previousValue = index > 0 ? chartData[index - 1].value : data.value;
                      const variation = previousValue > 0 ? ((data.value - previousValue) / previousValue) * 100 : 0;
                      const isPositive = variation > 0;
                      const isNegative = variation < 0;

                      return (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="py-2 px-3 font-medium text-gray-800">{data.month}</td>
                          <td className="py-2 px-3 text-right font-semibold text-blue-600">
                            {formatCurrency(data.value)}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-600">
                            {data.contractCount || 0}
                          </td>
                          <td className={`py-2 px-3 text-right font-medium ${
                            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {index > 0 ? (
                              <>
                                {isPositive && '+'}
                                {variation.toFixed(1)}%
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {insights.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3">Insights e Análises</h3>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="text-sm text-green-800 flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
