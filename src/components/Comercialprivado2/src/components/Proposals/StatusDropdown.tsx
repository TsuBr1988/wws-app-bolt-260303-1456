import React, { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatTimestampForDb } from '../../utils/dateUtils';

interface StatusDropdownProps {
  currentStatus: string;
  proposalId: string;
  proposalClient: string;
  onStatusChange: () => void;
  readOnly?: boolean;
}

const statusOptions = [
  { value: 'SQL', label: 'SQL', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'Proposta', label: 'Proposta', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Negociação', label: 'Negociação', color: 'bg-blue-100 text-blue-800' },
  { value: 'Análise de contrato', label: 'Análise de contrato', color: 'bg-purple-100 text-purple-800' },
  { value: 'Fechado', label: 'Fechado', color: 'bg-green-100 text-green-800' },
  { value: 'Perdido', label: 'Perdido', color: 'bg-red-100 text-red-800' }
];

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  proposalId,
  proposalClient,
  onStatusChange,
  readOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === currentStatus || readOnly) return;

    setIsUpdating(true);
    try {
      console.log('🔄 Atualizando status da proposta:', {
        proposalId,
        oldStatus: currentStatus,
        newStatus,
        client: proposalClient
      });

      // 1. Atualizar status da proposta
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Auto-definir datas baseado no status
      if (newStatus === 'Fechado' && currentStatus !== 'Fechado') {
        updateData.closing_date = formatTimestampForDb(new Date().toISOString().split('T')[0]);
      } else if (newStatus !== 'Fechado') {
        updateData.closing_date = null;
      }

      if (newStatus === 'Perdido' && currentStatus !== 'Perdido') {
        updateData.lost_date = formatTimestampForDb(new Date().toISOString().split('T')[0]);
        updateData.lost_reason = 'Fechou com concorrente'; // Padrão
      } else if (newStatus !== 'Perdido') {
        updateData.lost_date = null;
        updateData.lost_reason = null;
      }

      const { error: updateError } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', proposalId);

      if (updateError) throw updateError;

      // 2. Adicionar entrada no histórico
      const { error: historyError } = await supabase
        .from('proposal_status_history')
        .insert({
          proposal_id: proposalId,
          old_status: currentStatus,
          new_status: newStatus,
          changed_by: 'Sistema', // Pode ser melhorado com usuário logado
          changed_at: new Date().toISOString(),
          notes: `Status alterado de "${currentStatus}" para "${newStatus}" via Dashboard`
        });

      if (historyError) {
        console.warn('Erro ao salvar histórico (não crítico):', historyError);
      }

      console.log('✅ Status atualizado com sucesso!');
      
      // Chamar callback para atualizar a interface
      onStatusChange();
      
      setIsOpen(false);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      alert(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (readOnly) {
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentOption.color}`}>
        {currentOption.label}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${currentOption.color} ${
          isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
        }`}
      >
        <span>{isUpdating ? 'Atualizando...' : currentOption.label}</span>
        {!isUpdating && <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && !isUpdating && (
        <>
          {/* Overlay para fechar o dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-200 mb-1">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Alterar status</span>
                </div>
              </div>
              
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusUpdate(option.value)}
                  className={`w-full text-left px-2 py-2 rounded text-sm transition-colors ${
                    option.value === currentStatus
                      ? `${option.color} cursor-default`
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  disabled={option.value === currentStatus}
                >
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                    {option.label}
                  </span>
                  {option.value === currentStatus && (
                    <span className="text-xs text-gray-500 ml-2">(atual)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};