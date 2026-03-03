import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Info, ChevronDown, ChevronUp, Calculator, Code, AlertTriangle, Building2, Shield } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ConfigBenefit } from '../../../types';

// Função utilitária para formatar a exibição do cálculo
const getCalculationDisplay = (benefit: ConfigBenefit) => {
  const type = benefit.calculation_type;
  const formula = benefit.formula?.trim() || '';

  // Se for tipo fórmula e tiver fórmula customizada
  if (type === 'formula' && formula) {
    return {
      text: formula,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: Code,
      tooltip: 'Fórmula customizada',
      isCustom: true,
    };
  }

  // Para VT (per_day com código VT)
  if (type === 'per_day' && benefit.code === 'VT') {
    return {
      text: 'VT unitário × 2 × Dias × Qtd',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      icon: Calculator,
      tooltip: 'Cálculo automático: Valor do VT unitário × 2 viagens × Dias trabalhados × Quantidade',
      isCustom: false,
    };
  }

  // Para VR (per_day com código VR)
  if (type === 'per_day' && benefit.code === 'VR') {
    return {
      text: 'Valor × Dias VR × Qtd',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      icon: Calculator,
      tooltip: 'Cálculo automático: Valor × Dias de VR da escala × Quantidade',
      isCustom: false,
    };
  }

  // Para outros per_day
  if (type === 'per_day') {
    return {
      text: 'Valor × Dias × Qtd',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      icon: Calculator,
      tooltip: 'Cálculo automático: Valor × Dias trabalhados × Quantidade',
      isCustom: false,
    };
  }

  // Para fixed e per_month
  return {
    text: 'Valor × Qtd',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    icon: Calculator,
    tooltip: 'Cálculo automático: Valor unitário × Quantidade de funcionários',
    isCustom: false,
  };
};

// Função para detectar valores hardcoded na fórmula
const detectHardcodedValues = (formula: string): string[] => {
  const warnings: string[] = [];

  // Detecta números que não são parte de variáveis
  const numberPattern = /(?<![a-zA-Z])\d+\.?\d*/g;
  const numbers = formula.match(numberPattern);

  if (numbers && numbers.length > 0) {
    const uniqueNumbers = [...new Set(numbers)].filter(n => n !== '0' && n !== '1');
    if (uniqueNumbers.length > 0) {
      warnings.push(`Valores fixos detectados: ${uniqueNumbers.join(', ')}. Considere usar a variável "v" (valor) ou "vtU" se for valor unitário.`);
    }
  }

  return warnings;
};

// Função para obter placeholder dinâmico
const getFormulaPlaceholder = (calculationType: string, code: string): string => {
  if (calculationType !== 'formula') {
    return 'Cálculo automático';
  }

  if (code === 'VT') {
    return 'Ex: vtU * 2 * diasU * q';
  }

  return 'Ex: v * q ou s * 0.06';
};

