import React from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { formatCurrency } from '../../../utils';

interface SheetDetailChartProps {
  chartData: Array<{
    month: string;
    Orçado: number;
    Realizado: number;
  }>;
}

export const SheetDetailChart: React.FC<SheetDetailChartProps> = ({ chartData }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <h4 className="text-lg font-bold text-slate-900 mb-6">
        Evolução Mensal: Orçado vs Realizado
      </h4>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              stroke="#cbd5e1"
              tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="Orçado" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Line
              type="monotone"
              dataKey="Realizado"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
