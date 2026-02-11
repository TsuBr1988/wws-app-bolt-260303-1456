import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { ChartDataPoint } from '@/types/database';

interface BarsWithLineProps {
  data: ChartDataPoint[];
  barKey: string;
  lineKey: string;
  barName: string;
  lineName: string;
  barColor?: string;
  lineColor?: string;
}

export function BarsWithLine({
  data,
  barKey,
  lineKey,
  barName,
  lineName,
  barColor = '#3b82f6',
  lineColor = '#ef4444',
}: BarsWithLineProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12 }}
          label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          label={{ value: 'Valor (R$)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === lineName) {
              return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
            }
            return [value, name];
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey={barKey}
          name={barName}
          fill={barColor}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={lineKey}
          name={lineName}
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
