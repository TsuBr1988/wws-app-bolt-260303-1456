import React, { useState } from 'react';
import { X, MessageSquare, Send, User, Clock } from 'lucide-react';
import { useNotesList } from '../../hooks/useProposalNotes';
import { formatDateTimeBR } from '../../utils/dateUtils';

interface ObservacoesModalProps {
  proposalId: string;
  orgaoName: string;
  authorName?: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ObservacoesModal: React.FC<ObservacoesModalProps> = ({
  proposalId,
  orgaoName,
  authorName,
  open,
  onClose,
  onSaved
}) => {
  const { notes, loading, addNote } = useNotesList(proposalId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    
    setSending(true);
    try {
      await addNote(text, authorName || 'Usuário');
      setText("");
      onSaved?.();
    } catch (error) {
      console.error('Erro ao enviar observação:', error);
      alert('❌ Erro ao enviar observação. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Observações</h2>
              <p className="text-sm text-gray-600">{orgaoName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] max-h-[400px]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {!loading && notes.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma observação ainda</h3>
              <p className="text-gray-500">Seja o primeiro a adicionar uma observação para esta licitação</p>
            </div>
          )}
          
          {!loading && notes.map((note) => (
            <div key={note.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {note.author_name || 'Usuário'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTimeBR(note.created_at)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {note.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Observação
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Digite sua observação... (Enter para enviar, Shift+Enter para quebrar linha)"
                disabled={sending}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Enviando...' : 'Enviar'}</span>
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium">Dica:</span> Use Enter para enviar ou Shift+Enter para quebrar linha
          </div>
        </div>
      </div>
    </div>
  );
};