export const BenefitsManager = () => {
  const [benefits, setBenefits] = useState<ConfigBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formulaWarnings, setFormulaWarnings] = useState<string[]>([]);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 'facilities' | 'vigilancia'>('all');
  const [formData, setFormData] = useState<ConfigBenefit>({
    code: '',
    name: '',
    calculation_type: 'fixed',
    base_value: 0,
    service_type: 'facilities',
    formula: '',
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    loadBenefits();
  }, []);

  // Detectar warnings quando a fórmula mudar
  useEffect(() => {
    if (formData.calculation_type === 'formula' && formData.formula) {
      const warnings = detectHardcodedValues(formData.formula);
      setFormulaWarnings(warnings);
    } else {
      setFormulaWarnings([]);
    }
  }, [formData.formula, formData.calculation_type]);

  // Limpar fórmula quando mudar de tipo "formula" para outro
  const handleCalculationTypeChange = (newType: ConfigBenefit['calculation_type']) => {
    if (formData.calculation_type === 'formula' && newType !== 'formula') {
      setFormData({
        ...formData,
        calculation_type: newType,
        formula: '',
      });
    } else {
      setFormData({
        ...formData,
        calculation_type: newType,
      });
    }
  };

  const loadBenefits = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('config_benefits')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Erro ao carregar benefícios:', error);
    } else {
      setBenefits(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormulaWarnings([]);
    const maxOrder = benefits.length > 0 ? Math.max(...benefits.map((b) => b.order_index || 0)) : 0;
    setFormData({
      code: '',
      name: '',
      calculation_type: 'fixed',
      base_value: 0,
      service_type: 'facilities',
      formula: '',
      is_active: true,
      order_index: maxOrder + 1,
    });
  };

  const handleEdit = (benefit: ConfigBenefit) => {
    setEditingId(benefit.id!);
    setFormData({
      ...benefit,
      base_value: Number.isFinite(Number(benefit.base_value)) ? Number(benefit.base_value) : 0,
      order_index: benefit.order_index ?? 0,
      formula: benefit.formula ?? '',
      is_active: benefit.is_active ?? true,
    });
    setFormulaWarnings([]);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.service_type) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar que fórmula está preenchida se o tipo for "formula"
    if (formData.calculation_type === 'formula' && !formData.formula?.trim()) {
      alert('Para o tipo "Fórmula", é necessário preencher o campo Cálculo com uma fórmula válida.\nEx: v * q ou vtU * 2 * diasU * q');
      return;
    }

    // Limpar fórmula se o tipo não for "formula"
    const dataToSave = {
      ...formData,
      formula: formData.calculation_type === 'formula' ? formData.formula : '',
    };

    const baseValueToSave = (() => {
      const n = Number(dataToSave.base_value ?? 0);
      return Number.isFinite(n) ? n : 0;
    })();

    if (isAdding) {
      const { error } = await supabase.from('config_benefits').insert({
        code: dataToSave.code.toUpperCase(),
        name: dataToSave.name,
        calculation_type: dataToSave.calculation_type,
        base_value: baseValueToSave,
        service_type: dataToSave.service_type,
        formula: dataToSave.formula,
        is_active: dataToSave.is_active,
        order_index: dataToSave.order_index,
      });

      if (error) {
        console.error('Erro ao adicionar benefício:', error);
        alert('Erro ao adicionar benefício. Verifique se o código já existe.');
        return;
      }
    } else if (editingId) {
      const { error } = await supabase
        .from('config_benefits')
        .update({
          name: dataToSave.name,
          calculation_type: dataToSave.calculation_type,
          base_value: baseValueToSave,
          formula: dataToSave.formula,
          is_active: dataToSave.is_active,
          order_index: dataToSave.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        console.error('Erro ao atualizar benefício:', error);
        alert('Erro ao atualizar benefício');
        return;
      }
    }

    setIsAdding(false);
    setEditingId(null);
    loadBenefits();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este benefício?')) {
      return;
    }

    const { error } = await supabase.from('config_benefits').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir benefício:', error);
      alert('Erro ao excluir benefício');
      return;
    }

    loadBenefits();
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  // Filtrar benefícios por tipo de serviço
  const filteredBenefits = benefits.filter((benefit) => {
    if (serviceTypeFilter === 'all') return true;
    return benefit.service_type === serviceTypeFilter;
  });

  // Contar benefícios por tipo
  const facilitiesCount = benefits.filter((b) => b.service_type === 'facilities').length;
  const vigilanciaCount = benefits.filter((b) => b.service_type === 'vigilancia').length;

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">Benefícios</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAdd}
            disabled={isAdding || editingId !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors shadow-md disabled:bg-slate-400"
          >
            <Plus size={20} />
            Novo Benefício
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-600 hover:text-slate-800 transition-colors p-1"
            title={isExpanded ? 'Recolher' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2 mb-4">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Sobre a coluna "Cálculo":</p>
              <p className="mb-3">
                Para tipos <strong>Fixo</strong>, <strong>Por Dia</strong> e <strong>Por Mês</strong>, o cálculo é automático e mostrado em cinza.
                Somente o tipo <strong>Fórmula</strong> permite criar cálculos customizados, mostrados em azul.
              </p>
              <p className="font-semibold mb-1">Variáveis disponíveis para tipo "Fórmula":</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="bg-blue-100 px-1 rounded">v</code> ou <code className="bg-blue-100 px-1 rounded">valor</code> - Valor base do benefício (coluna Valor)</li>
                <li><code className="bg-blue-100 px-1 rounded">vtU</code> - Valor do Vale Transporte unitário</li>
                <li><code className="bg-blue-100 px-1 rounded">diasU</code> - Dias trabalhados da escala</li>
                <li><code className="bg-blue-100 px-1 rounded">q</code> - Quantidade de funcionários</li>
                <li><code className="bg-blue-100 px-1 rounded">vtDays</code> - Dias de VT por escala</li>
                <li><code className="bg-blue-100 px-1 rounded">vrDays</code> - Dias de VR por escala</li>
                <li><code className="bg-blue-100 px-1 rounded">s</code> ou <code className="bg-blue-100 px-1 rounded">salario</code> - Salário base do funcionário</li>
              </ul>
            </div>
          </div>

          {/* Filtro por Tipo de Serviço */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Filtrar por:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setServiceTypeFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  serviceTypeFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos ({benefits.length})
              </button>
              <button
                onClick={() => setServiceTypeFilter('facilities')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  serviceTypeFilter === 'facilities'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <Building2 size={14} />
                Facilities ({facilitiesCount})
              </button>
              <button
                onClick={() => setServiceTypeFilter('vigilancia')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  serviceTypeFilter === 'vigilancia'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                <Shield size={14} />
                Vigilância ({vigilanciaCount})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-md text-sm">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-3 py-2 text-left w-20">Ordem</th>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-center">Serviço</th>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-left min-w-[200px]">Cálculo</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="bg-green-50 border-b border-slate-200">
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData({ ...formData, order_index: parseInt(e.target.value) })
                    }
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="VT"
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={formData.service_type}
                    onChange={(e) =>
                      setFormData({ ...formData, service_type: e.target.value as 'facilities' | 'vigilancia' })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  >
                    <option value="facilities">Facilities</option>
                    <option value="vigilancia">Vigilância</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome"
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={formData.calculation_type}
                    onChange={(e) =>
                      handleCalculationTypeChange(e.target.value as ConfigBenefit['calculation_type'])
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  >
                    <option value="fixed">Fixo</option>
                    <option value="per_day">Por Dia</option>
                    <option value="per_month">Por Mês</option>
                    <option value="formula">Fórmula</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={Number.isFinite(Number(formData.base_value)) ? Number(formData.base_value) : 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_value: Number.isFinite(parseFloat(e.target.value)) ? parseFloat(e.target.value) : 0,
                      })
                    }
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={formData.formula || ''}
                      onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                      placeholder={getFormulaPlaceholder(formData.calculation_type, formData.code)}
                      disabled={formData.calculation_type !== 'formula'}
                      className={`w-full px-2 py-1 border border-slate-300 rounded text-xs ${
                        formData.calculation_type === 'formula' ? 'font-mono bg-white' : 'bg-slate-100 text-slate-500'
                      } disabled:cursor-not-allowed`}
                    />
                    {formulaWarnings.length > 0 && (
                      <div className="flex items-start gap-1 text-xs text-amber-700 bg-amber-50 p-1 rounded border border-amber-200">
                        <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                        <span>{formulaWarnings[0]}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value === 'true' })
                    }
                    className="px-2 py-1 border border-slate-300 rounded text-xs"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={handleSave}
                      className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {filteredBenefits.length === 0 && !isAdding && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  Nenhum benefício encontrado para este filtro.
                </td>
              </tr>
            )}

            {filteredBenefits.map((benefit) => (
              <tr
                key={benefit.id}
                className={`border-b border-slate-200 hover:bg-slate-50 ${
                  editingId === benefit.id ? 'bg-blue-50' : ''
                }`}
              >
                {editingId === benefit.id ? (
                  <>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={formData.order_index}
                        onChange={(e) =>
                          setFormData({ ...formData, order_index: parseInt(e.target.value) })
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-mono text-xs">
                      {benefit.code}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          benefit.service_type === 'facilities'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {benefit.service_type === 'facilities' ? (
                          <Building2 size={12} />
                        ) : (
                          <Shield size={12} />
                        )}
                        {benefit.service_type === 'facilities' ? 'Facilities' : 'Vigilância'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={formData.calculation_type}
                        onChange={(e) =>
                          handleCalculationTypeChange(e.target.value as ConfigBenefit['calculation_type'])
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      >
                        <option value="fixed">Fixo</option>
                        <option value="per_day">Por Dia</option>
                        <option value="per_month">Por Mês</option>
                        <option value="formula">Fórmula</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={Number.isFinite(Number(formData.base_value)) ? Number(formData.base_value) : 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            base_value: Number.isFinite(parseFloat(e.target.value)) ? parseFloat(e.target.value) : 0,
                          })
                        }
                        className="w-24 px-2 py-1 border border-slate-300 rounded text-right text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={formData.formula || ''}
                          onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                          placeholder={getFormulaPlaceholder(formData.calculation_type, formData.code)}
                          disabled={formData.calculation_type !== 'formula'}
                          className={`w-full px-2 py-1 border border-slate-300 rounded text-xs ${
                            formData.calculation_type === 'formula' ? 'font-mono bg-white' : 'bg-slate-100 text-slate-500'
                          } disabled:cursor-not-allowed`}
                        />
                        {formulaWarnings.length > 0 && (
                          <div className="flex items-start gap-1 text-xs text-amber-700 bg-amber-50 p-1 rounded border border-amber-200">
                            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                            <span>{formulaWarnings[0]}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={formData.is_active ? 'true' : 'false'}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.value === 'true' })
                        }
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={handleSave}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {benefit.order_index}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">
                      {benefit.code}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          benefit.service_type === 'facilities'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {benefit.service_type === 'facilities' ? (
                          <Building2 size={12} />
                        ) : (
                          <Shield size={12} />
                        )}
                        {benefit.service_type === 'facilities' ? 'Facilities' : 'Vigilância'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{benefit.name}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {benefit.calculation_type === 'fixed' && 'Fixo'}
                      {benefit.calculation_type === 'per_day' && 'Por Dia'}
                      {benefit.calculation_type === 'per_month' && 'Por Mês'}
                      {benefit.calculation_type === 'formula' && 'Fórmula'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(benefit.base_value ?? 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {(() => {
                        const calc = getCalculationDisplay(benefit);
                        const Icon = calc.icon;
                        return (
                          <div
                            className={`flex items-center gap-2 ${calc.bgColor} px-2 py-1 rounded`}
                            title={calc.tooltip}
                          >
                            <Icon size={14} className={calc.color} />
                            <span
                              className={`text-xs ${calc.color} ${
                                calc.isCustom ? 'font-mono' : 'font-normal'
                              }`}
                            >
                              {calc.text}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          benefit.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {benefit.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(benefit)}
                          disabled={isAdding || editingId !== null}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:text-slate-400"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(benefit.id!)}
                          disabled={isAdding || editingId !== null}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:text-slate-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </>
      )}
    </div>
  );
};
