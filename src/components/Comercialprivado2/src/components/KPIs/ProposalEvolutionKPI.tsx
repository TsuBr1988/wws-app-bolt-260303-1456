/**
 * Componente: ProposalEvolutionKPI
 * 
 * Propósito: KPI de Evolução da Quantidade de Propostas
 * Fórmula: (quantidade do mês atual - quantidade do mês anterior) ÷ quantidade do mês anterior
 * Consideração: Quantidade de propostas criadas, não valores
 */

import React, { useState } from 'react';
import { FileText, Info, X, Calendar } from 'lucide-react';
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
    count: number;
    proposals: any[];
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
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
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
          {monthData.proposals.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {monthData.count}
                  </div>
                  <div className="text-sm text-blue-700">
                    Total de propostas criadas
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Propostas criadas no mês:</h3>
              
              <div className="space-y-3">
                {monthData.proposals.map((proposal, index) => {
                  const createdDate = new Date(proposal.created_at);
                  
                  return (
                    <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{proposal.client}</h4>
                          <div className="text-sm text-gray-600">
                            Criada em: {displayDate(proposal.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            proposal.status === 'Fechado' ? 'bg-green-100 text-green-800' :
                            proposal.status === 'Negociação' ? 'bg-blue-100 text-blue-800' :
                            proposal.status === 'Proposta' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {proposal.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Valor Mensal:</span>
                          <div className="font-medium">R$ {proposal.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Duração:</span>
                          <div className="font-medium">{proposal.months} meses</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Valor Global:</span>
                          <div className="font-medium text-blue-600">R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma proposta criada</h3>
              <p className="text-gray-500">
                Não foram criadas propostas neste mês
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProposalEvolutionModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const [showBreakdownModal, setShowBreakdownModal] = useState<'current' | 'previous' | null>(null);
  
  if (!isOpen) return null;

  // Calcular quantidade mensal dos últimos 12 meses
  const calculateMonthlyProposalCount = () => {
    const monthlyData: { month: string; count: number }[] = [];
    const currentDate = new Date();
    const detailedData: { month: Date; count: number; proposals: any[] }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const monthKey = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Filtrar propostas criadas no mês específico
      const monthProposals = proposals.filter(proposal => {
        const proposalDate = new Date(proposal.created_at);
        return proposalDate >= monthDate && proposalDate <= monthEnd;
      });
      
      const proposalCount = monthProposals.length;
      
      monthlyData.push({ month: monthKey, count: proposalCount });
      detailedData.push({ month: monthDate, count: proposalCount, proposals: monthProposals });
    }
    
    return { monthlyData, detailedData };
  };

  const { monthlyData, detailedData } = calculateMonthlyProposalCount();
  const currentMonthCount = detailedData[detailedData.length - 1]?.count || 0;
  const previousMonthCount = detailedData[detailedData.length - 2]?.count || 0;
  
  const currentMonthData = detailedData[detailedData.length - 1];
  const previousMonthData = detailedData[detailedData.length - 2];
  
  const growthRate = previousMonthCount > 0 
    ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100
    : currentMonthCount > 0 ? 100 : 0; // Se não havia propostas antes e agora há, é 100% de crescimento

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Evolução da Quantidade de Propostas</h2>
              <p className="text-sm text-gray-600">Variação mensal na quantidade de propostas criadas</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Evolução Atual</h3>
            <div className={`text-4xl font-bold mb-2 ${
              growthRate >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              (Quantidade atual - Quantidade anterior) ÷ Quantidade anterior
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Propostas mês atual:</span>
                  <button
                    onClick={() => setShowBreakdownModal('current')}
                    className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer underline"
                    title="Clique para ver composição"
                  >
                    {currentMonthCount} propostas
                  </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Propostas mês anterior:</span>
                  <button
                    onClick={() => setShowBreakdownModal('previous')}
                    className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer underline"
                    title="Clique para ver composição"
                  >
                    {previousMonthCount} propostas
                  </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Diferença absoluta:</span>
                  <span className={`text-sm font-bold ${
                    currentMonthCount - previousMonthCount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentMonthCount - previousMonthCount >= 0 ? '+' : ''}{currentMonthCount - previousMonthCount} propostas
                  </span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-medium text-blue-800">
                    <strong>Fórmula:</strong> ({currentMonthCount} - {previousMonthCount}) ÷ {previousMonthCount || 1} = {growthRate.toFixed(1)}%
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
                          label: 'Quantidade de Propostas',
                          data: monthlyData.map(d => d.count),
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
                              return `Propostas: ${context.parsed.y}`;
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
                            stepSize: 1,
                            callback: function(value: any) {
                              return `${value}`;
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
                      {Math.max(...monthlyData.map(d => d.count))}
                    </div>
                    <div className="text-sm text-gray-600">Maior Quantidade</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(monthlyData.reduce((sum, d) => sum + d.count, 0) / monthlyData.length)}
                    </div>
                    <div className="text-sm text-gray-600">Média Mensal</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Evolução Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metodologia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Metodologia</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>📊 Quantidade:</strong> Número de propostas criadas por mês</p>
              <p><strong>🔄 Comparação:</strong> Mês atual vs mês anterior</p>
              <p><strong>📈 Interpretação:</strong> Valores positivos indicam crescimento na atividade comercial</p>
              <p><strong>🎯 Meta ideal:</strong> Crescimento consistente na geração de propostas</p>
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
          title="Propostas do Mês Atual"
        />
      )}
      
      {showBreakdownModal === 'previous' && previousMonthData && (
        <BreakdownModal
          isOpen={true}
          onClose={() => setShowBreakdownModal(null)}
          monthData={previousMonthData}
          title="Propostas do Mês Anterior"
        />
      )}
    </div>
  );
};

export const ProposalEvolutionKPI: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  
  // Calcular quantidade atual vs anterior
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  
  // Contar propostas do mês atual
  const currentMonthCount = proposals.filter(proposal => {
    const createdDate = new Date(proposal.created_at);
    return createdDate >= currentMonth && createdDate <= currentMonthEnd;
  }).length;
  
  // Contar propostas do mês anterior
  const previousMonthCount = proposals.filter(proposal => {
    const createdDate = new Date(proposal.created_at);
    return createdDate >= previousMonth && createdDate <= previousMonthEnd;
  }).length;
  
  const growthRate = previousMonthCount > 0 
    ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100
    : currentMonthCount > 0 ? 100 : 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 p-1.5 hover:bg-blue-100 rounded-full transition-colors"
          title="Ver detalhes da Evolução de Propostas"
        >
          <Info className="w-4 h-4 text-blue-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Evolução de Propostas
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
          <div>Atual: <strong>{currentMonthCount} propostas</strong></div>
          <div>Anterior: <strong>{previousMonthCount} propostas</strong></div>
          <div className={`${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Variação: <strong>{currentMonthCount - previousMonthCount >= 0 ? '+' : ''}{currentMonthCount - previousMonthCount}</strong>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-blue-600 font-medium">● Comparação de quantidade</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i), 1);
              const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
              
              return proposals.filter(proposal => {
                const createdDate = new Date(proposal.created_at);
                return createdDate >= monthDate && createdDate <= monthEnd;
              }).length;
            })}
            color="#3B82F6"
            height={40}
          />
        </div>
      </div>

      <ProposalEvolutionModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};