/**
 * Componente: ContractsNeededKPI
 * 
 * Propósito: KPI de Necessidade de Contratos para Voltar à Meta
 * Fórmula: Meta anual - Valor já fechado = Valor que falta atingir
 * Exibição: Valor mensal em destaque, valor anual em menor destaque
 */

import React, { useState } from 'react';
import { Target, Info, X, Calendar, DollarSign } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
import { useYear } from '../../contexts/YearContext';
import { formatCurrency } from '../../utils/formatCurrency';
import MiniBar from '../Dashboard/MiniBar';

interface KPIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContractsNeededModal: React.FC<KPIModalProps> = ({ isOpen, onClose }) => {
  const { selectedYear } = useYear();
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const { getAnnualGoal } = useMonthlyGoals();
  
  if (!isOpen) return null;

  // Calcular necessidade mensal dos últimos 12 meses
  const calculateMonthlyNeeds = () => {
    const monthlyData: { month: string; needed: number; monthlyNeeded: number; target: number; achieved: number }[] = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      const monthKey = monthEnd.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      const year = monthEnd.getFullYear();
      
      // Meta anual para o ano do mês analisado
      const annualTarget = getAnnualGoal();
      
      // Valor já fechado até aquele mês
      const closedValue = proposals
        .filter(proposal => {
          if (proposal.status !== 'Fechado' || !proposal.closing_date) return false;
          const closingDate = new Date(proposal.closing_date);
          return closingDate.getFullYear() === year && closingDate <= monthEnd;
        })
        .reduce((sum, proposal) => sum + (proposal.monthly_value * 12 || 0), 0);
      
      // Valor que falta para atingir a meta
      const needed = Math.max(0, annualTarget - closedValue);
      const monthlyNeeded = needed / 12;
      
      monthlyData.push({ 
        month: monthKey, 
        needed, 
        monthlyNeeded,
        target: annualTarget,
        achieved: closedValue
      });
    }
    
    return monthlyData;
  };

  const monthlyData = calculateMonthlyNeeds();
  const currentNeeds = monthlyData[monthlyData.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Necessidade de Contratos</h2>
              <p className="text-sm text-gray-600">Valor faltante para atingir a meta anual</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Necessidade Atual</h3>
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {formatCurrency(currentNeeds?.monthlyNeeded || 0)}
            </div>
            <p className="text-sm text-gray-600">
              Por mês para atingir a meta
            </p>
            <div className="text-2xl font-medium text-gray-500 mt-2">
              {formatCurrency(currentNeeds?.needed || 0)} total anual
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Racional do Cálculo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Racional do Cálculo</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Meta anual:</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(currentNeeds?.target || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Já atingido:</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(currentNeeds?.achieved || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">Falta atingir (anual):</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(currentNeeds?.needed || 0)}</span>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-sm font-medium text-orange-800">
                    <strong>Fórmula:</strong> {formatCurrency(currentNeeds?.needed || 0)} ÷ 12 meses = {formatCurrency(currentNeeds?.monthlyNeeded || 0)}/mês
                  </p>
                </div>
              </div>
            </div>

            {/* Gráfico de Evolução */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evolução - Últimos 12 Meses</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="w-full h-64">
                  <div className="flex items-end justify-between space-x-2 h-full">
                    {monthlyData.map((data, index) => {
                      const maxValue = Math.max(...monthlyData.map(d => d.monthlyNeeded), 1);
                      const height = (data.monthlyNeeded / maxValue) * 100;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-orange-500 rounded-t hover:bg-orange-600 transition-colors cursor-pointer group relative"
                            style={{ height: `${Math.max(height, 5)}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                              <div className="text-center">
                                <div>Mensal: {formatCurrency(data.monthlyNeeded)}</div>
                                <div>Anual: {formatCurrency(data.needed)}</div>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-600 mt-1">{data.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 text-center">
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(Math.max(...monthlyData.map(d => d.monthlyNeeded)))}
                    </div>
                    <div className="text-sm text-gray-600">Maior Necessidade/Mês</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(monthlyData.reduce((sum, d) => sum + d.monthlyNeeded, 0) / monthlyData.length)}
                    </div>
                    <div className="text-sm text-gray-600">Média/Mês</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(currentNeeds?.monthlyNeeded || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Necessidade Atual/Mês</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 mb-2">💡 Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>🎯 Definição:</strong> Valor faltante dividido por 12 meses</p>
              <p><strong>📊 Interpretação:</strong> Meta mensal necessária para atingir objetivo anual</p>
              <p><strong>🔄 Atualização:</strong> Recalculado conforme contratos são fechados</p>
              <p><strong>💡 Uso:</strong> Planejamento de vendas e distribuição de metas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContractsNeededKPI: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: proposals = [] } = useSupabaseQuery('proposals');
  const { getAnnualGoal } = useMonthlyGoals();
  const { selectedYear } = useYear();
  
  // Calcular necessidade atual
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Meta anual
  const annualTarget = getAnnualGoal();
  
  // Valor já fechado no ano atual
  const closedValue = proposals
    .filter(proposal => {
      if (proposal.status !== 'Fechado' || !proposal.closing_date) return false;
      const closingDate = new Date(proposal.closing_date);
      return closingDate.getFullYear() === currentYear;
    })
    .reduce((sum, proposal) => sum + (proposal.monthly_value * 12 || 0), 0);
  
  // Valor que falta para atingir a meta
  const remainingNeeded = Math.max(0, annualTarget - closedValue);
  const monthlyNeeded = remainingNeeded / 12;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
        <button
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 p-1.5 hover:bg-orange-100 rounded-full transition-colors"
          title="Ver detalhes da Necessidade de Contratos"
        >
          <Info className="w-4 h-4 text-orange-500" />
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" />
            Necessidade de Contratos
          </h3>
        </div>
        
        <div className="text-2xl font-bold text-orange-600 mb-2">
          {formatCurrency(monthlyNeeded)}
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Por mês para atingir meta
        </p>
        
        <div className="text-sm text-gray-700 space-y-1">
          <div>Meta anual: <strong>{formatCurrency(annualTarget)}</strong></div>
          <div>Já atingido: <strong>{formatCurrency(closedValue)}</strong></div>
          <div className="text-gray-500">Anual faltante: <strong>{formatCurrency(remainingNeeded)}</strong></div>
        </div>
        
        <div className="mt-2 text-xs text-orange-600 font-medium">● Meta restante ÷ 12 meses</div>
        
        {/* Minigráfico */}
        <div className="mt-3">
          <MiniBar
            data={Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(currentYear, currentMonth - 1 - (11 - i), 1);
              const year = monthDate.getFullYear();
              
              // Valor já fechado até aquele mês
              const monthClosedValue = proposals
                .filter(proposal => {
                  if (proposal.status !== 'Fechado' || !proposal.closing_date) return false;
                  const closingDate = new Date(proposal.closing_date);
                  return closingDate.getFullYear() === year && closingDate <= monthDate;
                })
                .reduce((sum, proposal) => sum + (proposal.monthly_value * 12 || 0), 0);
              
              // Valor que faltava atingir naquele mês
              const monthRemaining = Math.max(0, annualTarget - monthClosedValue);
              return monthRemaining / 12; // Valor mensal necessário
            })}
            color="#F59E0B"
            height={40}
          />
        </div>
      </div>

      <ContractsNeededModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};