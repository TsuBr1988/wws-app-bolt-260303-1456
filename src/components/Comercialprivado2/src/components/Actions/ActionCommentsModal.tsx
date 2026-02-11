import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Action, ActionComment, actionsService } from '../../services/actionsService';

interface ActionCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action | null;
}

export const ActionCommentsModal: React.FC<ActionCommentsModalProps> = ({
  isOpen,
  onClose,
  action
}) => {
  const [comments, setComments] = useState<ActionComment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (action && isOpen) {
      loadComments();
    }
  }, [action, isOpen]);

  const loadComments = async () => {
    if (!action) return;

    try {
      setLoading(true);
      const data = await actionsService.getCommentsByActionId(action.id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action || !authorName.trim() || !commentText.trim()) return;

    try {
      setSubmitting(true);
      await actionsService.createComment({
        action_id: action.id,
        author_name: authorName.trim(),
        comment_text: commentText.trim()
      });
      setCommentText('');
      await loadComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Erro ao adicionar comentário');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Comentários
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <p className="text-sm text-gray-900 font-medium">{action.descricao}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </div>
          ) : (
            comments.map(comment => {
              const initial = comment.author_name.charAt(0).toUpperCase();
              return (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {initial}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(parseISO(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.comment_text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200 space-y-3">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <button
              type="submit"
              disabled={submitting || !authorName.trim() || !commentText.trim()}
              className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
