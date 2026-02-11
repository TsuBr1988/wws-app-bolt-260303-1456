import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DifferentiatedBenefitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (benefit: DifferentiatedBenefitData) => void;
  benefit?: DifferentiatedBenefitData;
}

export interface DifferentiatedBenefitData {
  id?: string;
  name: string;
  monthly_value: number;
}

export const DifferentiatedBenefitModal = ({ isOpen, onClose, onSave, benefit }: DifferentiatedBenefitModalProps) => {
  const [formData, setFormData] = useState<DifferentiatedBenefitData>({
    name: '',
    monthly_value: 0,
  });

  useEffect(() => {
    if (benefit) {
      setFormData(benefit);
    } else {
      setFormData({
        name: '',
        monthly_value: 0,
      });
    }
  }, [benefit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do benefício');
      return;
    }

    if (formData.monthly_value <= 0) {
      alert('O valor mensal deve ser maior que zero');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-slate-800">
            {benefit ? 'Editar Benefício' : 'Incluir Benefício Diferenciado'}
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome do Benefício *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Auxílio Educação, Plano Odontológico"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Valor Mensal *
              </label>
              <input
                type="number"
                value={formData.monthly_value}
                onChange={(e) => setFormData({ ...formData, monthly_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.01"
                min="0"
                placeholder="0,00"
              />
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
              {benefit ? 'Atualizar' : 'Incluir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
