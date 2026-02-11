import React, { useState } from 'react';
import { X, MessageSquare, Send, User, Clock, FileText } from 'lucide-react';
import { Notificacao } from '../../types/notificacao';
import { formatDateTimeLocal, badgeByDeadline, colorBySituacao } from '../../utils/datetime';

interface NotificacaoDetalhesModalProps {
  item: Notificacao;
  onClose: () => void;
  onSaveDetalhes: (id: string, detalhes: string) => Promise<void> | void;
}

export const NotificacaoDetalhesModal: React.FC<NotificacaoDetalhesModalProps> = ({ 
  item, 
  onClose, 
  onSaveDetalhes 
}) => {
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);
  
  const deadlineBadge = badgeByDeadline(item.data_limite);
  const situacaoColor = colorBySituacao(item.situacao);

  const handleAddDetalhes = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!texto.trim()) return;
    
    setSaving(true);
    try {
      const timestamp = formatDateTimeLocal(new Date().toISOString());
      const novoDetalhes = (item.detalhes || '') + 
        (item.detalhes ? '\n\n' : '') + 
        `[${timestamp}] ${texto.trim()}`;
      
      await onSaveDetalhes(item.id, novoDetalhes);
      setTexto('');
    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
      alert('❌ Erro ao salvar detalhes. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{item.cliente}</h2>
              <p className="text-sm text-gray-600">{item.assunto}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Status Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Recebido</span>
              </div>
              <div className="text-sm text-gray-900">
                {formatDateTimeLocal(item.data_recebimento)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Limite</span>
              </div>
              <div className="text-sm text-gray-900">
                {formatDateTimeLocal(item.data_limite)}
              </div>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${deadlineBadge.cls}`}>
                  {deadlineBadge.label}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Situação</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${situacaoColor}`}>
                {item.situacao}
              </span>
            </div>
          </div>

          {/* Chat/Details Area */}
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Histórico de Detalhes</span>
            </h4>
            
            {item.detalhes ? (
              <div className="text-sm text-gray-700">
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                  {item.detalhes}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum detalhe registrado ainda.</p>
              </div>
            )}
          </div>

          {/* Add Details Form */}
          <form onSubmit={handleAddDetalhes} className="flex gap-3">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adicionar detalhes ou observações..."
              disabled={saving}
            />
            <button
              type="submit"
              disabled={!texto.trim() || saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Adicionar'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};