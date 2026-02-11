import { X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: EquipmentData) => void;
  equipment?: EquipmentData;
}

export interface EquipmentData {
  id?: string;
  name: string;
  brand: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  amortization: number;
  monthly_value: number;
}

interface ConfigEquipment {
  id: string;
  name: string;
  brand: string;
  default_quantity: number;
  unit_value: number;
  default_amortization: number;
}

export const EquipmentModal = ({ isOpen, onClose, onSave, equipment }: EquipmentModalProps) => {
  const [formData, setFormData] = useState<EquipmentData>({
    name: '',
    brand: '',
    quantity: 1,
    unit_value: 0,
    total_value: 0,
    amortization: 12,
    monthly_value: 0,
  });
  const [configEquipments, setConfigEquipments] = useState<ConfigEquipment[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfigEquipments();
    }
    if (equipment) {
      setFormData(equipment);
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
    }
  }, [equipment, isOpen]);

  const loadConfigEquipments = async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from('config_equipments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setConfigEquipments(data || []);
    } catch (error) {
      console.error('Error loading config equipments:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSelectConfigEquipment = (configId: string) => {
    if (!configId) return;

    const config = configEquipments.find(c => c.id === configId);
    if (!config) return;

    setFormData(prev => ({
      ...prev,
      name: config.name,
      brand: config.brand,
      quantity: config.default_quantity,
      unit_value: config.unit_value,
      amortization: config.default_amortization,
    }));
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
      alert('Por favor, informe o nome do equipamento');
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
            {equipment ? 'Editar Equipamento' : 'Incluir Equipamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {!equipment && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  Selecionar Equipamento Pré-Cadastrado (Opcional)
                </label>
                <select
                  onChange={(e) => handleSelectConfigEquipment(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={loadingConfig}
                >
                  <option value="">-- Selecione um equipamento ou preencha manualmente --</option>
                  {configEquipments.map(config => (
                    <option key={config.id} value={config.id}>
                      ⭐ {config.name} - {config.brand} (R$ {config.unit_value.toFixed(2)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-600 mt-2">
                  Ao selecionar um item pré-cadastrado, os campos abaixo serão preenchidos automaticamente, mas você pode editá-los.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome do Equipamento *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Aspirador de pó"
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
                  Quantidade *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Valor Unitário *
                </label>
                <input
                  type="number"
                  value={formData.unit_value}
                  onChange={(e) => setFormData({ ...formData, unit_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Valor Mensal:
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {formData.monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Calculado automaticamente: Valor Total ÷ Amortização
              </p>
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
              {equipment ? 'Atualizar' : 'Incluir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
