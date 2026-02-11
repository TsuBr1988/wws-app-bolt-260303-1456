import React, { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useSupabaseInsert } from '../../hooks/useSupabase';
import { useDepartment } from '../../contexts/DepartmentContext';

interface ContractFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({ onClose, onSuccess }) => {
  const { insert: insertContract, loading } = useSupabaseInsert('contracts');
  const { selectedDepartment } = useDepartment();
  const [formData, setFormData] = useState({
    client_name: '',
    city: '',
    numero_pregao: '',
    numero_contrato: '',
    monthly_value: 0,
    start_date: '',
    end_date: '',
    contract_object: '',
    empresa: 'WWS',
    reequilibrio_dissidio: false,
    reequilibrio_ipca: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name.trim() || !formData.contract_object.trim()) {
      alert('Nome do cliente e objeto do contrato são obrigatórios');
      return;
    }

    if (formData.monthly_value <= 0) {
      alert('Valor mensal deve ser maior que zero');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      alert('Datas de início e fim são obrigatórias');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      alert('Data de término deve ser posterior à data de início');
      return;
    }

    try {
      await insertContract({
        client_name: formData.client_name,
        city: formData.city,
        numero_pregao: formData.numero_pregao || null,
        numero_contrato: formData.numero_contrato || null,
        monthly_value: formData.monthly_value,
        start_date: formData.start_date,
        end_date: formData.end_date,
        contract_object: formData.contract_object,
        department: selectedDepartment,
        empresa: formData.empresa,
        reequilibrio_dissidio: formData.reequilibrio_dissidio,
        reequilibrio_ipca: formData.reequilibrio_ipca
      });

      alert('✅ Contrato criado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      alert(`❌ Erro ao criar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Incluir Novo Contrato</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: Ministério da Educação"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <select
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade (Opcional)
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: São Paulo, Rio de Janeiro, Brasília..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Pregão (Opcional)
              </label>
              <input
                type="text"
                value={formData.numero_pregao}
                onChange={(e) => setFormData({ ...formData, numero_pregao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 001/2025, PE-001/2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Contrato (Opcional)
              </label>
              <input
                type="text"
                value={formData.numero_contrato}
                onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 123/2025, CT-456/2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mensal *
              </label>
              <input
                type="number"
                value={formData.monthly_value || ''}
                onChange={(e) => setFormData({ ...formData, monthly_value: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                step="0.01"
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Término *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min={formData.start_date}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objeto do Contrato *
            </label>
            <textarea
              value={formData.contract_object}
              onChange={(e) => setFormData({ ...formData, contract_object: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Descreva o objeto/serviço do contrato..."
              required
            />
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Lembretes de Reequilíbrio</h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reequilibrio_dissidio}
                  onChange={(e) => setFormData({ ...formData, reequilibrio_dissidio: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Reequilíbrio Dissídio</span>
                  <p className="text-xs text-gray-500 mt-0.5">Lembrete anual todo dia 10 de janeiro</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reequilibrio_ipca}
                  onChange={(e) => setFormData({ ...formData, reequilibrio_ipca: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Reequilíbrio IPCA 12 meses</span>
                  <p className="text-xs text-gray-500 mt-0.5">Lembrete 10 meses após o início, depois anualmente</p>
                </div>
              </label>
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Resumo do Contrato</h3>
              <div className="text-sm text-blue-600 space-y-1">
                <p><strong>Cliente:</strong> {formData.client_name || 'Não informado'}</p>
                <p><strong>Cidade:</strong> {formData.city || 'Não informada'}</p>
                <p><strong>Valor Mensal:</strong> {formData.monthly_value > 0 ? `R$ ${formData.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}</p>
                <p><strong>Período:</strong> {formData.start_date ? new Date(formData.start_date).toLocaleDateString('pt-BR') : '?'} até {formData.end_date ? new Date(formData.end_date).toLocaleDateString('pt-BR') : '?'}</p>
                {formData.start_date && formData.end_date && (
                  <p><strong>Duração:</strong> {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} meses aproximadamente</p>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Criar Contrato'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};