import { Package, Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MaterialModal, MaterialData } from '../MaterialModal';
import { AllocateFunctionsModal } from '../AllocateFunctionsModal';
import { supabase } from '../../lib/supabase';
import { moeda } from '../../utils';

interface OthersTabProps {
  activeBudget: any;
}

interface OtherItem extends MaterialData {
  id: string;
  budget_id: string;
  created_at: string;
  updated_at: string;
}

export const OthersTab = ({ activeBudget }: OthersTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [others, setOthers] = useState<OtherItem[]>([]);
  const [budgetFunctions, setBudgetFunctions] = useState<any[]>([]);
  const [editingOther, setEditingOther] = useState<OtherItem | undefined>();
  const [allocatingOther, setAllocatingOther] = useState<OtherItem | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeBudget?.id) {
      loadOthers();
      loadBudgetFunctions();
    }
  }, [activeBudget]);

  const loadOthers = async () => {
    if (!activeBudget?.id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('others')
      .select('*')
      .eq('budget_id', activeBudget.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar outros itens:', error);
    } else {
      setOthers(data || []);
    }
    setIsLoading(false);
  };

  const loadBudgetFunctions = async () => {
    if (!activeBudget?.id) return;

    const { data, error } = await supabase
      .from('budget_functions')
      .select('*')
      .eq('budget_id', activeBudget.id)
      .order('created_at', { ascending: true});

    if (error) {
      console.error('Erro ao carregar funções:', error);
    } else {
      setBudgetFunctions(data || []);
    }
  };

  const handleSaveOther = async (itemData: MaterialData) => {
    if (!activeBudget?.id) return;

    const dataToSave = {
      name: itemData.name,
      brand: itemData.brand,
      quantity: itemData.quantity,
      unit_value: itemData.unit_value,
      total_value: itemData.total_value,
      amortization: itemData.amortization,
      monthly_value: itemData.monthly_value,
      allocated_functions: itemData.allocated_functions || [],
    };

    if (editingOther) {
      const { error } = await supabase
        .from('others')
        .update({
          ...dataToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingOther.id);

      if (error) {
        console.error('Erro ao atualizar item:', error);
        alert('Erro ao atualizar item');
      } else {
        loadOthers();
        setEditingOther(undefined);
      }
    } else {
      const { error } = await supabase.from('others').insert({
        budget_id: activeBudget.id,
        ...dataToSave,
      });

      if (error) {
        console.error('Erro ao adicionar item:', error);
        alert('Erro ao adicionar item');
      } else {
        loadOthers();
      }
    }
  };

  const handleEditOther = (item: OtherItem) => {
    setEditingOther(item);
    setIsModalOpen(true);
  };

  const handleDeleteOther = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    const { error } = await supabase.from('others').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item');
    } else {
      loadOthers();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOther(undefined);
  };

  const handleOpenAllocateModal = (item: OtherItem) => {
    setAllocatingOther(item);
    setIsAllocateModalOpen(true);
  };

  const handleCloseAllocateModal = () => {
    setIsAllocateModalOpen(false);
    setAllocatingOther(undefined);
  };

  const handleSaveAllocation = async (functionIds: string[]) => {
    if (!allocatingOther) return;

    const { error } = await supabase
      .from('others')
      .update({
        allocated_functions: functionIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', allocatingOther.id);

    if (error) {
      console.error('Erro ao atualizar alocação:', error);
      alert('Erro ao atualizar alocação das funções');
    } else {
      loadOthers();
    }
  };

  const totalMonthly = others.reduce((sum, item) => sum + item.monthly_value, 0);

  if (!activeBudget) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={40} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">
            Nenhum orçamento ativo
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Crie ou selecione um orçamento para gerenciar outros itens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Outros</h2>
            <p className="text-slate-600 mt-1">
              Gerencie outros itens necessários para o orçamento - O valor total será rateado pelo numero de colaboradores
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            <Plus size={20} />
            Incluir Item
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Carregando itens...</p>
          </div>
        ) : others.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Nenhum item cadastrado
            </h3>
            <p className="text-slate-600">
              Clique em "Incluir Item" para adicionar o primeiro item
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Marca
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      Qtd
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      Valor Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      Valor Total
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      Amortização
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      Valor Mensal
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      Funções
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {others.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.brand || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">
                        {moeda(item.unit_value)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">
                        {moeda(item.total_value)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">
                        {item.amortization} meses
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                        {moeda(item.monthly_value)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => handleOpenAllocateModal(item)}
                          className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                          title="Clique para configurar as funções"
                        >
                          {(() => {
                            const allocatedFunctions = (item as any).allocated_functions || [];
                            const totalFunctions = budgetFunctions.length;

                            if (allocatedFunctions.length === 0) {
                              return (
                                <>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                                    Todas ({totalFunctions})
                                  </span>
                                  <Settings size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </>
                              );
                            }

                            return (
                              <>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition-colors">
                                  {allocatedFunctions.length} de {totalFunctions}
                                </span>
                                <Settings size={14} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                              </>
                            );
                          })()}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditOther(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteOther(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td colSpan={6} className="px-4 py-4 text-right font-bold text-slate-800">
                      TOTAL MENSAL DE OUTROS:
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-blue-600 text-lg">
                      {moeda(totalMonthly)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      <MaterialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveOther}
        material={editingOther}
        budgetFunctions={budgetFunctions}
      />

      <AllocateFunctionsModal
        isOpen={isAllocateModalOpen}
        onClose={handleCloseAllocateModal}
        onSave={handleSaveAllocation}
        budgetFunctions={budgetFunctions}
        selectedFunctions={(allocatingOther as any)?.allocated_functions || []}
        materialName={allocatingOther?.name || ''}
        onFunctionDeleted={loadBudgetFunctions}
      />
    </div>
  );
};
