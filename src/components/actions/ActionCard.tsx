import { Calendar, User, Edit, Trash2, Clock, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import type { Action } from '../../pages/AtasAcoesPage';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ActionCommentsModal } from './ActionCommentsModal';
import { supabase } from '../../lib/supabase';

interface ActionCardProps {
  action: Action;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (newStatus: 'a_fazer' | 'fazendo' | 'feito') => void;
}

export function ActionCard({ action, onEdit, onDelete, onStatusChange }: ActionCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    fetchCommentsCount();
  }, [action.id]);

  const fetchCommentsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('action_comments')
        .select('*', { count: 'exact', head: true })
        .eq('action_id', action.id);

      if (error) throw error;
      setCommentsCount(count || 0);
    } catch (error) {
      console.error('Error fetching comments count:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'a_fazer':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'fazendo':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'feito':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'a_fazer':
        return 'A Fazer';
      case 'fazendo':
        return 'Fazendo';
      case 'feito':
        return 'Feito';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getDaysUntilDeadline = () => {
    try {
      const today = new Date();
      const deadline = parseISO(action.data_prazo);
      return differenceInDays(deadline, today);
    } catch {
      return null;
    }
  };

  const daysRemaining = getDaysUntilDeadline();
  const isOverdue = daysRemaining !== null && daysRemaining < 0 && action.status !== 'feito';
  const isNearDeadline = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7 && action.status !== 'feito';

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      <div className={`px-6 py-3 border-b-2 ${getStatusColor(action.status)}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">
              {getStatusLabel(action.status)}
            </span>
            {isOverdue && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                ATRASADO
              </span>
            )}
            {isNearDeadline && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">
                URGENTE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={action.status}
              onChange={(e) => onStatusChange(e.target.value as any)}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="a_fazer">A Fazer</option>
              <option value="fazendo">Fazendo</option>
              <option value="feito">Feito</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <p className="text-gray-800 text-base leading-relaxed">
              {action.descricao}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Responsável:</span>
            <span>{action.responsavel}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Prazo:</span>
            <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
              {formatDate(action.data_prazo)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Criado em:</span>
            <span>{formatDate(action.created_at.split('T')[0])}</span>
          </div>

          {daysRemaining !== null && action.status !== 'feito' && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Faltam:</span>
              <span
                className={`font-semibold ${
                  isOverdue
                    ? 'text-red-600'
                    : isNearDeadline
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}
              >
                {daysRemaining >= 0 ? `${daysRemaining} dias` : `${Math.abs(daysRemaining)} dias (atrasado)`}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t">
          <Button
            onClick={() => setShowComments(true)}
            variant="outline"
            className="relative"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comentários
            {commentsCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {commentsCount}
              </span>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={onEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              onClick={onDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {showComments && (
        <ActionCommentsModal
          actionId={action.id}
          actionDescription={action.descricao}
          onClose={() => {
            setShowComments(false);
            fetchCommentsCount();
          }}
        />
      )}
    </div>
  );
}
