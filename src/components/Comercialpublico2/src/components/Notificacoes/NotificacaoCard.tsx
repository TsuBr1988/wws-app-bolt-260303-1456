import React, { useState } from 'react';
import { Calendar, Clock, User, Edit, Trash2, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { Notificacao, SituacaoNotificacao } from '../../types/notificacao';
import { badgeByDeadline, colorBySituacao, formatDateTimeLocal, formatDateLocal, daysDiffFromNow } from '../../utils/datetime';

interface NotificacaoCardProps {
  item: Notificacao;
  onEdit?: (item: Notificacao) => void;
  onDelete?: (id: string) => void;
  onChangeSituacao?: (id: string, situacao: SituacaoNotificacao) => void;
  onViewDetails?: (item: Notificacao) => void;
  readOnly?: boolean;
}

export const NotificacaoCard: React.FC<NotificacaoCardProps> = ({
  item,
  onEdit,
  onDelete,
  onChangeSituacao,
  onViewDetails,
  readOnly = false
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const deadlineBadge = badgeByDeadline(item.data_limite);
  const situacaoColor = colorBySituacao(item.situacao);
  const daysUntil = daysDiffFromNow(item.data_limite);

  const handleSituacaoChange = (novoSituacao: SituacaoNotificacao) => {
    if (!onChangeSituacao || readOnly) return;
    onChangeSituacao(item.id, novoSituacao);
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
      daysUntil < 0 ? 'border-red-300' :
      daysUntil <= 2 ? 'border-yellow-300' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{item.cliente}</h3>
          <p className="text-sm text-gray-700 mb-2">{item.assunto}</p>
          
          {/* Badges */}
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${deadlineBadge.cls}`}>
              {deadlineBadge.label}
            </span>
            
            {!readOnly && onChangeSituacao ? (
              <select
                value={item.situacao}
                onChange={(e) => handleSituacaoChange(e.target.value as SituacaoNotificacao)}
                className={`px-2 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${situacaoColor}`}
              >
                <option value="A fazer">A fazer</option>
                <option value="Feito">Feito</option>
                <option value="Não iremos responder">Não iremos responder</option>
              </select>
            ) : (
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${situacaoColor}`}>
                {item.situacao}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center space-x-1">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(item)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalhes"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dates and Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span><strong>Recebido:</strong> {formatDateLocal(item.data_recebimento)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span><strong>Limite:</strong> {formatDateTimeLocal(item.data_limite)}</span>
        </div>
      </div>

      {/* Expandable Details */}
      {item.detalhes && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-2"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>Detalhes</span>
          </button>
          
          {expanded ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
              <pre className="whitespace-pre-wrap font-sans">{item.detalhes}</pre>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {truncateText(item.detalhes)}
            </div>
          )}
        </div>
      )}

      {/* Urgency Alert */}
      {daysUntil <= 0 && item.situacao === 'A fazer' && (
        <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1">
            <Clock className="w-4 h-4 text-red-600" />
            <span className="text-sm font-bold text-red-800">PRAZO VENCIDO!</span>
          </div>
        </div>
      )}

      {daysUntil === 0 && item.situacao === 'A fazer' && (
        <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center space-x-1">
            <Clock className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="text-sm font-bold text-red-800">VENCE HOJE!</span>
          </div>
        </div>
      )}
    </div>
  );
};