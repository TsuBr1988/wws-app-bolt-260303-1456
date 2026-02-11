import React, { useState, useEffect } from 'react';
import { DollarSign, ChevronLeft, ChevronRight, Edit2, Trash2, Check, X, Plus, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDepartment } from '../../contexts/DepartmentContext';
import { formatCurrency } from '../../utils/formatCurrency';

interface CostData {
  id: string;
  costName: string;
  values: { [key: string]: number };
}

export const OperationalCosts: React.FC = () => {
  const { selectedDepartment } = useDepartment();
  const [costs, setCosts] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [windowStart, setWindowStart] = useState(0);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [tempCostName, setTempCostName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCostName, setNewCostName] = useState('');

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const VISIBLE_MONTHS = 6;

  const allMonths = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  useEffect(() => {
    const startMonth = Math.max(0, currentMonth - 3);
    setWindowStart(startMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadCosts();
  }, [selectedDepartment]);

  const loadCosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operational_costs')
        .select('*')
        .eq('department', selectedDepartment)
        .order('cost_name');

      if (error) throw error;

      const groupedCosts: { [key: string]: CostData } = {};

      data?.forEach(record => {
        const key = `${record.year}-${record.month}`;
        if (!groupedCosts[record.cost_name]) {
          groupedCosts[record.cost_name] = {
            id: record.cost_name,
            costName: record.cost_name,
            values: {}
          };
        }
        groupedCosts[record.cost_name].values[key] = record.value || 0;
      });

      setCosts(Object.values(groupedCosts));
    } catch (error) {
      console.error('Error loading costs:', error);
      alert('Erro ao carregar custos operacionais');
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (costId: string, year: number, month: number, value: number) => {
    const key = `${year}-${month}`;
    setCosts(prevCosts =>
      prevCosts.map(cost =>
        cost.id === costId
          ? { ...cost, values: { ...cost.values, [key]: value } }
          : cost
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const cost of costs) {
        for (const [key, value] of Object.entries(cost.values)) {
          const [year, month] = key.split('-').map(Number);

          const { error } = await supabase
            .from('operational_costs')
            .upsert({
              cost_name: cost.costName,
              year,
              month,
              value,
              department: selectedDepartment,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'cost_name,year,month,department'
            });

          if (error) throw error;
        }
      }

      alert('Custos salvos com sucesso!');
    } catch (error) {
      console.error('Error saving costs:', error);
      alert('Erro ao salvar custos operacionais');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCost = async () => {
    if (!newCostName.trim()) {
      alert('Digite um nome para o custo');
      return;
    }

    const newCost: CostData = {
      id: newCostName,
      costName: newCostName,
      values: {}
    };

    setCosts([...costs, newCost]);
    setNewCostName('');
    setShowAddForm(false);
  };

  const handleDeleteCost = async (costId: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de custo?')) {
      return;
    }

    try {
      const costToDelete = costs.find(c => c.id === costId);
      if (!costToDelete) return;

      const { error } = await supabase
        .from('operational_costs')
        .delete()
        .eq('cost_name', costToDelete.costName)
        .eq('department', selectedDepartment);

      if (error) throw error;

      setCosts(costs.filter(c => c.id !== costId));
      alert('Tipo de custo excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting cost:', error);
      alert('Erro ao excluir tipo de custo');
    }
  };

  const handleSaveCostName = async (oldId: string) => {
    if (!tempCostName.trim()) {
      setEditingCostId(null);
      return;
    }

    try {
      const oldCost = costs.find(c => c.id === oldId);
      if (!oldCost) return;

      const { error } = await supabase
        .from('operational_costs')
        .update({ cost_name: tempCostName })
        .eq('cost_name', oldCost.costName)
        .eq('department', selectedDepartment);

      if (error) throw error;

      setCosts(costs.map(cost =>
        cost.id === oldId
          ? { ...cost, id: tempCostName, costName: tempCostName }
          : cost
      ));

      setEditingCostId(null);
      setTempCostName('');
    } catch (error) {
      console.error('Error updating cost name:', error);
      alert('Erro ao atualizar nome do custo');
    }
  };

  const getVisibleMonths = () => {
    const visible = [];
    const baseYear = 2024;
    const baseMonth = 0;

    const totalMonthsSinceBase = (currentYear - baseYear) * 12 + currentMonth - baseMonth;
    const absoluteStartMonth = totalMonthsSinceBase + windowStart - (currentMonth - 3);

    for (let i = 0; i < VISIBLE_MONTHS; i++) {
      const absoluteMonth = absoluteStartMonth + i;
      const monthIndex = ((absoluteMonth % 12) + 12) % 12;
      const yearOffset = Math.floor(absoluteMonth / 12);
      const year = baseYear + yearOffset;

      visible.push({
        month: allMonths[monthIndex],
        monthNumber: monthIndex + 1,
        year,
        key: `${year}-${monthIndex + 1}`
      });
    }
    return visible;
  };

  const visibleMonths = getVisibleMonths();
  const startDate = `${visibleMonths[0].month}/${visibleMonths[0].year}`;
  const endDate = `${visibleMonths[visibleMonths.length - 1].month}/${visibleMonths[visibleMonths.length - 1].year}`;

  const minWindowStart = -((currentYear - 2024) * 12 + (currentMonth - 3));
  const canGoBack = windowStart > minWindowStart;
  const canGoForward = true;

  const calculateSummary = () => {
    let totalInWindow = 0;
    let monthCount = 0;

    visibleMonths.forEach(({ key }) => {
      costs.forEach(cost => {
        const value = cost.values[key] || 0;
        totalInWindow += value;
        if (value > 0) monthCount++;
      });
    });

    const last12Months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      last12Months.push(`${year}-${month}`);
    }

    let totalLast12Months = 0;
    costs.forEach(cost => {
      last12Months.forEach(key => {
        totalLast12Months += cost.values[key] || 0;
      });
    });

    const avgPerMonth = totalInWindow / VISIBLE_MONTHS;

    return {
      totalInWindow,
      avgPerMonth,
      totalLast12Months,
      costTypesCount: costs.length
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando custos operacionais...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Custos Mensais</h2>
          <p className="text-sm text-gray-600">Configure custos operacionais por mês e ano</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setWindowStart(windowStart - 1)}
            disabled={!canGoBack}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
            {startDate} – {endDate}
          </div>
          <button
            onClick={() => setWindowStart(windowStart + 1)}
            disabled={!canGoForward}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50 px-6 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">
                  Tipo de Custo
                </th>
                {visibleMonths.map(({ month, year, key }) => (
                  <th key={key} className="px-4 py-3 text-center text-sm font-semibold text-gray-900 min-w-[120px]">
                    <div>{month}</div>
                    <div className="text-xs font-normal text-gray-500">{year}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 w-20">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {costs.map((cost) => (
                <tr key={cost.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white hover:bg-gray-50 px-6 py-3 border-r border-gray-200">
                    {editingCostId === cost.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tempCostName}
                          onChange={(e) => setTempCostName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCostName(cost.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCostId(null);
                            setTempCostName('');
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{cost.costName}</span>
                        <button
                          onClick={() => {
                            setEditingCostId(cost.id);
                            setTempCostName(cost.costName);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  {visibleMonths.map(({ monthNumber, year, key }) => (
                    <td key={key} className="px-4 py-3">
                      <input
                        type="number"
                        value={cost.values[key] || 0}
                        onChange={(e) => handleCostChange(cost.id, year, monthNumber, Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        step="0.01"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteCost(cost.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Excluir tipo de custo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={newCostName}
              onChange={(e) => setNewCostName(e.target.value)}
              placeholder="Nome do novo tipo de custo"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddCost}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCostName('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Tipo de Custo</span>
        </button>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Como usar a janela deslizante</span>
        </h3>
        <div className="space-y-2 text-sm text-green-800">
          <p><strong>• Navegação:</strong> Use as setas ← → para navegar pelos meses</p>
          <p><strong>• Período disponível:</strong> Desde janeiro/2024 até o futuro ilimitado</p>
          <p><strong>• Janela fixa:</strong> Mostra sempre 6 meses consecutivos</p>
          <p><strong>• Visualização inicial:</strong> Mês atual + 3 meses antes + 2 meses depois</p>
          <p><strong>• Primeira coluna:</strong> Permanece fixa ao rolar horizontalmente</p>
          <p><strong>• Edição:</strong> Altere valores e clique em "Salvar Alterações"</p>
          <p><strong>• Fronteira de ano:</strong> Navegação automática entre anos</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo dos Custos</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.costTypesCount}</div>
            <div className="text-sm text-gray-600">Tipos de Custo</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.avgPerMonth)}</div>
            <div className="text-sm text-gray-600">Custo Médio/Mês</div>
            <div className="text-xs text-gray-500">(janela atual)</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalLast12Months)}</div>
            <div className="text-sm text-gray-600">Custo dos Últimos 12 Meses</div>
            <div className="text-xs text-gray-500">(R$ {(summary.totalLast12Months / 12).toFixed(2)} médio/mês)</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalInWindow)}</div>
            <div className="text-sm text-gray-600">Total da Janela</div>
            <div className="text-xs text-gray-500">(6 meses)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
