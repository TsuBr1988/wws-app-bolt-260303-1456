import React, { useState } from 'react';
import { Plus, FileText, Calendar, DollarSign, User, Edit, Trash2, Eye } from 'lucide-react';
import { OrcamentoForm } from './OrcamentoForm';
import { OrcamentoCard } from './OrcamentoCard';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseDelete } from '../../hooks/useSupabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { useYear } from '../../contexts/YearContext';

interface Orcamento {
  id: string;
  numero: string;
  cliente: string;
  descricao: string;
  valor_total: number;
  data_criacao: string;
  data_validade: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'revisao';
  observacoes?: string;
  criado_por: string;
  department: string;
  itens?: {
    id: string;
    funcao: string;
    salario: number;
    custos: { id: string; descricao: string; valor: number }[];
    total: number;
  }[];
  created_at: string;
  updated_at: string;
}

export const Orcamentos: React.FC = () => {
  const { selectedYear } = useYear();
  const { selectedDepartment } = useDepartment();
  const { canEdit } = useSystemVersion();
  const canEditOrcamentos = canEdit('orcamentos') || canEdit('proposals');
  
  const [showForm, setShowForm] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);
  const [filter, setFilter] = useState<'all' | 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'revisao'>('all');

  // Buscar orçamentos do banco (usando uma tabela que criaremos)
  const { data: orcamentos = [], loading, refetch } = useSupabaseQuery('orcamentos' as any, {
    orderBy: { column: 'created_at', ascending: false },
    includeDepartmentFilter: true
  });

  const { insert: insertOrcamento, loading: insertLoading } = useSupabaseInsert('orcamentos' as any);
  const { deleteRecord: deleteOrcamento, loading: deleteLoading } = useSupabaseDelete('orcamentos' as any);

  // Filtrar orçamentos por status
  const filteredOrcamentos = orcamentos.filter(orcamento => {
    const statusMatch = filter === 'all' || orcamento.status === filter;
    return statusMatch;
  });

  // Calcular estatísticas
  const stats = {
    total: filteredOrcamentos.length,
    rascunho: filteredOrcamentos.filter(o => o.status === 'rascunho').length,
    enviado: filteredOrcamentos.filter(o => o.status === 'enviado').length,
    aprovado: filteredOrcamentos.filter(o => o.status === 'aprovado').length,
    rejeitado: filteredOrcamentos.filter(o => o.status === 'rejeitado').length,
    valorTotal: filteredOrcamentos.reduce((sum, o) => sum + o.valor_total, 0)
  };

  const handleAddOrcamento = async (orcamentoData: Omit<Orcamento, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await insertOrcamento({
        ...orcamentoData,
        department: selectedDepartment
      });
      
      alert('✅ Orçamento criado com sucesso!');
      setShowForm(false);
      setEditingOrcamento(null);
      await refetch();
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      alert(`❌ Erro ao criar orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleEditOrcamento = (orcamento: Orcamento) => {
    setEditingOrcamento(orcamento);
    setShowForm(true);
  };

  const handleDeleteOrcamento = async (orcamentoId: string) => {
    const orcamento = orcamentos.find(o => o.id === orcamentoId);
    const confirmMessage = `⚠️ CONFIRMAR EXCLUSÃO\n\nTem certeza que deseja excluir o orçamento "${orcamento?.numero}"?\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR') {
      try {
        await deleteOrcamento(orcamentoId);
        alert('✅ Orçamento excluído com sucesso!');
        await refetch();
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error);
        alert(`❌ Erro ao excluir orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-gray-100 text-gray-800';
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'revisao': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Orçamentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Orçamentos {selectedYear}</h1>
          <p className="text-gray-600">
            Gerencie planilhas orçamentárias do {selectedDepartment} para {selectedYear}
          </p>
        </div>
        {canEditOrcamentos ? (
          <button
            onClick={() => setShowForm(true)}
            disabled={insertLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{insertLoading ? 'Criando...' : 'Novo Orçamento'}</span>
          </button>
        ) : (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Modo Somente Leitura</span>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Orçamentos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.valorTotal)}</p>
              <p className="text-xs text-gray-500">Orçamentos do ano</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold text-green-600">{stats.aprovado}</p>
              <p className="text-xs text-gray-500">Orçamentos aceitos</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.enviado + stats.revisao}</p>
              <p className="text-xs text-gray-500">Aguardando resposta</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Filtrar por status:</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="rascunho">Rascunho</option>
          <option value="enviado">Enviado</option>
          <option value="aprovado">Aprovado</option>
          <option value="rejeitado">Rejeitado</option>
          <option value="revisao">Em Revisão</option>
        </select>
        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          Mostrando {filteredOrcamentos.length} de {orcamentos.length} orçamentos
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Planilhas Orçamentárias</h2>
          <p className="text-sm text-gray-600">
            Gerencie suas planilhas de orçamento e propostas comerciais
          </p>
        </div>
        
        {filteredOrcamentos.length > 0 ? (
          <div className="space-y-4">
            {filteredOrcamentos.map((orcamento) => (
              <OrcamentoCard
                key={orcamento.id}
                orcamento={orcamento}
                onEdit={canEditOrcamentos ? handleEditOrcamento : undefined}
                onDelete={canEditOrcamentos ? handleDeleteOrcamento : undefined}
                readOnly={!canEditOrcamentos}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? (canEditOrcamentos ? 'Clique em "Novo Orçamento" para começar' : 'Não há orçamentos cadastrados')
                : `Não há orçamentos com status "${filter}"`
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && canEditOrcamentos && (
        <OrcamentoForm
          onClose={() => {
            setShowForm(false);
            setEditingOrcamento(null);
          }}
          onSubmit={handleAddOrcamento}
          editingOrcamento={editingOrcamento}
        />
      )}
    </div>
  );
};