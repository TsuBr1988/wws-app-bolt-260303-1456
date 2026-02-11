import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText, User } from 'lucide-react';
import { Task, TaskFormData, createTask, updateTask } from './tasks.api';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collaboratorId?: string;
  collaboratorName?: string;
  task?: Task;
  collaborators: any[];
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  collaboratorId,
  collaboratorName,
  task,
  collaborators
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    due_date: '',
    status: 'a_fazer',
    assignee_id: ''
  });

  // Initialize form data
  useEffect(() => {
    if (task) {
      // Editing existing task
      setFormData({
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        status: task.status,
        assignee_id: task.assignee_id
      });
    } else {
      // Creating new task
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        due_date: today,
        status: 'a_fazer',
        assignee_id: collaboratorId || ''
      });
    }
  }, [task, collaboratorId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.title.trim()) {
      alert('Título é obrigatório');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória');
      return;
    }
    
    if (!formData.due_date) {
      alert('Data limite é obrigatória');
      return;
    }
    
    // Check if due_date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (formData.due_date < today) {
      alert('Data limite não pode ser no passado');
      return;
    }
    
    if (!formData.assignee_id) {
      alert('Colaborador é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      
      if (task) {
        // Update existing task
        result = await updateTask(task.id, formData);
      } else {
        // Create new task
        result = await createTask(formData);
      }
      
      if (result.error) {
        alert(`Erro ao ${task ? 'atualizar' : 'criar'} tarefa: ${result.error}`);
        return;
      }
      
      alert(`✅ Tarefa ${task ? 'atualizada' : 'criada'} com sucesso!`);
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Error in form submission:', err);
      alert('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollaborator = collaborators.find(c => c.id === formData.assignee_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {task ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <p className="text-sm text-gray-600">
                {collaboratorName && !task ? `Para ${collaboratorName}` : 'Configure os detalhes da tarefa'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Collaborator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colaborador *
            </label>
            <select
              value={formData.assignee_id}
              onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!collaboratorId || loading} // Lock if opened from specific collaborator card
            >
              <option value="">Selecione um colaborador</option>
              {collaborators.map(collaborator => (
                <option key={collaborator.id} value={collaborator.id}>
                  {collaborator.name}
                </option>
              ))}
            </select>
            {collaboratorId && (
              <p className="text-xs text-gray-500 mt-1">
                Colaborador fixo: {collaboratorName}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Revisar documentação do projeto X"
              required
              disabled={loading}
              maxLength={200}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Título curto e objetivo</span>
              <span>{formData.title.length}/200</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descreva os detalhes, objetivos e informações importantes desta tarefa..."
              required
              disabled={loading}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Detalhes e contexto da tarefa</span>
              <span>{formData.description.length}/1000</span>
            </div>
          </div>

          {/* Due Date and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Limite *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
                min={new Date().toISOString().split('T')[0]} // Today minimum
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="a_fazer">A fazer</option>
                <option value="fazendo">Fazendo</option>
                <option value="feito">Feito</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {selectedCollaborator && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Resumo da Tarefa</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span><strong>Colaborador:</strong> {selectedCollaborator.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span><strong>Prazo:</strong> {formData.due_date ? new Date(formData.due_date).toLocaleDateString('pt-BR') : 'Não definido'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span><strong>Status:</strong> {
                    formData.status === 'a_fazer' ? 'A fazer' :
                    formData.status === 'fazendo' ? 'Fazendo' : 'Feito'
                  }</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : (task ? 'Atualizar Tarefa' : 'Criar Tarefa')}</span>
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