import React, { useState } from 'react';
import { Target, Save, RotateCcw, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';
import { useSystemVersion } from '../../contexts/SystemVersionContext';

export const MonthlyGoalsCard: React.FC = () => {
  const { selectedYear } = useYear();
  const { canEdit } = useSystemVersion();
  const canEditGoals = canEdit('settings');
  
  const { monthlyGoals, updateGoals, loading, getAnnualGoal } = useMonthlyGoals();
  const [tempGoals, setTempGoals] = useState(monthlyGoals);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setTempGoals(monthlyGoals);
    setHasChanges(false);
  }, [monthlyGoals]);

  const handleGoalChange = (month: number, targetValue: number) => {
    if (!canEditGoals) return;
    
    setTempGoals(prev => prev.map(goal => 
      goal.month === month ? { ...goal, targetValue } : goal
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      await updateGoals(tempGoals);
      setHasChanges(false);
      alert('✅ Metas mensais atualizadas com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao salvar metas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja descartar as alterações?')) {
      setTempGoals(monthlyGoals);
      setHasChanges(false);
    }
  };

  const setAllGoals = (value: number) => {
    if (!canEditGoals) return;
    
    setTempGoals(prev => prev.map(goal => ({ ...goal, targetValue: value })));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const annualTotal = tempGoals.reduce((sum, goal) => sum + goal.targetValue, 0);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Metas Mensais {selectedYear}</h3>
          <p className="text-sm text-gray-600">Configure as metas de vendas para cada mês</p>
        </div>
        
        {canEditGoals && (
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Descartar</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </>
            )}
            
            {/* Quick Fill */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Preencher todos:</span>
              {[250000, 300000, 350000].map(value => (
                <button
                  key={value}
                  onClick={() => setAllGoals(value)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {formatCurrency(value).replace(',00', 'k').replace('.000', 'k')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Annual Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-blue-900">Meta Anual {selectedYear}</h4>
            <p className="text-sm text-blue-700">Soma de todas as metas mensais</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(annualTotal)}
            </div>
            <div className="text-sm text-blue-700">
              Média: {formatCurrency(annualTotal / 12)}/mês
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Goals Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tempGoals.map((goal) => (
            <div key={goal.month} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h4 className="text-sm font-semibold text-gray-900 capitalize">{goal.monthName}</h4>
                </div>
                <span className="text-xs text-gray-500">Mês {goal.month}</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Meta de Vendas</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={goal.targetValue || ''}
                      onChange={(e) => handleGoalChange(goal.month, parseFloat(e.target.value) || 0)}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        canEditGoals ? 'hover:border-blue-400' : 'bg-gray-50'
                      } transition-colors`}
                      placeholder="0"
                      disabled={!canEditGoals}
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(goal.targetValue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((goal.targetValue / annualTotal) * 100).toFixed(1)}% do total anual
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribuição Mensal</h4>
        
        <div className="grid grid-cols-12 gap-2 mb-4">
          {tempGoals.map((goal) => {
            const percentage = annualTotal > 0 ? (goal.targetValue / annualTotal) * 100 : 0;
            return (
              <div key={goal.month} className="text-center">
                <div 
                  className="bg-blue-500 rounded-t mb-1 transition-all"
                  style={{ height: `${Math.max(percentage * 1.5, 8)}px` }}
                  title={`${goal.monthName}: ${formatCurrency(goal.targetValue)}`}
                />
                <div className="text-xs text-gray-600 font-medium">
                  {goal.monthName.substring(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Menor: {formatCurrency(Math.min(...tempGoals.map(g => g.targetValue)))}</span>
          <span>Média: {formatCurrency(annualTotal / 12)}</span>
          <span>Maior: {formatCurrency(Math.max(...tempGoals.map(g => g.targetValue)))}</span>
        </div>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <div>
              <h4 className="text-sm font-semibold text-orange-900">Alterações Pendentes</h4>
              <p className="text-sm text-orange-800">
                Você fez alterações nas metas. Clique em "Salvar Alterações" para aplicar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Impacto das Metas</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>• <strong>CAC:</strong> Afeta o cálculo do Custo de Aquisição de Cliente</p>
          <p>• <strong>ROI:</strong> Base para cálculo do Retorno sobre Investimento</p>
          <p>• <strong>Dashboard:</strong> Metas são exibidas no card "Meta Comercial"</p>
          <p>• <strong>Comissões:</strong> Determinam as faixas de bonificação</p>
        </div>
      </div>
    </div>
  );
};