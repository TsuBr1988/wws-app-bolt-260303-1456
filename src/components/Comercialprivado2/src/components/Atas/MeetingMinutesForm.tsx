import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { MeetingMinute, CreateMeetingMinute } from '../../services/meetingMinutesService';

interface MeetingMinutesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (minute: CreateMeetingMinute) => Promise<void>;
  onAddAction: (tempData: CreateMeetingMinute) => void;
  minute?: MeetingMinute | null;
  tempData?: CreateMeetingMinute | null;
}

export const MeetingMinutesForm: React.FC<MeetingMinutesFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onAddAction,
  minute,
  tempData
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [participants, setParticipants] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tempData) {
      setTitle(tempData.title);
      setDate(tempData.date);
      setParticipants(tempData.participants || '');
      setContent(tempData.content);
    } else if (minute) {
      setTitle(minute.title);
      setDate(minute.date);
      setParticipants(minute.participants || '');
      setContent(minute.content);
    } else {
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setParticipants('');
      setContent('');
    }
  }, [minute, tempData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !content.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        date,
        content: content.trim(),
        participants: participants.trim() || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving meeting minute:', error);
      alert('Erro ao salvar ata');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAction = () => {
    if (!title.trim() || !date || !content.trim()) {
      alert('Preencha os campos obrigatórios antes de adicionar uma ação');
      return;
    }

    onAddAction({
      title: title.trim(),
      date,
      content: content.trim(),
      participants: participants.trim() || undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {minute ? 'Editar ATA' : 'Nova ATA'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Reunião *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Reunião Semanal de Marketing"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Reunião *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participantes
            </label>
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: João, Maria, Pedro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo da ATA *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Descreva os tópicos discutidos, decisões tomadas e próximos passos..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleAddAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Ação
            </button>

            <div className="flex-1"></div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !date || !content.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar ATA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
