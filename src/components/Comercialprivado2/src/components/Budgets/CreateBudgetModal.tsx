/**
 * Componente: CreateBudgetModal
 * 
 * Propósito: Modal para criação e edição de orçamentos
 * - Formulário de dados básicos do orçamento
 * - Criação de postos dentro do orçamento
 * - Estrutura modular com 8 blocos por posto
 * - Interface para adicionar cargos personalizados
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, ClipboardList, Users, Clock, CheckCircle } from 'lucide-react';
import { budgetsSupabase } from './budgetsSupabase';
import { useBudgetsSupabaseQuery, useBudgetsSupabaseInsert, clearBudgetsQueryCache } from './useBudgetsSupabase';
import { AddPositionModal } from './AddPositionModal';

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: any | null;
}

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  onClose,
  budget
}) => {
  const [loading, setLoading] = useState(false);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null);
  
  const { insert: insertBudget } = useBudgetsSupabaseInsert('budgets');

  const [formData, setFormData] = useState({
    nome: ''
  });

  // Buscar postos do orçamento atual
  const { data: positions = [], refetch: refetchPositions } = useBudgetsSupabaseQuery('budget_posts', {
    filter: currentBudgetId ? { budget_id: currentBudgetId } : undefined,
    select: 'id, post_name, role_id, scale_id, turn_id, city_id, salary_additions, total_cost, created_at',
    orderBy: { column: 'created_at', ascending: true }
  });

  // Carregar dados do orçamento para edição
  useEffect(() => {
    if (budget) {
      setFormData({
        nome: budget.nome || ''
      });
      setCurrentBudgetId(budget.id);
    } else {
      setFormData({
        nome: ''
      });
      setCurrentBudgetId(null);
    }
  }, [budget]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gerar número sequencial único (pode ser melhorado com sequence no banco)
      const budgetNumber = Math.floor(Math.random() * 1000000) + 100000; // 6 dígitos
      
      const budgetData = {
        client: formData.nome,
        project_name: formData.nome,
        budget_number: budgetNumber,
        total_value: 0, // Será calculado quando postos forem adicionados
        status: 'Rascunho' as const
      };

      if (budget && budget.id) {
        // Atualizar orçamento existente
        const { data: updatedBudget, error: updateError } = await budgetsSupabase
          .from('budgets')
          .update({
            client: budgetData.client,
            project_name: budgetData.project_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', budget.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        console.log('🔄 Orçamento atualizado:', updatedBudget);
        setCurrentBudgetId(budget.id);
        alert('✅ Orçamento atualizado com sucesso!');
      } else {
        // Criar novo orçamento
        console.log('➕ Criando novo orçamento no Supabase:', budgetData);

        const { data: newBudget, error: insertError } = await budgetsSupabase
          .from('budgets')
          .insert(budgetData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        
        console.log('✅ Orçamento criado com UUID:', newBudget);
        
        // Usar o UUID real retornado pelo Supabase
        setCurrentBudgetId(newBudget.id);
        
        alert(`✅ Orçamento criado com sucesso!\n\n📋 ID: ${newBudget.id}\n🔢 Número: #${newBudget.budget_number}\n\n➡️ Agora você pode adicionar postos ao orçamento.`);
      }
      
      // Limpar cache para atualizar a lista
      clearBudgetsQueryCache('budgets');
      
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert(`❌ Erro ao salvar orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = () => {
    if (!currentBudgetId) {
      alert('⚠️ Salve o orçamento primeiro antes de adicionar postos.');
      return;
    }
    setShowAddPositionModal(true);
  };

  const handlePositionAdded = (totalCost: number) => {
    console.log('🔄 Posto adicionado com custo:', totalCost);
    refetchPositions();
    setShowAddPositionModal(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {budget ? 'Editar Orçamento' : 'Novo Orçamento'}
                </h2>
                <p className="text-sm text-gray-600">Configure os dados básicos e adicione postos</p>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Básicos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Orçamento
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ex: Serviços de Segurança - Empresa ABC"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (budget ? 'Atualizar Orçamento' : 'Criar Orçamento')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>

            {/* Seção de Postos (só aparece se orçamento já foi salvo) */}
            {currentBudgetId && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Postos do Orçamento</h3>
                    <p className="text-sm text-gray-600">Cada posto possui 8 blocos de cálculo</p>
                  </div>
                  <button
                    onClick={handleAddPosition}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Posto</span>
                  </button>
                </div>

                {positions.length > 0 ? (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {positions.map((position, index) => (
                      <div key={position.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {index + 1}. {position.post_name}
                            </h4>
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              <div>📅 Criado: {new Date(position.created_at).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(position.total_cost || 0)}
                            </div>
                            <div className="text-sm text-gray-500">Custo calculado</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum posto adicionado</h4>
                    <p className="text-sm text-gray-500">
                      Clique em "Adicionar Posto\" para começar a construir o orçamento
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Posto */}
      {showAddPositionModal && currentBudgetId && (
        <AddPositionModal
          isOpen={showAddPositionModal}
          onClose={() => setShowAddPositionModal(false)}
          budgetId={currentBudgetId}
          onPositionAdded={handlePositionAdded}
        />
      )}
    </>
  );
};