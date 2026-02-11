import React, { useState, useEffect } from 'react';
import { BarChart3, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContractWithAddendums } from '../../types/contracts';
import { formatCurrency } from '../../utils/formatCurrency';
import { MonthlyRevenueModal } from './MonthlyRevenueModal';

interface ContractChartProps {
  contracts: ContractWithAddendums[];
  selectedYear: number;
}

export const ContractChart: React.FC<ContractChartProps> = ({ contracts, selectedYear }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewStartMonth, setViewStartMonth] = useState(0); // 0 = Janeiro do ano atual

  // Resetar para o ano atual quando o selectedYear muda
  useEffect(() => {
    const currentDate = new Date();
    const monthsFromReference = (selectedYear - currentDate.getFullYear()) * 12 + (0 - currentDate.getMonth());
    setViewStartMonth(monthsFromReference);
  }, [selectedYear]);
  // Função para calcular o valor correto de um contrato em um mês específico
  const getContractValueForMonth = (contract: ContractWithAddendums, targetDate: Date): number => {
    // Verificar se o contrato estava ativo neste mês
    const contractStart = new Date(contract.start_date);
    const contractEnd = new Date(contract.current_end_date);
    
    if (targetDate < contractStart || targetDate > contractEnd) {
      return 0; // Contrato não estava ativo
    }

    // Função para identificar aditivos informativos
    const isInformativeAddendum = (addendum: any) => {
      return addendum.monthly_value === 0 && 
             addendum.observations && 
             addendum.observations.startsWith('[ADITIVO INFORMATIVO]');
    };
    
    // 1. Verificar se havia aditivo pontual ativo neste mês
    const activePunctualAddendum = contract.addendums
      .filter(addendum => addendum.is_punctual && !isInformativeAddendum(addendum))
      .find(addendum => {
        const punctualStart = new Date(addendum.effective_start_date || addendum.start_date);
        const punctualEnd = new Date(addendum.effective_end_date || addendum.end_date);
        return targetDate >= punctualStart && targetDate <= punctualEnd;
      });
    
    if (activePunctualAddendum) {
      console.log(`📅 ${contract.client_name} em ${targetDate.toISOString().split('T')[0]}: Usando aditivo pontual - ${formatCurrency(activePunctualAddendum.monthly_value)}`);
      return activePunctualAddendum.monthly_value;
    }
    
    // 2. Se não há aditivo pontual ativo, buscar aditivo permanente mais recente até esta data
    const permanentAddendums = contract.addendums
      .filter(addendum => !addendum.is_punctual && !isInformativeAddendum(addendum))
      .filter(addendum => {
        const addendumStart = new Date(addendum.effective_start_date || addendum.start_date);
        return addendumStart <= targetDate; // Aditivo já estava em vigor
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Mais recente primeiro
    
    if (permanentAddendums.length > 0) {
      const latestPermanentAddendum = permanentAddendums[0];
      console.log(`📅 ${contract.client_name} em ${targetDate.toISOString().split('T')[0]}: Usando aditivo permanente #${contract.addendums.indexOf(latestPermanentAddendum) + 1} - ${formatCurrency(latestPermanentAddendum.monthly_value)}`);
      return latestPermanentAddendum.monthly_value;
    }
    
    // 3. Se não há aditivos aplicáveis, usar valor original do contrato
    console.log(`📅 ${contract.client_name} em ${targetDate.toISOString().split('T')[0]}: Usando valor original - ${formatCurrency(contract.monthly_value)}`);
    return contract.monthly_value;
  };

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  // Gerar dados mensais baseado na visualização atual (12 meses consecutivos)
  const generateMonthlyData = () => {
    const currentDate = new Date();
    const referenceDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    return Array.from({ length: 12 }, (_, index) => {
      // Calcular a data do mês baseado no offset
      const targetDate = new Date(referenceDate);
      targetDate.setMonth(targetDate.getMonth() + viewStartMonth + index);

      const monthIndex = targetDate.getMonth();
      const year = targetDate.getFullYear();
      const monthDate = new Date(year, monthIndex, 1);

      // Calcular faturamento separado por empresa
      const wwsRevenue = contracts.reduce((sum, contract) => {
        const empresa = (contract as any).empresa || 'WWS';
        if (empresa === 'WWS') {
          const contractValue = getContractValueForMonth(contract, monthDate);
          return sum + contractValue;
        }
        return sum;
      }, 0);

      const worldwideRevenue = contracts.reduce((sum, contract) => {
        const empresa = (contract as any).empresa || 'WWS';
        if (empresa === 'Worldwide') {
          const contractValue = getContractValueForMonth(contract, monthDate);
          return sum + contractValue;
        }
        return sum;
      }, 0);

      const totalRevenue = wwsRevenue + worldwideRevenue;

      return {
        month: monthNames[monthIndex],
        year,
        fullDate: monthDate,
        revenue: totalRevenue,
        wwsRevenue,
        worldwideRevenue
      };
    });
  };

  const monthlyData = generateMonthlyData();
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1000);

  const totalAnnualRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const averageMonthlyRevenue = totalAnnualRevenue / 12;

  // Funções de navegação
  const handlePreviousMonth = () => {
    setViewStartMonth(viewStartMonth - 1);
  };

  const handleNextMonth = () => {
    setViewStartMonth(viewStartMonth + 1);
  };

  // Obter o período atual de visualização
  const startDate = monthlyData[0];
  const endDate = monthlyData[11];
  const displayPeriod = `${startDate.month}/${startDate.year} - ${endDate.month}/${endDate.year}`;

  // Obter o mês atual para destacar no faturamento
  const currentMonthData = monthlyData.find(data => {
    const now = new Date();
    return data.fullDate.getMonth() === now.getMonth() &&
           data.fullDate.getFullYear() === now.getFullYear();
  });
  
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Faturamento Mensal dos Contratos</span>
            </h3>
            <p className="text-sm text-gray-600">Receita mensal considerando aditivos pontuais</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">WWS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-xs text-gray-600">Worldwide</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                {currentMonthData ? formatCurrency(currentMonthData.revenue) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Faturamento do Mês Atual</div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              title="Ver detalhes por contrato"
            >
              <Info className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
            </button>
          </div>
        </div>

        {/* Navegação de Período */}
        <div className="flex items-center justify-center space-x-4 mb-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg py-3 px-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <span className="font-bold text-blue-600 text-base">{displayPeriod}</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      {/* Chart Container */}
      <div className="relative">
        <div className="flex items-end justify-between space-x-1 h-64 mb-4 ml-20">
          {monthlyData.map((data, index) => {
            const wwsHeight = maxRevenue > 0 ? (data.wwsRevenue / maxRevenue) * 100 : 0;
            const worldwideHeight = maxRevenue > 0 ? (data.worldwideRevenue / maxRevenue) * 100 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full h-48 flex items-end group">
                  {/* Tooltip consolidado */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                    <div className="text-center space-y-1">
                      <div className="font-bold text-sm border-b border-gray-700 pb-1">{data.month} {data.year}</div>
                      {data.wwsRevenue > 0 && (
                        <div className="flex items-center justify-between space-x-3">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                            WWS:
                          </span>
                          <span className="font-semibold">{formatCurrency(data.wwsRevenue)}</span>
                        </div>
                      )}
                      {data.worldwideRevenue > 0 && (
                        <div className="flex items-center justify-between space-x-3">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-orange-400 rounded-full mr-1.5"></span>
                            Worldwide:
                          </span>
                          <span className="font-semibold">{formatCurrency(data.worldwideRevenue)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between space-x-3 pt-1 border-t border-gray-700">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-blue-300">{formatCurrency(data.revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra empilhada */}
                  <div className="w-full flex flex-col cursor-pointer" style={{ height: `${Math.max(wwsHeight + worldwideHeight, 2)}%` }}>
                    {/* Worldwide no topo (laranja) */}
                    {data.worldwideRevenue > 0 && (
                      <div
                        className="w-full bg-gradient-to-t from-orange-500 to-orange-400 group-hover:from-orange-600 group-hover:to-orange-500 transition-all"
                        style={{ height: `${(worldwideHeight / (wwsHeight + worldwideHeight)) * 100}%` }}
                      />
                    )}

                    {/* WWS na base (verde) */}
                    {data.wwsRevenue > 0 && (
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 group-hover:from-green-600 group-hover:to-green-500 transition-all"
                        style={{ height: `${(wwsHeight / (wwsHeight + worldwideHeight)) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 font-medium text-center">
                  <div>{data.month}</div>
                  <div className="text-[10px] text-gray-500">{data.year}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500 w-16 text-right pr-4">
          <span>{formatCurrency(maxRevenue)}</span>
          <span>{formatCurrency(maxRevenue * 0.75)}</span>
          <span>{formatCurrency(maxRevenue * 0.5)}</span>
          <span>{formatCurrency(maxRevenue * 0.25)}</span>
          <span>R$ 0</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(totalAnnualRevenue)}
          </div>
          <div className="text-sm text-gray-600">Total Anual</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(averageMonthlyRevenue)}
          </div>
          <div className="text-sm text-gray-600">Média Mensal</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {contracts.length}
          </div>
          <div className="text-sm text-gray-600">Contratos Ativos</div>
        </div>
      </div>

        {/* Informação sobre aditivos pontuais */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Controle de Aditivos Pontuais</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Aditivos pontuais ativos:</strong> Valor usado durante sua vigência</p>
            <p>• <strong>Após expiração:</strong> Retorna para o aditivo permanente mais recente</p>
            <p>• <strong>Exemplo:</strong> Setembro usa aditivo permanente se o pontual expirou em agosto</p>
          </div>
        </div>
      </div>

      {/* Modal de detalhes */}
      <MonthlyRevenueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contracts={contracts}
        selectedYear={selectedYear}
        getContractValueForMonth={getContractValueForMonth}
      />
    </>
  );
};