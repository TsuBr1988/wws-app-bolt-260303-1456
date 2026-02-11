import React, { useState } from 'react';
import { Settings as SettingsIcon, Target, DollarSign, Users, TrendingUp, Save, X, Plus, Trash2, Shield, Receipt } from 'lucide-react';
import { useSupabaseQuery, useSupabaseUpdate } from '../../hooks/useSupabase';
import { configurationService, MonthlyGoal, CommissionTier, WeeklyMetric } from '../../services/configurationService';
import { monthlyGoalsService } from '../../services/monthlyGoalsService';
import { EmployeeManagement } from '../Employees/EmployeeManagement';
import { UserManagement } from '../UserManagement/UserManagement';
import { OperationalCosts } from './OperationalCosts';
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';
import { useDepartment } from '../../contexts/DepartmentContext';

export const Settings: React.FC = () => {
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const { canEdit } = useSystemVersion();
  const canEditSettings = canEdit('settings');
  
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Hook para metas mensais
  const { 
    monthlyGoals, 
    loading: goalsLoading, 
    updateGoals,
    getAnnualGoal 
  } = useMonthlyGoals();

  // Estado local para edição das metas
  const [editingGoals, setEditingGoals] = useState<MonthlyGoal[]>([]);

  // Estados para Comissões
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);

  // Estados para Performance Semanal
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetric[]>([]);

  // Carregar configurações do Supabase
  React.useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setLoading(true);
        const [tiers, metrics] = await Promise.all([
          configurationService.getCommissionTiers(),
          configurationService.getWeeklyMetrics()
        ]);
        
        setCommissionTiers(tiers);
        setWeeklyMetrics(metrics);
      } catch (error) {
        console.error('Error loading configurations:', error);
        alert('Erro ao carregar configurações. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  // Sincronizar metas quando carregadas
  React.useEffect(() => {
    if (monthlyGoals.length > 0) {
      setEditingGoals([...monthlyGoals]);
    } else {
      // Inicializar com metas padrão se não houver dados
      const defaultGoals = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        year: selectedYear,
        monthName: new Date(selectedYear, index, 1).toLocaleDateString('pt-BR', { month: 'long' }),
        targetValue: 300000 // R$ 300k padrão
      }));
      setEditingGoals(defaultGoals);
    }
  }, [monthlyGoals]);

  const handleGoalChange = (month: number, value: number) => {
    setEditingGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.month === month 
          ? { ...goal, targetValue: value }
          : goal
      )
    );
  };

  const formatCurrencyLocal = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSaveGoals = async () => {
    try {
      setLoading(true);
      console.log('🔄 Salvando metas mensais para', selectedDepartment, ':', editingGoals);
      
      // Usar o serviço direto para salvar
      await monthlyGoalsService.updateMonthlyGoals(editingGoals, selectedDepartment);
      
      // Atualizar o hook também
      await updateGoals(editingGoals);
      
      console.log('Metas salvas no Supabase:', editingGoals);
      alert('✅ Metas comerciais atualizadas com sucesso!');
      setActiveCard(null);
      
      // Forçar atualização de toda a aplicação
      window.dispatchEvent(new CustomEvent('monthlyGoalsUpdated', { 
        detail: { goals: editingGoals, year: selectedYear, department: selectedDepartment } 
      }));
      
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      alert('❌ Erro ao salvar metas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };


  const handleSaveCommissions = async () => {
    try {
      setLoading(true);
      await configurationService.updateCommissionTiers(commissionTiers);
      console.log('Comissões salvas no Supabase:', commissionTiers);
      alert('Configurações de comissão atualizadas com sucesso!');
      setActiveCard(null);
    } catch (error) {
      console.error('Erro ao salvar comissões:', error);
      alert('Erro ao salvar comissões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetrics = async () => {
    try {
      setLoading(true);
      await configurationService.updateWeeklyMetrics(weeklyMetrics);
      console.log('Métricas salvas no Supabase:', weeklyMetrics);
      alert('Métricas de performance atualizadas com sucesso!');
      setActiveCard(null);
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      alert('Erro ao salvar métricas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addCommissionTier = () => {
    const newTier: CommissionTier = {
      id: Date.now().toString(),
      percentage: 0.5,
      minValue: 0,
      maxValue: 100000,
      label: '0 - 100k'
    };
    setCommissionTiers([...commissionTiers, newTier]);
  };

  const removeCommissionTier = (id: string) => {
    setCommissionTiers(commissionTiers.filter(tier => tier.id !== id));
  };

  const addWeeklyMetric = () => {
    const newMetric: WeeklyMetric = {
      id: Date.now().toString(),
      name: 'Nova Métrica',
      points: 1,
      role: 'Both'
    };
    setWeeklyMetrics([...weeklyMetrics, newMetric]);
  };

  const removeWeeklyMetric = (id: string) => {
    setWeeklyMetrics(weeklyMetrics.filter(metric => metric.id !== id));
  };

  const renderGoalsCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurar Metas Comerciais</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Metas Mensais - {selectedDepartment} {selectedYear}</h3>
            <p className="text-gray-600">Configure o valor de contratos que deve ser fechado em cada mês para o {selectedDepartment}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {editingGoals.map((goal) => (
              <div key={goal.month} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {goal.monthName}
                </label>
                <input
                  type="number"
                  value={goal.targetValue}
                  onChange={(e) => {
                    handleGoalChange(goal.month, Number(e.target.value) || 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="300000"
                  min="0"
                  step="1000"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrencyLocal(goal.targetValue)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Resumo Anual</h4>
            <div className="text-sm text-blue-800">
              <p>Departamento: {selectedDepartment}</p>
              <p>Total anual: {formatCurrencyLocal(editingGoals.reduce((sum, g) => sum + g.targetValue, 0))}</p>
              <p>Média mensal: {formatCurrencyLocal(editingGoals.reduce((sum, g) => sum + g.targetValue, 0) / 12)}</p>
              <p>Ano: {selectedYear}</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveGoals}
              disabled={loading || goalsLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading || goalsLoading ? 'Salvando...' : 'Salvar Metas'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommissionsCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurar Comissões</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Faixas de Comissão</h3>
            <p className="text-gray-600">Configure as porcentagens e faixas de valor para comissões</p>
          </div>

          <div className="space-y-4 mb-6">
            {commissionTiers.map((tier, index) => (
              <div key={tier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      % Comissão
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={tier.percentage}
                      onChange={(e) => {
                        const newTiers = commissionTiers.map(t => 
                          t.id === tier.id 
                            ? { ...t, percentage: Number(e.target.value) }
                            : t
                        );
                        setCommissionTiers(newTiers);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Faixa de Valor
                    </label>
                    <input
                      type="text"
                      value={tier.label}
                      onChange={(e) => {
                        const newTiers = commissionTiers.map(t => 
                          t.id === tier.id 
                            ? { ...t, label: e.target.value }
                            : t
                        );
                        setCommissionTiers(newTiers);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0 - 600k"
                    />
                  </div>

                  <div className="flex justify-end">
                    {commissionTiers.length > 1 && (
                      <button
                        onClick={() => removeCommissionTier(tier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addCommissionTier}
            className="w-full mb-6 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Faixa</span>
          </button>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveCommissions}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Comissões'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployeesCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Funcionários</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <EmployeeManagement />
        </div>
      </div>
    </div>
  );

  const renderUsersCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Usuários</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <UserManagement />
        </div>
      </div>
    </div>
  );

  const renderPerformanceCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurar Performance Semanal</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Métricas de Performance</h3>
            <p className="text-gray-600">Configure as métricas e seus pesos para avaliação semanal</p>
          </div>

          <div className="space-y-4 mb-6">
            {weeklyMetrics.map((metric) => (
              <div key={metric.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Métrica
                    </label>
                    <input
                      type="text"
                      value={metric.name}
                      onChange={(e) => {
                        const newMetrics = weeklyMetrics.map(m =>
                          m.id === metric.id
                            ? { ...m, name: e.target.value }
                            : m
                        );
                        setWeeklyMetrics(newMetrics);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pontos
                    </label>
                    <input
                      type="number"
                      value={metric.points}
                      onChange={(e) => {
                        const newMetrics = weeklyMetrics.map(m =>
                          m.id === metric.id
                            ? { ...m, points: Number(e.target.value) }
                            : m
                        );
                        setWeeklyMetrics(newMetrics);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Função
                    </label>
                    <select
                      value={metric.role}
                      onChange={(e) => {
                        const newMetrics = weeklyMetrics.map(m =>
                          m.id === metric.id
                            ? { ...m, role: e.target.value as 'Closer' | 'SDR' | 'Both' }
                            : m
                        );
                        setWeeklyMetrics(newMetrics);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Closer">Closer</option>
                      <option value="SDR">SDR</option>
                      <option value="Both">Ambos</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => removeWeeklyMetric(metric.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addWeeklyMetric}
            className="w-full mb-6 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Métrica</span>
          </button>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-green-900 mb-2">Resumo das Métricas</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <p><strong>Closers:</strong> {weeklyMetrics.filter(m => m.role === 'Closer' || m.role === 'Both').length} métricas</p>
                <p><strong>SDRs:</strong> {weeklyMetrics.filter(m => m.role === 'SDR' || m.role === 'Both').length} métricas</p>
              </div>
              <div>
                <p><strong>Total de pontos possíveis (Closer):</strong> {weeklyMetrics.filter(m => m.role === 'Closer' || m.role === 'Both').reduce((sum, m) => sum + m.points, 0)}</p>
                <p><strong>Total de pontos possíveis (SDR):</strong> {weeklyMetrics.filter(m => m.role === 'SDR' || m.role === 'Both').reduce((sum, m) => sum + m.points, 0)}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveMetrics}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Métricas'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperationalCostsCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Custos Operacionais</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <OperationalCosts />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600">
          {canEditSettings 
            ? 'Configure metas, comissões, funcionários e métricas de performance'
            : 'Visualize as configurações do sistema (modo somente leitura)'
          }
        </p>
      </div>

      {!canEditSettings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Modo Somente Leitura</h3>
              <p className="text-sm text-yellow-700">
                Para editar configurações, mude para o modo administrativo na barra lateral.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Botão 1 - Meta */}
        <button
          onClick={() => canEditSettings && setActiveCard('goals')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canEditSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Meta Comercial</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure as metas mensais de vendas' : 'Visualizar metas mensais'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 2 - Comissões */}
        <button
          onClick={() => canEditSettings && setActiveCard('commissions')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canEditSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Comissões</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure faixas e percentuais de comissão' : 'Visualizar configurações de comissão'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 3 - Funcionários */}
        <button
          onClick={() => canEditSettings && setActiveCard('employees')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canEditSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Funcionários</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Gerencie cadastro de funcionários' : 'Visualizar funcionários'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 4 - Performance Semanal */}
        <button
          onClick={() => canEditSettings && setActiveCard('performance')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canEditSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Semanal</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure métricas e pesos de avaliação' : 'Visualizar métricas de performance'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 5 - Gerenciar Usuários */}
        <button
          onClick={() => canEditSettings && setActiveCard('users')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canEditSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Controle de acesso e permissões do sistema' : 'Visualizar usuários do sistema'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 6 - Custos Operacionais */}
        <button
          onClick={() => canEditSettings && setActiveCard('costs')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canEditSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Custos Operacionais</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure custos mensais para KPIs financeiros' : 'Visualizar custos operacionais'}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p>• <strong>Versão:</strong> 1.0.0</p>
            <p>• <strong>Ano Fiscal:</strong> {selectedYear}</p>
            <p>• <strong>Banco de dados:</strong> Supabase</p>
            <p>• <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p>• <strong>Usuários ativos:</strong> Sistema sem autenticação</p>
            <p>• <strong>Modo:</strong> Produção</p>
            <p>• <strong>Backup:</strong> Automático</p>
          </div>
        </div>
      </div>

      {/* Modais */}
      {activeCard === 'goals' && canEditSettings && renderGoalsCard()}
      {activeCard === 'commissions' && canEditSettings && renderCommissionsCard()}
      {activeCard === 'employees' && canEditSettings && renderEmployeesCard()}
      {activeCard === 'users' && canEditSettings && renderUsersCard()}
      {activeCard === 'performance' && canEditSettings && renderPerformanceCard()}
      {activeCard === 'costs' && canEditSettings && renderOperationalCostsCard()}
    </div>
  );
};