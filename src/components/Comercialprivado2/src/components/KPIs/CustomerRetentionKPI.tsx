/**
 * Componente: CustomerRetentionKPI
 * 
 * Propósito: KPI de Taxa de Retenção de Clientes
 * Fórmula: (Clientes no final do período - Novos clientes adquiridos) ÷ Clientes no início do período
 * Consideração: período de 12 meses para trás do mês atual
 */

import React, { useState } from 'react';
import { Shield, Info, X } from 'lucide-react';
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

const CustomerRetentionModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  if (!isOpen) return null;

  // Calcular retenção mensal dos últimos 12 meses
  const calculateMonthlyRetention = () => {
    const monthlyData: { month: string; retention: number; startClients: number; endClients: number; newClients: number }[] = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth() - 11, 1); // 12 meses atrás
      const monthKey = monthEnd.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Clientes no início do período (12 meses atrás)
      const clientsAtStart = new Set(
        proposals
          .filter(proposal => {
            if (proposal.status !== 'Fechado') return false;
            const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
            return closeDate <= monthStart;
          })
          .map(p => p.client)
      ).size;
      
      // Clientes no final do período (mês atual)
      const clientsAtEnd = new Set(
        proposals
          .filter(proposal => {
            if (proposal.status !== 'Fechado') return false;
            const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
            return closeDate <= monthEnd;
          })
          .map(p => p.client)
      ).size;
      
      // Novos clientes adquiridos durante o período de 12 meses
      const newClients = new Set(
        proposals
          .filter(proposal => {
            if (proposal.status !== 'Fechado') return false;
            const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
            return closeDate > monthStart && closeDate <= monthEnd;
          })
          .map(p => p.client)
      ).size;
      
      // Taxa de retenção
      const retention = clientsAtStart > 0 ? ((clientsAtEnd - newClients) / clientsAtStart) * 100 : 0;
      
      monthlyData.push({ 
        month: monthKey, 
        retention: Math.max(0, retention), // Não permitir valores negativos
        startClients: clientsAtStart,
        endClients: clientsAtEnd,
        newClients
      });
    }
    
    return monthlyData;
  };

  const monthlyData = calculateMonthlyRetention();
  const currentRetention = monthlyData[monthlyData.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Taxa de Retenção de Clientes</h2>
              <p className="text-sm text-gray-600">Clientes mantidos ao longo do tempo</p>
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
          <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Retenção Atual</h3>
            <div className={`text-4xl font-bold mb-2 ${
              (currentRetention?.retention || 0) >= 80 ? 'text-green-600' : 
              (currentRetention?.retention || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(currentRetention?.retention || 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              (Clientes finais - Novos clientes) ÷ Clientes iniciais
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo (Últimos 12 Meses)</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Clientes no início:</span>
                  <span className="text-sm font-bold text-gray-900">{currentRetention?.startClients || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Clientes no final:</span>
                  <span className="text-sm font-bold text-gray-900">{currentRetention?.endClients || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Novos clientes:</span>
                  <span className="text-sm font-bold text-gray-900">{currentRetention?.newClients || 0}</span>
                </div>
                
                <div className="bg-teal-50 border border-teal-200 rounded p-3">
                  <p className="text-sm font-medium text-teal-800">
                    <strong>Fórmula:</strong> ({currentRetention?.endClients || 0} - {currentRetention?.newClients || 0}) ÷ {currentRetention?.startClients || 0} = {(currentRetention?.retention || 0).toFixed(1)}%
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
                          label: 'Taxa de Retenção (%)',
                          data: monthlyData.map(d => d.retention),
                          backgroundColor: '#14B8A6',
                          borderColor: '#14B8A6',
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
                              return `Retenção: ${context.parsed.y.toFixed(1)}%`;
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
                    <div className="text-lg font-bold text-teal-600">
                      {Math.max(...monthlyData.map(d => d.retention)).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Maior Retenção</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-teal-600">
                      {(monthlyData.reduce((sum, d) => sum + d.retention, 0) / monthlyData.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Média 12 Meses</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-teal-600">
                      {(currentRetention?.retention || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Retenção Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h4 className="font-medium text-teal-800 mb-2">💡 Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>🛡️ Definição:</strong> Percentual de clientes que continuam ativos</p>
              <p><strong>📊 Período:</strong> Análise móvel de 12 meses</p>
              <p><strong>🎯 Meta ideal:</strong> Retenção ≥ 80% indica alta satisfação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomerRetentionKPI: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  // Calcular retenção dos últimos 12 meses
  const currentDate = new Date();
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth() - 11, 1);
  
  // Clientes únicos no início do período (12 meses atrás)
  const clientsAtStart = new Set(
    proposals
      .filter(proposal => {
        if (proposal.status !== 'Fechado') return false;
        const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
        return closeDate <= monthStart;
      })
      .map(p => p.client)
  ).size;
  
  // Clientes únicos no final do período (agora)
  const clientsAtEnd = new Set(
    proposals
      .filter(proposal => {
        if (proposal.status !== 'Fechado') return false;
        const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
        return closeDate <= monthEnd;
      })
      .map(p => p.client)
  ).size;
  
  // Novos clientes adquiridos durante o período
  const newClients = new Set(
    proposals
      .filter(proposal => {
        if (proposal.status !== 'Fechado') return false;
        const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
        return closeDate > monthStart && closeDate <= monthEnd;
      })
      .map(p => p.client)
  ).size;
  
  // Taxa de retenção
  const retentionRate = clientsAtStart > 0 ? Math.max(0, ((clientsAtEnd - newClients) / clientsAtStart) * 100) : 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 p-1.5 hover:bg-teal-100 rounded-full transition-colors"
          title="Ver detalhes da Taxa de Retenção"
        >
          <Info className="w-4 h-4 text-teal-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-500" />
            Taxa de Retenção
          </h3>
        </div>
        
        <div className={`text-2xl font-bold mb-2 ${
          retentionRate >= 80 ? 'text-green-600' : 
          retentionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {retentionRate.toFixed(1)}%
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Últimos 12 meses
        </p>
        
        <div className="text-sm text-gray-700 space-y-1">
          <div>Inicial: <strong>{clientsAtStart} clientes</strong></div>
          <div>Final: <strong>{clientsAtEnd} clientes</strong></div>
          <div>Novos: <strong>{newClients} clientes</strong></div>
        </div>
        
        <div className="mt-2 text-xs text-teal-600 font-medium">● Janela móvel 12m</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i) + 1, 0);
              const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);
              
              const startClients = new Set(
                proposals
                  .filter(proposal => {
                    if (proposal.status !== 'Fechado') return false;
                    const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
                    return closeDate <= startDate;
                  })
                  .map(p => p.client)
              ).size;
              
              const endClients = new Set(
                proposals
                  .filter(proposal => {
                    if (proposal.status !== 'Fechado') return false;
                    const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
                    return closeDate <= endDate;
                  })
                  .map(p => p.client)
              ).size;
              
              const periodNewClients = new Set(
                proposals
                  .filter(proposal => {
                    if (proposal.status !== 'Fechado') return false;
                    const closeDate = proposal.closing_date ? new Date(proposal.closing_date) : new Date(proposal.created_at);
                    return closeDate > startDate && closeDate <= endDate;
                  })
                  .map(p => p.client)
              ).size;
              
              return startClients > 0 ? Math.max(0, ((endClients - periodNewClients) / startClients) * 100) : 0;
            })}
            color="#14B8A6"
            height={40}
          />
        </div>
      </div>

      <CustomerRetentionModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};