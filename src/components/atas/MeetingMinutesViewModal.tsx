import { X, Calendar, Users, FileText, Plus } from 'lucide-react';
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

interface MeetingMinutesViewModalProps {
  meetingMinute: MeetingMinute;
  onClose: () => void;
  onAddAction?: () => void;
}

export function MeetingMinutesViewModal({
  meetingMinute,
  onClose,
  onAddAction,
}: MeetingMinutesViewModalProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {meetingMinute.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(meetingMinute.date)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {meetingMinute.participants && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-start gap-2 text-sm">
                <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-blue-900">Participantes:</span>
                  <p className="text-blue-800 mt-1">{meetingMinute.participants}</p>
                </div>
              </div>
            </div>
          )}

          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Conteúdo da ATA
              </h3>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {meetingMinute.content}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          {onAddAction && (
            <Button
              onClick={() => {
                onAddAction();
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ação
            </Button>
          )}
          <Button onClick={onClose} variant="outline" className={!onAddAction ? 'ml-auto' : ''}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
