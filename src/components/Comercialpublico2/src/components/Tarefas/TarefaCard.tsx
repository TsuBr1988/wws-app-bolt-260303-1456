import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Check, ChevronDown, ChevronRight, User } from 'lucide-react';
import { getDaysUntil, formatDateBR, formatTimeBR } from '../../utils/dateUtils';

interface Tarefa {
  id: string;
  nome: string;
  descricao?: string;
  status: 'A fazer' | 'Fazendo' | 'Feito';
  data_inclusao: string;
  data_prazo: string;
  criado_por: string;
  responsavel: string;
}

interface TarefaCardProps {
  tarefa: Tarefa;
  onUpdateStatus?: (tarefaId: string, newStatus: 'A fazer' | 'Fazendo' | 'Feito') => void;
  readOnly?: boolean;
}

export const TarefaCard: React.FC<TarefaCardProps> = ({ 
  tarefa, 
  onUpdateStatus,
  readOnly = false
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const diasRestantes = getDaysUntil(tarefa.data_prazo);
  
  const getUrgencyClass = () => {
    if (diasRestantes < 0) {
      return 'border-l-4 border-l-red-600 bg-red-50 border-red-200';
    } else if (diasRestantes === 0) {
      return 'border-l-4 border-l-orange-600 bg-orange-50 border-orange-200';
    } else if (diasRestantes <= 2) {
      return 'border-l-4 border-l-yellow-600 bg-yellow-50 border-yellow-200';
    } else if (tarefa.status === 'Fazendo') {
      return 'border-l-4 border-l-blue-600 bg-blue-50 border-blue-200';
    }
    return 'border-l-4 border-l-gray-400 bg-white border-gray-200';
  };

  const getUrgencyIcon = () => {
    if (diasRestantes < 0) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (diasRestantes === 0) {
      return <Clock className="w-4 h-4 text-orange-600 animate-pulse" />;
    } else if (diasRestantes <= 2) {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
    return <Calendar className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A fazer': return 'bg-gray-100 text-gray-800';
      case 'Fazendo': return 'bg-blue-100 text-blue-800';
      case 'Feito': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDaysRemaining = () => {
    if (diasRestantes < 0) return `Vencida há ${Math.abs(diasRestantes)} dias`;
    if (diasRestantes === 0) return 'Vence hoje!';
    if (diasRestantes === 1) return 'Vence amanhã';
    return `${diasRestantes} dias restantes`;
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className={`rounded-lg border transition-all hover:shadow-md ${getUrgencyClass()}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 line-clamp-2">{tarefa.nome}</h4>
            <div className="flex items-center space-x-2 mt-1">
              {getUrgencyIcon()}
              <span className={`text-sm font-medium ${
                diasRestantes < 0 ? 'text-red-600' :
                diasRestantes === 0 ? 'text-orange-600' :
                diasRestantes <= 2 ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {formatDaysRemaining()}
              </span>
            </div>
          </div>
          
          {/* Status Dropdown */}
          {onUpdateStatus && (
            <div className="ml-3">
              <select
                value={tarefa.status}
                onChange={(e) => onUpdateStatus(tarefa.id, e.target.value as any)}
                className={`px-2 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(tarefa.status)}`}
              >
                <option value="A fazer">A fazer</option>
                <option value="Fazendo">Fazendo</option>
                <option value="Feito">Feito</option>
              </select>
            </div>
          )}
          
          {!onUpdateStatus && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tarefa.status)}`}>
              {tarefa.status}
            </span>
          )}
        </div>

        {/* Data e Criador */}
        <div className="text-sm text-gray-600 space-y-1 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Prazo: {formatDateBR(tarefa.data_prazo)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>Por: {tarefa.criado_por}</span>
            </div>
          </div>
        </div>

        {/* Descrição (Expansível) */}
        {tarefa.descricao && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Descrição</span>
            </button>
            
            {expanded ? (
              <div className="mt-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
                {tarefa.descricao}
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-600">
                {truncateText(tarefa.descricao)}
              </div>
            )}
          </div>
        )}

        {/* Banner de Urgência */}
        {diasRestantes === 0 && (
          <div className="mt-3 bg-orange-100 border border-orange-300 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center space-x-1">
              <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
              <span className="text-sm font-bold text-orange-800">VENCE HOJE!</span>
            </div>
          </div>
        )}

        {diasRestantes < 0 && (
          <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-800">VENCIDA!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};