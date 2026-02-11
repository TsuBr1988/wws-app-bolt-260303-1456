import React, { useState, useEffect } from 'react';
import { X, Award, Calendar, Target, DollarSign, Users } from 'lucide-react';
import { Challenge } from '../../types';
import { challengeService } from '../../services/challengeService';
import { useDepartment } from '../../contexts/DepartmentContext';

interface AddChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge?: Challenge | null;
  employees: any[];
}

export const AddChallengeModal: React.FC<AddChallengeModalProps> = ({
  isOpen,
  onClose,
  challenge,
  employees
}) => {
  const { selectedDepartment } = useDepartment();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    rewardAmount: '',
    targetType: 'sales' as 'sales' | 'monthly_value' | 'contratos_assinados',
    targetValue: 0,
    participantsIds: [] as string[]
  });

  // Carregar dados do desafio para edição
  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title,
        description: challenge.description || '',
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        rewardAmount: challenge.rewardAmount,
        targetType: challenge.targetType,
        targetValue: challenge.targetValue,
        participantsIds: challenge.participantsIds || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        rewardAmount: '',
        targetType: 'sales',
        targetValue: 0,
        participantsIds: []
      });
    }
  }, [challenge]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.title.trim()) {
      alert('O título do desafio é obrigatório');
      return;
    }
    
    if (!formData.endDate) {
      alert('A data final do desafio é obrigatória');
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
    
    if (!formData.rewardAmount.trim()) {
      alert('A descrição do prêmio é obrigatória');
      return;
    }

    setLoading(true);
    
    try {
      const challengeData = {
        title: formData.title,
        description: formData.description || null,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reward_amount: formData.rewardAmount,
        target_type: formData.targetType,
        target_value: formData.targetValue,
      participants_ids: formData.participantsIds.length > 0 ? formData.participantsIds : null,
      department: selectedDepartment
      };

      if (challenge && challenge.id) {
        await challengeService.updateChallenge(challenge.id, challengeData);
        alert('✅ Desafio atualizado com sucesso!');
      } else {
        await challengeService.createChallenge(challengeData);
        
        // Salvar timestamp de criação de novo desafio no localStorage
        localStorage.setItem('newChallengeCreatedAt', new Date().toISOString());
        
        alert('✅ Desafio criado com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar desafio:', error);
      
      // Log detalhado do erro para diagnóstico
      console.error('Erro completo:', {
        error: error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        supabaseError: error
      });
      
      // Mensagem de erro mais detalhada
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Se for erro do Supabase, tentar extrair mais informações
        if (error.message && typeof error === 'object') {
          const errorObj = error as any;
          
          if (errorObj.code) {
            errorMessage += ` (Código: ${errorObj.code})`;
          }
          
          if (errorObj.details) {
            errorMessage += ` | Detalhes: ${errorObj.details}`;
          }
          
          if (errorObj.hint) {
            errorMessage += ` | Dica: ${errorObj.hint}`;
          }
        }
      } else if (typeof error === 'object' && error !== null) {
        // Se for um objeto, tentar extrair informações úteis
        const errorObj = error as any;
        
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        } else {
          errorMessage = JSON.stringify(error, null, 2);
        }
      } else {
        errorMessage = String(error);
      }
      
      alert(`❌ Erro ao salvar desafio: ${errorMessage}\n\n🔍 Verifique o console do navegador (F12 > Console) para mais detalhes técnicos.`);
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

  const selectAllParticipants = () => {
    const nonAdminEmployees = employees.filter(emp => emp.role !== 'Admin');
    setFormData(prev => ({
      ...prev,
      participantsIds: nonAdminEmployees.map(emp => emp.id)
    }));
  };

  const clearAllParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participantsIds: []
    }));
  };

  const nonAdminEmployees = employees.filter(emp => emp.role !== 'Admin');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {challenge && challenge.id ? 'Editar Desafio' : 'Novo Desafio'}
              </h2>
              <p className="text-sm text-gray-600">Configure os parâmetros do desafio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título e Descrição */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Desafio *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Desafio de Vendas do Trimestre"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Detalhes adicionais sobre o desafio..."
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                min={formData.startDate}
                required
              />
            </div>
          </div>

          {/* Prêmio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prêmio *
            </label>
            <textarea
              value={formData.rewardAmount}
              onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Vale-presente de R$ 500, Dia de folga, Jantar em restaurante..."
              required
            />
          </div>

          {/* Tipo de Meta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Meta *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.targetType === 'sales'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="targetType"
                  value="sales"
                  checked={formData.targetType === 'sales'}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <DollarSign className={`w-5 h-5 ${formData.targetType === 'sales' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Vendas (Total)</div>
                    <div className="text-sm text-gray-600">Valor total dos contratos</div>
                  </div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.targetType === 'monthly_value'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="targetType"
                  value="monthly_value"
                  checked={formData.targetType === 'monthly_value'}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <DollarSign className={`w-5 h-5 ${formData.targetType === 'monthly_value' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Valor Mensal</div>
                    <div className="text-sm text-gray-600">Parcela mensal dos contratos</div>
                  </div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.targetType === 'contratos_assinados'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="targetType"
                  value="contratos_assinados"
                  checked={formData.targetType === 'contratos_assinados'}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <Award className={`w-5 h-5 ${formData.targetType === 'contratos_assinados' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Contratos Assinados</div>
                    <div className="text-sm text-gray-600">Fechamentos confirmados</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Valor da Meta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.targetType === 'sales' ? 'Valor de Vendas Alvo (Total) *' :
               formData.targetType === 'monthly_value' ? 'Valor Mensal Alvo *' :
               'Quantidade de Contratos *'}
            </label>
            <input
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              min="1"
              step={formData.targetType === 'sales' || formData.targetType === 'monthly_value' ? "0.01" : "1"}
              placeholder={
                formData.targetType === 'sales' ? "Ex: 50000" :
                formData.targetType === 'monthly_value' ? "Ex: 600000" :
                "Ex: 10"
              }
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.targetType === 'sales' ? 'Valor total em vendas fechadas no período' :
               formData.targetType === 'monthly_value' ? 'Valor mensal total dos contratos no período' :
               'Quantidade total de contratos assinados no período'
              }
            </p>
          </div>

          {/* Participantes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Participantes
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={selectAllParticipants}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Selecionar Todos
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAllParticipants}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                >
                  Limpar Seleção
                </button>
              </div>
            </div>
            
            <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto">
              {formData.participantsIds.length === 0 && (
                <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Todos os funcionários podem participar</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Deixe vazio para incluir todos, ou selecione funcionários específicos
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                {nonAdminEmployees.map(employee => (
                  <label key={employee.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.participantsIds.includes(employee.id)}
                      onChange={() => handleParticipantToggle(employee.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.role} • {employee.department}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {formData.participantsIds.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {formData.participantsIds.length} funcionário{formData.participantsIds.length > 1 ? 's' : ''} selecionado{formData.participantsIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-900 mb-2">Preview do Desafio</h4>
            <div className="text-sm text-orange-800 space-y-1">
              <p><strong>Meta:</strong> {
                formData.targetType === 'points' ? `${formData.targetValue} pontos` :
                formData.targetType === 'sales' ? `R$ ${formData.targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                formData.targetType === 'mql' ? `${formData.targetValue} MQLs` :
                formData.targetType === 'visitas_agendadas' ? `${formData.targetValue} visitas agendadas` :
                formData.targetType === 'pontos_educacao' ? `${formData.targetValue} pontos de educação` :
                `${formData.targetValue} contratos assinados`
              }</p>
              <p><strong>Período:</strong> {formData.startDate ? new Date(formData.startDate).toLocaleDateString('pt-BR') : '?'} até {formData.endDate ? new Date(formData.endDate).toLocaleDateString('pt-BR') : '?'}</p>
              <p><strong>Participantes:</strong> {formData.participantsIds.length === 0 ? 'Todos os funcionários' : `${formData.participantsIds.length} selecionados`}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : (challenge && challenge.id ? 'Atualizar Desafio' : 'Criar Desafio')}
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