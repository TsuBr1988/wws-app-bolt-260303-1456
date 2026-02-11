import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { FunctionsManager } from './settings/FunctionsManager';
import { BenefitsManager } from './settings/BenefitsManager';
import { CityManager } from './settings/CityManager';
import { EncargosManager } from './settings/EncargosManager';
import { ItemsConfigManager } from './settings/ItemsConfigManager';
import { GlobalSettings } from '../GlobalSettings';
import { getMinimumWage } from '../../services/systemConfigService';

export const SettingsTab = () => {
  const [vtValue, setVtValue] = useState(5.5);
  const [issRate, setIssRate] = useState(3.0);
  const [city, setCity] = useState('');
  const [minimumWage, setMinimumWage] = useState(1621.00);

  useEffect(() => {
    loadMinimumWage();
  }, []);

  const loadMinimumWage = async () => {
    const wage = await getMinimumWage();
    setMinimumWage(wage);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={32} className="text-slate-700" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
            <p className="text-slate-600 text-sm">
              Gerencie as funções, benefícios, cidades, equipamentos, uniformes, capex e materiais que serão utilizados nos orçamentos
            </p>
          </div>
        </div>
      </div>

      <GlobalSettings
        vtValue={vtValue}
        setVtValue={setVtValue}
        issRate={issRate}
        setIssRate={setIssRate}
        city={city}
        setCity={setCity}
        minimumWage={minimumWage}
        setMinimumWage={setMinimumWage}
      />

      <CityManager />

      <EncargosManager />

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <FunctionsManager />
      </div>

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <BenefitsManager />
      </div>

      <ItemsConfigManager />
    </div>
  );
};
