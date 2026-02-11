/**
 * Componente: SalesConversionKPI
 * 
 * Propósito: KPI de Taxa de Conversão de Vendas (ACUMULATIVO)
 * Fórmula: Total de contratos fechados de todos os tempos ÷ Total de propostas de todos os tempos
 * Metodologia: Snapshot acumulativo - sempre considera histórico completo até o mês
 */

import React, { useState } from 'react';
import { Users, Info, X } from 'lucide-react';
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

const SalesConversionModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  if (!isOpen) return null;

  // Calcular conversão acumulativa mensal dos últimos 12 meses
  const calculateMonthlyConversion = () => {
    const monthlyData: { month: string; conversion: number; clients: number; proposals: number }[] = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0); // Último dia do mês
      const monthKey = monthEnd.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // ACUMULATIVO: Propostas criadas ATÉ o fim do mês
      const proposalsUntilMonth = proposals.filter(proposal => {
        const createdDate = new Date(proposal.created_at);
        return createdDate <= monthEnd;
      });
      
      // ACUMULATIVO: Contratos fechados ATÉ o fim do mês
      const closedContractsUntilMonth = proposalsUntilMonth.filter(proposal => {
        if (proposal.status !== 'Fechado') return false;
        
        const closeDate = proposal.closing_date ? 
          new Date(proposal.closing_date) : 
          new Date(proposal.created_at);
        
        return closeDate <= monthEnd;
      });
      
      const totalProposals = proposalsUntilMonth.length;
      const closedClients = closedContractsUntilMonth.length;
      
      // Taxa de conversão acumulativa
      const conversion = totalProposals > 0 ? (closedClients / totalProposals) * 100 : 0;
      
      monthlyData.push({ 
        month: monthKey,
        conversion, 
        clients: closedClients, 
        proposals: totalProposals 
      });
    }
    
    return monthlyData;
  };

  const monthlyData = calculateMonthlyConversion();
  const currentConversion = monthlyData[monthlyData.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Taxa de Conversão de Vendas</h2>
              <p className="text-sm text-gray-600">Eficiência na conversão de propostas</p>
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
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Conversão Atual</h3>
            <div className={`text-4xl font-bold mb-2 ${
              (currentConversion?.conversion || 0) >= 30 ? 'text-green-600' : 
              (currentConversion?.conversion || 0) >= 15 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(currentConversion?.conversion || 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              Clientes fechados ÷ Total de propostas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Contratos fechados (acumulado):</span>
                  <span className="text-sm font-bold text-gray-900">{currentConversion?.clients || 0} clientes</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Total de propostas (acumulado):</span>
                  <span className="text-sm font-bold text-gray-900">{currentConversion?.proposals || 0} propostas</span>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-sm font-medium text-orange-800">
                    <strong>Fórmula Acumulativa:</strong> {currentConversion?.clients || 0} ÷ {currentConversion?.proposals || 0} = {(currentConversion?.conversion || 0).toFixed(1)}%
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
                          label: 'Taxa de Conversão (%)',
                          data: monthlyData.map(d => d.conversion),
                          backgroundColor: '#F59E0B',
                          borderColor: '#F59E0B',
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
                              return `Conversão: ${context.parsed.y.toFixed(1)}%`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: {
                            display: false
                          },
                          ticks: {
                            callback: function(value: any) {
                              return `${value}%`;
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
                    <div className="text-lg font-bold text-orange-600">
                      {Math.max(...monthlyData.map(d => d.conversion)).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Maior Taxa</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {(monthlyData.reduce((sum, d) => sum + d.conversion, 0) / monthlyData.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Média 12 Meses</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {(currentConversion?.conversion || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Taxa Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 mb-2">💡 Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>🎯 Definição:</strong> Percentual acumulativo de propostas que se tornam contratos</p>
              <p><strong>📊 Metodologia:</strong> Snapshot acumulativo - considera histórico completo até cada mês</p>
              <p><strong>📈 Interpretação:</strong> Mostra eficiência geral da conversão ao longo do tempo</p>
              <p><strong>🔍 Tendência:</strong> Taxa estável indica processo de vendas maduro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SalesConversionKPI: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  // Calcular conversão acumulativa atual (todos os tempos)
  const currentDate = new Date();
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // ACUMULATIVO: Todas as propostas criadas até agora
  const allProposalsUntilNow = proposals.filter(proposal => {
    const createdDate = new Date(proposal.created_at);
    return createdDate <= monthEnd;
  });
  
  // ACUMULATIVO: Todos os contratos fechados até agora
  const allClosedContractsUntilNow = allProposalsUntilNow.filter(proposal => {
    if (proposal.status !== 'Fechado') return false;
    
    const closeDate = proposal.closing_date ? 
      new Date(proposal.closing_date) : 
      new Date(proposal.created_at);
    
    return closeDate <= monthEnd;
  });
  
  const totalProposals = allProposalsUntilNow.length;
  const closedClients = allClosedContractsUntilNow.length;
  
  const conversionRate = totalProposals > 0 ? (closedClients / totalProposals) * 100 : 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 p-1.5 hover:bg-orange-100 rounded-full transition-colors"
          title="Ver detalhes da Taxa de Conversão"
        >
          <Info className="w-4 h-4 text-orange-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Taxa de Conversão
          </h3>
        </div>
        
        <div className={`text-2xl font-bold mb-2 ${
          conversionRate >= 30 ? 'text-green-600' : 
          conversionRate >= 15 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {conversionRate.toFixed(1)}%
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Acumulativo de todos os tempos
        </p>
        
        <div className="text-sm text-gray-700 space-y-1">
          <div>Contratos fechados: <strong>{closedClients}</strong></div>
          <div>Total propostas: <strong>{totalProposals}</strong></div>
          <div>Período: <strong>Todos os tempos</strong></div>
        </div>
        
        <div className="mt-2 text-xs text-orange-600 font-medium">● Fechados ÷ Total (acumulativo)</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i) + 1, 0);
              
              // ACUMULATIVO: Propostas criadas até o fim deste mês
              const proposalsUntilThisMonth = proposals.filter(proposal => {
                const createdDate = new Date(proposal.created_at);
                return createdDate <= monthEnd;
              });
              
              // ACUMULATIVO: Contratos fechados até o fim deste mês
              const closedUntilThisMonth = proposalsUntilThisMonth.filter(proposal => {
                if (proposal.status !== 'Fechado') return false;
                
                const closeDate = proposal.closing_date ? 
                  new Date(proposal.closing_date) : 
                  new Date(proposal.created_at);
                
                return closeDate <= monthEnd;
              });
              
              const monthTotal = proposalsUntilThisMonth.length;
              const monthClosed = closedUntilThisMonth.length;
              
              return monthTotal > 0 ? (monthClosed / monthTotal) * 100 : 0;
            })}
            color="#F59E0B"
            height={40}
          />
        </div>
      </div>

      <SalesConversionModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};