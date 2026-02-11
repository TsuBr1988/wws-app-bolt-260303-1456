import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useNotesCount } from '../../hooks/useProposalNotes';

interface ObservacoesButtonProps {
  proposalId: string;
  onClick: () => void;
  className?: string;
}

export const ObservacoesButton: React.FC<ObservacoesButtonProps> = ({ 
  proposalId, 
  onClick, 
  className = '' 
}) => {
  const { count } = useNotesCount(proposalId);
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 transition-colors ${className}`}
      title={`${count} observação${count !== 1 ? 'ões' : ''}`}
    >
      <MessageSquare className="w-4 h-4 text-gray-600" />
      <span className="text-gray-700 font-medium">Obs.</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold text-white bg-red-600 shadow-lg">
          {count}
        </span>
      )}
    </button>
  );
};