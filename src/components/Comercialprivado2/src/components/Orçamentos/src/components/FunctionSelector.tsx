import { useState, useEffect } from 'react';
import { Plus, Shield, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FunctionConfig, ConfigFunction } from '../types';

interface FunctionSelectorProps {
  onAddFunction: (funcao: FunctionConfig) => void;
  serviceType?: 'facilities' | 'vigilancia';
  defaultCity?: string;
  defaultIssRate?: number;
  defaultVtValue?: number;
}

export const FunctionSelector = ({
  onAddFunction,
  serviceType = 'facilities',
  defaultCity = '',
  defaultIssRate = 0,
  defaultVtValue = 5.5
}: FunctionSelectorProps) => {
  const [functions, setFunctions] = useState<ConfigFunction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFunctions();
  }, [serviceType]);

  const loadFunctions = async () => {
    const { data, error } = await supabase
      .from('config_functions')
      .select('*')
      .eq('is_active', true)
      .eq('service_type', serviceType)
      .order('name');

    if (error) {
      console.error('Erro ao carregar funções:', error);
    } else {
      setFunctions(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    const select = document.getElementById('funcao_select') as HTMLSelectElement;
    const selectedIndex = parseInt(select.value);
    const selectedFunction = functions[selectedIndex];

    if (!selectedFunction) return;

    const novaFuncao: FunctionConfig = {
      id: Date.now().toString(),
      nome: selectedFunction.name,
      chaveSalario: selectedFunction.code,
      qtd: 1,
      salario: selectedFunction.base_salary,
      escala: 'S_SEXTA_44',
      horarioTipo: 'diurno',
      peric: serviceType === 'vigilancia' ? 30 : 0,
      insal: 0,
      grat: selectedFunction.default_bonus_percent || 0,
      notPerc: 20,
      horas: 0,
      horaNotAd: 14.2857,
      hasIntra: 'nao',
      intraPerc: 0,
      vtValue: defaultVtValue,
      city: defaultCity,
      issRate: defaultIssRate,
    };

    onAddFunction(novaFuncao);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
        <p className="text-center text-slate-600">Carregando funções...</p>
      </div>
    );
  }

  if (functions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
        <p className="text-center text-slate-600">
          Nenhuma função cadastrada. Adicione funções na aba de Configurações.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">Adicionar Função</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
          serviceType === 'vigilancia'
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {serviceType === 'vigilancia' ? (
            <>
              <Shield size={16} />
              <span>Vigilância</span>
            </>
          ) : (
            <>
              <Building2 size={16} />
              <span>Facilities</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-4">
        <select
          id="funcao_select"
          defaultValue={0}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {functions.map((funcao, idx) => (
            <option key={funcao.id} value={idx}>
              {funcao.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors shadow-md"
        >
          <Plus size={20} />
          Adicionar
        </button>
      </div>
    </div>
  );
};
