import { useState, useEffect } from 'react';
import { NewBudgetTab } from './components/tabs/NewBudgetTab';
import { BudgetOverviewTab } from './components/tabs/BudgetOverviewTab';
import { MaterialsTab } from './components/tabs/MaterialsTab';
import { CapexTab } from './components/tabs/CapexTab';
import { EquipmentsTab } from './components/tabs/EquipmentsTab';
import { UniformsTab } from './components/tabs/UniformsTab';
import { OthersTab } from './components/tabs/OthersTab';
import { DifferentiatedBenefitsTab } from './components/tabs/DifferentiatedBenefitsTab';
import { PositionBudgetTab } from './components/tabs/PositionBudgetTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { FunctionConfig, TabType } from './types';
import { getMinimumWage } from './services/systemConfigService';
import { supabase } from './lib/supabase';

interface AppProps {
  onGenerateProposal?: (budgetData: { id: string; clientName: string; monthlyValue: number; months: number }) => void;
  reloadTrigger?: number;
  supabaseClient?: any;
}

function App({ onGenerateProposal, reloadTrigger, supabaseClient }: AppProps = {}) {
  const [activeTab, setActiveTab] = useState<TabType>('novo');
  const [activeBudget, setActiveBudget] = useState<{
    id: string;
    budget_number: string;
    client_name: string;
    description: string;
    address?: string;
    city_name?: string;
  } | null>(null);

  const [vtValue, setVtValue] = useState(5.5);
  const [issRate, setIssRate] = useState(3.0);
  const [city, setCity] = useState('AMERICANA - 3,0%');
  const [funcoes, setFuncoes] = useState<FunctionConfig[]>([]);
  const [minimumWage, setMinimumWage] = useState(1621.00);

  useEffect(() => {
    loadMinimumWage();
  }, []);

  const loadMinimumWage = async () => {
    const wage = await getMinimumWage();
    setMinimumWage(wage);
  };

  const handleBudgetCreated = async (
    budgetId: string,
    budgetNumber: string,
    clientName: string,
    description: string
  ) => {
    // Buscar dados completos do orçamento incluindo address e city_name
    const { data } = await supabase
      .from('budgets')
      .select('address, city_name')
      .eq('id', budgetId)
      .maybeSingle();

    setActiveBudget({
      id: budgetId,
      budget_number: budgetNumber,
      client_name: clientName,
      description,
      address: data?.address || undefined,
      city_name: data?.city_name || undefined,
    });
    setActiveTab('geral');
  };

  const handleBudgetUpdated = async (
    budgetId: string,
    budgetNumber: string,
    clientName: string,
    description: string
  ) => {
    // Buscar dados completos do orçamento incluindo address e city_name
    const { data } = await supabase
      .from('budgets')
      .select('address, city_name')
      .eq('id', budgetId)
      .maybeSingle();

    setActiveBudget({
      id: budgetId,
      budget_number: budgetNumber,
      client_name: clientName,
      description,
      address: data?.address || undefined,
      city_name: data?.city_name || undefined,
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'novo':
        return (
          <NewBudgetTab
            activeBudget={activeBudget}
            onBudgetCreated={handleBudgetCreated}
            onBudgetUpdated={handleBudgetUpdated}
            onGenerateProposal={onGenerateProposal}
            reloadTrigger={reloadTrigger}
            supabaseClient={supabaseClient}
          />
        );
      case 'geral':
        return (
          <BudgetOverviewTab
            vtValue={vtValue}
            setVtValue={setVtValue}
            issRate={issRate}
            setIssRate={setIssRate}
            city={city}
            setCity={setCity}
            funcoes={funcoes}
            setFuncoes={setFuncoes}
            activeBudget={activeBudget}
            activeTab={activeTab}
            minimumWage={minimumWage}
            setMinimumWage={setMinimumWage}
          />
        );
      case 'materiais':
        return <MaterialsTab activeBudget={activeBudget} />;
      case 'capex':
        return <CapexTab activeBudget={activeBudget} />;
      case 'equipamentos':
        return <EquipmentsTab activeBudget={activeBudget} />;
      case 'uniformes':
        return <UniformsTab activeBudget={activeBudget} />;
      case 'outros':
        return <OthersTab activeBudget={activeBudget} />;
      case 'beneficios-diferenciados':
        return <DifferentiatedBenefitsTab activeBudget={activeBudget} />;
      case 'posto':
        return (
          <PositionBudgetTab
            vtValue={vtValue}
            issRate={issRate}
            funcoes={funcoes}
            activeBudget={activeBudget}
            activeTab={activeTab}
            minimumWage={minimumWage}
          />
        );
      case 'configuracoes':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  const tabs: { id: TabType; label: string; disabled?: boolean }[] = [
    { id: 'novo', label: 'Novo Orçamento' },
    { id: 'geral', label: 'Orçamento Geral', disabled: !activeBudget },
    { id: 'materiais', label: 'Materiais de consumo', disabled: !activeBudget },
    { id: 'capex', label: 'Capex', disabled: !activeBudget },
    { id: 'equipamentos', label: 'Equipamentos', disabled: !activeBudget },
    { id: 'uniformes', label: 'Uniformes', disabled: !activeBudget },
    { id: 'outros', label: 'Outros', disabled: !activeBudget },
    { id: 'beneficios-diferenciados', label: 'Benefícios Diferenciados', disabled: !activeBudget },
    { id: 'posto', label: 'Orçamento por Posto', disabled: !activeBudget },
    { id: 'configuracoes', label: 'Configurações' },
  ];

  return (
    <div className="w-full h-full">
      {activeBudget && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Orçamento Ativo:</span>{' '}
            {activeBudget.budget_number} - {activeBudget.client_name}
          </p>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : tab.disabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="w-full">{renderTabContent()}</div>
    </div>
  );
}

export default App;
