import { X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UniformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (uniform: UniformData) => void;
  uniform?: UniformData;
}

export interface UniformData {
  id?: string;
  name: string;
  brand: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  amortization: number;
  monthly_value: number;
}

interface ConfigUniform {
  id: string;
  name: string;
  brand: string;
  default_quantity: number;
  default_amortization: number;
  unit_value: number;
}

export const UniformModal = ({ isOpen, onClose, onSave, uniform }: UniformModalProps) => {
  const [configUniforms, setConfigUniforms] = useState<ConfigUniform[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [formData, setFormData] = useState<UniformData>({
    name: '',
    brand: '',
    quantity: 1,
    unit_value: 0,
    total_value: 0,
    amortization: 12,
    monthly_value: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadConfigUniforms();
    }
  }, [isOpen]);

  useEffect(() => {
    if (uniform) {
      setFormData(uniform);
      setSelectedConfigId('');
    } else {
      setFormData({
        name: '',
        brand: '',
        quantity: 1,
        unit_value: 0,
        total_value: 0,
        amortization: 12,
        monthly_value: 0,
      });
      setSelectedConfigId('');
    }
  }, [uniform, isOpen]);

  const loadConfigUniforms = async () => {
    const { data, error } = await supabase
      .from('config_uniforms')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Erro ao carregar uniformes padrão:', error);
    } else {
      setConfigUniforms(data || []);
    }
  };

  const handleSelectConfigUniform = (configId: string) => {
    setSelectedConfigId(configId);

    if (!configId) {
      setFormData({
        name: '',
        brand: '',
        quantity: 1,
        unit_value: 0,
        total_value: 0,
        amortization: 12,
        monthly_value: 0,
      });
      return;
    }

    const config = configUniforms.find(u => u.id === configId);
    if (config) {
      setFormData({
        name: config.name,
        brand: config.brand || '',
        quantity: config.default_quantity,
        unit_value: config.unit_value,
        total_value: config.default_quantity * config.unit_value,
        amortization: config.default_amortization,
        monthly_value: (config.default_quantity * config.unit_value) / config.default_amortization,
      });
    }
  };

  useEffect(() => {
    const total = formData.quantity * formData.unit_value;
    const monthly = formData.amortization > 0 ? total / formData.amortization : 0;

    setFormData(prev => ({
      ...prev,
      total_value: total,
      monthly_value: monthly,
    }));
  }, [formData.quantity, formData.unit_value, formData.amortization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do uniforme');
      return;
    }

    if (formData.quantity <= 0) {
      alert('A quantidade deve ser maior que zero');
      return;
    }

    if (formData.unit_value <= 0) {
      alert('O valor unitário deve ser maior que zero');
      return;
    }

    if (formData.amortization <= 0) {
      alert('A amortização deve ser maior que zero');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            {uniform ? 'Editar Uniforme' : 'Incluir Uniforme'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 text-sm mb-1">
                  Atenção: Valores por Funcionário Individual
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Cadastre a <strong>quantidade</strong> e o <strong>valor</strong> de uniformes para <strong>UM funcionário</strong>.
                  O sistema multiplicará automaticamente pelo número total de funcionários do posto (considerando a escala de trabalho).
                </p>
                <p className="text-xs text-amber-700 mt-2 italic">
                  Exemplo: Se cada funcionário recebe 2 calças, cadastre "Quantidade: 2". O sistema calculará para todos os funcionários do posto.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!uniform && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Uniformes Pré-Configurados
                    </label>
                    <select
                      value={selectedConfigId}
                      onChange={(e) => handleSelectConfigUniform(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 font-medium"
                    >
                      <option value="">Selecione um uniforme padrão ou crie customizado</option>
                      {configUniforms.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.name} - {config.default_quantity}x - Vida útil: {config.default_amortization} meses - R$ {config.unit_value.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-600 mt-2">
                      Selecione um uniforme padrão para preencher os campos automaticamente, ou deixe em branco para criar um customizado
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome do Uniforme *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Calça social"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Marca
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Marca XYZ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quantidade (por funcionário) *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Quantas unidades por funcionário
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Valor Unitário (R$) *
                </label>
                <input
                  type="number"
                  value={formData.unit_value}
                  onChange={(e) => setFormData({ ...formData, unit_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 500.00"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Preço de cada unidade
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Valor Total
                </label>
                <input
                  type="text"
                  value={formData.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  readOnly
                  className="w-full px-4 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amortização (meses) *
                </label>
                <input
                  type="number"
                  value={formData.amortization}
                  onChange={(e) => setFormData({ ...formData, amortization: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">
                  Valor Mensal (por funcionário):
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {formData.monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-1">
                Calculado automaticamente: Valor Total ÷ Amortização
              </p>
              <div className="bg-blue-100 rounded p-2 mt-2">
                <p className="text-xs text-blue-800 font-medium">
                  Este é o custo mensal <strong>por funcionário</strong>. O custo total do posto será multiplicado automaticamente pelo número de funcionários (considerando a escala).
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
            >
              {uniform ? 'Atualizar' : 'Incluir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
