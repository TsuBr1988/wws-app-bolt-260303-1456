import React from 'react';
import { Info } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  baseInfo: string[];
  chartData: number[];
  onInfoClick: () => void;
  trend?: 'up' | 'down' | 'neutral';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  baseInfo,
  chartData,
  onInfoClick,
  trend = 'neutral'
}) => {
  const maxValue = Math.max(...chartData, 1);
  const normalizedData = chartData.map(v => (v / maxValue) * 100);

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          onClick={onInfoClick}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          title="Ver detalhes"
        >
          <Info className="w-4 h-4 text-gray-400 hover:text-blue-600" />
        </button>
      </div>

      <div className="mb-3">
        <div className={`text-2xl font-bold ${getTrendColor()}`}>
          {value}
        </div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>

      <div className="space-y-1 mb-4">
        {baseInfo.map((info, index) => (
          <div key={index} className="text-xs text-gray-600">
            {info}
          </div>
        ))}
      </div>

      <div className="flex items-end space-x-1 h-12">
        {normalizedData.map((height, index) => (
          <div
            key={index}
            className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
            style={{ height: `${Math.max(height, 5)}%` }}
            title={`Mês ${index + 1}: ${chartData[index].toFixed(2)}`}
          />
        ))}
      </div>
      <div className="text-xs text-center text-gray-400 mt-1">
        Evolução dos últimos {chartData.length} meses
      </div>
    </div>
  );
};
