import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { updateMinimumWage } from '../services/systemConfigService';

interface City {
  id: string;
  name: string;
  iss_rate: number;
}

interface GlobalSettingsProps {
  vtValue: number;
  setVtValue: (value: number) => void;
  issRate: number;
  setIssRate: (value: number) => void;
  city: string;
  setCity: (value: string) => void;
  minimumWage: number;
  setMinimumWage: (value: number) => void;
}

export const GlobalSettings = ({
  vtValue,
  setVtValue,
  issRate,
  setIssRate,
  city,
  setCity,
  minimumWage,
  setMinimumWage,
}: GlobalSettingsProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao carregar cidades:', error);
      return;
    }

    setCities(data || []);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = cities.find(c => c.id === e.target.value);
    if (selectedCity) {
      setCity(`${selectedCity.name} - ${selectedCity.iss_rate.toFixed(1)}%`);
      setIssRate(selectedCity.iss_rate);
    }
  };

  const handleMinimumWageBlur = async () => {
    setIsSaving(true);
    const result = await updateMinimumWage(minimumWage);
    setIsSaving(false);

    if (result.success) {
      console.log('Salário mínimo atualizado com sucesso');
    } else {
      console.error('Erro ao atualizar salário mínimo:', result.error);
      alert('Erro ao salvar salário mínimo. Tente novamente.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg shadow-md border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Configurações Globais
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Salário Mínimo Nacional
          </label>
          <input
            type="number"
            step="0.01"
            value={minimumWage}
            onChange={(e) => setMinimumWage(parseFloat(e.target.value))}
            onBlur={handleMinimumWageBlur}
            disabled={isSaving}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
            placeholder="R$ 1.621,00"
          />
          <p className="text-xs text-slate-500 mt-1">
            Base para cálculo de insalubridade
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Valor VT (Unitário)
          </label>
          <input
            type="number"
            step="0.05"
            value={vtValue}
            onChange={(e) => setVtValue(parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Cidade (ISSQN)
          </label>
          <select
            onChange={handleCityChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {cities.length === 0 ? (
              <option value="">Nenhuma cidade cadastrada</option>
            ) : (
              cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} - {city.iss_rate.toFixed(1)}%
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
};
