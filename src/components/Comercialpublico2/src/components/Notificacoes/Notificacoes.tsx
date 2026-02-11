import React, { useState } from 'react';
import { Plus, Bell, Clock, AlertTriangle, CheckCircle, Filter, Search } from 'lucide-react';
import { useNotificacoes, sortDefault } from '../../hooks/useNotificacoes';
import { NotificacaoForm } from './NotificacaoForm';
import { NotificacaoCard } from './NotificacaoCard';
import { NotificacaoDetalhesModal } from './NotificacaoDetalhesModal';
import { Notificacao, SituacaoNotificacao } from '../../types/notificacao';
import { daysDiffFromNow } from '../../utils/datetime';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { useDepartment } from '../../contexts/DepartmentContext';

export const Notificacoes: React.FC = () => {
  const { selectedDepartment } = useDepartment();
  const { canEdit } = useSystemVersion();
  const canEditNotificacoes = canEdit('proposals'); // Usar mesma permissão das propostas
  
  const { items, loading, add, update, remove } = useNotificacoes();
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Notificacao | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Notificacao | null>(null);
  const [filterSituacao, setFilterSituacao] = useState<'all' | SituacaoNotificacao>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar e ordenar notificações
  const filteredItems = items.filter(item => {
    const situacaoMatch = filterSituacao === 'all' || item.situacao === filterSituacao;
    const searchMatch = searchTerm === '' || 
      item.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assunto.toLowerCase().includes(searchTerm.toLowerCase());
    
    return situacaoMatch && searchMatch;
  });

  const sortedItems = sortDefault(filteredItems);

  // Calcular indicadores
  const stats = {
    emAberto: items.filter(n => n.situacao === 'A fazer').length,
    vencemEm2Dias: items.filter(n => {
      const days = daysDiffFromNow(n.data_limite);
      return n.situacao === 'A fazer' && days >= 0 && days <= 2;
    }).length,
    vencemHoje: items.filter(n => {
      const days = daysDiffFromNow(n.data_limite);
      return n.situacao === 'A fazer' && days === 0;
    }).length,
    vencidas: items.filter(n => {
      const days = daysDiffFromNow(n.data_limite);
      return n.situacao === 'A fazer' && days < 0;
    }).length
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingItem) {
        await update(editingItem.id, formData);
        alert('✅ Notificação atualizada com sucesso!');
      } else {
        await add(formData);
        alert('✅ Notificação criada com sucesso!');
      }
      
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      alert('❌ Erro ao salvar notificação. Tente novamente.');
    }
  };

  const handleEdit = (item: Notificacao) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const item = items.find(n => n.id === id);
    const confirmMessage = `⚠️ CONFIRMAR EXCLUSÃO\n\nTem certeza que deseja excluir a notificação de "${item?.cliente}"?\n\nAssunto: ${item?.assunto}\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR') {
      try {
        await remove(id);
        alert('✅ Notificação excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
        alert('❌ Erro ao excluir notificação. Tente novamente.');
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const handleChangeSituacao = async (id: string, situacao: SituacaoNotificacao) => {
    try {
      await update(id, { situacao });
    } catch (error) {
      console.error('Erro ao atualizar situação:', error);
      alert('❌ Erro ao atualizar situação. Tente novamente.');
    }
  };

  const handleViewDetails = (item: Notificacao) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleSaveDetalhes = async (id: string, detalhes: string) => {
    try {
      await update(id, { detalhes });
      // Atualizar item selecionado para refletir mudanças no modal
      setSelectedItem(prev => prev ? { ...prev, detalhes } : null);
    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Notificações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações e Ofícios - {selectedDepartment}</h1>
          <p className="text-gray-600">
            {canEditNotificacoes 
              ? `Controle de notificações, ofícios e prazos de resposta do ${selectedDepartment}`
              : 'Visualize as notificações cadastradas (modo somente leitura)'
            }
          </p>
        </div>
        {canEditNotificacoes && (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Notificação</span>
          </button>
        )}
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Aberto</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.emAberto}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencem em 2 Dias</p>
              <p className="text-2xl font-bold text-orange-600">{stats.vencemEm2Dias}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencem Hoje</p>
              <p className="text-2xl font-bold text-red-600">{stats.vencemHoje}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{stats.vencidas}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou assunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Filtrar por situação:</span>
            <select
              value={filterSituacao}
              onChange={(e) => setFilterSituacao(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as situações</option>
              <option value="A fazer">A fazer</option>
              <option value="Feito">Feito</option>
              <option value="Não iremos responder">Não iremos responder</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {sortedItems.length} de {items.length} notificações
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-4">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => (
            <NotificacaoCard
              key={item.id}
              item={item}
              onEdit={canEditNotificacoes ? handleEdit : undefined}
              onDelete={canEditNotificacoes ? handleDelete : undefined}
              onChangeSituacao={canEditNotificacoes ? handleChangeSituacao : undefined}
              onViewDetails={handleViewDetails}
              readOnly={!canEditNotificacoes}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {searchTerm || filterSituacao !== 'all' ? (
                <Search className="w-8 h-8 text-gray-400" />
              ) : (
                <Bell className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterSituacao !== 'all'
                ? 'Nenhuma notificação encontrada'
                : 'Nenhuma notificação cadastrada'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterSituacao !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : canEditNotificacoes 
                  ? 'Clique em "Nova Notificação" para começar'
                  : 'Não há notificações cadastradas no sistema'
              }
            </p>
            {(searchTerm || filterSituacao !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSituacao('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && canEditNotificacoes && (
        <NotificacaoForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          title={editingItem ? 'Editar Notificação' : 'Nova Notificação'}
        />
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedItem && (
        <NotificacaoDetalhesModal
          item={selectedItem}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedItem(null);
          }}
          onSaveDetalhes={handleSaveDetalhes}
        />
      )}
    </div>
  );
};