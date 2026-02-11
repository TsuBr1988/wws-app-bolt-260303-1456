import React, { useState } from 'react';
import { Edit, Trash2, Calendar, FileText, Clock } from 'lucide-react';
import { Task, updateTask, deleteTask } from './tasks.api';

interface TaskRowProps {
  task: Task;
  onUpdate: () => void;
  onEdit: (task: Task) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onUpdate, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: 'a_fazer' | 'fazendo' | 'feito') => {
    if (newStatus === task.status) return;

    setIsUpdatingStatus(true);
    try {
      const { error } = await updateTask(task.id, { status: newStatus });
      
      if (error) {
        alert(`Erro ao atualizar status: ${error}`);
        return;
      }
      
      onUpdate();
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Erro inesperado ao atualizar status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    const confirmMessage = `Tem certeza que deseja excluir a tarefa "${task.title}"?\n\nEsta ação não pode ser desfeita.`;
    
    if (confirm(confirmMessage)) {
      try {
        const { error } = await deleteTask(task.id);
        
        if (error) {
          alert(`Erro ao excluir tarefa: ${error}`);
          return;
        }
        
        onUpdate();
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Erro inesperado ao excluir tarefa');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'a_fazer': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'fazendo': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'feito': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'a_fazer': return 'A fazer';
      case 'fazendo': return 'Fazendo';
      case 'feito': return 'Feito';
      default: return status;
    }
  };

  const isOverdue = () => {
    const today = new Date().toISOString().split('T')[0];
    return task.status !== 'feito' && task.due_date < today;
  };

  const isDueSoon = () => {
    const today = new Date();
    const dueDate = new Date(task.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return task.status !== 'feito' && diffDays <= 1 && diffDays >= 0;
  };

  // Truncate description for initial display
  const truncateDescription = (text: string, maxLines: number = 3) => {
    const words = text.split(' ');
    const wordsPerLine = 12; // Approximate
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ');
  };

  const truncatedDescription = truncateDescription(task.description);
  const needsExpansion = task.description.length > truncatedDescription.length;

  return (
    <div className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
      isOverdue() ? 'border-red-200 bg-red-50' :
      isDueSoon() ? 'border-orange-200 bg-orange-50' :
      'border-gray-200 bg-white'
    }`}>
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-medium text-gray-900 truncate">{task.title}</h4>
            {isOverdue() && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                VENCIDA
              </span>
            )}
            {isDueSoon() && !isOverdue() && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                VENCE HOJE
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Criada: {formatDate(task.created_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span className={isOverdue() ? 'text-red-600 font-medium' : isDueSoon() ? 'text-orange-600 font-medium' : ''}>
                Limite: {formatDate(task.due_date)}
              </span>
            </div>
            {task.finished_at && (
              <div className="flex items-center space-x-1">
                <span className="text-green-600">Concluída: {formatDate(task.finished_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center space-x-3">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            disabled={isUpdatingStatus}
            className={`px-3 py-1 border rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)} ${
              isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
            }`}
          >
            <option value="a_fazer">A fazer</option>
            <option value="fazendo">Fazendo</option>
            <option value="feito">Feito</option>
          </select>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar tarefa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir tarefa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="text-sm text-gray-700">
        <p className={`${!isExpanded && needsExpansion ? 'line-clamp-3' : ''}`}>
          {isExpanded ? task.description : truncatedDescription}
        </p>
        {needsExpansion && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs mt-1"
          >
            {isExpanded ? 'ler menos' : 'ler mais'}
          </button>
        )}
      </div>

      {/* Task ID for debugging */}
      <div className="mt-2 text-xs text-gray-400">
        ID: {task.id.substring(0, 8)}
      </div>
    </div>
  );
};