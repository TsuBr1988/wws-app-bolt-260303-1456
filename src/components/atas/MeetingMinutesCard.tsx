import { Calendar, Users, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  content: string;
  participants: string;
  created_at: string;
}

interface MeetingMinutesCardProps {
  meetingMinute: MeetingMinute;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export function MeetingMinutesCard({
  meetingMinute,
  onEdit,
  onDelete,
  onView,
}: MeetingMinutesCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {meetingMinute.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(meetingMinute.date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {meetingMinute.participants && (
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 pb-4 border-b">
            <Users className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Participantes:</span>
              <span className="ml-2">{meetingMinute.participants}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-wrap">
            {getPreview(meetingMinute.content)}
          </p>
        </div>

        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <Button
            onClick={onView}
            variant="outline"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Completa
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
    </div>
  );
}
