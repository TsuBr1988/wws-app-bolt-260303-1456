import { useState, useEffect, useRef } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Info, AlertTriangle, Users, ChevronDown, X } from 'lucide-react';
import { DashboardService } from '@/services/dashboardService';
import { getLast12Months } from '@/lib/months';
import { FinancialStationResults, Client } from '@/types/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ContractMargin {
  company: string;
  tipo: string;
  contract_name: string;
  margin: number;
}

export function MainFinancialMetricsCard() {
  const [loading, setLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentMonthData, setCurrentMonthData] = useState<FinancialStationResults[]>([]);
  const [previousMonthData, setPreviousMonthData] = useState<FinancialStationResults[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showPositiveModal, setShowPositiveModal] = useState(false);
  const [showNegativeModal, setShowNegativeModal] = useState(false);
  const [revenueDetailModal, setRevenueDetailModal] = useState<{
    show: boolean;
    title: string;
    data: FinancialStationResults[];
  }>({ show: false, title: '', data: [] });
  const [excludedPositiveContracts, setExcludedPositiveContracts] = useState<string[]>([]);
  const [excludedNegativeContracts, setExcludedNegativeContracts] = useState<string[]>([]);
  const [isPositiveFilterOpen, setIsPositiveFilterOpen] = useState(false);
  const [isNegativeFilterOpen, setIsNegativeFilterOpen] = useState(false);
  const positiveFilterRef = useRef<HTMLDivElement>(null);
  const negativeFilterRef = useRef<HTMLDivElement>(null);

  const months = getLast12Months();

  useEffect(() => {
    if (months.length > 0) {
      setSelectedMonths([months[months.length - 1].monthYm]);
    }
  }, []);

  useEffect(() => {
    if (selectedMonths.length > 0) {
      loadData();
    }
  }, [selectedMonths]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (positiveFilterRef.current && !positiveFilterRef.current.contains(event.target as Node)) {
        setIsPositiveFilterOpen(false);
      }
      if (negativeFilterRef.current && !negativeFilterRef.current.contains(event.target as Node)) {
        setIsNegativeFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMonth = (monthYm: string) => {
    setSelectedMonths(prev =>
      prev.includes(monthYm)
        ? prev.filter(m => m !== monthYm)
        : [...prev, monthYm]
    );
  };

  const clearSelection = () => {
    setSelectedMonths([]);
  };

  const getDisplayText = () => {
    if (selectedMonths.length === 0) return 'Selecione os meses';
    if (selectedMonths.length === 1) {
      return months.find(m => m.monthYm === selectedMonths[0])?.monthLabel || '';
    }
    return `${selectedMonths.length} meses selecionados`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const sortedMonths = [...selectedMonths].sort();
      const earliestMonthIndex = months.findIndex(m => m.monthYm === sortedMonths[0]);
      const previousMonthYm = earliestMonthIndex > 0 ? months[earliestMonthIndex - 1].monthYm : null;

      const [currentData, clientsData] = await Promise.all([
        DashboardService.getFinancialStationResults(selectedMonths),
        DashboardService.getClients()
      ]);

      setCurrentMonthData(currentData);
      setClients(clientsData);

      if (previousMonthYm) {
        const previousData = await DashboardService.getFinancialStationResults([previousMonthYm]);
        setPreviousMonthData(previousData);
      } else {
        setPreviousMonthData([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (data: FinancialStationResults[], field: keyof FinancialStationResults) => {
    return data.reduce((sum, record) => sum + Number(record[field]), 0);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getClientInfo = (contractName: string) => clients.find(c => c.name === contractName);

  const totalRevenueCurrent = calculateTotal(currentMonthData, 'revenue');
  const totalRevenuePrevious = calculateTotal(previousMonthData, 'revenue');
  const totalRevenueChange = calculatePercentageChange(totalRevenueCurrent, totalRevenuePrevious);
  const totalClientsCount = new Set(currentMonthData.map(d => d.contract_name)).size;

  const wwsDataCurrent = currentMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.company === 'WWS';
  });
  const wwsRevenueCurrent = calculateTotal(wwsDataCurrent, 'revenue');
  const wwsClientsCount = new Set(wwsDataCurrent.map(d => d.contract_name)).size;

  const wwsDataPrevious = previousMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.company === 'WWS';
  });
  const wwsRevenuePrevious = calculateTotal(wwsDataPrevious, 'revenue');
  const wwsRevenueChange = calculatePercentageChange(wwsRevenueCurrent, wwsRevenuePrevious);

  const worldwideDataCurrent = currentMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.company === 'Worldwide';
  });
  const worldwideRevenueCurrent = calculateTotal(worldwideDataCurrent, 'revenue');
  const worldwideClientsCount = new Set(worldwideDataCurrent.map(d => d.contract_name)).size;

  const worldwideDataPrevious = previousMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.company === 'Worldwide';
  });
  const worldwideRevenuePrevious = calculateTotal(worldwideDataPrevious, 'revenue');
  const worldwideRevenueChange = calculatePercentageChange(worldwideRevenueCurrent, worldwideRevenuePrevious);

  const publicoDataCurrent = currentMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.tipo === 'Público';
  });
  const publicoRevenueCurrent = calculateTotal(publicoDataCurrent, 'revenue');
  const publicoClientsCount = new Set(publicoDataCurrent.map(d => d.contract_name)).size;

  const publicoDataPrevious = previousMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.tipo === 'Público';
  });
  const publicoRevenuePrevious = calculateTotal(publicoDataPrevious, 'revenue');
  const publicoRevenueChange = calculatePercentageChange(publicoRevenueCurrent, publicoRevenuePrevious);

  const privadoDataCurrent = currentMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.tipo === 'Privado';
  });
  const privadoRevenueCurrent = calculateTotal(privadoDataCurrent, 'revenue');
  const privadoClientsCount = new Set(privadoDataCurrent.map(d => d.contract_name)).size;

  const privadoDataPrevious = previousMonthData.filter(d => {
    const client = getClientInfo(d.contract_name);
    return client?.tipo === 'Privado';
  });
  const privadoRevenuePrevious = calculateTotal(privadoDataPrevious, 'revenue');
  const privadoRevenueChange = calculatePercentageChange(privadoRevenueCurrent, privadoRevenuePrevious);

  const contractMargins: ContractMargin[] = currentMonthData.map(record => {
    const client = getClientInfo(record.contract_name);
    return {
      company: client?.company || 'N/A',
      tipo: client?.tipo || 'N/A',
      contract_name: record.contract_name,
      margin: Number(record.contribution_margin),
    };
  });

  const negativeMargins = contractMargins.filter(c => c.margin < 0);
  const negativeMarginCount = negativeMargins.length;

  const positiveMargins = contractMargins.filter(c => c.margin > 0).sort((a, b) => b.margin - a.margin);
  const filteredPositiveMargins = positiveMargins.filter(c => !excludedPositiveContracts.includes(c.contract_name));
  const top3Positive = filteredPositiveMargins.slice(0, 3);

  const sortedNegativeMargins = negativeMargins.sort((a, b) => a.margin - b.margin);
  const filteredNegativeMargins = sortedNegativeMargins.filter(c => !excludedNegativeContracts.includes(c.contract_name));
  const top3Negative = filteredNegativeMargins.slice(0, 3);

  const totalPositiveMargin = positiveMargins.reduce((sum, c) => sum + c.margin, 0);
  const totalNegativeMargin = negativeMargins.reduce((sum, c) => sum + c.margin, 0);

  const calculateTotalContributionMarginPrevious = () => {
    const previousContractMargins = previousMonthData.map(record => Number(record.contribution_margin));
    return previousContractMargins.reduce((sum, margin) => sum + margin, 0);
  };

  const calculateContributionMarginChange = () => {
    const currentTotal = totalPositiveMargin + totalNegativeMargin;
    const previousTotal = calculateTotalContributionMarginPrevious();
    return calculatePercentageChange(currentTotal, previousTotal);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const selectedMonthLabel = selectedMonths.length === 1
    ? months.find(m => m.monthYm === selectedMonths[0])?.monthLabel || ''
    : `${selectedMonths.length} meses selecionados`;

  return (
    <>
      <IndicatorCard
        title="Principais Números"
        subtitle="Visão consolidada dos indicadores financeiros"
        accentColor="#3498DB"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Meses:</label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <span className="text-sm text-gray-700">{getDisplayText()}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                  {[...months].reverse().map((month) => (
                    <label
                      key={month.monthYm}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(month.monthYm)}
                        onChange={() => toggleMonth(month.monthYm)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{month.monthLabel}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedMonths.length > 0 && (
              <button
                onClick={clearSelection}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Limpar seleção"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando dados...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="Faturamento Total"
                  value={formatCurrency(totalRevenueCurrent)}
                  change={totalRevenueChange}
                  previousValue={totalRevenuePrevious}
                  previousMonthData={previousMonthData.length > 0}
                  clientsCount={totalClientsCount}
                  onInfoClick={() => setRevenueDetailModal({
                    show: true,
                    title: 'Faturamento Total',
                    data: currentMonthData
                  })}
                />
                <MetricCard
                  title="Faturamento WWS"
                  value={formatCurrency(wwsRevenueCurrent)}
                  change={wwsRevenueChange}
                  previousValue={wwsRevenuePrevious}
                  previousMonthData={previousMonthData.length > 0}
                  clientsCount={wwsClientsCount}
                  onInfoClick={() => setRevenueDetailModal({
                    show: true,
                    title: 'Faturamento WWS',
                    data: wwsDataCurrent
                  })}
                />
                <MetricCard
                  title="Faturamento Worldwide"
                  value={formatCurrency(worldwideRevenueCurrent)}
                  change={worldwideRevenueChange}
                  previousValue={worldwideRevenuePrevious}
                  previousMonthData={previousMonthData.length > 0}
                  clientsCount={worldwideClientsCount}
                  onInfoClick={() => setRevenueDetailModal({
                    show: true,
                    title: 'Faturamento Worldwide',
                    data: worldwideDataCurrent
                  })}
                />
                <MetricCard
                  title="Faturamento Público"
                  value={formatCurrency(publicoRevenueCurrent)}
                  change={publicoRevenueChange}
                  previousValue={publicoRevenuePrevious}
                  previousMonthData={previousMonthData.length > 0}
                  clientsCount={publicoClientsCount}
                  onInfoClick={() => setRevenueDetailModal({
                    show: true,
                    title: 'Faturamento Público',
                    data: publicoDataCurrent
                  })}
                />
                <MetricCard
                  title="Faturamento Privado"
                  value={formatCurrency(privadoRevenueCurrent)}
                  change={privadoRevenueChange}
                  previousValue={privadoRevenuePrevious}
                  previousMonthData={previousMonthData.length > 0}
                  clientsCount={privadoClientsCount}
                  onInfoClick={() => setRevenueDetailModal({
                    show: true,
                    title: 'Faturamento Privado',
                    data: privadoDataCurrent
                  })}
                />
                <MetricCard
                  title="Margem de Contribuição do Mês"
                  value={formatCurrency(totalPositiveMargin + totalNegativeMargin)}
                  change={calculateContributionMarginChange()}
                  previousValue={calculateTotalContributionMarginPrevious()}
                  previousMonthData={previousMonthData.length > 0}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Top 3 Margens Positivas
                      </h3>
                      <div className="relative" ref={positiveFilterRef}>
                        <button
                          onClick={() => setIsPositiveFilterOpen(!isPositiveFilterOpen)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Filtrar contratos"
                        >
                          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isPositiveFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPositiveFilterOpen && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[500px] max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-700">Selecione os contratos para exibir no ranking</p>
                            </div>
                            <div className="p-2">
                              {positiveMargins.map((contract) => (
                                <label
                                  key={contract.contract_name}
                                  className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={!excludedPositiveContracts.includes(contract.contract_name)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setExcludedPositiveContracts(prev => prev.filter(c => c !== contract.contract_name));
                                      } else {
                                        setExcludedPositiveContracts(prev => [...prev, contract.contract_name]);
                                      }
                                    }}
                                    className="rounded border-gray-300 mt-0.5 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900">
                                      {contract.contract_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {contract.company} • {contract.tipo}
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold text-green-700 ml-4 whitespace-nowrap flex-shrink-0 text-right min-w-[100px]">
                                    {formatCurrency(contract.margin)}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {top3Positive.length > 0 ? (
                      <div className="space-y-2">
                        {top3Positive.map((contract, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {contract.contract_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {contract.company} • {contract.tipo}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-green-700">
                              {formatCurrency(contract.margin)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum contrato com margem positiva</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        Top 3 Margens Negativas
                      </h3>
                      <div className="relative" ref={negativeFilterRef}>
                        <button
                          onClick={() => setIsNegativeFilterOpen(!isNegativeFilterOpen)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Filtrar contratos"
                        >
                          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isNegativeFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isNegativeFilterOpen && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[500px] max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-700">Selecione os contratos para exibir no ranking</p>
                            </div>
                            <div className="p-2">
                              {sortedNegativeMargins.map((contract) => (
                                <label
                                  key={contract.contract_name}
                                  className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={!excludedNegativeContracts.includes(contract.contract_name)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setExcludedNegativeContracts(prev => prev.filter(c => c !== contract.contract_name));
                                      } else {
                                        setExcludedNegativeContracts(prev => [...prev, contract.contract_name]);
                                      }
                                    }}
                                    className="rounded border-gray-300 mt-0.5 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900">
                                      {contract.contract_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {contract.company} • {contract.tipo}
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold text-red-700 ml-4 whitespace-nowrap flex-shrink-0 text-right min-w-[100px]">
                                    {formatCurrency(contract.margin)}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {top3Negative.length > 0 ? (
                      <div className="space-y-2">
                        {top3Negative.map((contract, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {contract.contract_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {contract.company} • {contract.tipo}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-red-700">
                              {formatCurrency(contract.margin)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum contrato com margem negativa</p>
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Total Margem Positiva
                      </h3>
                      <p className="text-2xl font-bold text-green-700 mt-2">
                        {formatCurrency(totalPositiveMargin)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {positiveMargins.length} {positiveMargins.length === 1 ? 'contrato' : 'contratos'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPositiveModal(true)}
                      className="p-2 hover:bg-green-100 rounded-full transition-colors"
                      disabled={positiveMargins.length === 0}
                    >
                      <Info className="h-5 w-5 text-green-700" />
                    </button>
                  </div>
                </Card>

                <Card className="p-6 bg-red-50 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Total Margem Negativa
                      </h3>
                      <p className="text-2xl font-bold text-red-700 mt-2">
                        {formatCurrency(totalNegativeMargin)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {negativeMargins.length} {negativeMargins.length === 1 ? 'contrato' : 'contratos'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNegativeModal(true)}
                      className="p-2 hover:bg-red-100 rounded-full transition-colors"
                      disabled={negativeMargins.length === 0}
                    >
                      <Info className="h-5 w-5 text-red-700" />
                    </button>
                  </div>
                </Card>
              </div>

            </div>
          )}
        </div>
      </IndicatorCard>

      <Dialog open={showPositiveModal} onOpenChange={setShowPositiveModal}>
        <DialogContent onClose={() => setShowPositiveModal(false)}>
          <DialogHeader>
            <DialogTitle>Contratos com Margem Positiva</DialogTitle>
            <DialogDescription>
              Detalhamento de todos os contratos com margem de contribuição positiva em {selectedMonthLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
            {positiveMargins.map((contract, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{contract.contract_name}</div>
                  <div className="text-sm text-gray-600">
                    {contract.company} • {contract.tipo}
                  </div>
                </div>
                <div className="text-lg font-semibold text-green-700">
                  {formatCurrency(contract.margin)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={revenueDetailModal.show} onOpenChange={(open) => setRevenueDetailModal({ ...revenueDetailModal, show: open })}>
        <DialogContent className="!max-w-[95vw] w-[95vw]" onClose={() => setRevenueDetailModal({ ...revenueDetailModal, show: false })}>
          <DialogHeader>
            <DialogTitle>{revenueDetailModal.title} por Cliente</DialogTitle>
            <DialogDescription>
              Detalhamento do faturamento de cada cliente em {selectedMonthLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={600}>
              <BarChart
                data={revenueDetailModal.data
                  .map(d => ({
                    name: d.contract_name,
                    Faturamento: Number(d.revenue)
                  }))
                  .sort((a, b) => b.Faturamento - a.Faturamento)}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    compactDisplay: 'short',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1,
                  }).format(value)}
                />
                <Tooltip
                  formatter={(value: number) => [
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(value),
                    'Faturamento'
                  ]}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="Faturamento" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNegativeModal} onOpenChange={setShowNegativeModal}>
        <DialogContent onClose={() => setShowNegativeModal(false)}>
          <DialogHeader>
            <DialogTitle>Contratos com Margem Negativa</DialogTitle>
            <DialogDescription>
              Detalhamento de todos os contratos com margem de contribuição negativa em {selectedMonthLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
            {sortedNegativeMargins.map((contract, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-4 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{contract.contract_name}</div>
                  <div className="text-sm text-gray-600">
                    {contract.company} • {contract.tipo}
                  </div>
                </div>
                <div className="text-lg font-semibold text-red-700">
                  {formatCurrency(contract.margin)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  previousValue?: number;
  icon?: React.ReactNode;
  previousMonthData?: boolean;
  clientsCount?: number;
  onInfoClick?: () => void;
}

function MetricCard({ title, value, change, previousValue, icon, previousMonthData, clientsCount, onInfoClick }: MetricCardProps) {
  const showChange = change !== undefined && previousMonthData;
  const isPositive = change !== undefined && change >= 0;

  const formatCurrencyShort = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="p-6 relative">
      {onInfoClick && (
        <button
          onClick={onInfoClick}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          title="Ver detalhes"
        >
          <Info className="h-4 w-4 text-gray-500" />
        </button>
      )}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {icon && <div>{icon}</div>}
        </div>
        {clientsCount !== undefined && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{clientsCount} {clientsCount === 1 ? 'cliente' : 'clientes'}</span>
          </div>
        )}
        {showChange && previousValue !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{formatPercentage(change)} ({formatCurrencyShort(previousValue)})</span>
          </div>
        )}
      </div>
    </Card>
  );

  function formatPercentage(value: number) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
}
