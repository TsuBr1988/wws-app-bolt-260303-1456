import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, ChevronLeft, ChevronRight, Save, Plus, Trash2, Edit, X } from 'lucide-react';
import { configurationService, OperationalCost } from '../../services/configurationService';
import { formatCurrency } from '../../utils/formatCurrency';
import { clearCostsCache } from '../../services/costsService';
import { useYear } from '../../contexts/YearContext';
import { useSystemVersion } from '../../contexts/SystemVersionContext';

type MonthRef = { year: number; month: number };

interface OperationalCost {
  id: string;
  name: string;
  years: {
    year: number;
    months: { month: number; value: number }[];
  }[];
}

export const OperationalCostsCard: React.FC = () => {
  const { selectedYear } = useYear();
  const { canEdit } = useSystemVersion();
  const canEditCosts = canEdit('settings');
  const [activeTab, setActiveTab] = useState<'costs'>('costs');
  
  const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibleStart, setVisibleStart] = useState(0);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [tempCostName, setTempCostName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCostName, setNewCostName] = useState('');

  const visibleCount = 6;

  // Carregar dados
  useEffect(() => {
    const loadCosts = async () => {
      try {
        setLoading(true);
        const costs = await configurationService.getOperationalCosts();
        setOperationalCosts(costs);
      } catch (error) {
        console.error('Erro ao carregar custos operacionais:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCosts();
  }, []);

  // Gerar lista completa de meses (baseado nos anos disponíveis)
  const allMonths: MonthRef[] = useMemo(() => {
    const startYear = 2024;
    const endYear = selectedYear + 1; // Incluir o ano seguinte
    const months: MonthRef[] = [];
    
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        months.push({ year, month });
      }
    }
    
    return months;
  }, [selectedYear]);

  // Calcular posição inicial para centralizar no mês atual
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const currentIndex = allMonths.findIndex(m => 
      m.year === currentYear && m.month === currentMonth
    );
    
    if (currentIndex >= 0) {
      // Centralizar no mês atual: 3 meses antes, mês atual, 2 meses depois
      const idealStart = Math.max(0, currentIndex - 3);
      const maxStart = Math.max(0, allMonths.length - visibleCount);
      setVisibleStart(Math.min(idealStart, maxStart));
    }
  }, [allMonths]);

  const visibleMonths = allMonths.slice(visibleStart, visibleStart + visibleCount);

  const handlePrevious = () => {
    setVisibleStart(Math.max(0, visibleStart - 1));
  };

  const handleNext = () => {
    const maxStart = Math.max(0, allMonths.length - visibleCount);
    setVisibleStart(Math.min(maxStart, visibleStart + 1));
  };

  const getMonthLabel = (monthRef: MonthRef) => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                       'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return monthNames[monthRef.month - 1];
  };

  const getWindowLabel = (months: MonthRef[]) => {
    if (months.length === 0) return '';
    const first = months[0];
    const last = months[months.length - 1];
    return `${String(first.month).padStart(2, '0')}/${first.year} – ${String(last.month).padStart(2, '0')}/${last.year}`;
  };

  const getValue = (cost: OperationalCost, year: number, month: number): number => {
    const yearData = cost.years?.find(y => y.year === year);
    if (!yearData) return 0;
    
    const monthData = yearData.months.find(m => m.month === month);
    return monthData?.value || 0;
  };

  const updateValue = async (costId: string, year: number, month: number, value: number) => {
    if (!canEditCosts) return;
    
    const updatedCosts = operationalCosts.map(cost => {
      if (cost.id !== costId) return cost;
      
      const updatedYears = cost.years?.map(yearData => {
        if (yearData.year !== year) return yearData;
        
        const updatedMonths = yearData.months.map(monthData => {
          if (monthData.month !== month) return monthData;
          return { ...monthData, value };
        });
        
        // Adicionar mês se não existir
        if (!updatedMonths.find(m => m.month === month)) {
          updatedMonths.push({ month, value });
          updatedMonths.sort((a, b) => a.month - b.month);
        }
        
        return { ...yearData, months: updatedMonths };
      }) || [];
      
      // Adicionar ano se não existir
      if (!updatedYears.find(y => y.year === year)) {
        updatedYears.push({
          year,
          months: [{ month, value }]
        });
        updatedYears.sort((a, b) => a.year - b.year);
      }
      
      return { ...cost, years: updatedYears };
    });
    
    setOperationalCosts(updatedCosts);
    
    // Auto-save com debounce
    try {
      await configurationService.updateOperationalCosts(updatedCosts);
      clearCostsCache();
    } catch (error) {
      console.error('Erro ao salvar custos:', error);
    }
  };

  const handleAddCost = async () => {
    if (!newCostName.trim()) {
      alert('Digite o nome do tipo de custo');
      return;
    }

    const newCost: OperationalCost = {
      id: Date.now().toString(),
      name: newCostName,
      years: allMonths.reduce((acc, monthRef) => {
        let yearData = acc.find(y => y.year === monthRef.year);
        if (!yearData) {
          yearData = { year: monthRef.year, months: [] };
          acc.push(yearData);
        }
        yearData.months.push({ month: monthRef.month, value: 0 });
        return acc;
      }, [] as { year: number; months: { month: number; value: number }[] }[])
    };

    try {
      const updatedCosts = [...operationalCosts, newCost];
      await configurationService.updateOperationalCosts(updatedCosts);
      setOperationalCosts(updatedCosts);
      setNewCostName('');
      setShowAddForm(false);
      clearCostsCache();
      alert('✅ Tipo de custo adicionado com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao adicionar tipo de custo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleEditCost = (cost: OperationalCost) => {
    setEditingCostId(cost.id);
    setTempCostName(cost.name);
  };

  const handleSaveCostName = async (costId: string) => {
    if (!tempCostName.trim()) {
      alert('Nome do custo não pode estar vazio');
      return;
    }

    try {
      const updatedCosts = operationalCosts.map(cost =>
        cost.id === costId ? { ...cost, name: tempCostName } : cost
      );
      
      await configurationService.updateOperationalCosts(updatedCosts);
      setOperationalCosts(updatedCosts);
      setEditingCostId(null);
      setTempCostName('');
      clearCostsCache();
    } catch (error) {
      alert(`❌ Erro ao salvar nome: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeleteCost = async (costId: string, costName: string) => {
    if (confirm(`Tem certeza que deseja excluir "${costName}"?\n\nEsta ação irá:\n• Remover todos os dados históricos\n• Afetar os cálculos de CAC e ROI\n\nDigite "EXCLUIR" para confirmar:`)) {
      try {
        const updatedCosts = operationalCosts.filter(cost => cost.id !== costId);
        await configurationService.updateOperationalCosts(updatedCosts);
        setOperationalCosts(updatedCosts);
        clearCostsCache();
        alert('✅ Tipo de custo excluído com sucesso!');
      } catch (error) {
        alert(`❌ Erro ao excluir: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  // Agrupar meses visíveis por ano para cabeçalhos
  const yearGroups = useMemo(() => {
    const groups: { year: number; months: MonthRef[]; startIndex: number; count: number }[] = [];
    
    visibleMonths.forEach((month, index) => {
      let group = groups.find(g => g.year === month.year);
      if (!group) {
        group = { year: month.year, months: [], startIndex: index, count: 0 };
        groups.push(group);
      }
      group.months.push(month);
      group.count++;
    });
    
    return groups;
  }, [visibleMonths]);

  const canGoLeft = visibleStart > 0;
  const canGoRight = visibleStart < allMonths.length - visibleCount;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'costs':
        return (
          <div className="space-y-6">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Custos Mensais</h3>
                <p className="text-sm text-gray-600">Configure custos operacionais por mês e ano</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrevious}
                  disabled={!canGoLeft}
                  className="h-8 w-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="text-sm text-gray-600 font-medium min-w-[140px] text-center">
                  {getWindowLabel(visibleMonths)}
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={!canGoRight}
                  className="h-8 w-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add Cost Type Button */}
            {canEditCosts && (
              <div className="flex items-center justify-between">
                <div></div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Tipo de Custo</span>
                </button>
              </div>
            )}

            {/* Add Form */}
            {showAddForm && canEditCosts && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nome do novo tipo de custo"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCost();
                      if (e.key === 'Escape') {
                        setShowAddForm(false);
                        setNewCostName('');
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCost}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCostName('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Costs Table */}
            <div className="relative">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-separate border-spacing-0">
                  {/* Year Headers */}
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 bg-white border-b border-gray-200 p-3 text-left min-w-[220px]">
                        <span className="text-sm font-medium text-gray-900">Tipo de Custo</span>
                      </th>
                      {yearGroups.map((group, groupIndex) => (
                        <th
                          key={group.year}
                          colSpan={group.count}
                          className={`border-b border-gray-200 p-2 text-center bg-gray-50 text-sm font-semibold text-gray-700 ${
                            groupIndex === 0 ? 'border-l' : ''
                          }`}
                        >
                          {group.year}
                        </th>
                      ))}
                    </tr>
                    
                    {/* Month Headers */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-gray-50 border-b border-gray-200 p-3 text-left min-w-[220px]">
                        <span className="text-xs text-gray-600">Ações</span>
                      </th>
                      {visibleMonths.map((month, index) => (
                        <th
                          key={`${month.year}-${month.month}`}
                          className={`border-b border-gray-200 p-2 text-center bg-gray-50 min-w-[90px] text-sm text-gray-600 ${
                            index === 0 ? 'border-l' : ''
                          }`}
                        >
                          {getMonthLabel(month)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {operationalCosts.map((cost, costIndex) => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        {/* Fixed First Column - Cost Name */}
                        <td className="sticky left-0 z-10 bg-white border-b border-gray-100 p-3 min-w-[220px]">
                          <div className="flex items-center justify-between">
                            {editingCostId === cost.id ? (
                              <div className="flex items-center space-x-2 flex-1">
                                <input
                                  type="text"
                                  value={tempCostName}
                                  onChange={(e) => setTempCostName(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCostName(cost.id);
                                    if (e.key === 'Escape') setEditingCostId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveCostName(cost.id)}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Salvar"
                                >
                                  <Save className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingCostId(null)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Cancelar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-medium text-gray-900 text-sm">{cost.name}</span>
                                {canEditCosts && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleEditCost(cost)}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Editar nome"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCost(cost.id, cost.name)}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Excluir tipo de custo"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Month Value Cells */}
                        {visibleMonths.map((month, monthIndex) => {
                          const value = getValue(cost, month.year, month.month);
                          
                          return (
                            <td 
                              key={`${month.year}-${month.month}`}
                              className={`border-b border-gray-100 p-1 text-center min-w-[90px] ${
                                monthIndex === 0 ? 'border-l' : ''
                              }`}
                            >
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                className={`w-full rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                  canEditCosts ? 'border-gray-300 hover:border-blue-400' : 'border-gray-200 bg-gray-50'
                                } transition-colors`}
                                value={value || ''}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value) || 0;
                                  updateValue(cost.id, month.year, month.month, newValue);
                                }}
                                placeholder="0"
                                disabled={!canEditCosts}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">💡 Como usar a janela deslizante</h4>
              <div className="space-y-1 text-sm text-green-800">
                <p>• <strong>Navegação:</strong> Use as setas ← → para navegar pelos meses</p>
                <p>• <strong>Janela fixa:</strong> Mostra sempre 6 meses consecutivos</p>
                <p>• <strong>Primeira coluna:</strong> Permanece fixa ao rolar horizontalmente</p>
                <p>• <strong>Edição:</strong> Clique em qualquer valor para editar (auto-save)</p>
                <p>• <strong>Fronteira de ano:</strong> Navegação automática entre anos (nov/dez ↔ jan/fev)</p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumo dos Custos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {operationalCosts.length}
                  </div>
                  <div className="text-sm text-gray-600">Tipos de Custo</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      visibleMonths.reduce((sum, month) => 
                        sum + operationalCosts.reduce((costSum, cost) => 
                          costSum + getValue(cost, month.year, month.month), 0
                        ), 0
                      ) / visibleMonths.length
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Custo Médio/Mês</div>
                  <div className="text-xs text-gray-500">(janela atual)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      (() => {
                        const currentDate = new Date();
                        const rolling12Months = [];
                        
                        // Gerar últimos 12 meses (atual + 11 anteriores)
                        for (let i = 0; i < 12; i++) {
                          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                          rolling12Months.push({ year: monthDate.getFullYear(), month: monthDate.getMonth() + 1 });
                        }
                        
                        return rolling12Months.reduce((sum, month) => 
                          sum + operationalCosts.reduce((costSum, cost) => 
                            costSum + getValue(cost, month.year, month.month), 0
                          ), 0
                        );
                      })()
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Custo dos Últimos 12 Meses</div>
                  <div className="text-xs text-gray-500">
                    ({formatCurrency(
                      (() => {
                        const currentDate = new Date();
                        const rolling12Months = [];
                        
                        for (let i = 0; i < 12; i++) {
                          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                          rolling12Months.push({ year: monthDate.getFullYear(), month: monthDate.getMonth() + 1 });
                        }
                        
                        const total = rolling12Months.reduce((sum, month) => 
                          sum + operationalCosts.reduce((costSum, cost) => 
                            costSum + getValue(cost, month.year, month.month), 0
                          ), 0
                        );
                        
                        return total / 12;
                      })()
                    )} médio/mês)
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      visibleMonths.reduce((sum, month) => 
                        sum + operationalCosts.reduce((costSum, cost) => 
                          costSum + getValue(cost, month.year, month.month), 0
                        ), 0
                      )
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total da Janela</div>
                  <div className="text-xs text-gray-500">({visibleCount} meses)</div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Custos Mensais</h3>
                <p className="text-sm text-gray-600">Configure custos operacionais por mês e ano</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrevious}
                  disabled={!canGoLeft}
                  className="h-8 w-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="text-sm text-gray-600 font-medium min-w-[140px] text-center">
                  {getWindowLabel(visibleMonths)}
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={!canGoRight}
                  className="h-8 w-8 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add Cost Type Button */}
            {canEditCosts && (
              <div className="flex items-center justify-between">
                <div></div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Tipo de Custo</span>
                </button>
              </div>
            )}

            {/* Add Form */}
            {showAddForm && canEditCosts && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nome do novo tipo de custo"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCost();
                      if (e.key === 'Escape') {
                        setShowAddForm(false);
                        setNewCostName('');
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCost}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCostName('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Costs Table */}
            <div className="relative">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-separate border-spacing-0">
                  {/* Year Headers */}
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 bg-white border-b border-gray-200 p-3 text-left min-w-[220px]">
                        <span className="text-sm font-medium text-gray-900">Tipo de Custo</span>
                      </th>
                      {yearGroups.map((group, groupIndex) => (
                        <th
                          key={group.year}
                          colSpan={group.count}
                          className={`border-b border-gray-200 p-2 text-center bg-gray-50 text-sm font-semibold text-gray-700 ${
                            groupIndex === 0 ? 'border-l' : ''
                          }`}
                        >
                          {group.year}
                        </th>
                      ))}
                    </tr>
                    
                    {/* Month Headers */}
                    <tr>
                      <th className="sticky left-0 z-20 bg-gray-50 border-b border-gray-200 p-3 text-left min-w-[220px]">
                        <span className="text-xs text-gray-600">Ações</span>
                      </th>
                      {visibleMonths.map((month, index) => (
                        <th
                          key={`${month.year}-${month.month}`}
                          className={`border-b border-gray-200 p-2 text-center bg-gray-50 min-w-[90px] text-sm text-gray-600 ${
                            index === 0 ? 'border-l' : ''
                          }`}
                        >
                          {getMonthLabel(month)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {operationalCosts.map((cost, costIndex) => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        {/* Fixed First Column - Cost Name */}
                        <td className="sticky left-0 z-10 bg-white border-b border-gray-100 p-3 min-w-[220px]">
                          <div className="flex items-center justify-between">
                            {editingCostId === cost.id ? (
                              <div className="flex items-center space-x-2 flex-1">
                                <input
                                  type="text"
                                  value={tempCostName}
                                  onChange={(e) => setTempCostName(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCostName(cost.id);
                                    if (e.key === 'Escape') setEditingCostId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveCostName(cost.id)}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Salvar"
                                >
                                  <Save className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingCostId(null)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Cancelar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-medium text-gray-900 text-sm">{cost.name}</span>
                                {canEditCosts && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleEditCost(cost)}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Editar nome"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCost(cost.id, cost.name)}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Excluir tipo de custo"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Month Value Cells */}
                        {visibleMonths.map((month, monthIndex) => {
                          const value = getValue(cost, month.year, month.month);
                          
                          return (
                            <td 
                              key={`${month.year}-${month.month}`}
                              className={`border-b border-gray-100 p-1 text-center min-w-[90px] ${
                                monthIndex === 0 ? 'border-l' : ''
                              }`}
                            >
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                className={`w-full rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                  canEditCosts ? 'border-gray-300 hover:border-blue-400' : 'border-gray-200 bg-gray-50'
                                } transition-colors`}
                                value={value || ''}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value) || 0;
                                  updateValue(cost.id, month.year, month.month, newValue);
                                }}
                                placeholder="0"
                                disabled={!canEditCosts}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">💡 Como usar a janela deslizante</h4>
              <div className="space-y-1 text-sm text-green-800">
                <p>• <strong>Navegação:</strong> Use as setas ← → para navegar pelos meses</p>
                <p>• <strong>Janela fixa:</strong> Mostra sempre 6 meses consecutivos</p>
                <p>• <strong>Primeira coluna:</strong> Permanece fixa ao rolar horizontalmente</p>
                <p>• <strong>Edição:</strong> Clique em qualquer valor para editar (auto-save)</p>
                <p>• <strong>Fronteira de ano:</strong> Navegação automática entre anos (nov/dez ↔ jan/fev)</p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumo dos Custos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {operationalCosts.length}
                  </div>
                  <div className="text-sm text-gray-600">Tipos de Custo</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      visibleMonths.reduce((sum, month) => 
                        sum + operationalCosts.reduce((costSum, cost) => 
                          costSum + getValue(cost, month.year, month.month), 0
                        ), 0
                      ) / visibleMonths.length
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Custo Médio/Mês</div>
                  <div className="text-xs text-gray-500">(janela atual)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      (() => {
                        const currentDate = new Date();
                        const rolling12Months = [];
                        
                        // Gerar últimos 12 meses (atual + 11 anteriores)
                        for (let i = 0; i < 12; i++) {
                          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                          rolling12Months.push({ year: monthDate.getFullYear(), month: monthDate.getMonth() + 1 });
                        }
                        
                        return rolling12Months.reduce((sum, month) => 
                          sum + operationalCosts.reduce((costSum, cost) => 
                            costSum + getValue(cost, month.year, month.month), 0
                          ), 0
                        );
                      })()
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Custo dos Últimos 12 Meses</div>
                  <div className="text-xs text-gray-500">
                    ({formatCurrency(
                      (() => {
                        const currentDate = new Date();
                        const rolling12Months = [];
                        
                        for (let i = 0; i < 12; i++) {
                          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                          rolling12Months.push({ year: monthDate.getFullYear(), month: monthDate.getMonth() + 1 });
                        }
                        
                        const total = rolling12Months.reduce((sum, month) => 
                          sum + operationalCosts.reduce((costSum, cost) => 
                            costSum + getValue(cost, month.year, month.month), 0
                          ), 0
                        );
                        
                        return total / 12;
                      })()
                    )} médio/mês)
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      visibleMonths.reduce((sum, month) => 
                        sum + operationalCosts.reduce((costSum, cost) => 
                          costSum + getValue(cost, month.year, month.month), 0
                        ), 0
                      )
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total da Janela</div>
                  <div className="text-xs text-gray-500">({visibleCount} meses)</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderTabContent()}
    </div>
  );
};