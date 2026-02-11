import { Shirt, Plus, Edit, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { UniformModal, UniformData } from '../UniformModal';
import { supabase } from '../../lib/supabase';
import { moeda } from '../../utils';
import { ESCALAS } from '../../constants';

interface UniformsTabProps {
  activeBudget: any;
}

interface BudgetFunction {
  id: string;
  function_name: string;
  quantity: number;
  scale: string;
}

interface Uniform extends UniformData {
  id: string;
  budget_id: string;
  function_id: string;
  created_at: string;
  updated_at: string;
}

export const UniformsTab = ({ activeBudget }: UniformsTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetFunctions, setBudgetFunctions] = useState<BudgetFunction[]>([]);
  const [uniformsByFunction, setUniformsByFunction] = useState<Record<string, Uniform[]>>({});
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [editingUniform, setEditingUniform] = useState<Uniform | undefined>();
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
      .select('id, function_name, quantity, scale')
      .eq('budget_id', activeBudget.id)
      .order('created_at', { ascending: true });

    if (functionsError) {
      console.error('Erro ao carregar funções:', functionsError);
    } else {
      setBudgetFunctions(functionsData || []);
      const allExpanded = new Set((functionsData || []).map(f => f.id));
      setExpandedFunctions(allExpanded);
    }

    const { data: uniformsData, error: uniformsError } = await supabase
      .from('uniforms')
      .select('*')
      .eq('budget_id', activeBudget.id)
      .order('created_at', { ascending: false });

    if (uniformsError) {
      console.error('Erro ao carregar uniformes:', uniformsError);
    } else {
      const groupedUniforms: Record<string, Uniform[]> = {};
      (uniformsData || []).forEach((uniform: Uniform) => {
        if (!groupedUniforms[uniform.function_id]) {
          groupedUniforms[uniform.function_id] = [];
        }
        groupedUniforms[uniform.function_id].push(uniform);
      });
      setUniformsByFunction(groupedUniforms);
    }

    setIsLoading(false);
  };

  const handleSaveUniform = async (uniformData: UniformData) => {
    if (!activeBudget?.id) return;

    if (editingUniform) {
      const { error } = await supabase
        .from('uniforms')
        .update({
          name: uniformData.name,
          brand: uniformData.brand,
          quantity: uniformData.quantity,
          unit_value: uniformData.unit_value,
          total_value: uniformData.total_value,
          amortization: uniformData.amortization,
          monthly_value: uniformData.monthly_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUniform.id);

      if (error) {
        console.error('Erro ao atualizar uniforme:', error);
        alert('Erro ao atualizar uniforme');
      } else {
        loadData();
        setEditingUniform(undefined);
      }
    } else if (isAddingToAll) {
      // Adicionar uniforme a todas as funções
      const uniformsToInsert = budgetFunctions.map(func => ({
        budget_id: activeBudget.id,
        function_id: func.id,
        name: uniformData.name,
        brand: uniformData.brand,
        quantity: uniformData.quantity,
        unit_value: uniformData.unit_value,
        total_value: uniformData.total_value,
        amortization: uniformData.amortization,
        monthly_value: uniformData.monthly_value,
      }));

      const { error } = await supabase.from('uniforms').insert(uniformsToInsert);

      if (error) {
        console.error('Erro ao adicionar uniformes:', error);
        alert('Erro ao adicionar uniformes a todas as funções');
      } else {
        loadData();
      }
    } else {
      // Adicionar uniforme a uma função específica
      if (!selectedFunctionId) return;

      const { error } = await supabase.from('uniforms').insert({
        budget_id: activeBudget.id,
        function_id: selectedFunctionId,
        name: uniformData.name,
        brand: uniformData.brand,
        quantity: uniformData.quantity,
        unit_value: uniformData.unit_value,
        total_value: uniformData.total_value,
        amortization: uniformData.amortization,
        monthly_value: uniformData.monthly_value,
      });

      if (error) {
        console.error('Erro ao adicionar uniforme:', error);
        alert('Erro ao adicionar uniforme');
      } else {
        loadData();
      }
    }
  };

  const handleEditUniform = (uniform: Uniform) => {
    setEditingUniform(uniform);
    setSelectedFunctionId(uniform.function_id);
    setIsModalOpen(true);
  };

  const handleDeleteUniform = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este uniforme?')) {
      return;
    }

    const { error } = await supabase.from('uniforms').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir uniforme:', error);
      alert('Erro ao excluir uniforme');
    } else {
      loadData();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUniform(undefined);
    setSelectedFunctionId('');
    setIsAddingToAll(false);
  };

  const handleAddUniformForFunction = (functionId: string) => {
    setSelectedFunctionId(functionId);
    setIsAddingToAll(false);
    setIsModalOpen(true);
  };

  const handleAddUniformToAll = () => {
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

    budgetFunctions.forEach(func => {
      const uniforms = uniformsByFunction[func.id] || [];

      // Soma apenas os valores mensais por funcionário (sem multiplicar)
      const functionTotalPerEmployee = uniforms.reduce((sum, u) => sum + u.monthly_value, 0);

      total += functionTotalPerEmployee;
    });

    return total;
  };

  if (!activeBudget) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shirt size={40} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">
            Nenhum orçamento ativo
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Crie ou selecione um orçamento para gerenciar uniformes.
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
            <h2 className="text-2xl font-bold text-slate-800">Uniformes por Função</h2>
            <p className="text-slate-600 mt-1">
              Adicione e gerencie os uniformes necessários para cada função do orçamento
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3 rounded">
              <p className="text-sm text-blue-800 font-medium">
                💡 <strong>Importante:</strong> Todos os valores devem ser cadastrados <strong>POR FUNCIONÁRIO</strong>.
                O sistema multiplicará automaticamente pela quantidade de funcionários de cada posto/escala.
              </p>
            </div>
          </div>
          {budgetFunctions.length > 0 && (
            <button
              onClick={handleAddUniformToAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={16} />
              Adicionar Uniforme a Todos
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
              Adicione funções ao orçamento antes de cadastrar uniformes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetFunctions.map((func) => {
              const uniforms = uniformsByFunction[func.id] || [];
              const isExpanded = expandedFunctions.has(func.id);

              // Calcular número de funcionários baseado na escala
              const escalaConfig = ESCALAS[func.scale] || { multiplier: 1.0, nome: func.scale };
              const numFuncionarios = func.quantity * escalaConfig.multiplier;

              // Total mensal de uniformes POR FUNCIONÁRIO desta função (não multiplica)
              const functionTotalPerEmployee = uniforms.reduce((sum, u) => sum + u.monthly_value, 0);

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
                            {func.quantity} {func.quantity === 1 ? 'posto' : 'postos'}
                            ({numFuncionarios} {numFuncionarios === 1 ? 'funcionário' : 'funcionários'} na escala {escalaConfig.nome}) •
                            {uniforms.length} {uniforms.length === 1 ? 'uniforme' : 'uniformes'} cadastrado{uniforms.length !== 1 ? 's' : ''}
                          </p>
                          {functionTotalPerEmployee > 0 && (
                            <p className="text-sm text-blue-600 font-semibold mt-1">
                              Custo mensal por funcionário: {moeda(functionTotalPerEmployee)}
                            </p>
                          )}
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
                          Uniformes desta função
                        </h4>
                        <button
                          onClick={() => handleAddUniformForFunction(func.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                          Adicionar Uniforme
                        </button>
                      </div>

                      {uniforms.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-lg">
                          <Shirt size={32} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">
                            Nenhum uniforme cadastrado para esta função
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
                              {uniforms.map((uniform) => (
                                <tr
                                  key={uniform.id}
                                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-3 py-2 text-sm font-medium text-slate-800">
                                    {uniform.name}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-600">
                                    {uniform.brand || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center text-slate-600">
                                    {uniform.quantity}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right text-slate-600">
                                    {moeda(uniform.unit_value)}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right text-slate-600">
                                    {moeda(uniform.total_value)}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-center text-slate-600">
                                    {uniform.amortization}m
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right font-semibold text-blue-600">
                                    {moeda(uniform.monthly_value)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEditUniform(uniform)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Editar"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUniform(uniform.id)}
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
                <div>
                  <span className="text-lg font-bold text-slate-800">
                    TOTAL MENSAL DE UNIFORMES (por funcionário):
                  </span>
                  <p className="text-xs text-slate-600 mt-1">
                    Este valor será multiplicado pelo número de funcionários de cada posto no orçamento geral
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {moeda(calculateTotalMonthly())}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <UniformModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUniform}
        uniform={editingUniform}
      />
    </div>
  );
};
