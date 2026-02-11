import React, { useState } from 'react';
import { X, Save, Calendar, User, FileText } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useDepartment } from '../../contexts/DepartmentContext';

interface Tarefa {
  id: string;
  nome: string;
  descricao?: string;
  status: 'A fazer' | 'Fazendo' | 'Feito';
  data_inclusao: string;
  data_prazo: string;
  criado_por: string;
  responsavel: string;
  department: string;
}

interface TarefaFormProps {
  onClose: () => void;
  onSubmit: (tarefa: Omit<Tarefa, 'id' | 'created_at' | 'updated_at' | 'data_inclusao'>) => void;
}

export const TarefaForm: React.FC<TarefaFormProps> = ({ onClose, onSubmit }) => {
  const { selectedDepartment } = useDepartment();
  const { data: employees = [] } = useSupabaseQuery('employees');
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    data_prazo: '',
    criado_por: '',
    responsavel: '',
    status: 'A fazer' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.nome.trim()) {
      alert('Nome da tarefa é obrigatório');
      return;
    }
    
    if (!formData.data_prazo) {
      alert('Data de prazo é obrigatória');
      return;
    }
    
    if (!formData.criado_por) {
      alert('Selecione quem criou a tarefa');
      return;
    }
    
    if (!formData.responsavel) {
      alert('Selecione o responsável pela tarefa');
      return;
    }
    
    // Verificar se a data de prazo é futura
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prazoDate = new Date(formData.data_prazo + 'T00:00:00');
    
    if (prazoDate < today) {
      const confirmation = confirm('⚠️ A data de prazo está no passado.\n\nDeseja continuar mesmo assim?');
      if (!confirmation) return;
    }
    
    // Enviar dados
    onSubmit({
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      data_prazo: formData.data_prazo + 'T23:59:59.999Z', // Final do dia
      criado_por: formData.criado_por,
      responsavel: formData.responsavel,
      status: formData.status,
      department: selectedDepartment
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nova Tarefa</h2>
              <p className="text-sm text-gray-600">{selectedDepartment}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Tarefa *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Revisar contrato X, Elaborar planilha Y..."
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes sobre a tarefa, instruções específicas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Prazo *
            </label>
            <input
              type="date"
              value={formData.data_prazo}
              onChange={(e) => setFormData({ ...formData, data_prazo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Data limite para conclusão da tarefa
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criado por *
            </label>
            <select
              value={formData.criado_por}
              onChange={(e) => setFormData({ ...formData, criado_por: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione quem criou</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.name}>
                  {employee.name} - {employee.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável *
            </label>
            <select
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione o responsável</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.name}>
                  {employee.name} - {employee.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Inicial
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A fazer">A fazer</option>
              <option value="Fazendo">Fazendo</option>
            </select>
          </div>

          {/* Preview */}
          {formData.nome && formData.data_prazo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Preview da Tarefa</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Nome:</strong> {formData.nome}</p>
                <p><strong>Prazo:</strong> {new Date(formData.data_prazo).toLocaleDateString('pt-BR')}</p>
                <p><strong>Responsável:</strong> {formData.responsavel || 'Não selecionado'}</p>
                <p><strong>Status:</strong> {formData.status}</p>
                <p><strong>Departamento:</strong> {selectedDepartment}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Criar Tarefa</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};