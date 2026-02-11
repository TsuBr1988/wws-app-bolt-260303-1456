import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, LabelList } from 'recharts';
import { ChartDataPoint } from '@/types/database';

interface StackedBarsProps {
  data: ChartDataPoint[];
  series: { key: string; name: string; color?: string }[];
  yAxisLabel?: string;
}

const CustomLabel = (props: any) => {
  const { x, y, width, value, index, data } = props;

  if (index === 0) return null;

  const currentTotal = data[index]?.total || 0;
  const previousTotal = data[index - 1]?.total || 0;

  if (previousTotal === 0) return null;

  const variation = ((currentTotal - previousTotal) / previousTotal) * 100;
  const formattedVariation = `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`;
  const color = variation >= 0 ? '#10B981' : '#EF4444';

  return (
    <g>
      <text
        x={x - width / 2}
        y={y - 10}
        fill={color}
        fontSize={11}
        fontWeight="600"
        textAnchor="middle"
      >
        {formattedVariation}
      </text>
    </g>
  );
};

export function StackedBars({ data, series, yAxisLabel }: StackedBarsProps) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (!series || series.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const dataWithTotals = data.map(item => {
    const total = series.reduce((sum, s) => sum + (Number(item[s.key]) || 0), 0);
    return { ...item, total };
  });

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={dataWithTotals}
          margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
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
            tickFormatter={formatYAxis}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString('pt-BR') : value,
              name
            ]}
            labelFormatter={(label) => `Período: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;

              const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <p className="text-sm font-semibold mb-2">Período: {label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                      {entry.name}: {Number(entry.value).toLocaleString('pt-BR')}
                    </p>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <p className="text-sm font-bold text-gray-900">
                      Total: {total.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          {series.map((serie, index) => (
            <Bar
              key={serie.key}
              dataKey={serie.key}
              name={serie.name}
              fill={serie.color || colors[index % colors.length]}
              stackId="a"
              radius={index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            >
              {index === series.length - 1 && (
                <LabelList
                  dataKey={serie.key}
                  content={(props) => <CustomLabel {...props} data={dataWithTotals} />}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}