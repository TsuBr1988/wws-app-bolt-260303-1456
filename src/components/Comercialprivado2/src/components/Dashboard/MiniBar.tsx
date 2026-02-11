import React from 'react';
import { ResponsiveContainer, BarChart, Bar } from 'recharts';

type MiniBarProps = {
  data: number[] | undefined | null; // mesma série usada no modal (só os valores)
  color: string;                      // cor por KPI
  height?: number;                    // padrão 44px
};

export default function MiniBar({ data, color, height = 44 }: MiniBarProps) {
  const values = Array.isArray(data)
    ? data.map(n => Number(n)).filter(n => Number.isFinite(n))
    : [];

  // Garantir que o pai tenha uma altura explícita para o ResponsiveContainer
  if (values.length === 0) {
    return <div style={{ height }} className="w-full rounded-md bg-gray-100" aria-label="sem dados" />;
  }

  const chartData = values.map((v, i) => ({ i, v }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          {/* eixos/grid default ficam ocultos por não declararmos */}
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}