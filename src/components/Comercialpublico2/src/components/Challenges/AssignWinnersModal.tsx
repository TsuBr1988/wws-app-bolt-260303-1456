import React, { useState } from 'react';
import { X, Users, Star } from 'lucide-react';
import { Challenge } from '../../types';
import { challengeService } from '../../services/challengeService';

interface AssignWinnersModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  employees: any[];
}

export const AssignWinnersModal: React.FC<AssignWinnersModalProps> = ({
  isOpen,
  onClose,
  challenge,
  employees
}) => {
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Filtrar funcionários elegíveis (participantes do desafio)
  const eligibleEmployees = challenge.participantsIds && challenge.participantsIds.length > 0
    ? employees.filter(emp => challenge.participantsIds!.includes(emp.id))
    : employees.filter(emp => emp.role !== 'Admin');

  const handleWinnerToggle = (employeeId: string) => {
    setSelectedWinners(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedWinners.length === 0) {
      alert('Selecione pelo menos um vencedor');
      return;
    }

    setLoading(true);
    
    try {
      await challengeService.assignWinners(challenge.id, selectedWinners);
      alert(`✅ Vencedor${selectedWinners.length > 1 ? 'es' : ''} atribuído${selectedWinners.length > 1 ? 's' : ''} com sucesso!`);
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir vencedores:', error);
      alert(`❌ Erro ao atribuir vencedores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Atribuir Vencedores</h2>
              <p className="text-sm text-gray-600">{challenge.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Desafio Concluído!</span>
              </div>
              <p className="text-sm text-green-700">
                A meta de <strong>
                  {
                    challenge.targetType === 'points' ? `${challenge.targetValue.toLocaleString()} pontos` :
                    challenge.targetType === 'sales' ? `R$ ${challenge.targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                    challenge.targetType === 'mql' ? `${challenge.targetValue.toLocaleString()} MQLs` :
                    challenge.targetType === 'visitas_agendadas' ? `${challenge.targetValue.toLocaleString()} visitas agendadas` :
                    `${challenge.targetValue.toLocaleString()} contratos assinados`
                  }
                </strong> foi atingida. Selecione quem são os vencedores deste desafio.
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecionar Vencedores *
            </label>
            
            <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {eligibleEmployees.map(employee => (
                  <label key={employee.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedWinners.includes(employee.id)}
                      onChange={() => handleWinnerToggle(employee.id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.role} • {employee.department}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {selectedWinners.length > 0 && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                {selectedWinners.length} vencedor{selectedWinners.length > 1 ? 'es' : ''} selecionado{selectedWinners.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || selectedWinners.length === 0}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Confirmar Vencedores'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};