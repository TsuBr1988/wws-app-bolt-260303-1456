import { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { calculateDurationInMonths, formatCurrency, formatDateBR } from '../../lib/contractUtils';

interface ContractFormProps {
  onClose: () => void;
  onSubmit: (contractData: any) => Promise<void>;
  defaultDepartment?: string;
}

export function ContractForm({ onClose, onSubmit, defaultDepartment }: ContractFormProps) {
  const [formData, setFormData] = useState({
    client_name: '',
    empresa: 'WWS',
    tipo: 'Publico',
    city: '',
    numero_pregao: '',
    numero_contrato: '',
    monthly_value: '',
    start_date: '',
    end_date: '',
    contract_object: '',
    reequilibrio_dissidio: false,
    reequilibrio_ipca: false,
    prazo_maximo_renovacao: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nome do cliente é obrigatório';
    }

    if (!formData.contract_object.trim()) {
      newErrors.contract_object = 'Objeto do contrato é obrigatório';
    }

    const value = parseFloat(formData.monthly_value);
    if (!formData.monthly_value || isNaN(value) || value <= 0) {
      newErrors.monthly_value = 'Valor mensal deve ser maior que zero';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Data de início é obrigatória';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'Data de término é obrigatória';
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'Data de término deve ser posterior à data de início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const submitData: any = {
        ...formData,
        monthly_value: parseFloat(formData.monthly_value),
        department: defaultDepartment || 'Comercial Publico',
        is_active: true,
      };

      if (formData.prazo_maximo_renovacao) {
        submitData.prazo_maximo_renovacao = parseInt(formData.prazo_maximo_renovacao);
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('❌ Error creating contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationMonths =
    formData.start_date && formData.end_date
      ? calculateDurationInMonths(formData.start_date, formData.end_date)
      : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold">Novo Contrato</h2>
          <button onClick={onClose} className="hover:bg-blue-700 rounded-full p-1">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cliente *
              </label>
              <Input
                value={formData.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
                placeholder="Digite o nome do cliente"
                className={errors.client_name ? 'border-red-500' : ''}
              />
              {errors.client_name && (
                <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa *</label>
              <select
                value={formData.empresa}
                onChange={(e) => handleChange('empresa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Publico">Público</option>
                <option value="Privado">Privado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Digite a cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Pregão
              </label>
              <Input
                value={formData.numero_pregao}
                onChange={(e) => handleChange('numero_pregao', e.target.value)}
                placeholder="Ex: 001/2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Contrato
              </label>
              <Input
                value={formData.numero_contrato}
                onChange={(e) => handleChange('numero_contrato', e.target.value)}
                placeholder="Ex: 123/2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mensal *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_value}
                onChange={(e) => handleChange('monthly_value', e.target.value)}
                placeholder="0.00"
                className={errors.monthly_value ? 'border-red-500' : ''}
              />
              {errors.monthly_value && (
                <p className="text-red-500 text-xs mt-1">{errors.monthly_value}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início *
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className={errors.start_date ? 'border-red-500' : ''}
              />
              {errors.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Término *
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className={errors.end_date ? 'border-red-500' : ''}
              />
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo Máximo de Renovação (meses)
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={formData.prazo_maximo_renovacao}
                onChange={(e) => handleChange('prazo_maximo_renovacao', e.target.value)}
                placeholder="Ex: 60"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número máximo de meses que o contrato pode ser renovado
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objeto do Contrato *
              </label>
              <textarea
                value={formData.contract_object}
                onChange={(e) => handleChange('contract_object', e.target.value)}
                rows={4}
                placeholder="Descreva o objeto do contrato"
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.contract_object ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contract_object && (
                <p className="text-red-500 text-xs mt-1">{errors.contract_object}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reequilíbrio</h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.reequilibrio_dissidio}
                  onChange={(e) => handleChange('reequilibrio_dissidio', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-gray-700">Reequilíbrio Dissídio</span>
                  <p className="text-xs text-gray-500">
                    Lembrete anual todo dia 10 de janeiro
                  </p>
                </div>
              </label>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.reequilibrio_ipca}
                  onChange={(e) => handleChange('reequilibrio_ipca', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-gray-700">Reequilíbrio IPCA</span>
                  <p className="text-xs text-gray-500">
                    Lembrete 10 meses após o início, depois anualmente
                  </p>
                </div>
              </label>
            </div>
          </div>

          {formData.client_name && formData.start_date && formData.end_date && formData.monthly_value && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Preview do Contrato</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{formData.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Empresa:</span>
                  <span className="font-medium">{formData.empresa}</span>
                </div>
                {formData.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cidade:</span>
                    <span className="font-medium">{formData.city}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Mensal:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(parseFloat(formData.monthly_value))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Período:</span>
                  <span className="font-medium">
                    {formatDateBR(formData.start_date)} até {formatDateBR(formData.end_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duração:</span>
                  <span className="font-medium">{durationMonths} meses</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Salvando...' : 'Criar Contrato'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
