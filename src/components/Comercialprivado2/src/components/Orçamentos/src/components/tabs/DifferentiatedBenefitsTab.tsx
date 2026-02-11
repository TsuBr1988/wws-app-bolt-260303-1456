import { Gift, Plus, Edit, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DifferentiatedBenefitModal, DifferentiatedBenefitData } from '../DifferentiatedBenefitModal';
import { supabase } from '../../lib/supabase';
import { moeda } from '../../utils';

interface DifferentiatedBenefitsTabProps {
  activeBudget: any;
}

interface BudgetFunction {
  id: string;
  function_name: string;
  quantity: number;
}

interface DifferentiatedBenefit extends DifferentiatedBenefitData {
  id: string;
  budget_id: string;
  function_id: string;
  created_at: string;
  updated_at: string;
}

export const DifferentiatedBenefitsTab = ({ activeBudget }: DifferentiatedBenefitsTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetFunctions, setBudgetFunctions] = useState<BudgetFunction[]>([]);
  const [benefitsByFunction, setBenefitsByFunction] = useState<Record<string, DifferentiatedBenefit[]>>({});
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [editingBenefit, setEditingBenefit] = useState<DifferentiatedBenefit | undefined>();
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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

    const { data: benefitsData, error: benefitsError } = await supabase
      .from('differentiated_benefits')
      .select('*')
      .eq('budget_id', activeBudget.id)
      .order('created_at', { ascending: false });

    if (benefitsError) {
      console.error('Erro ao carregar benefícios:', benefitsError);
    } else {
      const groupedBenefits: Record<string, DifferentiatedBenefit[]> = {};
      (benefitsData || []).forEach((benefit: DifferentiatedBenefit) => {
        if (!groupedBenefits[benefit.function_id]) {
          groupedBenefits[benefit.function_id] = [];
        }
        groupedBenefits[benefit.function_id].push(benefit);
      });
      setBenefitsByFunction(groupedBenefits);
    }

    setIsLoading(false);
  };

  const handleSaveBenefit = async (benefitData: DifferentiatedBenefitData) => {
    if (!activeBudget?.id || !selectedFunctionId) return;

    if (editingBenefit) {
      const { error } = await supabase
        .from('differentiated_benefits')
        .update({
          name: benefitData.name,
          monthly_value: benefitData.monthly_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBenefit.id);

      if (error) {
        console.error('Erro ao atualizar benefício:', error);
        alert('Erro ao atualizar benefício');
      } else {
        loadData();
        setEditingBenefit(undefined);
      }
    } else {
      const { error } = await supabase.from('differentiated_benefits').insert({
        budget_id: activeBudget.id,
        function_id: selectedFunctionId,
        name: benefitData.name,
        monthly_value: benefitData.monthly_value,
      });

      if (error) {
        console.error('Erro ao adicionar benefício:', error);
        alert('Erro ao adicionar benefício');
      } else {
        loadData();
      }
    }
  };

  const handleEditBenefit = (benefit: DifferentiatedBenefit) => {
    setEditingBenefit(benefit);
    setSelectedFunctionId(benefit.function_id);
    setIsModalOpen(true);
  };

  const handleDeleteBenefit = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este benefício?')) {
      return;
    }

    const { error } = await supabase.from('differentiated_benefits').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir benefício:', error);
      alert('Erro ao excluir benefício');
    } else {
      loadData();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBenefit(undefined);
    setSelectedFunctionId('');
  };

  const handleAddBenefitForFunction = (functionId: string) => {
    setSelectedFunctionId(functionId);
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
    Object.values(benefitsByFunction).forEach(benefits => {
      benefits.forEach(b => {
        total += b.monthly_value;
      });
    });
    return total;
  };

  if (!activeBudget) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={40} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">
            Nenhum orçamento ativo
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Crie ou selecione um orçamento para gerenciar benefícios diferenciados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Benefícios Diferenciados por Função</h2>
          <p className="text-slate-600 mt-1">
            Adicione benefícios específicos para cada função do orçamento
          </p>
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
              Adicione funções ao orçamento antes de cadastrar benefícios diferenciados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetFunctions.map((func) => {
              const benefits = benefitsByFunction[func.id] || [];
              const isExpanded = expandedFunctions.has(func.id);
              const functionTotal = benefits.reduce((sum, b) => sum + b.monthly_value, 0);

              return (
                <div
                  key={func.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-emerald-50 to-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleFunctionExpanded(func.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">
                            {func.function_name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {func.quantity} {func.quantity === 1 ? 'funcionário' : 'funcionários'} •
                            {benefits.length} {benefits.length === 1 ? 'benefício' : 'benefícios'} cadastrado{benefits.length !== 1 ? 's' : ''}
                            {functionTotal > 0 && ` • Custo mensal: ${moeda(functionTotal)}`}
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
                          Benefícios desta função
                        </h4>
                        <button
                          onClick={() => handleAddBenefitForFunction(func.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                          Adicionar Benefício
                        </button>
                      </div>

                      {benefits.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-lg">
                          <Gift size={32} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">
                            Nenhum benefício cadastrado para esta função
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                                  Nome do Benefício
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
                              {benefits.map((benefit) => (
                                <tr
                                  key={benefit.id}
                                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-3 py-2 text-sm font-medium text-slate-800">
                                    {benefit.name}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right font-semibold text-emerald-600">
                                    {moeda(benefit.monthly_value)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEditBenefit(benefit)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Editar"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteBenefit(benefit.id)}
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

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">
                  TOTAL MENSAL DE BENEFÍCIOS DIFERENCIADOS:
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  {moeda(calculateTotalMonthly())}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <DifferentiatedBenefitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveBenefit}
        benefit={editingBenefit}
      />
    </div>
  );
};
