import { Wrench, Plus, Edit, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EquipmentModal, EquipmentData } from '../EquipmentModal';
import { supabase } from '../../lib/supabase';
import { moeda } from '../../utils';

interface EquipmentsTabProps {
  activeBudget: any;
}

interface BudgetFunction {
  id: string;
  function_name: string;
  quantity: number;
}

interface Equipment extends EquipmentData {
  id: string;
  budget_id: string;
  function_id: string;
  created_at: string;
  updated_at: string;
}

export const EquipmentsTab = ({ activeBudget }: EquipmentsTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetFunctions, setBudgetFunctions] = useState<BudgetFunction[]>([]);
  const [equipmentsByFunction, setEquipmentsByFunction] = useState<Record<string, Equipment[]>>({});
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToAll, setIsAddingToAll] = useState(false);

  useEffect(() => {
    if (activeBudget?.id) {
      loadData();
    }
  }, [activeBudget]);

  const loadData = async () => {
    if (!activeBudget?.id) return;

    setIsLoading(true);

    const { data: functionsData, error: functionsError } = await supabase
      .from('budget_functions')
      .select('id, function_name, quantity')
      .eq('budget_id', activeBudget.id)
      .order('created_at', { ascending: true });

    if (functionsError) {
      console.error('Erro ao carregar funções:', functionsError);
    } else {
      setBudgetFunctions(functionsData || []);
      const allExpanded = new Set((functionsData || []).map(f => f.id));
      setExpandedFunctions(allExpanded);
    }

    const { data: equipmentsData, error: equipmentsError } = await supabase
      .from('equipments')
      .select('*')
      .eq('budget_id', activeBudget.id)
      .order('created_at', { ascending: false });

    if (equipmentsError) {
      console.error('Erro ao carregar equipamentos:', equipmentsError);
    } else {
      const groupedEquipments: Record<string, Equipment[]> = {};
      (equipmentsData || []).forEach((equipment: Equipment) => {
        if (equipment.function_id) {
          if (!groupedEquipments[equipment.function_id]) {
            groupedEquipments[equipment.function_id] = [];
          }
          groupedEquipments[equipment.function_id].push(equipment);
        }
      });
      setEquipmentsByFunction(groupedEquipments);
    }

    setIsLoading(false);
  };

  const handleSaveEquipment = async (equipmentData: EquipmentData) => {
    if (!activeBudget?.id) return;

    if (editingEquipment) {
      const { error } = await supabase
        .from('equipments')
        .update({
          name: equipmentData.name,
          brand: equipmentData.brand,
          quantity: equipmentData.quantity,
          unit_value: equipmentData.unit_value,
          total_value: equipmentData.total_value,
          amortization: equipmentData.amortization,
          monthly_value: equipmentData.monthly_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEquipment.id);

      if (error) {
        console.error('Erro ao atualizar equipamento:', error);
        alert('Erro ao atualizar equipamento');
      } else {
        loadData();
        setEditingEquipment(undefined);
      }
    } else if (isAddingToAll) {
      const equipmentsToInsert = budgetFunctions.map(func => ({
        budget_id: activeBudget.id,
        function_id: func.id,
        name: equipmentData.name,
        brand: equipmentData.brand,
        quantity: equipmentData.quantity,
        unit_value: equipmentData.unit_value,
        total_value: equipmentData.total_value,
        amortization: equipmentData.amortization,
        monthly_value: equipmentData.monthly_value,
      }));

      const { error } = await supabase.from('equipments').insert(equipmentsToInsert);

      if (error) {
        console.error('Erro ao adicionar equipamentos:', error);
        alert('Erro ao adicionar equipamentos a todas as funções');
      } else {
        loadData();
      }
    } else {
      if (!selectedFunctionId) return;

      const { error } = await supabase.from('equipments').insert({
        budget_id: activeBudget.id,
        function_id: selectedFunctionId,
        name: equipmentData.name,
        brand: equipmentData.brand,
        quantity: equipmentData.quantity,
        unit_value: equipmentData.unit_value,
        total_value: equipmentData.total_value,
        amortization: equipmentData.amortization,
        monthly_value: equipmentData.monthly_value,
      });

      if (error) {
        console.error('Erro ao adicionar equipamento:', error);
        alert('Erro ao adicionar equipamento');
      } else {
        loadData();
      }
    }
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setSelectedFunctionId(equipment.function_id);
    setIsModalOpen(true);
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) {
      return;
    }

    const { error } = await supabase.from('equipments').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir equipamento:', error);
      alert('Erro ao excluir equipamento');
    } else {
      loadData();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(undefined);
    setSelectedFunctionId('');
    setIsAddingToAll(false);
  };

  const handleAddEquipmentForFunction = (functionId: string) => {
    setSelectedFunctionId(functionId);
    setIsAddingToAll(false);
    setIsModalOpen(true);
  };

  const handleAddEquipmentToAll = () => {
    setIsAddingToAll(true);
    setSelectedFunctionId('');
    setIsModalOpen(true);
  };

  const toggleFunctionExpanded = (functionId: string) => {
    setExpandedFunctions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(functionId)) {
        newSet.delete(functionId);
      } else {
        newSet.add(functionId);
      }
      return newSet;
    });
  };

  const calculateTotalMonthly = () => {
    let total = 0;
    Object.values(equipmentsByFunction).forEach(equipments => {
      equipments.forEach(e => {
        total += e.monthly_value;
      });
    });
    return total;
  };

  if (!activeBudget) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench size={40} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">
            Nenhum orçamento ativo
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Crie ou selecione um orçamento para gerenciar equipamentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Equipamentos por Função</h2>
            <p className="text-slate-600 mt-1">
              Adicione e gerencie os equipamentos necessários para cada função do orçamento (valores para 1 funcionário)
            </p>
          </div>
          {budgetFunctions.length > 0 && (
            <button
              onClick={handleAddEquipmentToAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={16} />
              Adicionar Equipamento a Todos
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Carregando dados...</p>
          </div>
        ) : budgetFunctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Nenhuma função cadastrada
            </h3>
            <p className="text-slate-600">
              Adicione funções ao orçamento antes de cadastrar equipamentos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetFunctions.map((func) => {
              const equipments = equipmentsByFunction[func.id] || [];
              const isExpanded = expandedFunctions.has(func.id);
              const functionTotal = equipments.reduce((sum, e) => sum + e.monthly_value, 0);

              return (
                <div
                  key={func.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleFunctionExpanded(func.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">
                            {func.function_name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {func.quantity} {func.quantity === 1 ? 'funcionário' : 'funcionários'} •
                            {equipments.length} {equipments.length === 1 ? 'equipamento' : 'equipamentos'} cadastrado{equipments.length !== 1 ? 's' : ''}
                            {functionTotal > 0 && ` • Custo mensal (1 func.): ${moeda(functionTotal)}`}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-700">
                          Equipamentos desta função
                        </h4>
                        <button
                          onClick={() => handleAddEquipmentForFunction(func.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                          Adicionar Equipamento
                        </button>
                      </div>

                      {equipments.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-lg">
                          <Wrench size={32} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">
                            Nenhum equipamento cadastrado para esta função
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                                  Nome
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                                  Marca
                                </th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">
                                  Qtd
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                                  Valor Unit.
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                                  Valor Total
                                </th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">
                                  Amortização
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                                  Valor Mensal
                                </th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {equipments.map((equipment) => (
                                <tr
                                  key={equipment.id}
                                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-3 py-2 text-sm font-medium text-slate-800">
                                    {equipment.name}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-600">
                                    {equipment.brand || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center text-slate-600">
                                    {equipment.quantity}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right text-slate-600">
                                    {moeda(equipment.unit_value)}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right text-slate-600">
                                    {moeda(equipment.total_value)}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center text-slate-600">
                                    {equipment.amortization} meses
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right font-semibold text-blue-600">
                                    {moeda(equipment.monthly_value)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEditEquipment(equipment)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Editar"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEquipment(equipment.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">
                  TOTAL MENSAL DE EQUIPAMENTOS (para 1 funcionário por função):
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {moeda(calculateTotalMonthly())}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                No orçamento geral, este valor será multiplicado pela quantidade de funcionários de cada função
              </p>
            </div>
          </div>
        )}
      </div>

      <EquipmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEquipment}
        equipment={editingEquipment}
      />
    </div>
  );
};
