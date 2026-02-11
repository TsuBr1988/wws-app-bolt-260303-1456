import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format, addMonths, startOfMonth } from 'date-fns';
import { ContractWithAddendums, getValueForMonth, formatCurrency, isContractExpired } from '../../lib/contractUtils';

interface ContractChartProps {
  contracts: ContractWithAddendums[];
  selectedYear: number;
  onInfoClick: () => void;
}

export function ContractChart({ contracts, selectedYear, onInfoClick }: ContractChartProps) {
  const [startMonth, setStartMonth] = useState(0);

  const chartData = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (startMonth + i) % 12;
      const yearOffset = Math.floor((startMonth + i) / 12);
      const monthDate = new Date(selectedYear + yearOffset, monthIndex, 1);

      let wwsTotal = 0;
      let worldwideTotal = 0;
      let activeCount = 0;

      contracts.forEach((contract) => {
        const value = getValueForMonth(contract, monthDate);
        if (value > 0) {
          activeCount++;
          if (contract.empresa === 'WWS') {
            wwsTotal += value;
          } else {
            worldwideTotal += value;
          }
        }
      });

      months.push({
        month: format(monthDate, 'MMM/yy'),
        monthDate,
        wws: wwsTotal,
        worldwide: worldwideTotal,
        total: wwsTotal + worldwideTotal,
        activeCount,
      });
    }
    return months;
  }, [contracts, selectedYear, startMonth]);

  const maxValue = Math.max(...chartData.map((d) => d.total));
  const totalAnual = chartData.reduce((sum, d) => sum + d.total, 0);
  const mediaMensal = totalAnual / 12;
  const activeContracts = contracts.filter((c) => c.is_active && !isContractExpired(c)).length;

  const handlePrevious = () => {
    setStartMonth((prev) => (prev - 1 + 12) % 12);
  };

  const handleNext = () => {
    setStartMonth((prev) => (prev + 1) % 12);
  };

  const firstMonth = chartData[0]?.month;
  const lastMonth = chartData[11]?.month;

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-dark">Faturamento Mensal</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-green-500 to-green-400 rounded"></div>
            <span className="text-sm text-gray-600">WWS</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-b from-orange-500 to-orange-400 rounded"></div>
            <span className="text-sm text-gray-600">Worldwide</span>
          </div>
          <button
            onClick={onInfoClick}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ver detalhamento"
          >
            <Info className="h-5 w-5 text-blue-600" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevious}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {firstMonth} - {lastMonth}
        </span>
        <button
          onClick={handleNext}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="relative h-64">
        <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
          {[100, 75, 50, 25, 0].map((percent) => (
            <div key={percent} className="text-right">
              {formatCurrency((maxValue * percent) / 100)}
            </div>
          ))}
        </div>

        <div className="ml-24 h-full flex items-end space-x-2">
          {chartData.map((data, index) => {
            const wwsHeight = maxValue > 0 ? (data.wws / maxValue) * 100 : 0;
            const worldwideHeight = maxValue > 0 ? (data.worldwide / maxValue) * 100 : 0;
            const totalHeight = wwsHeight + worldwideHeight;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
                style={{ height: '100%' }}
              >
                <div
                  className="w-full flex flex-col justify-end"
                  style={{ height: '100%' }}
                >
                  <div
                    className="w-full relative"
                    style={{ height: `${Math.max(totalHeight, 2)}%` }}
                  >
                    {data.worldwide > 0 && (
                      <div
                        className="w-full bg-gradient-to-b from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-colors cursor-pointer"
                        style={{
                          height: `${(worldwideHeight / totalHeight) * 100}%`,
                        }}
                      ></div>
                    )}
                    {data.wws > 0 && (
                      <div
                        className="w-full bg-gradient-to-b from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 transition-colors cursor-pointer"
                        style={{
                          height: `${(wwsHeight / totalHeight) * 100}%`,
                        }}
                      ></div>
                    )}

                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-xl">
                        <div className="font-semibold mb-1">{data.month}</div>
                        {data.wws > 0 && (
                          <div className="text-green-300">
                            WWS: {formatCurrency(data.wws)}
                          </div>
                        )}
                        {data.worldwide > 0 && (
                          <div className="text-orange-300">
                            Worldwide: {formatCurrency(data.worldwide)}
                          </div>
                        )}
                        <div className="text-blue-300 font-semibold mt-1 pt-1 border-t border-gray-700">
                          Total: {formatCurrency(data.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                  {data.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Anual</div>
          <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalAnual)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">Média Mensal</div>
          <div className="text-2xl font-bold text-green-900">{formatCurrency(mediaMensal)}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">Contratos Ativos</div>
          <div className="text-2xl font-bold text-purple-900">{activeContracts}</div>
        </div>
      </div>
    </div>
  );
}
