import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/types/database';

interface SimpleBarsProps {
  data: ChartDataPoint[];
  dataKey: string;
  name: string;
  color?: string;
  yAxisLabel?: string;
  valueFormat?: 'currency' | 'percent' | 'number';
}

export function SimpleBars({ data, dataKey, name, color = '#3B82F6', yAxisLabel, valueFormat = 'currency' }: SimpleBarsProps) {
  const formatValue = (value: number | string) => {
    if (typeof value !== 'number') return value;

    switch (valueFormat) {
      case 'percent':
        return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
      case 'number':
        return value.toLocaleString('pt-BR');
      case 'currency':
      default:
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
  };
  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="monthLabel" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value) => [formatValue(value as number), name]}
            labelFormatter={(label) => `Período: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey={dataKey} 
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}