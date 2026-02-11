import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Plus, Trash2, Clock, User } from 'lucide-react';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseDelete } from '../../hooks/useSupabase';
import { displayDateTime } from '../../utils/dateUtils';

interface ProposalCommentsModalProps {
  proposalId: string | null;
  proposalClient: string;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

// UUID validation utility
function isUUID(v?: string | null): boolean {
  return !!v && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
}

export const ProposalCommentsModal: React.FC<ProposalCommentsModalProps> = ({
  proposalId,
  proposalClient,
  isOpen,
  onClose,
  readOnly = false
}) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Always call hooks - never conditional
  const { data: comments = [], loading, refetch } = useSupabaseQuery('proposal_comments', {
    filter: isUUID(proposalId) ? { proposal_id: proposalId } : undefined,
    orderBy: { column: 'commented_at', ascending: false }
  });

  const { insert: insertComment } = useSupabaseInsert('proposal_comments');
  const { deleteRecord: deleteComment } = useSupabaseDelete('proposal_comments');

  // Always render the same structure - control visibility with CSS
  const modalContent = (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
      isOpen ? 'block' : 'hidden'
    }`} onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Observações</h2>
              <p className="text-sm text-gray-600">{proposalClient}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fechar observações"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {comment.created_by || 'Sistema'}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{displayDateTime(comment.commented_at)}</span>
                          </div>
                        </div>
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => handleDeleteComment(comment.id, comment.content)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir comentário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {comment.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma observação</h3>
                  <p className="text-gray-500">
                    {readOnly 
                      ? 'Esta proposta ainda não possui observações.'
                      : 'Adicione observações importantes sobre esta proposta.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={handleAddComment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Observação
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Digite sua observação sobre esta proposta..."
                  disabled={isAddingComment}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    Mínimo 3 caracteres, máximo 1000
                  </p>
                  <p className="text-xs text-gray-500">
                    {newComment.length}/1000
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isAddingComment}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isAddingComment || newComment.trim().length < 3}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingComment ? 'Adicionando...' : 'Adicionar Observação'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isUUID(proposalId)) {
      alert('❌ ID da proposta inválido. Não é possível adicionar comentários.');
      return;
    }
    
    if (!newComment.trim()) {
      alert('Digite um comentário antes de adicionar.');
      return;
    }

    if (newComment.trim().length < 3) {
      alert('O comentário deve ter pelo menos 3 caracteres.');
      return;
    }

    setIsAddingComment(true);
    
    try {
      await insertComment({
        proposal_id: proposalId!,
        content: newComment.trim(),
        created_by: 'Sistema',
        commented_at: new Date().toISOString()
      });

      setNewComment('');
      await refetch();
      
    } catch (error) {
      console.error('❌ Erro ao adicionar comentário:', error);
      alert(`Erro ao adicionar comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsAddingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string, commentContent: string) {
    const confirmMessage = `⚠️ EXCLUIR COMENTÁRIO\n\nTem certeza que deseja excluir este comentário?\n\n"${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}"\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR') {
      try {
        await deleteComment(commentId);
        await refetch();
        alert('✅ Comentário excluído com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao excluir comentário:', error);
        alert(`❌ Erro ao excluir comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return modalContent;
};