import React from 'react';
import { FileText, Calendar, Users, Eye, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MeetingMinute } from '../../services/meetingMinutesService';

interface MeetingMinutesCardProps {
  minute: MeetingMinute;
  onView: (minute: MeetingMinute) => void;
  onEdit: (minute: MeetingMinute) => void;
  onDelete: (id: string) => void;
}

export const MeetingMinutesCard: React.FC<MeetingMinutesCardProps> = ({
  minute,
  onView,
  onEdit,
  onDelete
}) => {
  const preview = minute.content.length > 150
    ? minute.content.substring(0, 150) + '...'
    : minute.content;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 rounded-t-lg flex items-center gap-2">
        <FileText className="w-5 h-5 text-white" />
        <span className="text-white font-semibold">ATA</span>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {minute.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{format(parseISO(minute.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          {minute.participants && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="line-clamp-1">{minute.participants}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {preview}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => onView(minute)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Completa</span>
          </button>

          <div className="flex-1"></div>

          <button
            onClick={() => onEdit(minute)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(minute.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
