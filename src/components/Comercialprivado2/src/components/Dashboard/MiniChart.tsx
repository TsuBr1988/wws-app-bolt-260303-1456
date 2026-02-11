import React from 'react';

interface MiniChartProps {
  data: number[];
  color: string;
  type?: 'line' | 'bar';
  height?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({ 
  data, 
  color, 
  type = 'bar', 
  height = 40 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-xs text-gray-400">Sem dados</div>
      </div>
    );
  }

  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;

  if (type === 'line') {
    // SVG Line Chart
    const width = 120;
    const padding = 2;
    const innerWidth = width - (padding * 2);
    const innerHeight = height - (padding * 2);

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * innerWidth;
      const y = padding + innerHeight - ((value - minValue) / range) * innerHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="w-full">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {data.map((value, index) => {
          const x = padding + (index / (data.length - 1)) * innerWidth;
          const y = padding + innerHeight - ((value - minValue) / range) * innerHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
            />
          );
        })}
      </svg>
    );
  }

  // Bar Chart (default)
  return (
    <div className="flex items-end justify-between h-full space-x-0.5">
      {data.map((value, index) => {
        const heightPercentage = ((value - minValue) / range) * 100;
        return (
          <div
            key={index}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              backgroundColor: color,
              height: `${Math.max(heightPercentage, 5)}%`,
              opacity: value === 0 ? 0.3 : 1,
              minWidth: '2px'
            }}
            title={`${value.toFixed(2)}`}
          />
        );
      })}
    </div>
  );
};