/**
 * Componente: SalesGrowthKPI
 * 
 * Propósito: KPI de Crescimento das Vendas
 * Fórmula: (faturamento do mês atual - faturamento do período anterior) ÷ faturamento do período anterior
 * Consideração: faturamento = valor mensal por 12 meses após assinatura
 */

import React, { useState } from 'react';
import { TrendingUp, Info, X, Calendar, DollarSign } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';
import MiniBar from '../Dashboard/MiniBar';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface KPIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthData: {
    month: Date;
    revenue: number;
    contracts: any[];
  };
  title: string;
}

const BreakdownModal: React.FC<BreakdownModalProps> = ({ isOpen, onClose, monthData, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">
                {monthData.month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          {monthData.contracts.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(monthData.revenue)}
                  </div>
                  <div className="text-sm text-green-700">
                    Total do faturamento ({monthData.contracts.length} contrato{monthData.contracts.length !== 1 ? 's' : ''})
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contratos que contribuem para o faturamento:</h3>
              
              <div className="space-y-3">
                {monthData.contracts.map((contract, index) => {
                  const closingDate = new Date(contract.closing_date || contract.created_at);
                  
                  // Calcular diferença em meses completos de forma mais precisa
                  const yearsDiff = monthData.month.getFullYear() - closingDate.getFullYear();
                  const monthsDiff = monthData.month.getMonth() - closingDate.getMonth();
                  let monthsAfterClosing = yearsDiff * 12 + monthsDiff;
                  
                  // Se o dia do mês analisado for menor que o dia de fechamento, subtrair 1 mês
                  if (monthData.month.getDate() < closingDate.getDate()) {
                    monthsAfterClosing--;
                  }
                  
                  // Garantir que seja pelo menos 1 se estamos no mesmo mês ou posterior
                  if (monthData.month >= new Date(closingDate.getFullYear(), closingDate.getMonth(), 1)) {
                    monthsAfterClosing = Math.max(1, monthsAfterClosing);
                  }
                  
                  // Limitar a 12 meses máximo
                  monthsAfterClosing = Math.min(12, monthsAfterClosing);
                  
                  return (
                    <div key={contract.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{contract.client}</h4>
                          <div className="text-sm text-gray-600">
                            Fechado em: {displayDate(contract.closing_date || contract.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(contract.monthly_value)}
                          </div>
                          <div className="text-xs text-gray-500">contribuição mensal</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Valor Global:</span>
                          <div className="font-medium">{formatCurrency(contract.total_value)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Duração:</span>
                          <div className="font-medium">{contract.months} meses</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Meses ativo:</span>
                          <div className="font-medium">
                            {monthsAfterClosing}/12 meses
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato ativo</h3>
              <p className="text-gray-500">
                Não há contratos contribuindo para o faturamento neste mês
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SalesGrowthModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const [showBreakdownModal, setShowBreakdownModal] = useState<'current' | 'previous' | null>(null);
  
  if (!isOpen) return null;

  // Calcular faturamento mensal dos últimos 12 meses
  const calculateMonthlyRevenue = () => {
    const monthlyData: { month: string; revenue: number }[] = [];
    const currentDate = new Date();
    const detailedData: { month: Date; revenue: number; contracts: any[] }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Calcular faturamento do mês considerando apenas 12 meses de contribuição por contrato
      const activeContracts: any[] = [];
      const monthRevenue = proposals.reduce((sum, proposal) => {
        if (proposal.status !== 'Fechado' || !proposal.closing_date) return sum;
        
        const closingDate = new Date(proposal.closing_date);
        // Calcular diferença em meses completos
        const yearsDiff = monthDate.getFullYear() - closingDate.getFullYear();
        const monthsDiff = monthDate.getMonth() - closingDate.getMonth();
        const monthsAfterClosing = yearsDiff * 12 + monthsDiff + 1; // +1 para iniciar em 1/12
        
        // Só conta se o contrato está entre 1/12 e 12/12 meses
        if (monthsAfterClosing >= 1 && monthsAfterClosing <= 12) {
          activeContracts.push(proposal);
          return sum + (proposal.monthly_value || 0);
        }
        
        return sum;
      }, 0);
      
      monthlyData.push({ month: monthKey, revenue: monthRevenue });
      detailedData.push({ month: monthDate, revenue: monthRevenue, contracts: activeContracts });
    }
    
    return { monthlyData, detailedData };
  };

  const { monthlyData, detailedData } = calculateMonthlyRevenue();
  const currentMonthRevenue = detailedData[detailedData.length - 1]?.revenue || 0;
  const previousMonthRevenue = detailedData[detailedData.length - 2]?.revenue || 0;
  
  const currentMonthData = detailedData[detailedData.length - 1];
  const previousMonthData = detailedData[detailedData.length - 2];
  
  const growthRate = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Crescimento das Vendas</h2>
              <p className="text-sm text-gray-600">Variação mensal no faturamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Valor Atual */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Crescimento Atual</h3>
            <div className={`text-4xl font-bold mb-2 ${
              growthRate >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              (Faturamento atual - Faturamento anterior) ÷ Faturamento anterior
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Faturamento mês atual:</span>
                  <button
                    onClick={() => setShowBreakdownModal('current')}
                    className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer underline"
                    title="Clique para ver composição"
                  >
                    {formatCurrency(currentMonthRevenue)}
                  </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Faturamento mês anterior:</span>
                  <button
                    onClick={() => setShowBreakdownModal('previous')}
                    className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer underline"
                    title="Clique para ver composição"
                  >
                    {formatCurrency(previousMonthRevenue)}
                  </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Diferença absoluta:</span>
                  <span className={`text-sm font-bold ${
                    currentMonthRevenue - previousMonthRevenue >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(currentMonthRevenue - previousMonthRevenue))}
                  </span>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-medium text-green-800">
                    <strong>Fórmula:</strong> ({formatCurrency(currentMonthRevenue)} - {formatCurrency(previousMonthRevenue)}) ÷ {formatCurrency(previousMonthRevenue)} = {growthRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Gráfico de Evolução */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evolução - Últimos 12 Meses</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="w-full h-64">
                  <Bar
                    data={{
                      labels: monthlyData.map(d => d.month),
                      datasets: [
                        {
                          label: 'Faturamento Mensal',
                          data: monthlyData.map(d => d.revenue),
                          backgroundColor: '#10B981',
                          borderColor: '#10B981',
                          borderWidth: 1,
                          borderRadius: 4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context: any) {
                              return `Faturamento: ${formatCurrency(context.parsed.y)}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            display: false
                          },
                          ticks: {
                            callback: function(value: any) {
                              return formatCurrency(value);
                            }
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(Math.max(...monthlyData.map(d => d.revenue)))}
                    </div>
                    <div className="text-sm text-gray-600">Maior Faturamento</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(monthlyData.reduce((sum, d) => sum + d.revenue, 0) / monthlyData.length)}
                    </div>
                    <div className="text-sm text-gray-600">Média Mensal</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Crescimento Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metodologia */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">💡 Metodologia</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>📈 Faturamento:</strong> Valor mensal de contratos ativos (máximo 12 meses por contrato)</p>
              <p><strong>🔄 Comparação:</strong> Mês atual vs mês anterior</p>
              <p><strong>📊 Interpretação:</strong> Valores positivos indicam crescimento, negativos indicam retração</p>
              <p><strong>🎯 Meta ideal:</strong> Crescimento consistente mês a mês</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Breakdown Modals */}
      {showBreakdownModal === 'current' && currentMonthData && (
        <BreakdownModal
          isOpen={true}
          onClose={() => setShowBreakdownModal(null)}
          monthData={currentMonthData}
          title="Composição do Faturamento - Mês Atual"
        />
      )}
      
      {showBreakdownModal === 'previous' && previousMonthData && (
        <BreakdownModal
          isOpen={true}
          onClose={() => setShowBreakdownModal(null)}
          monthData={previousMonthData}
          title="Composição do Faturamento - Mês Anterior"
        />
      )}
    </div>
  );
};

export const SalesGrowthKPI: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  // Calcular crescimento atual
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  
  const calculateMonthRevenue = (targetMonth: Date) => {
    return proposals.reduce((sum, proposal) => {
      if (proposal.status !== 'Fechado' || !proposal.closing_date) return sum;
      
      const closingDate = new Date(proposal.closing_date);
      // Calcular diferença em meses completos (iniciando em 1/12)
      const yearsDiff = targetMonth.getFullYear() - closingDate.getFullYear();
      const monthsDiff = targetMonth.getMonth() - closingDate.getMonth();
      const monthsAfterClosing = yearsDiff * 12 + monthsDiff + 1; // +1 para iniciar em 1/12
      
      // Só conta se o contrato está entre 1/12 e 12/12 meses
      if (monthsAfterClosing >= 1 && monthsAfterClosing <= 12) {
        return sum + (proposal.monthly_value || 0);
      }
        
      // Se passou de 12/12 meses, não conta mais
      return sum;
    }, 0);
  };

  const currentMonthRevenue = calculateMonthRevenue(currentMonth);
  const previousMonthRevenue = calculateMonthRevenue(previousMonth);
  
  const growthRate = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 p-1.5 hover:bg-green-100 rounded-full transition-colors"
          title="Ver detalhes do Crescimento das Vendas"
        >
          <Info className="w-4 h-4 text-green-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Crescimento das Vendas
          </h3>
        </div>
        
        <div className={`text-2xl font-bold mb-2 ${
          growthRate >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Mês atual vs anterior
        </p>
        
        <div className="text-sm text-gray-700 space-y-1">
          <div>Atual: <strong>{formatCurrency(currentMonthRevenue)}</strong></div>
          <div>Anterior: <strong>{formatCurrency(previousMonthRevenue)}</strong></div>
          <div className={`${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Variação: <strong>{formatCurrency(Math.abs(currentMonthRevenue - previousMonthRevenue))}</strong>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-green-600 font-medium">● Comparação mensal</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i), 1);
              return calculateMonthRevenue(monthDate);
            })}
            color="#10B981"
            height={40}
          />
        </div>
      </div>

      <SalesGrowthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};