/**
 * Componente: LTVKpi
 * 
 * Propósito: KPI de LTV (Valor Vitalício do Cliente)
 * Fórmula: Ticket médio × 12 meses (considerando 12 meses após assinatura)
 */

import React, { useState } from 'react';
import { DollarSign, Info, X } from 'lucide-react';
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

const LTVModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  if (!isOpen) return null;

  // Calcular LTV mensal dos últimos 12 meses
  const calculateMonthlyLTV = () => {
    const monthlyData: { month: string; ltv: number; ticketMedio: number; contracts: number }[] = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      const monthKey = monthEnd.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Contratos fechados até este mês
      const contractsClosedUntilMonth = proposals.filter(proposal => {
        if (proposal.status !== 'Fechado') return false;
        
        const closeDate = proposal.closing_date ? 
          new Date(proposal.closing_date) : 
          new Date(proposal.created_at);
        
        return closeDate <= monthEnd;
      });
      
      // Calcular ticket médio acumulativo
      const totalRevenue = contractsClosedUntilMonth.reduce(
        (sum, contract) => sum + (contract.monthly_value || 0), 0
      );
      
      const contractCount = contractsClosedUntilMonth.length;
      const ticketMedio = contractCount > 0 ? totalRevenue / contractCount : 0;
      
      // LTV = Ticket médio × 12 meses
      const ltv = ticketMedio * 12;
      
      monthlyData.push({ 
        month: monthKey, 
        ltv, 
        ticketMedio, 
        contracts: contractCount 
      });
    }
    
    return monthlyData;
  };

  const monthlyData = calculateMonthlyLTV();
  const currentLTV = monthlyData[monthlyData.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">LTV - Valor Vitalício do Cliente</h2>
              <p className="text-sm text-gray-600">Receita esperada durante o ciclo de vida</p>
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
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">LTV Atual</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatCurrency(currentLTV?.ltv || 0)}
            </div>
            <p className="text-sm text-gray-600">
              Ticket médio × 12 meses de contribuição
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Contratos acumulados:</span>
                  <span className="text-sm font-bold text-gray-900">{currentLTV?.contracts || 0} contratos</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Ticket médio:</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(currentLTV?.ticketMedio || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Período de contribuição:</span>
                  <span className="text-sm font-bold text-gray-900">12 meses</span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-medium text-blue-800">
                    <strong>Fórmula:</strong> {formatCurrency(currentLTV?.ticketMedio || 0)} × 12 meses = {formatCurrency(currentLTV?.ltv || 0)}
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
                          label: 'LTV (Valor Vitalício)',
                          data: monthlyData.map(d => d.ltv),
                          backgroundColor: '#3B82F6',
                          borderColor: '#3B82F6',
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
                              return `LTV: ${formatCurrency(context.parsed.y)}`;
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
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(Math.max(...monthlyData.map(d => d.ltv)))}
                    </div>
                    <div className="text-sm text-gray-600">Maior LTV</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(monthlyData.reduce((sum, d) => sum + d.ltv, 0) / monthlyData.length)}
                    </div>
                    <div className="text-sm text-gray-600">LTV Médio</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(currentLTV?.ltv || 0)}
                    </div>
                    <div className="text-sm text-gray-600">LTV Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Insights e Metodologia</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>📊 Definição:</strong> Valor total que um cliente gera durante seu relacionamento</p>
              <p><strong>⏰ Período:</strong> 12 meses fixos após assinatura do contrato</p>
              <p><strong>🔄 Cálculo:</strong> Ticket médio multiplicado por 12 meses</p>
              <p><strong>📈 Tendência:</strong> LTV crescente indica clientes de maior valor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LTVKpi: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  // Calcular LTV atual
  const currentDate = new Date();
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Contratos fechados até agora
  const contractsClosedUntilNow = proposals.filter(proposal => {
    if (proposal.status !== 'Fechado') return false;
    
    const closeDate = proposal.closing_date ? 
      new Date(proposal.closing_date) : 
      new Date(proposal.created_at);
    
    return closeDate <= monthEnd;
  });
  
  // Calcular ticket médio acumulativo
  const totalRevenue = contractsClosedUntilNow.reduce(
    (sum, contract) => sum + (contract.monthly_value || 0), 0
  );
  
  const contractCount = contractsClosedUntilNow.length;
  const ticketMedio = contractCount > 0 ? totalRevenue / contractCount : 0;
  
  // LTV = Ticket médio × 12 meses
  const ltv = ticketMedio * 12;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 p-1.5 hover:bg-blue-100 rounded-full transition-colors"
          title="Ver detalhes do LTV"
        >
          <Info className="w-4 h-4 text-blue-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            LTV (Valor Vitalício)
          </h3>
        </div>
        
        <div className="text-2xl font-bold text-blue-600 mb-2">
          {formatCurrency(ltv)}
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Por cliente em 12 meses
        </p>
        
        <div className="text-sm text-gray-700 space-y-1">
          <div>Ticket médio: <strong>{formatCurrency(ticketMedio)}</strong></div>
          <div>Período: <strong>12 meses</strong></div>
          <div>Contratos base: <strong>{contractCount}</strong></div>
        </div>
        
        <div className="mt-2 text-xs text-blue-600 font-medium">● Ticket médio × 12m</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i) + 1, 0);
              const monthContracts = proposals.filter(proposal => {
                if (proposal.status !== 'Fechado') return false;
                const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
                return closeDate <= monthEnd;
              });
              const monthRevenue = monthContracts.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
              const monthTicket = monthContracts.length > 0 ? monthRevenue / monthContracts.length : 0;
              return monthTicket * 12;
            })}
            color="#3B82F6"
            height={40}
          />
        </div>
      </div>

      <LTVModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};