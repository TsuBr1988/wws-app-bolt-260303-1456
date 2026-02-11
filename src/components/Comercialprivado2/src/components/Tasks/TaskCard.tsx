import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Filter, User, Calendar, Clock, Target } from 'lucide-react';
import { Task, listTasksByAssignee, getCounts, TaskCounts } from './tasks.api';
import { TaskRow } from './TaskRow';
import { TaskFormModal } from './TaskFormModal';

interface TaskCardProps {
  collaborator: any;
  collaborators: any[];
  onDataChange: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  collaborator, 
  collaborators,
  onDataChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({ total: 0, dueIn5: 0, dueIn1: 0 });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Multi-status filter state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['a_fazer', 'fazendo']);

  // Load counts on mount and when data changes
  useEffect(() => {
    loadCounts();
  }, [collaborator.id, onDataChange]);

  // Load tasks when expanded or filters change
  useEffect(() => {
    if (isExpanded) {
      loadTasks();
    }
  }, [isExpanded, selectedStatuses, onDataChange]);

  const loadCounts = async () => {
    try {
      const { data, error } = await getCounts(collaborator.id);
      if (error) {
        console.warn(`Erro ao carregar contadores para ${collaborator.name}:`, error);
      } else {
        setCounts(data);
      }
    } catch (err) {
      console.warn('Erro inesperado ao carregar contadores:', err);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await listTasksByAssignee(collaborator.id, {
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        limit: 20
      });
      
      if (error) {
        console.warn(`Erro ao carregar tarefas para ${collaborator.name}:`, error);
      } else {
        setTasks(data);
      }
    } catch (err) {
      console.warn('Erro inesperado ao carregar tarefas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowCreateModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowCreateModal(true);
  };

  const handleTaskSuccess = () => {
    loadCounts();
    loadTasks();
    onDataChange(); // Refresh chart
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingTask(null);
  };

  const statusOptions = [
    { value: 'a_fazer', label: 'A fazer', color: 'text-yellow-700' },
    { value: 'fazendo', label: 'Fazendo', color: 'text-blue-700' },
    { value: 'feito', label: 'Feito', color: 'text-green-700' }
  ];

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        {/* Card Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{collaborator.name}</h3>
                <p className="text-sm text-gray-600">Gerenciamento de tarefas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateTask}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                title={`Criar tarefa para ${collaborator.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                {counts.total}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">≤ 5 dias:</span>
              <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                counts.dueIn5 > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {counts.dueIn5}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">≤ 1 dia:</span>
              <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                counts.dueIn1 > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {counts.dueIn1}
              </span>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar:</span>
              </div>
              
              <div className="flex items-center space-x-3">
                {statusOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(option.value)}
                      onChange={() => handleStatusToggle(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              
              <div className="text-sm text-gray-500">
                ({tasks.length} {selectedStatuses.length > 0 ? 'filtrada(s)' : 'tarefa(s)'})
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {isExpanded && (
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskSuccess}
                      onEdit={handleEditTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedStatuses.length > 0 ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa criada'}
                  </h3>
                  <p className="text-gray-500">
                    {selectedStatuses.length > 0 
                      ? `Não há tarefas com status: ${selectedStatuses.map(s => 
                          statusOptions.find(opt => opt.value === s)?.label
                        ).join(', ')}`
                      : `Clique no botão + para criar a primeira tarefa de ${collaborator.name}`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleTaskSuccess}
        collaboratorId={collaborator.id}
        collaboratorName={collaborator.name}
        task={editingTask}
        collaborators={collaborators}
      />
    </>
  );
};