/**
 * Componente: PipelineCoverageKPI
 *
 * Propósito: KPI de Cobertura de Pipeline de Vendas
 * Fórmula: Valor de faturamento possível (propostas em aberto) ÷ Meta efetiva (com carry-over)
 */

import React, { useState, useCallback } from 'react';
import { Target, Info, X } from 'lucide-react';
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
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
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

const PipelineCoverageModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const { getMonthGoal } = useMonthlyGoals();

  // Função para calcular meta efetiva com carry-over
  const calculateEffectiveMonthGoal = useCallback((month: number, year: number): number => {
    let carryOverFromPreviousMonth = 0;
    let effectiveGoalForRequestedMonth = 0;

    for (let m = 1; m <= month; m++) {
      const targetRevenue = getMonthGoal(m); // Já é valor anualizado do banco

      // Contratos fechados no mês
      const monthContracts = proposals.filter(p => {
        if (p.status !== 'Fechado' || !p.closing_date) return false;
        const closingDate = new Date(p.closing_date);
        return closingDate.getMonth() + 1 === m && closingDate.getFullYear() === year;
      });

      // Receita real usando monthly_value * 12 (anualizada)
      const actualRevenue = monthContracts.reduce(
        (sum, c) => sum + ((c.monthly_value || 0) * 12), 0
      );

      const effectiveTarget = Math.max(0, targetRevenue + carryOverFromPreviousMonth);

      // Se este é o mês solicitado, guardar a meta efetiva
      if (m === month) {
        effectiveGoalForRequestedMonth = effectiveTarget;
      }

      const realDeficit = Math.max(0, effectiveTarget - actualRevenue);
      const realSurplus = Math.max(0, actualRevenue - effectiveTarget);

      // Calcular carry-over para próximo mês
      if (targetRevenue > 0) {
        carryOverFromPreviousMonth = realSurplus > 0 ? -realSurplus : realDeficit;
      } else if (actualRevenue > 0) {
        carryOverFromPreviousMonth = -actualRevenue;
      }
    }

    // Retornar meta efetiva do mês solicitado ANUALIZADA
    return effectiveGoalForRequestedMonth;
  }, [proposals, getMonthGoal]);

  if (!isOpen) return null;

  // Calcular cobertura mensal dos últimos 12 meses
  const calculateMonthlyCoverage = () => {
    const monthlyData: { month: string; coverage: number; pipelineValue: number; target: number }[] = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const monthKey = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const month = monthDate.getMonth() + 1;
      const year = monthDate.getFullYear();

      // Propostas em aberto até aquele mês (acumulativo)
      const openProposals = proposals.filter(proposal => {
        if (proposal.status !== 'SQL' &&
            proposal.status !== 'Proposta' &&
            proposal.status !== 'Negociação' &&
            proposal.status !== 'Análise de contrato') return false;

        const createdDate = new Date(proposal.created_at);
        return createdDate <= monthEnd;
      });

      // Valor do pipeline ANUALIZADO (valor mensal * 12)
      const pipelineValueAnnualized = openProposals.reduce((sum, p) => sum + ((p.monthly_value || 0) * 12), 0);

      // Meta efetiva do mês ANUALIZADA (com carry-over)
      const effectiveGoalAnnualized = calculateEffectiveMonthGoal(month, year);

      // Cobertura do pipeline - compara pipeline anualizado com meta efetiva anualizada
      const coverage = effectiveGoalAnnualized > 0 ? (pipelineValueAnnualized / effectiveGoalAnnualized) * 100 : 0;

      monthlyData.push({
        month: monthKey,
        coverage,
        pipelineValue: pipelineValueAnnualized,
        target: effectiveGoalAnnualized
      });
    }

    return monthlyData;
  };

  const monthlyData = calculateMonthlyCoverage();
  const currentCoverage = monthlyData[monthlyData.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cobertura de Pipeline de Vendas</h2>
              <p className="text-sm text-gray-600">Proporção entre pipeline e meta</p>
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
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cobertura Atual</h3>
            <div className={`text-4xl font-bold mb-2 ${
              (currentCoverage?.coverage || 0) >= 100 ? 'text-green-600' :
              (currentCoverage?.coverage || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(currentCoverage?.coverage || 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              Pipeline anualizado ÷ Meta efetiva
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Pipeline anualizado:</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(currentCoverage?.pipelineValue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Meta efetiva (com carry-over):</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(currentCoverage?.target || 0)}</span>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="text-sm font-medium text-purple-800">
                    <strong>Fórmula:</strong> {formatCurrency(currentCoverage?.pipelineValue || 0)} ÷ {formatCurrency(currentCoverage?.target || 0)} = {(currentCoverage?.coverage || 0).toFixed(1)}%
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
                          label: 'Cobertura de Pipeline (%)',
                          data: monthlyData.map(d => d.coverage),
                          backgroundColor: '#8B5CF6',
                          borderColor: '#8B5CF6',
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
                              return `Cobertura: ${context.parsed.y.toFixed(1)}%`;
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
                    <div className="text-lg font-bold text-purple-600">
                      {Math.max(...monthlyData.map(d => d.coverage)).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Maior Cobertura</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {(monthlyData.reduce((sum, d) => sum + d.coverage, 0) / monthlyData.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Média 12 Meses</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {(currentCoverage?.coverage || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Cobertura Atual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-2">💡 Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>🎯 Interpretação:</strong> Mostra quantas vezes o pipeline anualizado cobre a meta efetiva do mês</p>
              <p><strong>📊 Metodologia:</strong> Soma valores anualizados (mensal × 12) de propostas abertas (SQL, Proposta, Negociação, Análise) e compara com meta efetiva anualizada que considera deficit/superavit acumulado do ano</p>
              <p><strong>🔄 Carry-over:</strong> Meta efetiva ajusta-se conforme performance: deficit aumenta a meta, superavit reduz a meta dos meses seguintes</p>
              <p><strong>📈 Meta ideal:</strong> Cobertura ≥ 100% indica pipeline saudável para atingir a meta efetiva; valores acima mostram folga adicional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PipelineCoverageKPI: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const { getMonthGoal } = useMonthlyGoals();

  // Função para calcular meta efetiva com carry-over
  const calculateEffectiveMonthGoal = useCallback((month: number, year: number): number => {
    let carryOverFromPreviousMonth = 0;
    let effectiveGoalForRequestedMonth = 0;

    for (let m = 1; m <= month; m++) {
      const targetRevenue = getMonthGoal(m); // Já é valor anualizado do banco

      // Contratos fechados no mês
      const monthContracts = proposals.filter(p => {
        if (p.status !== 'Fechado' || !p.closing_date) return false;
        const closingDate = new Date(p.closing_date);
        return closingDate.getMonth() + 1 === m && closingDate.getFullYear() === year;
      });

      // Receita real usando monthly_value * 12 (anualizada)
      const actualRevenue = monthContracts.reduce(
        (sum, c) => sum + ((c.monthly_value || 0) * 12), 0
      );

      const effectiveTarget = Math.max(0, targetRevenue + carryOverFromPreviousMonth);

      // Se este é o mês solicitado, guardar a meta efetiva
      if (m === month) {
        effectiveGoalForRequestedMonth = effectiveTarget;
      }

      const realDeficit = Math.max(0, effectiveTarget - actualRevenue);
      const realSurplus = Math.max(0, actualRevenue - effectiveTarget);

      // Calcular carry-over para próximo mês
      if (targetRevenue > 0) {
        carryOverFromPreviousMonth = realSurplus > 0 ? -realSurplus : realDeficit;
      } else if (actualRevenue > 0) {
        carryOverFromPreviousMonth = -actualRevenue;
      }
    }

    // Retornar meta efetiva do mês solicitado ANUALIZADA
    return effectiveGoalForRequestedMonth; // Retornar valor anualizado
  }, [proposals, getMonthGoal]);

  // Calcular cobertura atual
  const currentMonth = new Date().getMonth() + 1;

  // Propostas em aberto (SQL, Proposta, Negociação, Análise de contrato)
  const openProposals = proposals.filter(proposal =>
    proposal.status === 'SQL' ||
    proposal.status === 'Proposta' ||
    proposal.status === 'Negociação' ||
    proposal.status === 'Análise de contrato'
  );

  // Valor do pipeline ANUALIZADO (valores mensais * 12)
  const pipelineValueAnnualized = openProposals.reduce((sum, p) => sum + ((p.monthly_value || 0) * 12), 0);

  // Meta efetiva do mês atual ANUALIZADA (com carry-over)
  const effectiveGoalAnnualized = calculateEffectiveMonthGoal(currentMonth, selectedYear);

  // Cobertura - compara pipeline anualizado com meta efetiva anualizada
  const coverage = effectiveGoalAnnualized > 0 ? (pipelineValueAnnualized / effectiveGoalAnnualized) * 100 : 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          className="absolute top-4 right-4 z-10 p-1.5 hover:bg-purple-100 rounded-full transition-colors"
          title="Ver detalhes da Cobertura de Pipeline"
          aria-label="Ver detalhes da Cobertura de Pipeline"
        >
          <Info className="w-4 h-4 text-purple-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            Cobertura de Pipeline
          </h3>
        </div>
        
        <div className={`text-2xl font-bold mb-2 ${
          coverage >= 100 ? 'text-green-600' :
          coverage >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {coverage.toFixed(1)}%
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Pipeline vs meta efetiva
        </p>

        <div className="text-sm text-gray-700 space-y-1">
          <div>Pipeline anualizado: <strong>{formatCurrency(pipelineValueAnnualized)}</strong></div>
          <div>Meta efetiva: <strong>{formatCurrency(effectiveGoalAnnualized)}</strong></div>
          <div>Propostas: <strong>{openProposals.length}</strong></div>
        </div>

        <div className="mt-2 text-xs text-purple-600 font-medium">● Pipeline anualizado ÷ Meta efetiva</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const currentDate = new Date();
              const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - i), 1);
              const month = monthDate.getMonth() + 1;
              const year = monthDate.getFullYear();
              const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

              const monthOpenProposals = proposals.filter(proposal => {
                if (proposal.status !== 'SQL' &&
                    proposal.status !== 'Proposta' &&
                    proposal.status !== 'Negociação' &&
                    proposal.status !== 'Análise de contrato') return false;
                const createdDate = new Date(proposal.created_at);
                return createdDate <= monthEnd;
              });

              const monthPipelineValue = monthOpenProposals.reduce((sum, p) => sum + ((p.monthly_value || 0) * 12), 0);

              const monthEffectiveTarget = calculateEffectiveMonthGoal(month, year);

              return monthEffectiveTarget > 0 ? (monthPipelineValue / monthEffectiveTarget) * 100 : 0;
            })}
            color="#8B5CF6"
            height={40}
          />
        </div>
      </div>

      <PipelineCoverageModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};