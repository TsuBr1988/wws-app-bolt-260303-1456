import React from 'react';
import { BarChart3, TrendingUp, Target, Info, X, Maximize2 } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { isContratoAssinado } from '../../constants/status';

export const SalesChart: React.FC = () => {
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const [showBreakdownModal, setShowBreakdownModal] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
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
        // Excluir contratos com promotor (não contam para metas)
        if (proposal.promotor_id) return false;
        
        const proposalDate = new Date(proposal.created_at || new Date());
        return proposalDate.getMonth() === index && proposalDate.getFullYear() === currentYear;
      });
      
      // Calcular valor mensal de todas as propostas (barra azul)
      const totalProposals = monthProposals
        .reduce((sum, proposal) => {
          // SEMPRE usar valor estimado (total_value) para barra azul
          const contractValue = proposal.total_value || 0;
          return sum + Number(contractValue);
        }, 0);
      
      // Calcular valor mensal de propostas fechadas (barra verde)
      const closedProposals = proposals
        .filter(proposal => {
          // NOVO: Usar constante para verificar se é contrato assinado
          if (!isContratoAssinado(proposal.status)) return false;
          
          // Excluir contratos com promotor (não contam para metas)
          if (proposal.promotor_id) return false;
          
          // OBRIGATÓRIO: deve ter closing_date definido
          if (!proposal.closing_date) {
            console.log('⚠️ Proposta fechada sem closing_date:', {
              client: proposal.client,
              status: proposal.status,
              id: proposal.id
            });
            return false;
          }
          
          // Converter closing_date para data e extrair mês/ano
          const closingDate = new Date(proposal.closing_date);
          const proposalMonth = closingDate.getMonth(); // 0-11 (Janeiro=0, Maio=4)
          const proposalYear = closingDate.getFullYear();
          
          console.log('🔍 [SalesChart] Verificando proposta fechada para gráfico:', {
            client: proposal.client,
            closing_date: proposal.closing_date,
            parsedClosingDate: closingDate.toISOString(),
            proposalMonth: proposalMonth,
            proposalYear: proposalYear,
            targetMonth: index, // 0-11 (Janeiro=0, Maio=4)
            targetYear: currentYear,
            monthMatch: proposalMonth === index,
            yearMatch: proposalYear === currentYear,
            included: proposalMonth === index && proposalYear === currentYear,
            monthName: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][proposalMonth],
            targetMonthName: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index]
          });
          
          // Comparar mês e ano exatos usando a closing_date
          const isIncluded = proposalMonth === index && proposalYear === currentYear;
          
          if (isIncluded) {
            console.log(`✅ [SalesChart] Proposta incluída no mês ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index]}:`, {
              client: proposal.client,
              closing_date: proposal.closing_date,
              valor: selectedDepartment === 'Petrobras' 
                ? (proposal.nosso_lance || proposal.total_value || 0)
                : (proposal.total_value || 0)
            });
          }
          
          return isIncluded;
        })
        .reduce((sum, proposal) => {
          // SEMPRE usar nosso lance quando disponível, senão valor estimado como fallback
          const contractValue = proposal.nosso_lance || proposal.total_value || 0;
          return sum + Number(contractValue);
        }, 0);
      
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
          console.log('🔍 [SalesChart] Composição detalhada do valor total global:', {
            totalAllProposals,
            monthlyData: monthlyData.map(data => ({
              month: data.month,
              proposals: data.proposals,
              closed: data.closed
            })),
            allProposals: proposals.map(p => ({
              client: p.client,
              total_value: p.total_value,
              nosso_lance: p.nosso_lance,
              status: p.status,
              created_at: p.created_at,
              closing_date: p.closing_date,
              month_created: new Date(p.created_at).getMonth() + 1,
              month_closed: p.closing_date ? new Date(p.closing_date).getMonth() + 1 : null
            }))
          });
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
          console.log('🔍 [SalesChart] Composição detalhada do valor fechado global:', {
            totalClosed,
            closedProposalsData: monthlyData.map(data => ({
              month: data.month,
              closedValue: data.closed
            })).filter(d => d.closedValue > 0),
            allClosedProposals: proposals.filter(p => (p.status === 'Fechado' || p.status === 'Contrato assinado')).map(p => {
              const dateToUse = p.closing_date ? new Date(p.closing_date) : new Date(p.created_at);
              return {
                client: p.client,
                total_value: p.total_value,
                nosso_lance: p.nosso_lance,
                closing_date: p.closing_date || p.created_at,
                month_closed: dateToUse.getMonth() + 1,
                year_closed: dateToUse.getFullYear(),
                value_used: selectedDepartment === 'Petrobras' ? (p.nosso_lance || p.total_value) : p.total_value
              };
            })
          });
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

  // Função para formatar valores de forma compacta (mobile)
  const formatCompactCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" onClick={() => setIsFullscreen(true)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg md:text-lg font-semibold text-gray-900">Performance Mensal de Vendas {selectedYear}</h3>
          <p className="text-xs md:text-sm text-gray-600">Propostas Totais vs Contratos Fechados</p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            title="Expandir gráfico"
          >
            <Maximize2 className="w-4 h-4 text-gray-500" />
          </button>
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Propostas Totais</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Fechados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Chart Container */}
        <div className="flex items-end justify-between space-x-1 h-16 md:h-64 mb-4 ml-8 md:ml-16 mr-6 md:mr-8">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-1">
              {/* Bars Container */}
              <div className="relative w-full flex justify-center items-end h-12 md:h-48 min-w-[14px] md:min-w-[40px] pt-2 md:pt-8">
                {/* Conversion Rate Label - positioned above this month's bar */}
                {data.closed > 0 && data.proposals > 0 && (
                  <div 
                    className="absolute text-xs font-medium text-green-600 whitespace-nowrap z-30 hidden md:block"
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
                <div className="relative group w-3 md:w-6 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer" 
                     style={{ height: `${Math.max(5, maxValue > 0 ? (data.proposals / maxValue) * 100 : 0)}%` }}>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    Propostas Totais: {formatCurrency(data.proposals)}
                  </div>
                </div>
                
                {/* Closed Bar (Green - Foreground) */}
                <div className="relative group w-2 md:w-4 -ml-2 md:-ml-5 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer z-10" 
                     style={{ height: `${Math.max(3, maxValue > 0 ? (data.closed / maxValue) * 100 : 0)}%` }}>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    Fechados: {formatCurrency(data.closed)}
                  </div>
                </div>
              </div>
              
              {/* Month Label */}
              <span className="text-xs font-medium">{data.month}</span>
            </div>
          ))}
        </div>

        {/* Y-axis labels - Hidden on mobile */}
        <div className="absolute left-0 top-0 h-12 md:h-48 flex flex-col justify-between text-[8px] md:text-xs text-gray-500 w-6 md:w-14 text-right pr-1 md:pr-2">
          {/* Mobile: formato compacto */}
          <span className="block md:hidden">{formatCompactCurrency(maxValue)}</span>
          <span className="block md:hidden">{formatCompactCurrency(maxValue * 0.75)}</span>
          <span className="block md:hidden">{formatCompactCurrency(maxValue * 0.5)}</span>
          <span className="block md:hidden">{formatCompactCurrency(maxValue * 0.25)}</span>
          <span className="block md:hidden">0</span>
          
          {/* Desktop: formato completo */}
          <span className="hidden md:block">{formatCurrencyNoDecimals(maxValue)}</span>
          <span className="hidden md:block">{formatCurrencyNoDecimals(maxValue * 0.75)}</span>
          <span className="hidden md:block">{formatCurrencyNoDecimals(maxValue * 0.5)}</span>
          <span className="hidden md:block">{formatCurrencyNoDecimals(maxValue * 0.25)}</span>
          <span className="hidden md:block">{formatCurrencyNoDecimals(0)}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdownModal('total-global');
            }}
            className="text-[10px] md:text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
            title="Clique para ver detalhes"
          >
            <span className="text-[10px] md:text-lg">{formatCurrencyNoDecimals(totalAllProposals)}</span>
            <Info className="w-2 h-2 md:w-4 md:h-4 ml-1" />
          </button>
          <div className="text-[9px] md:text-sm text-gray-600">Valor Total Global</div>
        </div>
        <div className="text-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdownModal('closed-global');
            }}
            className="text-[10px] md:text-2xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
            title="Clique para ver detalhes"
          >
            <span className="text-[10px] md:text-lg">{formatCurrencyNoDecimals(totalClosed)}</span>
            <Info className="w-2 h-2 md:w-4 md:h-4 ml-1" />
          </button>
          <div className="text-[9px] md:text-sm text-gray-600">Valor Fechado Global</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] md:text-2xl font-bold text-purple-600">
            <span className="text-[10px] md:text-lg">{conversionRate.toFixed(1)}%</span>
          </div>
          <div className="text-[9px] md:text-sm text-gray-600">Taxa Conversão</div>
        </div>
      </div>
    </div>
    
    {/* Fullscreen Chart Modal */}
    {isFullscreen && (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-6xl max-h-full bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Mensal de Vendas {selectedYear}</h3>
              <p className="text-sm text-gray-600">Propostas Totais vs Contratos Fechados</p>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Fullscreen Chart */}
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between space-x-4 text-sm mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Propostas Totais</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Fechados</span>
              </div>
            </div>
            
            <div className="relative">
              {/* Chart Container - Fullscreen */}
              <div className="flex items-end justify-between space-x-2 h-64 sm:h-80 mb-4 ml-16">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    {/* Bars Container */}
                    <div className="relative w-full flex justify-center items-end h-52 sm:h-72 min-w-[40px] pt-8">
                      {/* Conversion Rate Label */}
                      {data.closed > 0 && data.proposals > 0 && (
                        <div 
                          className="absolute text-xs font-medium text-green-600 whitespace-nowrap z-30"
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
                      <div className="relative group w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer" 
                           style={{ height: `${Math.max(5, maxValue > 0 ? (data.proposals / maxValue) * 100 : 0)}%` }}>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          Propostas Totais: {formatCurrency(data.proposals)}
                        </div>
                      </div>
                      
                      {/* Closed Bar (Green - Foreground) */}
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

              {/* Y-axis labels - Full version */}
              <div className="absolute left-0 top-0 h-52 sm:h-72 flex flex-col justify-between text-xs text-gray-500 w-14 text-right pr-2">
                <span>{formatCurrencyNoDecimals(maxValue)}</span>
                <span>{formatCurrencyNoDecimals(maxValue * 0.75)}</span>
                <span>{formatCurrencyNoDecimals(maxValue * 0.5)}</span>
                <span>{formatCurrencyNoDecimals(maxValue * 0.25)}</span>
                <span>{formatCurrencyNoDecimals(0)}</span>
              </div>
            </div>

            {/* Summary Stats - Fullscreen */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <button 
                  onClick={() => setShowBreakdownModal('total-global')}
                  className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
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
                  className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  title="Clique para ver detalhes"
                >
                  {formatCurrencyNoDecimals(totalClosed)}
                  <Info className="w-4 h-4 ml-1" />
                </button>
                <div className="text-sm text-gray-600">Valor Fechado Global</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Taxa Conversão</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {showBreakdownModal && (
      <BreakdownModal 
        type={showBreakdownModal} 
        onClose={() => setShowBreakdownModal(null)} 
      />
    )}
    </>
  );
};