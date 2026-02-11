import { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';

interface MeetingMinutesFormProps {
  meetingMinute?: {
    id: string;
    title: string;
    date: string;
    content: string;
    participants: string;
  } | null;
  onSave: (data: {
    title: string;
    date: string;
    content: string;
    participants: string;
  }) => Promise<void>;
  onClose: () => void;
  onAddAction?: (currentData: {
    title: string;
    date: string;
    content: string;
    participants: string;
  }) => void;
  tempData?: {
    title: string;
    date: string;
    content: string;
    participants: string;
  } | null;
}

export function MeetingMinutesForm({
  meetingMinute,
  onSave,
  onClose,
  onAddAction,
  tempData,
}: MeetingMinutesFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tempData) {
      // Restaurar dados temporários
      setTitle(tempData.title);
      setDate(tempData.date);
      setParticipants(tempData.participants);
      setContent(tempData.content);
    } else if (meetingMinute) {
      setTitle(meetingMinute.title);
      setDate(meetingMinute.date);
      setParticipants(meetingMinute.participants || '');
      setContent(meetingMinute.content);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [meetingMinute, tempData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título, data e conteúdo da ata.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        date,
        content: content.trim(),
        participants: participants.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Error saving meeting minute:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {meetingMinute ? 'Editar ATA' : 'Nova ATA de Reunião'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Reunião *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião Mensal de Resultados"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participantes
              </label>
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Ex: João Silva, Maria Santos, Pedro Oliveira"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo da ATA *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o conteúdo da ata aqui...&#10;&#10;Você pode incluir:&#10;- Pauta da reunião&#10;- Discussões realizadas&#10;- Decisões tomadas&#10;- Ações definidas&#10;- Próximos passos"
                rows={16}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                disabled={saving}
                required
              />
            </div>
          </div>
        </form>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          {onAddAction && (
            <Button
              type="button"
              onClick={() => onAddAction({
                title,
                date,
                content,
                participants,
              })}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ação
            </Button>
          )}
          <div className={`flex gap-3 ${!onAddAction ? 'ml-auto' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar ATA
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
