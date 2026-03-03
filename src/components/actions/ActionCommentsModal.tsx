import { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { getDatabase } from '../../lib/databaseResolver';
import { useToast } from '../ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const supabase = getDatabase('ATAS');

interface Comment {
  id: string;
  action_id: string;
  author_name: string;
  comment_text: string;
  created_at: string;
}

interface ActionCommentsModalProps {
  actionId: string;
  actionDescription: string;
  onClose: () => void;
}

export function ActionCommentsModal({
  actionId,
  actionDescription,
  onClose,
}: ActionCommentsModalProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [actionId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('action_comments')
        .select('*')
        .eq('action_id', actionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Erro ao carregar comentários',
        description: 'Não foi possível carregar os comentários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorName.trim() || !commentText.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha seu nome e o comentário.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('action_comments').insert([
        {
          action_id: actionId,
          author_name: authorName.trim(),
          comment_text: commentText.trim(),
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Comentário adicionado!',
      });

      setCommentText('');
      fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: 'Erro ao adicionar comentário',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Comentários</h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {actionDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Nenhum comentário ainda
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Seja o primeiro a comentar!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 rounded-full p-2">
                      <div className="text-blue-600 font-bold text-sm">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {comment.author_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap ml-12">
                  {comment.comment_text}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu nome
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentário
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva seu comentário..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={submitting}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Fechar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
