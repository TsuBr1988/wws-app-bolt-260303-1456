import { useState, useEffect, useRef } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { ResultsTable } from '../ResultsTable';
import { FunctionConfig, FunctionData } from '../../types';
import { calcularFuncao, calcularFuncaoComOverrides } from '../../utils';
import { ESCALAS, GRUPOS_ENCARGOS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { budgetEncargosService } from '../../services/budgetEncargosService';

interface PositionBudgetTabProps {
  vtValue: number;
  issRate: number;
  funcoes: FunctionConfig[];
  activeBudget: {
    id: string;
    budget_number: string;
    client_name: string;
    description: string;
  } | null;
  activeTab?: string;
  minimumWage: number;
}

export const PositionBudgetTab = ({
  vtValue,
  issRate,
  funcoes,
  activeBudget,
  activeTab,
  minimumWage,
}: PositionBudgetTabProps) => {
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('');
  const [functionData, setFunctionData] = useState<FunctionData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [margemLucro, setMargemLucro] = useState(10);
  const [margemAdm, setMargemAdm] = useState(5);
  const [margensLoaded, setMargensLoaded] = useState(false);
  const [encargosOverridesCount, setEncargosOverridesCount] = useState(0);
  const [encargosComOverrides, setEncargosComOverrides] = useState<any[]>(GRUPOS_ENCARGOS);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (funcoes.length > 0 && !selectedFunctionId) {
      setSelectedFunctionId(funcoes[0].id);
    }
  }, [funcoes]);

  useEffect(() => {
    const initialize = async () => {
      if (activeBudget) {
        setMargensLoaded(false);
        await loadMargens();
        await loadEncargosOverridesCount();
      }
    };
    initialize();
  }, [activeBudget?.id]);

  // Recarregar dados quando voltar para a aba "Orçamento por Posto"
  useEffect(() => {
    if (activeBudget && activeTab === 'posto' && margensLoaded && selectedFunctionId) {
      console.log('🔄 Recarregando dados - aba voltou para "posto"');
      // Incrementar o trigger para forçar reload dos benefícios
      setReloadTrigger(prev => prev + 1);
    }
  }, [activeTab, margensLoaded, selectedFunctionId]);

  const loadMargens = async () => {
    if (!activeBudget) return;

    const { data, error } = await supabase
      .from('budgets')
      .select('margem_lucro, margem_adm')
      .eq('id', activeBudget.id)
      .maybeSingle();

    if (!error && data) {
      setMargemLucro(data.margem_lucro || 10);
      setMargemAdm(data.margem_adm || 5);
    }
    setMargensLoaded(true);
  };

  const loadEncargosOverridesCount = async () => {
    if (!activeBudget) return;
    const count = await budgetEncargosService.countOverrides(activeBudget.id);
    setEncargosOverridesCount(count);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedFunctionId && activeBudget && margensLoaded) {
      console.log('📊 Carregando dados da função - Trigger:', reloadTrigger);
      loadFunctionData();
    }
  }, [selectedFunctionId, activeBudget?.id, margemLucro, margemAdm, margensLoaded, reloadTrigger]);

  const loadFunctionData = async () => {
    if (!activeBudget || !selectedFunctionId) return;

    // 🔥 PASSO 1: Limpar dados antigos para forçar re-render
    setFunctionData(null);

    const selectedFunc = funcoes.find((f) => f.id === selectedFunctionId);
    if (!selectedFunc) return;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 INÍCIO DO CARREGAMENTO - Timestamp:', new Date().toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Buscar o service_type do orçamento
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('service_type')
      .eq('id', activeBudget.id)
      .maybeSingle();

    const serviceType = budgetData?.service_type || 'facilities';

    console.log('📋 Orçamento ID:', activeBudget.id);
    console.log('📋 Service Type:', serviceType);
    console.log('📋 Função Selecionada:', selectedFunc.nome);

    // 🔥 PASSO 2: Buscar benefícios com cache busting
    const timestamp = Date.now();
    console.log('⏰ Cache Busting Timestamp:', timestamp);

    const { data: configBenefits, error: benefitsError } = await supabase
      .from('config_benefits')
      .select('*')
      .eq('is_active', true)
      .eq('service_type', serviceType)
      .order('order_index')
      .order('id'); // Segunda ordenação para garantir query única

    if (benefitsError) {
      console.error('❌ ERRO ao buscar benefícios:', benefitsError);
      return;
    }

    console.log('✅ Benefícios carregados do banco:', configBenefits?.length || 0);
    console.log('📊 Lista completa de benefícios:');
    configBenefits?.forEach(b => {
      console.log(`   - ${b.name} (${b.code}): R$ ${b.base_value} [${b.calculation_type}]`);
    });

    // 🔥 PASSO 3: Log específico do NR-07
    const nr07 = configBenefits?.find(b =>
      b.code === 'NR_07' ||
      b.code === 'NR07' ||
      b.name.includes('NR-07') ||
      b.name.includes('NR 07') ||
      b.name.includes('Insumos')
    );

    if (nr07) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 BENEFÍCIO NR-07 ENCONTRADO:');
      console.log('   📝 Nome:', nr07.name);
      console.log('   🔖 Código:', nr07.code);
      console.log('   💰 Valor base:', nr07.base_value, '(tipo:', typeof nr07.base_value, ')');
      console.log('   📐 Tipo de cálculo:', nr07.calculation_type);
      console.log('   🧮 Fórmula:', nr07.formula || 'N/A');
      console.log('   ✓ Ativo:', nr07.is_active);
      console.log('   🔢 ID:', nr07.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️ BENEFÍCIO NR-07 NÃO ENCONTRADO!');
      console.log('   Benefícios disponíveis:', configBenefits?.map(b => `${b.name} (${b.code})`).join(', '));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    const { data: materiais } = await supabase
      .from('materials')
      .select('*')
      .eq('budget_id', activeBudget.id);

    const { data: capex } = await supabase
      .from('capex')
      .select('*')
      .eq('budget_id', activeBudget.id);

    const { data: equipamentos } = await supabase
      .from('equipments')
      .select('*')
      .eq('budget_id', activeBudget.id);

    const { data: uniformes } = await supabase
      .from('uniforms')
      .select('*')
      .eq('budget_id', activeBudget.id);

    const { data: outros } = await supabase
      .from('others')
      .select('*')
      .eq('budget_id', activeBudget.id);

    const { data: beneficiosDiferenciados } = await supabase
      .from('differentiated_benefits')
      .select('*')
      .eq('budget_id', activeBudget.id);

    const materiaisParaEstaFuncao = materiais?.filter((m) => {
      const allocatedFunctions = m.allocated_functions || [];
      return (
        allocatedFunctions.length === 0 ||
        allocatedFunctions.includes(selectedFunc.id)
      );
    }) || [];

    const capexParaEstaFuncao = capex?.filter((c) => {
      const allocatedFunctions = c.allocated_functions || [];
      return (
        allocatedFunctions.length === 0 ||
        allocatedFunctions.includes(selectedFunc.id)
      );
    }) || [];

    // Equipamentos e uniformes funcionam por função (function_id) - valores para 1 funcionário, multiplicados pela qtd
    const equipamentosParaEstaFuncao = equipamentos?.filter(
      (e) => e.function_id === selectedFunc.id
    ) || [];

    const uniformesParaEstaFuncao = uniformes?.filter(
      (u) => u.function_id === selectedFunc.id
    ) || [];

    const beneficiosDiferenciadosParaEstaFuncao = beneficiosDiferenciados?.filter(
      (b) => b.function_id === selectedFunc.id
    ) || [];

    const totalMateriaisFuncao = materiaisParaEstaFuncao.reduce(
      (sum, m) => sum + m.monthly_value,
      0
    );
    const totalCapexFuncao = capexParaEstaFuncao.reduce(
      (sum, c) => sum + c.monthly_value,
      0
    );

    // Equipamentos e uniformes: valores para 1 funcionário, multiplicar pela quantidade da função
    const escalaConfig = ESCALAS[selectedFunc.escala];
    const funcionariosDaFuncao = selectedFunc.qtd * escalaConfig.multiplier;

    const totalEquipamentosFuncao = equipamentosParaEstaFuncao.reduce(
      (sum, e) => sum + e.monthly_value,
      0
    ) * funcionariosDaFuncao;

    const totalUniformesFuncao = uniformesParaEstaFuncao.reduce(
      (sum, u) => sum + u.monthly_value,
      0
    ) * funcionariosDaFuncao;

    const outrosParaEstaFuncao = outros?.filter((o) => {
      const allocatedFunctions = o.allocated_functions || [];
      return (
        allocatedFunctions.length === 0 ||
        allocatedFunctions.includes(selectedFunc.id)
      );
    }) || [];

    const totalOutrosFuncao = outrosParaEstaFuncao.reduce(
      (sum, o) => sum + o.monthly_value,
      0
    );

    const totalBeneficiosDiferenciadosFuncao = beneficiosDiferenciadosParaEstaFuncao.reduce(
      (sum, b) => sum + b.monthly_value,
      0
    );

    const funcoesQueReceberamMateriais = funcoes.filter((f) => {
      return materiaisParaEstaFuncao.some((m) => {
        const allocatedFunctions = m.allocated_functions || [];
        return (
          allocatedFunctions.length === 0 ||
          allocatedFunctions.includes(f.id)
        );
      });
    });

    const totalPessoasMateriais = funcoesQueReceberamMateriais.reduce(
      (sum, f) => {
        const escalaConfigTemp = ESCALAS[f.escala];
        const funcionarios = f.qtd * escalaConfigTemp.multiplier;
        return sum + funcionarios;
      },
      0
    );

    const funcoesQueReceberamOutros = funcoes.filter((f) => {
      return outrosParaEstaFuncao.some((o) => {
        const allocatedFunctions = o.allocated_functions || [];
        return (
          allocatedFunctions.length === 0 ||
          allocatedFunctions.includes(f.id)
        );
      });
    });

    const totalPessoasOutros = funcoesQueReceberamOutros.reduce(
      (sum, f) => {
        const escalaConfigTemp = ESCALAS[f.escala];
        const funcionarios = f.qtd * escalaConfigTemp.multiplier;
        return sum + funcionarios;
      },
      0
    );

    const totalPessoasParaCalculo =
      totalPessoasMateriais > 0 ? totalPessoasMateriais : (totalPessoasOutros > 0 ? totalPessoasOutros : funcionariosDaFuncao);

    console.log('🧮 Chamando calcularFuncaoComOverrides...');
    console.log('   configBenefits count:', configBenefits?.length);
    console.log('   VT Value:', selectedFunc.vtValue);
    console.log('   Budget ID:', activeBudget.id);

    const calculatedData = await calcularFuncaoComOverrides(
      selectedFunc,
      activeBudget.id,
      selectedFunc.vtValue,
      configBenefits || [],
      totalMateriaisFuncao,
      totalCapexFuncao,
      totalEquipamentosFuncao,
      totalUniformesFuncao,
      totalPessoasParaCalculo,
      totalBeneficiosDiferenciadosFuncao,
      totalOutrosFuncao,
      minimumWage
    );

    console.log('✅ Dados calculados!');
    console.log('📊 Benefícios calculados:');
    calculatedData.beneficios.forEach(b => {
      console.log(`   - ${b.d}: R$ ${b.v.toFixed(2)}`);
    });

    // Log específico do NR-07 no resultado
    const nr07Result = calculatedData.beneficios.find(b =>
      b.d.includes('NR-07') ||
      b.d.includes('NR 07') ||
      b.d.includes('Insumos')
    );
    if (nr07Result) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 NR-07 NO RESULTADO FINAL:');
      console.log('   Nome:', nr07Result.d);
      console.log('   Valor calculado:', nr07Result.v.toFixed(2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FIM DO CARREGAMENTO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const remunValues = [
      calculatedData.s,
      calculatedData.vPeric,
      calculatedData.vInsal,
      calculatedData.vGrat,
      calculatedData.vNot,
      calculatedData.vRed,
    ];
    remunValues.forEach((val) => {
      calculatedData.totalAcumulado += val * calculatedData.q;
    });

    // Buscar encargos customizados para este orçamento
    const encargosComOverrides = await budgetEncargosService.getEncargosWithOverrides(
      activeBudget.id,
      GRUPOS_ENCARGOS
    );

    // Armazenar para exibição na tabela
    setEncargosComOverrides(encargosComOverrides);

    encargosComOverrides.forEach((grupo) => {
      grupo.i.forEach((item: any) => {
        const v = calculatedData.baseCalculoGeral * item.p;
        calculatedData.totalAcumulado += v;
        calculatedData.encargosAcumulado += v;
      });
    });

    const vTotalIntra = calculatedData.vIntra * calculatedData.q;
    calculatedData.totalAcumulado += vTotalIntra;

    calculatedData.beneficios.forEach((benef) => {
      calculatedData.totalAcumulado += benef.v;
    });

    calculatedData.totalAcumulado += calculatedData.materiais;
    calculatedData.totalAcumulado += calculatedData.capex;
    calculatedData.totalAcumulado += calculatedData.equipamentos;
    calculatedData.totalAcumulado += calculatedData.uniformes;
    calculatedData.totalAcumulado += calculatedData.outros || 0;
    calculatedData.totalAcumulado += calculatedData.beneficiosDiferenciados;

    const funcaoIssRate = selectedFunc.issRate ?? issRate;
    // Cálculo do BDI incluindo IRPJ (15% do lucro) e CSLL (9% do lucro)
    // Lucro + IRPJ + CSLL = Lucro * (1 + 0.15 + 0.09) = Lucro * 1.24
    const lucroComImpostos = (margemLucro / 100) * 1.24;
    const taxaBDI = lucroComImpostos + (margemAdm / 100) + 0.0065 + 0.03 + funcaoIssRate / 100;
    calculatedData.totalComBDI = calculatedData.totalAcumulado / (1 - taxaBDI);
    calculatedData.valorTotalBDI =
      calculatedData.totalComBDI - calculatedData.totalAcumulado;
    calculatedData.issRate = funcaoIssRate;

    setFunctionData(calculatedData);
  };

  const selectedFunction = funcoes.find((f) => f.id === selectedFunctionId);
  const escalaConfig = selectedFunction
    ? ESCALAS[selectedFunction.escala]
    : null;
  const quantidadeFuncionarios = selectedFunction && escalaConfig
    ? selectedFunction.qtd * escalaConfig.multiplier
    : 0;

  if (!activeBudget) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">
            Orçamento por Posto
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Crie ou selecione um orçamento para visualizar o detalhamento por posto.
          </p>
        </div>
      </div>
    );
  }

  if (funcoes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">
            Orçamento por Posto
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Adicione funções ao orçamento para visualizar o detalhamento por posto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {encargosOverridesCount > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-orange-900 mb-1">
                Encargos Sociais Customizados Ativos
              </h4>
              <p className="text-sm text-orange-800">
                Este orçamento possui <span className="font-bold">{encargosOverridesCount} encargo(s) customizado(s)</span> sendo aplicado(s) nos cálculos desta planilha.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={28} className="text-blue-600" />
            Orçamento por Posto
          </h2>
          <div className="flex gap-4 text-sm">
            <div className="bg-blue-50 px-3 py-1 rounded border border-blue-200">
              <span className="font-semibold text-blue-900">Margem ADM:</span>
              <span className="ml-1 text-blue-700">{margemAdm.toFixed(2)}%</span>
            </div>
            <div className={`px-3 py-1 rounded border ${margemLucro > 20 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-200'}`}>
              <span className={`font-semibold ${margemLucro > 20 ? 'text-orange-900' : 'text-green-900'}`}>Margem Lucro:</span>
              <span className={`ml-1 ${margemLucro > 20 ? 'text-orange-700' : 'text-green-700'}`}>{margemLucro.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {margemLucro > 20 && (
          <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-800">
                  <strong>Atenção:</strong> A margem de lucro está em {margemLucro.toFixed(2)}%, valor acima do padrão (10%).
                  Verifique se este valor está correto na aba "Orçamento Geral".
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Selecione o Posto
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full max-w-md bg-white border-2 border-slate-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-blue-500 transition-colors"
            >
              <span className="font-medium text-slate-800">
                {selectedFunction?.nome || 'Selecione uma função'}
              </span>
              <ChevronDown
                size={20}
                className={`text-slate-500 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 w-full max-w-md mt-2 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {funcoes.map((func) => (
                  <button
                    key={func.id}
                    onClick={() => {
                      setSelectedFunctionId(func.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      selectedFunctionId === func.id
                        ? 'bg-blue-100 font-semibold'
                        : ''
                    }`}
                  >
                    {func.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedFunction && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Nome da Função
              </div>
              <div className="text-lg font-bold text-slate-900">
                {selectedFunction.nome}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Quantidade de Postos
              </div>
              <div className="text-lg font-bold text-blue-700">
                {selectedFunction.qtd}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Quantidade de Funcionários
              </div>
              <div className="text-lg font-bold text-green-700">
                {quantidadeFuncionarios}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Escala
              </div>
              <div className="text-lg font-bold text-slate-900">
                {escalaConfig?.nome || selectedFunction.escala}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Horário
              </div>
              <div className={`text-lg font-bold ${selectedFunction.horarioTipo === 'noturno' ? 'text-purple-700' : 'text-amber-600'}`}>
                {selectedFunction.horarioTipo === 'noturno' ? 'Noturno' : 'Diurno'}
              </div>
            </div>
          </div>
        )}
      </div>

      {functionData && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            Planilha Detalhada - {selectedFunction?.nome}
          </h3>
          <ResultsTable
            funcoesDados={[functionData]}
            issRate={issRate}
            margemLucro={margemLucro}
            margemAdm={margemAdm}
            encargosComOverrides={encargosComOverrides}
          />
        </div>
      )}
    </div>
  );
};
