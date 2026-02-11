/**
 * Componente: SalesCycleTimeKPI
 * 
 * Propósito: KPI de Tempo de Ciclo de Vendas
 * Fórmula: Soma do tempo para fechar cada negócio ÷ Número de negócios fechados
 */

import React, { useState } from 'react';
import { Clock, Info, X } from 'lucide-react';
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

const SalesCycleTimeModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  if (!isOpen) return null;

  // Calcular tempo de ciclo mensal dos últimos 12 meses
  const calculateMonthlyCycleTime = () => {
    const monthlyData: { month: string; cycleTime: number; closedDeals: number; totalDays: number }[] = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const monthKey = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Negócios fechados no mês
      const closedDeals = proposals.filter(proposal => {
        if (proposal.status !== 'Fechado' || !proposal.closing_date) return false;
        
        const closingDate = new Date(proposal.closing_date);
        return closingDate >= monthDate && closingDate <= monthEnd;
      });
      
      // Calcular tempo total para todos os negócios do mês
      const totalDays = closedDeals.reduce((sum, proposal) => {
        const createdDate = new Date(proposal.created_at);
        const closingDate = new Date(proposal.closing_date!);
        const diffTime = closingDate.getTime() - createdDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      
      // Tempo médio de ciclo
      const cycleTime = closedDeals.length > 0 ? totalDays / closedDeals.length : 0;
      
      monthlyData.push({ 
        month: monthKey, 
        cycleTime, 
        closedDeals: closedDeals.length,
        totalDays
      });
    }
    
    return monthlyData;
  };

  const monthlyData = calculateMonthlyCycleTime();
  const currentCycleTime = monthlyData[monthlyData.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tempo de Ciclo de Vendas</h2>
              <p className="text-sm text-gray-600">Tempo médio para fechar negócios</p>
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
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ciclo Atual</h3>
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {Math.round(currentCycleTime?.cycleTime || 0)} dias
            </div>
            <p className="text-sm text-gray-600">
              Tempo médio proposta → fechamento
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Negócios fechados:</span>
                  <span className="text-sm font-bold text-gray-900">{currentCycleTime?.closedDeals || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Total de dias:</span>
                  <span className="text-sm font-bold text-gray-900">{currentCycleTime?.totalDays || 0} dias</span>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                  <p className="text-sm font-medium text-indigo-800">
                    <strong>Fórmula:</strong> {currentCycleTime?.totalDays || 0} dias ÷ {currentCycleTime?.closedDeals || 0} negócios = {Math.round(currentCycleTime?.cycleTime || 0)} dias
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
                          label: 'Tempo de Ciclo (dias)',
                          data: monthlyData.map(d => d.cycleTime),
                          backgroundColor: '#6366F1',
                          borderColor: '#6366F1',
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
                              return `Ciclo: ${Math.round(context.parsed.y)} dias`;
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
                              return `${Math.round(value)} dias`;
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
                    <div className="text-lg font-bold text-indigo-600">
                      {Math.round(Math.max(...monthlyData.map(d => d.cycleTime)))} dias
                    </div>
                    <div className="text-sm text-gray-600">Maior Ciclo</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-indigo-600">
                      {Math.round(monthlyData.reduce((sum, d) => sum + d.cycleTime, 0) / monthlyData.length)} dias
                    </div>
                    <div className="text-sm text-gray-600">Média 12 Meses</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-indigo-600">
                      {Math.round(currentCycleTime?.cycleTime || 0)} dias
                    </div>
                    <div className="text-sm text-gray-600">Ciclo Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-medium text-indigo-800 mb-2">💡 Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>⏱️ Definição:</strong> Tempo médio desde criação até fechamento</p>
              <p><strong>📊 Cálculo:</strong> Soma de todos os tempos ÷ número de fechamentos</p>
              <p><strong>🎯 Meta ideal:</strong> Ciclo mais curto indica processo eficiente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SalesCycleTimeKPI: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  // Calcular tempo de ciclo atual (último mês com fechamentos)
  const closedProposals = proposals.filter(proposal => 
    proposal.status === 'Fechado' && 
    proposal.closing_date && 
    proposal.created_at
  );
  
  const calculateAverageCycleTime = () => {
    if (closedProposals.length === 0) return 0;
    
    const totalDays = closedProposals.reduce((sum, proposal) => {
      const createdDate = new Date(proposal.created_at);
      const closingDate = new Date(proposal.closing_date!);
      const diffTime = closingDate.getTime() - createdDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return totalDays / closedProposals.length;
  };

  const averageCycleTime = calculateAverageCycleTime();

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 p-1.5 hover:bg-indigo-100 rounded-full transition-colors"
          title="Ver detalhes do Tempo de Ciclo"
        >
          <Info className="w-4 h-4 text-indigo-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Tempo de Ciclo
          </h3>
        </div>
        
        <div className="text-2xl font-bold text-indigo-600 mb-2">
          {Math.round(averageCycleTime)} dias
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Proposta → Fechamento
        </p>
        
        <div className="text-sm text-gray-700 space-y-1">
          <div>Fechamentos: <strong>{closedProposals.length}</strong></div>
          <div>Tempo total: <strong>{Math.round(averageCycleTime * closedProposals.length)} dias</strong></div>
          <div>Eficiência: <strong>{averageCycleTime <= 30 ? 'Rápido' : averageCycleTime <= 60 ? 'Médio' : 'Lento'}</strong></div>
        </div>
        
        <div className="mt-2 text-xs text-indigo-600 font-medium">● Tempo total ÷ Fechamentos</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - (11 - i), 1);
              const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
              
              const monthClosedProposals = proposals.filter(proposal => {
                if (proposal.status !== 'Fechado' || !proposal.closing_date) return false;
                const closingDate = new Date(proposal.closing_date);
                return closingDate >= monthDate && closingDate <= monthEnd;
              });
              
              if (monthClosedProposals.length === 0) return 0;
              
              const monthTotalDays = monthClosedProposals.reduce((sum, proposal) => {
                const createdDate = new Date(proposal.created_at);
                const closingDate = new Date(proposal.closing_date!);
                const diffTime = closingDate.getTime() - createdDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return sum + diffDays;
              }, 0);
              
              return monthTotalDays / monthClosedProposals.length;
            })}
            color="#6366F1"
            height={40}
          />
        </div>
      </div>

      <SalesCycleTimeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};