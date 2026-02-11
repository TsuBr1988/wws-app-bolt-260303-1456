import React from 'react';
import { Fuel as Funnel, TrendingDown, Clock, Info } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';

interface FunnelStage {
  key: 'SQL' | 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido';
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    key: 'SQL',
    label: 'SQL',
    color: 'border-cyan-500',
    bgColor: 'bg-cyan-500',
    textColor: 'text-white'
  },
  {
    key: 'Proposta',
    label: 'Proposta',
    color: 'border-blue-500',
    bgColor: 'bg-blue-500',
    textColor: 'text-white'
  },
  {
    key: 'Negociação',
    label: 'Negociação',
    color: 'border-blue-400',
    bgColor: 'bg-blue-400',
    textColor: 'text-white'
  },
  {
    key: 'Fechado',
    label: 'Fechado',
    color: 'border-green-500',
    bgColor: 'bg-green-500',
    textColor: 'text-white'
  },
  {
    key: 'Perdido',
    label: 'Perdido',
    color: 'border-red-500',
    bgColor: 'bg-red-500',
    textColor: 'text-white'
  }
];

export const SalesFunnelCard: React.FC = () => {
  const { selectedYear } = useYear();
  const { data: proposals = [], loading } = useSupabaseQuery('proposals');

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filtrar propostas do ano selecionado
  const currentYearProposals = proposals.filter(p => {
    const proposalYear = new Date(p.created_at).getFullYear();
    return proposalYear === selectedYear;
  });

  const totalProposals = currentYearProposals.length;

  // Contar propostas por status
  const proposalsByStatus = {
    SQL: currentYearProposals.filter(p => p.status === 'SQL'),
    Proposta: currentYearProposals.filter(p => p.status === 'Proposta'),
    Negociação: currentYearProposals.filter(p => p.status === 'Negociação'),
    Fechado: currentYearProposals.filter(p => p.status === 'Fechado'),
    Perdido: currentYearProposals.filter(p => p.status === 'Perdido')
  };

  // Calcular taxa de conversão geral (Fechado / Total)
  const overallConversionRate = totalProposals > 0 
    ? ((proposalsByStatus.Fechado.length / totalProposals) * 100).toFixed(0)
    : '0';

  // Calcular tempo médio de fechamento
  const calculateAverageTime = () => {
    const closedProposals = proposalsByStatus.Fechado.filter(p => 
      p.created_at && p.closing_date
    );

    if (closedProposals.length === 0) return 'Calculando...';

    const totalDays = closedProposals.reduce((sum, proposal) => {
      const createdDate = new Date(proposal.created_at);
      const closingDate = new Date(proposal.closing_date!);
      const diffTime = closingDate.getTime() - createdDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return Math.round(totalDays / closedProposals.length);
  };

  const averageTime = calculateAverageTime();

  // Calcular conversão entre estágios
  const getConversionRate = (fromCount: number, toCount: number) => {
    return fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(0) : '0';
  };

  // Calcular largura proporcional para o funil (baseado no número de propostas)
  const getStageWidth = (stageCount: number) => {
    if (totalProposals === 0) return 20; // Largura mínima
    const percentage = (stageCount / totalProposals) * 100;
    return Math.max(20, percentage); // Mínimo de 20% de largura
  };

  const getStagePercentage = (stageCount: number) => {
    return totalProposals > 0 ? ((stageCount / totalProposals) * 100).toFixed(0) : '0';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Funnel className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Funil de Vendas</h2>
        </div>
        <p className="text-sm text-gray-500">{selectedYear}</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{totalProposals}</div>
          <div className="text-sm text-gray-600">Propostas Totais</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{overallConversionRate}%</div>
          <div className="text-sm text-gray-600">Taxa Conversão</div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="flex-1 space-y-4 mb-6">
        {FUNNEL_STAGES.map((stage, index) => {
          const stageProposals = proposalsByStatus[stage.key];
          const stageCount = stageProposals.length;
          const stagePercentage = getStagePercentage(stageCount);
          const stageWidth = getStageWidth(stageCount);
          
          // Calcular conversão para o próximo estágio (exceto para o último)
          let conversionRate = '—';
          let nextStageCount = 0;
          
          if (index < FUNNEL_STAGES.length - 1) {
            const nextStage = FUNNEL_STAGES[index + 1];
            nextStageCount = proposalsByStatus[nextStage.key].length;
            conversionRate = getConversionRate(stageCount, nextStageCount);
          }

          return (
            <div key={stage.key} className="space-y-2">
              {/* Stage Bar */}
              <div 
                className={`${stage.bgColor} rounded-lg text-center py-4 px-4 ${stage.textColor} mx-auto transition-all duration-300 relative`}
                style={{ 
                  width: `${stageWidth}%`,
                  minWidth: '120px'
                }}
              >
                <div className="font-semibold text-lg">{stage.label}</div>
                <div className="text-sm opacity-90">
                  {stageCount} propostas ({stagePercentage}%)
                </div>
                
                {/* Tooltip com detalhes */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {stageCount} de {totalProposals} propostas
                </div>
              </div>

              {/* Conversion Rate between stages */}
              {index < FUNNEL_STAGES.length - 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500 px-4">
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>{conversionRate}% conversão</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Info className="w-3 h-3" />
                    <span>{stageCount > 0 ? 'Com dados' : 'Sem dados'}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Average Time Section */}
      <div className="bg-white rounded-lg p-4 text-center border border-gray-200 mt-auto">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-600">Tempo Médio Total</span>
        </div>
        <div className="text-xl font-bold text-purple-600">
          {typeof averageTime === 'number' ? `${averageTime} dias` : averageTime}
        </div>
        <div className="text-xs text-gray-500">Proposta → Fechado</div>
      </div>
    </div>
  );
};