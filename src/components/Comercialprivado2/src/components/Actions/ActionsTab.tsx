import React, { useState, useEffect } from 'react';
import { Plus, ListTodo, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Action, actionsService, CreateAction } from '../../services/actionsService';
import { ActionForm } from './ActionForm';
import { ActionCard } from './ActionCard';
import { ActionCommentsModal } from './ActionCommentsModal';
import { useAuth } from '@/hooks/useAuth';

interface ActionsTabProps {
  responsaveis: string[];
  initialFormOpen?: boolean;
  onActionCreated?: () => void;
}

export const ActionsTab: React.FC<ActionsTabProps> = ({
  responsaveis,
  initialFormOpen = false,
  onActionCreated
}) => {
  const { user, hasIndicatorAccess, canEditIndicator } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(initialFormOpen);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');

  useEffect(() => {
    loadActions();
  }, []);

  useEffect(() => {
    if (initialFormOpen) {
      const canCreate = user?.is_admin
        ? true
        : hasIndicatorAccess('marketing', 'Tarefas - Pedir') || canEditIndicator('marketing', 'Tarefas - Pedir');
      if (canCreate) setIsFormOpen(true);
    }
  }, [canEditIndicator, hasIndicatorAccess, initialFormOpen, user?.is_admin]);

  const canCreate = user?.is_admin
    ? true
    : hasIndicatorAccess('marketing', 'Tarefas - Pedir') || canEditIndicator('marketing', 'Tarefas - Pedir');

  const canEdit = user?.is_admin ? true : canEditIndicator('marketing', 'Tarefas - Editar');

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await actionsService.getAllActions();
      setActions(data);

      const counts: Record<string, number> = {};
      for (const action of data) {
        const count = await actionsService.getCommentsCount(action.id);
        counts[action.id] = count;
      }
      setCommentsCount(counts);
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async (action: CreateAction) => {
    if (!canCreate) return;
    try {
      await actionsService.createAction(action);
      await loadActions();
      if (onActionCreated) {
        onActionCreated();
      }
    } catch (error) {
      console.error('Error creating action:', error);
      throw error;
    }
  };

  const handleUpdateAction = async (action: CreateAction) => {
    if (!editingAction) return;
    if (!canEdit) return;

    try {
      await actionsService.updateAction(editingAction.id, action);
      await loadActions();
      setEditingAction(null);
    } catch (error) {
      console.error('Error updating action:', error);
      throw error;
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'a_fazer' | 'fazendo' | 'feito') => {
    if (!canEdit) return;
    try {
      await actionsService.updateAction(id, { status: newStatus });
      await loadActions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteAction = async (id: string) => {
    if (!canEdit) return;
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;

    try {
      await actionsService.deleteAction(id);
      await loadActions();
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const handleViewComments = (action: Action) => {
    setSelectedAction(action);
    setIsCommentsModalOpen(true);
  };

  const handleEditAction = (action: Action) => {
    if (!canEdit) return;
    setEditingAction(action);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAction(null);
  };

  const filteredActions = actions.filter(action => {
    if (statusFilter !== 'all' && action.status !== statusFilter) return false;
    if (responsavelFilter !== 'all' && action.responsavel !== responsavelFilter) return false;
    return true;
  });

  const sortedActions = [...filteredActions].sort((a, b) => {
    if (a.status === 'feito' && b.status !== 'feito') return 1;
    if (a.status !== 'feito' && b.status === 'feito') return -1;
    return a.data_prazo.localeCompare(b.data_prazo);
  });

  const statusCounts = {
    a_fazer: actions.filter(a => a.status === 'a_fazer').length,
    fazendo: actions.filter(a => a.status === 'fazendo').length,
    feito: actions.filter(a => a.status === 'feito').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Tarefas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tarefas</h2>
          <p className="text-gray-600 mt-1">Gerencie seus planos de ação</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter(statusFilter === 'a_fazer' ? 'all' : 'a_fazer')}
          className={`bg-white rounded-lg border-2 p-6 hover:shadow-md transition-all ${
            statusFilter === 'a_fazer' ? 'border-red-500 shadow-md' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Circle className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-red-600">{statusCounts.a_fazer}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">A Fazer</h3>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'fazendo' ? 'all' : 'fazendo')}
          className={`bg-white rounded-lg border-2 p-6 hover:shadow-md transition-all ${
            statusFilter === 'fazendo' ? 'border-yellow-500 shadow-md' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-500" />
            <span className="text-3xl font-bold text-yellow-600">{statusCounts.fazendo}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Fazendo</h3>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'feito' ? 'all' : 'feito')}
          className={`bg-white rounded-lg border-2 p-6 hover:shadow-md transition-all ${
            statusFilter === 'feito' ? 'border-green-500 shadow-md' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-green-600">{statusCounts.feito}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Feito</h3>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="a_fazer">A Fazer</option>
              <option value="fazendo">Fazendo</option>
              <option value="feito">Feito</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Responsável
            </label>
            <select
              value={responsavelFilter}
              onChange={(e) => setResponsavelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              {responsaveis.map(resp => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedActions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-gray-600">Crie uma nova tarefa para começar</p>
          </div>
        ) : (
          sortedActions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              commentsCount={commentsCount[action.id] || 0}
              onStatusChange={handleStatusChange}
              onEdit={handleEditAction}
              onDelete={handleDeleteAction}
              onViewComments={handleViewComments}
              canEdit={canEdit}
            />
          ))
        )}
      </div>

      <ActionForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingAction ? handleUpdateAction : handleCreateAction}
        action={editingAction}
        responsaveis={responsaveis}
      />

      <ActionCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false);
          loadActions();
        }}
        action={selectedAction}
      />
    </div>
  );
};
