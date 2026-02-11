import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, Users } from 'lucide-react';
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

interface AddCommercialGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: CommercialGoal | null;
  employees: any[];
}

export const AddCommercialGoalModal: React.FC<AddCommercialGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  employees
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    prize: '',
    targetType: 'points' as 'points' | 'sales' | 'mql' | 'visitas_agendadas' | 'contratos_assinados' | 'pontos_educacao' | 'valores_mensais_contratos',
    targetValue: 0,
    participantsIds: [] as string[]
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        startDate: goal.startDate,
        endDate: goal.endDate,
        prize: goal.prize,
        targetType: goal.targetType,
        targetValue: goal.targetValue,
        participantsIds: goal.participantsIds || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        prize: '',
        targetType: 'points',
        targetValue: 0,
        participantsIds: []
      });
    }
  }, [goal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('O título da meta é obrigatório');
      return;
    }

    if (!formData.endDate) {
      alert('A data final da meta é obrigatória');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('A data final deve ser posterior à data inicial');
      return;
    }

    if (formData.targetValue <= 0) {
      alert('O valor da meta deve ser maior que zero');
      return;
    }

    if (!formData.prize.trim()) {
      alert('A descrição do prêmio/reconhecimento é obrigatória');
      return;
    }

    setLoading(true);

    try {
      const goalData = {
        title: formData.title,
        description: formData.description || null,
        start_date: formData.startDate,
        end_date: formData.endDate,
        prize: formData.prize,
        target_type: formData.targetType,
        target_value: formData.targetValue,
        participants_ids: formData.participantsIds.length > 0 ? formData.participantsIds : null,
        status: 'active' as const
      };

      if (goal && goal.id) {
        await commercialGoalsService.updateGoal(goal.id, goalData);
        alert('Meta comercial atualizada com sucesso!');
      } else {
        await commercialGoalsService.createGoal(goalData);
        alert('Meta comercial criada com sucesso!');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar meta comercial:', error);
      alert(`Erro ao salvar meta comercial: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantToggle = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      participantsIds: prev.participantsIds.includes(employeeId)
        ? prev.participantsIds.filter(id => id !== employeeId)
        : [...prev.participantsIds, employeeId]
    }));
  };

  const targetTypeOptions = [
    { value: 'points', label: 'Pontos' },
    { value: 'sales', label: 'Vendas (R$)' },
    { value: 'valores_mensais_contratos', label: 'Valores Mensais de Contratos' },
    { value: 'mql', label: 'MQL (Marketing Qualified Leads)' },
    { value: 'visitas_agendadas', label: 'Visitas Agendadas' },
    { value: 'contratos_assinados', label: 'Contratos Assinados' },
    { value: 'pontos_educacao', label: 'Pontos de Educação' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {goal ? 'Editar Meta Comercial' : 'Nova Meta Comercial'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Meta *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Meta de Vendas Q1 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Descreva os detalhes da meta comercial..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Início *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Final *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Meta *
              </label>
              <select
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {targetTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor da Meta *
              </label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Prêmio/Reconhecimento *
            </label>
            <input
              type="text"
              value={formData.prize}
              onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Bônus de R$ 5.000 ou Viagem para o vencedor"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users className="w-4 h-4 inline mr-1" />
              Participantes (deixe em branco para incluir todos)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {employees.filter(emp => emp.role !== 'Admin').map(employee => (
                <label
                  key={employee.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={formData.participantsIds.includes(employee.id)}
                    onChange={() => handleParticipantToggle(employee.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{employee.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.participantsIds.length === 0
                ? 'Todos os funcionários participarão desta meta'
                : `${formData.participantsIds.length} participante(s) selecionado(s)`
              }
            </p>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{goal ? 'Atualizar Meta' : 'Criar Meta'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
