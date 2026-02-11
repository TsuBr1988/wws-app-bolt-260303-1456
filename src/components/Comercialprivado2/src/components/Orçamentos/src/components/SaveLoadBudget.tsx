import { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Budget, FunctionConfig } from '../types';

interface SaveLoadBudgetProps {
  currentBudget: {
    vtValue: number;
    issRate: number;
    city: string;
    functions: FunctionConfig[];
  };
  serviceType: 'facilities' | 'vigilancia';
  onLoadBudget: (budget: Budget) => void;
}

export const SaveLoadBudget = ({
  currentBudget,
  serviceType,
  onLoadBudget,
}: SaveLoadBudgetProps) => {
  const [budgetName, setBudgetName] = useState('');
  const [savedBudgets, setSavedBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<('facilities' | 'vigilancia')[]>(['facilities', 'vigilancia']);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar orçamentos:', error);
      return;
    }

    setSavedBudgets(data || []);
  };

  const handleSave = async () => {
    if (!budgetName.trim()) {
      alert('Por favor, insira um nome para o orçamento');
      return;
    }

    if (currentBudget.functions.length === 0) {
      alert('Adicione pelo menos uma função antes de salvar');
      return;
    }

    setIsLoading(true);

    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        name: budgetName,
        vt_value: currentBudget.vtValue,
        iss_rate: currentBudget.issRate,
        city: currentBudget.city,
        service_type: serviceType,
      })
      .select()
      .maybeSingle();

    if (budgetError || !budgetData) {
      console.error('Erro ao salvar orçamento:', budgetError);
      alert('Erro ao salvar orçamento');
      setIsLoading(false);
      return;
    }

    const functionsToInsert = currentBudget.functions.map((f) => ({
      budget_id: budgetData.id,
      function_name: f.nome,
      quantity: f.qtd,
      salary: f.salario,
      scale: f.escala,
      shift_type: f.horarioTipo,
      periculosity_percent: f.peric,
      unhealthiness_percent: f.insal,
      bonus_percent: f.grat,
      night_additional_percent: f.notPerc,
      hours_per_day: f.horas,
      reduced_hour_percent: f.horaNotAd,
      has_intrajornada: f.hasIntra === 'sim',
      intrajornada_percent: f.intraPerc,
      vt_value: f.vtValue,
      city: f.city,
      iss_rate: f.issRate,
    }));

    const { error: functionsError } = await supabase
      .from('budget_functions')
      .insert(functionsToInsert);

    if (functionsError) {
      console.error('Erro ao salvar funções:', functionsError);
      alert('Erro ao salvar funções do orçamento');
      setIsLoading(false);
      return;
    }

    alert('Orçamento salvo com sucesso!');
    setBudgetName('');
    loadBudgets();
    setIsLoading(false);
  };

  const handleLoad = async (budgetId: string) => {
    setIsLoading(true);

    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .maybeSingle();

    if (budgetError || !budgetData) {
      console.error('Erro ao carregar orçamento:', budgetError);
      alert('Erro ao carregar orçamento');
      setIsLoading(false);
      return;
    }

    const { data: functionsData, error: functionsError } = await supabase
      .from('budget_functions')
      .select('*')
      .eq('budget_id', budgetId);

    if (functionsError) {
      console.error('Erro ao carregar funções:', functionsError);
      alert('Erro ao carregar funções do orçamento');
      setIsLoading(false);
      return;
    }

    const functions: FunctionConfig[] = (functionsData || []).map((f) => ({
      id: f.id,
      nome: f.function_name,
      chaveSalario: '',
      qtd: f.quantity,
      salario: parseFloat(f.salary),
      escala: f.scale,
      horarioTipo: f.shift_type as 'diurno' | 'noturno',
      peric: parseFloat(f.periculosity_percent || 0),
      insal: parseFloat(f.unhealthiness_percent || 0),
      grat: parseFloat(f.bonus_percent || 0),
      notPerc: parseFloat(f.night_additional_percent || 20),
      horas: parseFloat(f.hours_per_day || 0),
      horaNotAd: parseFloat(f.reduced_hour_percent || 14.2857),
      hasIntra: f.has_intrajornada ? 'sim' : 'nao',
      intraPerc: parseFloat(f.intrajornada_percent || 0),
      vtValue: parseFloat(f.vt_value || 5.5),
      city: f.city || '',
      issRate: parseFloat(f.iss_rate || 0),
    }));

    onLoadBudget({
      id: budgetData.id,
      name: budgetData.name,
      vt_value: parseFloat(budgetData.vt_value),
      iss_rate: parseFloat(budgetData.iss_rate),
      city: budgetData.city,
      service_type: budgetData.service_type as 'facilities' | 'vigilancia',
      functions,
      created_at: budgetData.created_at,
      updated_at: budgetData.updated_at,
    });

    setIsLoading(false);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) {
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);

    if (error) {
      console.error('Erro ao excluir orçamento:', error);
      alert('Erro ao excluir orçamento');
      setIsLoading(false);
      return;
    }

    alert('Orçamento excluído com sucesso!');
    loadBudgets();
    setIsLoading(false);
  };

  const toggleServiceFilter = (type: 'facilities' | 'vigilancia') => {
    setServiceFilter((prev) => {
      if (prev.includes(type)) {
        const newFilter = prev.filter((t) => t !== type);
        return newFilter.length === 0 ? [type] : newFilter;
      } else {
        return [...prev, type];
      }
    });
  };

  const filteredBudgets = savedBudgets.filter((budget) =>
    serviceFilter.includes(budget.service_type || 'facilities')
  );

  const facilitiesTotal = savedBudgets
    .filter((b) => (b.service_type || 'facilities') === 'facilities')
    .reduce((acc, b) => acc + (b.functions?.length || 0), 0);

  const vigilanciaTotal = savedBudgets
    .filter((b) => b.service_type === 'vigilancia')
    .reduce((acc, b) => acc + (b.functions?.length || 0), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Salvar/Carregar Orçamento
      </h3>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={budgetName}
          onChange={(e) => setBudgetName(e.target.value)}
          placeholder="Nome do orçamento"
          className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors shadow-md disabled:bg-slate-400"
        >
          <Save size={20} />
          Salvar
        </button>
      </div>

      {savedBudgets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-700">
              Orçamentos Salvos
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => toggleServiceFilter('facilities')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  serviceFilter.includes('facilities')
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Facilities ({facilitiesTotal})
              </button>
              <button
                onClick={() => toggleServiceFilter('vigilancia')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  serviceFilter.includes('vigilancia')
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Vigilância ({vigilanciaTotal})
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredBudgets.map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">{budget.name}</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        (budget.service_type || 'facilities') === 'facilities'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {(budget.service_type || 'facilities') === 'facilities'
                        ? 'Facilities'
                        : 'Vigilância'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {new Date(budget.created_at!).toLocaleDateString('pt-BR')} • {budget.functions?.length || 0} postos
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoad(budget.id!)}
                    disabled={isLoading}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:text-slate-400"
                  >
                    <FolderOpen size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id!)}
                    disabled={isLoading}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:text-slate-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
