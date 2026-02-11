import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, CheckCircle2 } from 'lucide-react';
import { commercialGoalsService } from '../../services/commercialGoalsService';

type CommercialGoal = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  prize: string;
  targetType: 'points' | 'sales' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao' | 'valores_mensais_contratos';
  targetValue: number;
  status: 'active' | 'completed' | 'expired';
  participantsIds?: string[];
  winnerIds?: string[];
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
};

interface AssignWinnersModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: CommercialGoal;
  employees: any[];
}

export const AssignWinnersModal: React.FC<AssignWinnersModalProps> = ({
  isOpen,
  onClose,
  goal,
  employees
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);

  useEffect(() => {
    if (goal.winnerIds) {
      setSelectedWinners(goal.winnerIds);
    } else {
      setSelectedWinners([]);
    }
  }, [goal]);

  if (!isOpen) return null;

  const eligibleParticipants = goal.participantsIds && goal.participantsIds.length > 0
    ? employees.filter(emp => goal.participantsIds!.includes(emp.id))
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
      await commercialGoalsService.assignWinners(goal.id, selectedWinners);
      alert(`Vencedor(es) atribuído(s) com sucesso à meta "${goal.title}"!`);
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir vencedores:', error);
      alert(`Erro ao atribuir vencedores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Atribuir Vencedores
              </h2>
              <p className="text-sm text-gray-600">{goal.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Trophy className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Prêmio: {goal.prize}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Selecione um ou mais vencedores que alcançaram a meta
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users className="w-4 h-4 inline mr-1" />
              Selecione os Vencedores *
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {eligibleParticipants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum participante elegível encontrado</p>
                </div>
              ) : (
                eligibleParticipants.map(employee => (
                  <label
                    key={employee.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedWinners.includes(employee.id)
                        ? 'bg-green-50 border-2 border-green-500'
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedWinners.includes(employee.id)}
                        onChange={() => handleWinnerToggle(employee.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-5 h-5"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.role}</p>
                      </div>
                    </div>
                    {selectedWinners.includes(employee.id) && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedWinners.length === 0
                ? 'Nenhum vencedor selecionado'
                : selectedWinners.length === 1
                ? '1 vencedor selecionado'
                : `${selectedWinners.length} vencedores selecionados`
              }
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Trophy className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                Após atribuir os vencedores, eles ficarão registrados permanentemente nesta meta comercial.
                Você pode atribuir múltiplos vencedores se necessário.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={loading || selectedWinners.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  <span>Confirmar Vencedores</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
