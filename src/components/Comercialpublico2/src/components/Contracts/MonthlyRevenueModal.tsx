import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { ContractWithAddendums } from '../../types/contracts';
import { formatCurrency } from '../../utils/formatCurrency';

interface MonthlyRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: ContractWithAddendums[];
  selectedYear: number;
  getContractValueForMonth: (contract: ContractWithAddendums, targetDate: Date) => number;
}

export const MonthlyRevenueModal: React.FC<MonthlyRevenueModalProps> = ({
  isOpen,
  onClose,
  contracts,
  selectedYear: initialYear,
  getContractValueForMonth
}) => {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [startMonthIndex, setStartMonthIndex] = useState(0);
  const [expandedCompanies, setExpandedCompanies] = useState<{ [key: string]: boolean }>({
    Worldwide: false,
    WWS: false
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentYear(initialYear);
      setStartMonthIndex(0);
    }
  }, [isOpen, initialYear]);

  if (!isOpen) return null;

  const MIN_YEAR = 2021;

  // Verificar se há contratos ativos no ano especificado
  const hasContractsInYear = (year: number) => {
    return contracts.some(contract => {
      const contractStart = new Date(contract.start_date);
      const contractEnd = new Date(contract.current_end_date);
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      return contractStart <= yearEnd && contractEnd >= yearStart;
    });
  };

  const canGoToPreviousYear = currentYear > MIN_YEAR;
  const canGoToNextYear = hasContractsInYear(currentYear + 1);

  const handlePreviousYear = () => {
    if (canGoToPreviousYear) {
      setCurrentYear(currentYear - 1);
      setStartMonthIndex(0);
    }
  };

  const handleNextYear = () => {
    if (canGoToNextYear) {
      setCurrentYear(currentYear + 1);
      setStartMonthIndex(0);
    }
  };

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const visibleMonths = months.slice(startMonthIndex, startMonthIndex + 6);
  const visibleMonthIndices = Array.from({ length: 6 }, (_, i) => startMonthIndex + i).filter(i => i < 12);

  const canGoLeft = startMonthIndex > 0;
  const canGoRight = startMonthIndex + 6 < 12;

  const handlePrevious = () => {
    if (canGoLeft) {
      setStartMonthIndex(Math.max(0, startMonthIndex - 1));
    }
  };

  const handleNext = () => {
    if (canGoRight) {
      setStartMonthIndex(Math.min(6, startMonthIndex + 1));
    }
  };

  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [company]: !prev[company]
    }));
  };

  // Separar e ordenar contratos por empresa
  const worldwideContracts = contracts
    .filter(c => (c as any).empresa === 'Worldwide')
    .sort((a, b) => a.client_name.localeCompare(b.client_name));

  const wwsContracts = contracts
    .filter(c => !(c as any).empresa || (c as any).empresa === 'WWS')
    .sort((a, b) => a.client_name.localeCompare(b.client_name));

  // Calcular totais por empresa
  const calculateCompanyTotal = (contractsList: ContractWithAddendums[], monthIndex: number) => {
    const monthDate = new Date(currentYear, monthIndex, 1);
    return contractsList.reduce((sum, contract) => {
      return sum + getContractValueForMonth(contract, monthDate);
    }, 0);
  };

  const renderCompanySection = (companyName: string, contractsList: ContractWithAddendums[], bgColor: string, textColor: string) => {
    const isExpanded = expandedCompanies[companyName];
    const hasContracts = contractsList.length > 0;

    return (
      <>
        {/* Linha do título da empresa */}
        <tr className={`${bgColor} border-b border-gray-300`}>
          <td className="sticky left-0 z-10 px-4 py-3 font-bold text-sm">
            <button
              onClick={() => toggleCompany(companyName)}
              className="flex items-center space-x-2 hover:opacity-75 transition-opacity w-full"
              disabled={!hasContracts}
            >
              {hasContracts ? (
                isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4"></span>
              )}
              <span className={textColor}>{companyName}</span>
              <span className="text-xs text-gray-600">({contractsList.length})</span>
            </button>
          </td>
          {visibleMonthIndices.map(monthIndex => (
            <td key={monthIndex} className={`px-4 py-3 text-center font-bold text-sm ${textColor}`}>
              {formatCurrency(calculateCompanyTotal(contractsList, monthIndex))}
            </td>
          ))}
        </tr>

        {/* Linhas dos contratos (quando expandido) */}
        {isExpanded && contractsList.map(contract => (
          <tr key={contract.id} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="sticky left-0 z-10 bg-white px-4 py-2 text-sm text-gray-700 pl-12">
              {contract.client_name}
            </td>
            {visibleMonthIndices.map(monthIndex => {
              const monthDate = new Date(currentYear, monthIndex, 1);
              const value = getContractValueForMonth(contract, monthDate);
              return (
                <td key={monthIndex} className="px-4 py-2 text-center text-sm text-gray-700">
                  {value > 0 ? formatCurrency(value) : '-'}
                </td>
              );
            })}
          </tr>
        ))}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Faturamento Mensal por Contrato</h2>
            <p className="text-sm text-gray-600 mt-1">Valores mensais considerando aditivos ativos - {currentYear}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center justify-center space-x-4 px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <button
            onClick={handlePreviousYear}
            disabled={!canGoToPreviousYear}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
              canGoToPreviousYear
                ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Ano anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">{currentYear}</span>
          </div>

          <button
            onClick={handleNextYear}
            disabled={!canGoToNextYear}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
              canGoToNextYear
                ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Próximo ano"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={!canGoLeft}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              canGoLeft
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <span>Exibindo meses:</span>
            <span className="font-bold text-blue-600">
              {months[startMonthIndex]} - {months[Math.min(startMonthIndex + 5, 11)]}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={!canGoRight}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              canGoRight
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Próximo</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr className="border-b-2 border-gray-300">
                <th className="sticky left-0 z-30 bg-gray-100 px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Contrato
                </th>
                {visibleMonthIndices.map(monthIndex => (
                  <th key={monthIndex} className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                    {months[monthIndex]} {currentYear}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Seção Worldwide */}
              {renderCompanySection('Worldwide', worldwideContracts, 'bg-orange-50', 'text-orange-700')}

              {/* Seção WWS */}
              {renderCompanySection('WWS', wwsContracts, 'bg-green-50', 'text-green-700')}

              {/* Linha de Total Geral */}
              <tr className="bg-blue-50 border-t-2 border-blue-300">
                <td className="sticky left-0 z-10 bg-blue-50 px-4 py-3 font-bold text-sm text-blue-900">
                  TOTAL GERAL
                </td>
                {visibleMonthIndices.map(monthIndex => {
                  const wwsTotal = calculateCompanyTotal(wwsContracts, monthIndex);
                  const worldwideTotal = calculateCompanyTotal(worldwideContracts, monthIndex);
                  return (
                    <td key={monthIndex} className="px-4 py-3 text-center font-bold text-sm text-blue-900">
                      {formatCurrency(wwsTotal + worldwideTotal)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer with Legend */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700">Worldwide</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">WWS</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Clique nas setas ao lado do nome da empresa para expandir/recolher os contratos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
