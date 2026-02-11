import React from 'react';
import { BarChart3, TrendingUp, Target, Info, X, Expand } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';

export const SalesChart: React.FC = () => {
  const { selectedYear } = useYear();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = React.useState<string | null>(null);
  const { data: proposals = [], loading } = useSupabaseQuery('proposals');
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  // Gerar dados mensais para todo o ano de 2025
  const generateMonthlyData = () => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const currentYear = selectedYear;
    
    return months.map((month, index) => {
      // Filtrar propostas do mês específico
      const monthProposals = proposals.filter(proposal => {
        const proposalDate = new Date(proposal.created_at || new Date());
        return proposalDate.getMonth() === index && proposalDate.getFullYear() === currentYear;
      });
      
      // Calcular valor mensal de todas as propostas (barra azul)
      const totalProposals = monthProposals
        .reduce((sum, proposal) => sum + Number(proposal.total_value || 0), 0);
      
      // Calcular valor mensal de propostas fechadas (barra verde)
      const closedProposals = monthProposals
        .filter(proposal => proposal.status === 'Fechado')
        .filter(proposal => {
          // Se tem data de fechamento, usar ela; senão usar data de criação
          const closingDate = proposal.closingDate ? 
            new Date(proposal.closingDate) : 
            new Date(proposal.created_at || new Date());
          return closingDate.getMonth() === index && closingDate.getFullYear() === currentYear;
        })
        .reduce((sum, proposal) => sum + Number(proposal.total_value || 0), 0);
      
      return {
        month,
        proposals: totalProposals, // Todas as propostas
        closed: closedProposals     // Propostas fechadas
      };
    });
  };

  const monthlyData = generateMonthlyData();
  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.proposals, d.closed)),
    50000 // Valor mínimo para escala
  );
  
  const formatCurrencyNoDecimals = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calcular totais anuais
  const totalAllProposals = monthlyData.reduce((sum, d) => sum + d.proposals, 0);
  const totalClosed = monthlyData.reduce((sum, d) => sum + d.closed, 0);
  const conversionRate = totalAllProposals > 0 ? (totalClosed / totalAllProposals) * 100 : 0;
  const BreakdownModal: React.FC<{ type: string; onClose: () => void }> = ({ type, onClose }) => {
    const renderContent = () => {
      switch (type) {
        case 'total-global':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição do Valor Total Global</h3>
              <div className="space-y-2">
                {monthlyData.map((data, index) => {
                  if (data.proposals === 0) return null;
                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{data.month}</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrencyNoDecimals(data.proposals)}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total Global</span>
                    <span className="text-blue-600">{formatCurrencyNoDecimals(totalAllProposals)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        case 'closed-global':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição do Valor Fechado Global</h3>
              <div className="space-y-2">
                {monthlyData.map((data, index) => {
                  if (data.closed === 0) return null;
                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{data.month}</span>
                      <span className="font-bold text-green-600">
                        {formatCurrencyNoDecimals(data.closed)}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total Fechado</span>
                    <span className="text-green-600">{formatCurrencyNoDecimals(totalClosed)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detalhamento</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  };

  // Expanded Chart Modal for Mobile
  const ExpandedChartModal: React.FC = () => {
    if (!isExpanded) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 md:hidden">
        <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-full max-h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Mensal de Vendas {selectedYear}</h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-4 h-full overflow-y-auto">
            {/* Full-size chart for landscape viewing */}
            <div className="relative">
              <div className="flex items-center justify-between space-x-2 text-sm mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Propostas Totais</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Fechados</span>
                </div>
              </div>
              
              {/* Chart Container - Full Size */}
              <div className="flex items-end justify-between space-x-2 h-80 mb-6 ml-16">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    {/* Bars Container */}
                    <div className="relative w-full flex justify-center items-end h-64 min-w-[40px] pt-8">
                      {/* Conversion Rate Label */}
                      {data.closed > 0 && data.proposals > 0 && (
                        <div 
                          className="absolute text-sm font-medium text-green-600 whitespace-nowrap z-30"
                          style={{ 
                            bottom: `${Math.max(5, maxValue > 0 ? (data.proposals / maxValue) * 100 : 0) + 10}%`,
                            left: '50%',
                            transform: 'translateX(-50%)'
                          }}
                        >
                          {((data.closed / data.proposals) * 100).toFixed(1)}%
                        </div>
                      )}
                      
                      {/* Total Proposals Bar */}
                      <div className="relative group w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer" 
                           style={{ height: `${Math.max(5, maxValue > 0 ? (data.proposals / maxValue) * 100 : 0)}%` }}>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          Propostas Totais: {formatCurrency(data.proposals)}
                        </div>
                      </div>
                      
                      {/* Closed Bar */}
                      <div className="relative group w-6 -ml-7 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer z-10" 
                           style={{ height: `${Math.max(3, maxValue > 0 ? (data.closed / maxValue) * 100 : 0)}%` }}>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          Fechados: {formatCurrency(data.closed)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Month Label */}
                    <span className="text-sm text-gray-600 font-medium">{data.month}</span>
                  </div>
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-12 h-64 flex flex-col justify-between text-sm text-gray-500 w-14 text-right pr-2">
                <span>{formatCurrencyNoDecimals(maxValue)}</span>
                <span>{formatCurrencyNoDecimals(maxValue * 0.75)}</span>
                <span>{formatCurrencyNoDecimals(maxValue * 0.5)}</span>
                <span>{formatCurrencyNoDecimals(maxValue * 0.25)}</span>
                <span>{formatCurrencyNoDecimals(0)}</span>
              </div>
            </div>

            {/* Summary Stats - Expanded */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <button 
                  onClick={() => setShowBreakdownModal('total-global')}
                  className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  title="Clique para ver detalhes"
                >
                  {formatCurrencyNoDecimals(totalAllProposals)}
                  <Info className="w-4 h-4 ml-1" />
                </button>
                <div className="text-sm text-gray-600">Valor Total Global</div>
              </div>
              <div className="text-center">
                <button 
                  onClick={() => setShowBreakdownModal('closed-global')}
                  className="text-xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  title="Clique para ver detalhes"
                >
                  {formatCurrencyNoDecimals(totalClosed)}
                  <Info className="w-4 h-4 ml-1" />
                </button>
                <div className="text-sm text-gray-600">Valor Fechado Global</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">
                  {conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Taxa Conversão</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Performance Mensal {selectedYear}</h3>
          <p className="text-sm text-gray-500 mt-1">Propostas Totais vs Contratos Fechados</p>
        </div>
        <div className="flex items-center space-x-1 md:space-x-4 text-xs md:text-sm">
          {/* Mobile expand button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="Expandir gráfico"
          >
            <Expand className="w-3 h-3 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-1">
            <div className="w-2 md:w-3 h-1.5 md:h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 hidden md:inline text-xs md:text-sm">Propostas Totais</span>
            <span className="text-gray-600 md:hidden text-xs">Prop</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 md:w-3 h-1.5 md:h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 text-xs md:text-sm">Fech</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Chart Container */}
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-32 sm:h-40 md:h-48 lg:h-64 xl:h-72 mb-4 ml-2 sm:ml-6 md:ml-12 lg:ml-16">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-1">
              {/* Bars Container */}
              <div className="relative w-full flex justify-center items-end h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 min-w-[12px] sm:min-w-[20px] md:min-w-[30px] lg:min-w-[40px] pt-1 sm:pt-2 md:pt-4 lg:pt-8">
                {/* Conversion Rate Label - positioned above this month's bar */}
                {data.closed > 0 && data.proposals > 0 && (
                  <div 
                    className="absolute text-xs font-medium text-green-600 whitespace-nowrap z-30 hidden sm:block"
                    style={{ 
                      bottom: `${Math.max(5, maxValue > 0 ? (data.proposals / maxValue) * 100 : 0) + 10}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {((data.closed / data.proposals) * 100).toFixed(1)}%
                  </div>
                )}
                
                {/* Total Proposals Bar (Blue - Background) */}
                <div className="relative group w-2 sm:w-3 md:w-4 lg:w-6 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer" 
                     style={{ height: `${Math.max(5, maxValue > 0 ? (data.proposals / maxValue) * 100 : 0)}%` }}>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 hidden sm:block">
                    Propostas Totais: {formatCurrency(data.proposals)}
                  </div>
                </div>
                
                {/* Closed Bar (Green - Foreground) */}
                <div className="relative group w-1.5 sm:w-2 md:w-3 lg:w-4 -ml-1.5 sm:-ml-2 md:-ml-3 lg:-ml-5 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer z-10" 
                     style={{ height: `${Math.max(3, maxValue > 0 ? (data.closed / maxValue) * 100 : 0)}%` }}>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 hidden sm:block">
                    Fechados: {formatCurrency(data.closed)}
                  </div>
                </div>
              </div>
              
              {/* Month Label */}
              <span className="text-xs text-gray-600 font-medium">{data.month}</span>
            </div>
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 flex-col justify-between text-xs text-gray-500 w-6 sm:w-8 md:w-10 lg:w-14 text-right pr-1 sm:pr-2 hidden sm:flex">
          <span>{formatCurrencyNoDecimals(maxValue)}</span>
          <span className="hidden md:block">{formatCurrencyNoDecimals(maxValue * 0.75)}</span>
          <span>{formatCurrencyNoDecimals(maxValue * 0.5)}</span>
          <span className="hidden lg:block">{formatCurrencyNoDecimals(maxValue * 0.25)}</span>
          <span>{formatCurrencyNoDecimals(0)}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <button 
            onClick={() => setShowBreakdownModal('total-global')}
            className="text-xs sm:text-sm md:text-xl lg:text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
            title="Clique para ver detalhes"
          >
            {formatCurrencyNoDecimals(totalAllProposals)}
            <Info className="w-2 sm:w-3 md:w-4 h-2 sm:h-3 md:h-4 ml-1" />
          </button>
          <div className="text-xs sm:text-sm text-gray-600">Valor Total Global</div>
        </div>
        <div className="text-center">
          <button 
            onClick={() => setShowBreakdownModal('closed-global')}
            className="text-xs sm:text-sm md:text-xl lg:text-2xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
            title="Clique para ver detalhes"
          >
            {formatCurrencyNoDecimals(totalClosed)}
            <Info className="w-2 sm:w-3 md:w-4 h-2 sm:h-3 md:h-4 ml-1" />
          </button>
          <div className="text-xs sm:text-sm text-gray-600">Valor Fechado Global</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-sm md:text-xl lg:text-2xl font-bold text-purple-600">
            {conversionRate.toFixed(1)}%
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Taxa Conversão</div>
        </div>
      </div>
    </div>
    
    <ExpandedChartModal />
    
    {showBreakdownModal && (
      <BreakdownModal 
        type={showBreakdownModal} 
        onClose={() => setShowBreakdownModal(null)} 
      />
    )}
    </>
  );
};