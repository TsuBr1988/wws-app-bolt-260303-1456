import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, Cell } from 'recharts';

interface ContractVsEffectiveData {
  monthLabel: string;
  [key: string]: number | string;
  contract: number;
  effective: number;
}

interface ContractVsEffectiveBarsProps {
  data: ContractVsEffectiveData[];
  categories: string[];
}

const COLOR_PALETTE = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#EF4444', // red
  '#06B6D4', // cyan
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  categories: string[];
}

function CustomTooltip({ active, payload, label, categories }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value: number) => value.toLocaleString('pt-BR');

  const dataPoint = payload[0]?.payload;
  const totalContract = dataPoint?.contract || 0;
  const totalEffective = dataPoint?.effective || 0;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-bold text-gray-900 mb-2">Período: {label}</p>

      <div className="space-y-1 mb-2">
        {categories.map((category, index) => {
          const value = dataPoint?.[`contract_${category}`] || 0;
          return (
            <div key={category} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length] }}
                />
                <span className="text-sm text-gray-700">Contrato {category}:</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatValue(value)}</span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 pt-2 mb-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-gray-900">Total Contratos:</span>
          <span className="text-sm font-bold text-blue-600">{formatValue(totalContract)}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: totalEffective > totalContract ? '#EF4444' : '#10B981' }}
            />
            <span className="text-sm font-bold text-gray-900">Efetivos:</span>
          </div>
          <span
            className={`text-sm font-bold ${totalEffective > totalContract ? 'text-red-600' : 'text-green-600'}`}
          >
            {formatValue(totalEffective)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ContractVsEffectiveBars({ data, categories }: ContractVsEffectiveBarsProps) {
  const formatValue = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  const renderContractLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const dataPoint = data[index];
    const totalContract = dataPoint?.contract || 0;

    if (totalContract === 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#1f2937"
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {formatValue(totalContract)}
      </text>
    );
  };

  const renderEffectiveLabel = (props: any) => {
    const { x, y, width, value } = props;

    if (!value || value === 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#1f2937"
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {formatValue(value)}
      </text>
    );
  };

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
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
            label={{ value: 'Funcionários', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip categories={categories} />} />
          <Legend />
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={`contract_${category}`}
              name={`Contrato ${category}`}
              fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
              stackId="contract"
              radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            >
              {index === categories.length - 1 && (
                <LabelList content={renderContractLabel} position="top" />
              )}
            </Bar>
          ))}
          <Bar
            dataKey="effective"
            name="Efetivos"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          >
            {data.map((d) => (
              <Cell
                key={d.monthLabel}
                fill={d.effective > d.contract ? '#EF4444' : '#10B981'}
              />
            ))}
            <LabelList content={renderEffectiveLabel} position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
