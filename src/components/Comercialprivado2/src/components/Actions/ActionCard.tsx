import React from 'react';
import { User, Calendar, MessageSquare, Pencil, Trash2, Clock } from 'lucide-react';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Action } from '../../services/actionsService';

interface ActionCardProps {
  action: Action;
  commentsCount: number;
  onStatusChange: (id: string, newStatus: 'a_fazer' | 'fazendo' | 'feito') => void;
  onEdit: (action: Action) => void;
  onDelete: (id: string) => void;
  onViewComments: (action: Action) => void;
  canEdit?: boolean;
}

const statusConfig = {
  a_fazer: {
    label: 'A Fazer',
    bg: 'bg-red-500',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  fazendo: {
    label: 'Fazendo',
    bg: 'bg-yellow-500',
    text: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  feito: {
    label: 'Feito',
    bg: 'bg-green-500',
    text: 'text-green-700',
    border: 'border-green-200'
  }
};

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  commentsCount,
  onStatusChange,
  onEdit,
  onDelete,
  onViewComments,
  canEdit = true,
}) => {
  const config = statusConfig[action.status];
  const prazoDate = parseISO(action.data_prazo);
  const today = new Date();
  const daysRemaining = differenceInDays(prazoDate, today);
  const isOverdue = isPast(prazoDate) && action.status !== 'feito';
  const isUrgent = daysRemaining <= 7 && daysRemaining >= 0 && action.status !== 'feito';

  const getDaysRemainingColor = () => {
    if (isOverdue) return 'text-red-600 bg-red-50 border-red-200';
    if (isUrgent) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getDaysRemainingText = () => {
    if (action.status === 'feito') return 'Concluído';
    if (isOverdue) {
      const daysLate = Math.abs(daysRemaining);
      return `${daysLate} ${daysLate === 1 ? 'dia' : 'dias'} atrasado`;
    }
    if (daysRemaining === 0) return 'Vence hoje';
    if (daysRemaining === 1) return '1 dia restante';
    return `${daysRemaining} dias restantes`;
  };

  return (
    <div className={`bg-white rounded-lg border-2 ${config.border} shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`${config.bg} px-4 py-3 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">{config.label.toUpperCase()}</span>
          {isOverdue && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
              ATRASADO
            </span>
          )}
          {isUrgent && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
              URGENTE
            </span>
          )}
        </div>
        <select
          value={action.status}
          disabled={!canEdit}
          onChange={(e) => {
            if (!canEdit) return;
            onStatusChange(action.id, e.target.value as any);
          }}
          className={`px-2 py-1 text-sm bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded transition-all ${
            canEdit ? 'hover:bg-opacity-30 cursor-pointer' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          <option value="a_fazer">A Fazer</option>
          <option value="fazendo">Fazendo</option>
          <option value="feito">Feito</option>
        </select>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-gray-900 font-medium leading-relaxed">
          {action.descricao}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{action.responsavel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{format(prazoDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Criado em {format(parseISO(action.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg ${getDaysRemainingColor()}`}>
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">{getDaysRemainingText()}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => onViewComments(action)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comentários</span>
            {commentsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[20px] text-center">
                {commentsCount}
              </span>
            )}
          </button>

          <div className="flex-1"></div>

          {canEdit && (
            <>
              <button
                onClick={() => onEdit(action)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDelete(action.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
