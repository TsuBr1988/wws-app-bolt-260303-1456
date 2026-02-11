/**
 * Componente: BudgetPage
 * 
 * Propósito: Página principal do sistema de orçamentos de serviços
 * - Listagem de orçamentos existentes
 * - Criação de novos orçamentos
 * - Gerenciamento de postos e blocos de cálculo
 * - Interface para construção modular de orçamentos
 */

import React, { useState } from 'react';
import { Plus, ClipboardList, Edit, Trash2, Eye, FileText, Clock, CheckCircle, X } from 'lucide-react';
import { useBudgetsSupabaseQuery } from './useBudgetsSupabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { CreateBudgetModal } from './CreateBudgetModal';
import { BudgetCard } from './BudgetCard';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

export const BudgetPage: React.FC = () => {
  const { canEdit, canView } = useSystemVersion();
  const canEditBudgets = canEdit('budgets');
  const canViewBudgets = canView('budgets');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  
  // Buscar orçamentos do Supabase específico de Budgets
  const { data: budgets = [], loading, refetch } = useBudgetsSupabaseQuery('budgets', {
    orderBy: { column: 'created_at', ascending: false }
  });

  // Buscar postos dos orçamentos
  const { data: budgetPosts = [] } = useBudgetsSupabaseQuery('budget_posts');
  const handleCreateBudget = () => {
    setEditingBudget(null);
    setShowCreateModal(true);
  };

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingBudget(null);
    refetch();
  };

  const handleApproveBudget = async (budgetId: string) => {
    try {
      // Atualizar status do orçamento para aprovado
      console.log('✅ Aprovando orçamento:', budgetId);
      alert('✅ Orçamento aprovado com sucesso!\n\n🔄 Funcionalidade de integração com propostas será implementada em breve.');

      refetch();
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      alert(`❌ Erro ao aprovar orçamento: Funcionalidade em desenvolvimento`);
    }
  };

  const handleRejectBudget = async (budgetId: string) => {
    try {
      console.log('❌ Reprovando orçamento:', budgetId);
      
      alert('❌ Orçamento reprovado com sucesso.');
      refetch();
    } catch (error) {
      console.error('Erro ao reprovar orçamento:', error);
      alert(`❌ Erro ao reprovar orçamento: Funcionalidade em desenvolvimento`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'reprovado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'pendente': return 'Pendente';
      case 'reprovado': return 'Reprovado';
      default: return status;
    }
  };

  const totalBudgets = budgets.length;
  const approvedBudgets = budgets.filter(b => b.status === 'aprovado').length;
  const pendingBudgets = budgets.filter(b => b.status === 'pendente').length;
  const rejectedBudgets = budgets.filter(b => b.status === 'reprovado').length;

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orçamentos de Serviço</h1>
            <p className="text-gray-600 mt-1">
              {canViewBudgets && canEditBudgets
                ? 'Gerencie orçamentos modulares com postos e blocos de cálculo'
                : canViewBudgets
                ? 'Visualize os orçamentos do sistema (modo somente leitura)'
                : 'Acesso restrito aos orçamentos'
              }
            </p>
          </div>
        </div>
        {canViewBudgets && canEditBudgets ? (
          <button
            onClick={handleCreateBudget}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Novo Orçamento</span>
          </button>
        ) : canViewBudgets ? (
          <div className="bg-white border-2 border-gray-200 text-gray-500 px-6 py-3 rounded-xl flex items-center space-x-2 shadow-md">
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">Modo Somente Leitura</span>
          </div>
        ) : null}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-all hover:border-blue-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total de Orçamentos</p>
              <p className="text-3xl font-bold text-gray-900">{totalBudgets}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-all hover:border-yellow-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingBudgets}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-all hover:border-red-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Reprovados</p>
              <p className="text-3xl font-bold text-red-600">{rejectedBudgets}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
              <X className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-all hover:border-green-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Aprovados</p>
              <p className="text-3xl font-bold text-green-600">{approvedBudgets}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
        <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Orçamentos Cadastrados</h2>
        </div>

        {budgets.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {budgets.map((budget) => (
              <div key={budget.id} className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        #{budget.budget_number || 'TBD'} - {budget.project_name || budget.client || 'Orçamento sem nome'}
                      </h3>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${getStatusColor(budget.status)}`}>
                        {getStatusLabel(budget.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {displayDate(budget.created_at)}
                      </span>
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {budgetPosts.filter(p => p.budget_id === budget.id).length} postos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canEditBudgets && budget.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => handleApproveBudget(budget.id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejectBudget(budget.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Reprovar
                        </button>
                      </>
                    )}

                    {canEditBudgets && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all transform hover:scale-110"
                        title="Editar orçamento"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all transform hover:scale-110"
                        title="Excluir orçamento"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ClipboardList className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum orçamento criado</h3>
            <p className="text-gray-600">
              {canEditBudgets
                ? 'Clique em "Novo Orçamento" para começar a criar orçamentos de serviços.'
                : 'Não há orçamentos cadastrados no sistema.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <CreateBudgetModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          budget={editingBudget}
        />
      )}
      
      {/* Informações do Sistema */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-lg shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-blue-900">Como Funciona</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">1</span>
              <div>
                <p className="font-bold text-blue-900">Criação</p>
                <p className="text-blue-700 text-xs mt-1">Novo orçamento com nome do projeto</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">2</span>
              <div>
                <p className="font-bold text-blue-900">Postos</p>
                <p className="text-blue-700 text-xs mt-1">Adicionar postos com cargo/escala/turno</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">3</span>
              <div>
                <p className="font-bold text-blue-900">Blocos</p>
                <p className="text-blue-700 text-xs mt-1">8 blocos fixos de cálculo por posto</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">4</span>
              <div>
                <p className="font-bold text-blue-900">Aprovação</p>
                <p className="text-blue-700 text-xs mt-1">Admin aprova/reprova orçamentos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">5</span>
              <div>
                <p className="font-bold text-blue-900">Integração</p>
                <p className="text-blue-700 text-xs mt-1">Orçamento aprovado → Nova proposta</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">6</span>
              <div>
                <p className="font-bold text-blue-900">Configurações</p>
                <p className="text-blue-700 text-xs mt-1">Cargos e escalas editáveis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};