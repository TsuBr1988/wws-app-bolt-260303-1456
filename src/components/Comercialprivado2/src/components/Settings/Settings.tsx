import React, { useState } from 'react';
import { Settings as SettingsIcon, Target, DollarSign, Calendar, Users, ClipboardList } from 'lucide-react';
import { EmployeeManagement } from '../Employees/EmployeeManagement';
import { UserManagement } from '../UserManagement/UserManagement';
import { MonthlyGoalsCard } from './MonthlyGoalsCard';
import { OperationalCostsCard } from './OperationalCostsCard';
import { BudgetParametersCard } from './BudgetParametersCard';
import { useSystemVersion } from '../../contexts/SystemVersionContext';

type SettingsTab = 'goals' | 'costs' | 'employees' | 'users' | 'budget-params';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('goals');
  const { canEdit } = useSystemVersion();
  
  const tabs = [
    { id: 'goals', label: 'Metas Mensais', icon: Target, color: 'blue' },
    { id: 'costs', label: 'Custos Operacionais', icon: DollarSign, color: 'green' },
    { id: 'budget-params', label: 'Parâmetros para Orçamentos', icon: ClipboardList, color: 'purple' },
    { id: 'employees', label: 'Funcionários', icon: Users, color: 'indigo' },
    { id: 'users', label: 'Usuários', icon: SettingsIcon, color: 'gray' }
  ];

  const getTabColor = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
      green: isActive ? 'bg-green-50 text-green-600 border-green-200' : 'text-gray-600 hover:text-green-600 hover:bg-green-50',
      purple: isActive ? 'bg-purple-50 text-purple-600 border-purple-200' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50',
      indigo: isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50',
      gray: isActive ? 'bg-gray-50 text-gray-600 border-gray-200' : 'text-gray-600 hover:text-gray-600 hover:bg-gray-50'
    };
    return colorMap[color] || colorMap.gray;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'goals':
        return <MonthlyGoalsCard />;
      case 'costs':
        return <OperationalCostsCard />;
      case 'budget-params':
        return <BudgetParametersCard />;
      case 'employees':
        return <EmployeeManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return <MonthlyGoalsCard />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">
          {canEdit('settings') 
            ? 'Gerencie configurações do sistema, metas, custos e funcionários'
            : 'Visualize as configurações do sistema (modo somente leitura)'
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-current'
                      : 'border-transparent hover:border-gray-300'
                  } ${getTabColor(tab.color, isActive)}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Configurações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800 text-sm">
          <div>
            <p>• <strong>Metas Mensais:</strong> Configure objetivos por mês para cálculo de CAC/ROI</p>
            <p>• <strong>Custos Operacionais:</strong> Defina custos para cálculos de KPIs financeiros</p>
            <p>• <strong>Parâmetros de Orçamento:</strong> Cargos, escalas e configurações para orçamentos</p>
          </div>
          <div>
            <p>• <strong>Funcionários:</strong> Gerencie SDRs, Closers e dados de performance</p>
            <p>• <strong>Usuários:</strong> Controle de acesso e permissões do sistema</p>
            <p>• <strong>Sincronização:</strong> Todas as configurações são aplicadas em tempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
};