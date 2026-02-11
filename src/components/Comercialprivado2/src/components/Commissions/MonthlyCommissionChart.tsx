import React from 'react';
import { BarChart3, DollarSign } from 'lucide-react';
import { calculateMonthlyCommissions } from '../../utils/commissionUtils';
import { formatCurrency } from '../../utils/formatCurrency';

interface MonthlyCommissionChartProps {
  employeeId: string;
  employeeRole: 'closer' | 'sdr';
  proposals: any[];
  employeeName: string;
  selectedYear: number;
}

export const MonthlyCommissionChart: React.FC<MonthlyCommissionChartProps> = ({
  employeeId,
  employeeRole,
  proposals,
  employeeName,
  selectedYear
}) => {
  const monthlyData = calculateMonthlyCommissions(proposals, employeeId, employeeRole, selectedYear);
  
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  // Calcular valor máximo para escala do gráfico
  const maxCommission = Math.max(
    ...Object.values(monthlyData).map(data => data.commission),
    1000 // Valor mínimo para escala
  );
  
  const totalCommissions = Object.values(monthlyData).reduce((sum, data) => sum + data.commission, 0);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Comissões Mensais - {employeeName}</span>
          </h3>
          <p className="text-sm text-gray-600">Comissões efetivas recebidas por mês em {selectedYear}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalCommissions)}
          </div>
          <div className="text-sm text-gray-500">Total Anual</div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="relative">
        <div className="flex items-end justify-between space-x-2 h-64 mb-4">
          {months.map((month, index) => {
            const monthKey = `${selectedYear}-${(index + 1).toString().padStart(2, '0')}`;
            const data = monthlyData[monthKey];
            const height = maxCommission > 0 ? (data.commission / maxCommission) * 100 : 0;
            
            return (
              <div key={month} className="flex-1 flex flex-col items-center">
                <div className="relative w-full h-48 flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer group"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div className="text-center">
                        <div className="font-medium">{formatCurrency(data.commission)}</div>
                        <div>{data.contracts.length} contrato{data.contracts.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 font-medium">{month}</div>
                <div className="text-xs text-gray-500">
                  {data.contracts.length > 0 ? `${data.contracts.length}` : '-'}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500 -ml-16">
          <span>{formatCurrency(maxCommission)}</span>
          <span>{formatCurrency(maxCommission * 0.75)}</span>
          <span>{formatCurrency(maxCommission * 0.5)}</span>
          <span>{formatCurrency(maxCommission * 0.25)}</span>
          <span>R$ 0,00</span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {Object.values(monthlyData).filter(data => data.contracts.length > 0).length}
          </div>
          <div className="text-sm text-gray-600">Meses com Comissão</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {Object.values(monthlyData).reduce((sum, data) => sum + data.contracts.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Contratos Fechados</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {totalCommissions > 0 ? formatCurrency(totalCommissions / 12) : 'R$ 0,00'}
          </div>
          <div className="text-sm text-gray-600">Média Mensal</div>
        </div>
      </div>
    </div>
  );
};