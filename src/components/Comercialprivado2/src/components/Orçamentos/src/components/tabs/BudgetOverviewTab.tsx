import { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, X, Percent, CreditCard as Edit, FileText, Shield, Building2, Settings } from 'lucide-react';
import { FunctionSelector } from '../FunctionSelector';
import { FunctionCard } from '../FunctionCard';
import { ResultsTable } from '../ResultsTable';
import { FunctionConfig, FunctionData } from '../../types';
import { calcularFuncao, calcularFuncaoComOverrides } from '../../utils';
import { GRUPOS_ENCARGOS, ESCALAS } from '../../constants';
import { supabase } from '../../lib/supabase';
import { EncargosOverridesModal } from '../EncargosOverridesModal';
import { budgetEncargosService } from '../../services/budgetEncargosService';

interface BudgetOverviewTabProps {
  vtValue: number;
  setVtValue: (value: number) => void;
  issRate: number;
  setIssRate: (value: number) => void;
  city: string;
  setCity: (value: string) => void;
  funcoes: FunctionConfig[];
  setFuncoes: (funcoes: FunctionConfig[]) => void;
  activeBudget: {
    id: string;
    budget_number: string;
    client_name: string;
    description: string;
  } | null;
  activeTab: string;
  minimumWage: number;
  setMinimumWage: (value: number) => void;
}

export const BudgetOverviewTab = ({
  vtValue,
  setVtValue,
  issRate,
  setIssRate,
  city,
  setCity,
  funcoes,
  setFuncoes,
  activeBudget,
  activeTab,
  minimumWage,
  setMinimumWage,
}: BudgetOverviewTabProps) => {
  const [resultado, setResultado] = useState<{
    funcoesDados: FunctionData[];
    taxaBDI: number;
    totalContrato: number;
  } | null>(null);
  const [encargosComOverrides, setEncargosComOverrides] = useState<any[]>(GRUPOS_ENCARGOS);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [margemLucro, setMargemLucro] = useState(10);
  const [margemAdm, setMargemAdm] = useState(5);
  const [showMargemModal, setShowMargemModal] = useState(false);
  const [tempMargemLucro, setTempMargemLucro] = useState(10);
  const [tempMargemAdm, setTempMargemAdm] = useState(5);
  const [serviceType, setServiceType] = useState<'facilities' | 'vigilancia'>('facilities');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEncargosModal, setShowEncargosModal] = useState(false);
  const [encargosOverridesCount, setEncargosOverridesCount] = useState(0);

  // Helper para parseFloat com valor padrão
  const parseFloatSafe = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const formatPeopleCount = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (activeBudget && activeTab === 'geral') {
      console.log('🔄 Recarregando dados - aba voltou para "geral"');
      loadBudgetData();
      loadEncargosOverridesCount();
    }
  }, [activeBudget?.id, activeTab]);

  const loadEncargosOverridesCount = async () => {
    if (!activeBudget) return;
    const count = await budgetEncargosService.countOverrides(activeBudget.id);
    setEncargosOverridesCount(count);
  };

  const handleEncargosModalSave = () => {
    loadEncargosOverridesCount();
  };

  const loadBudgetData = async () => {
    if (!activeBudget) return;

    setIsLoading(true);
    console.log('📥 Iniciando carregamento de dados do orçamento:', activeBudget.id);

    try {
      const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('margem_lucro, margem_adm, service_type')
      .eq('id', activeBudget.id)
      .maybeSingle();

    if (!budgetError && budgetData) {
      setMargemLucro(budgetData.margem_lucro || 10);
      setMargemAdm(budgetData.margem_adm || 5);
      setServiceType(budgetData.service_type || 'facilities');
    }

    const { data, error } = await supabase
      .from('budget_functions')
      .select('*')
      .eq('budget_id', activeBudget.id);

    if (error) {
      console.error('Erro ao carregar funções do orçamento:', error);
      return;
    }

    // Buscar salários atualizados de config_functions
    const { data: configFunctions } = await supabase
      .from('config_functions')
      .select('name, base_salary');

    const salaryMap = new Map(
      configFunctions?.map(cf => [cf.name, cf.base_salary]) || []
    );

    const { data: calcData, error: calcError } = await supabase
      .from('budget_calculations')
      .select('*')
      .eq('budget_id', activeBudget.id)
      .maybeSingle();

    if (!calcError && calcData) {
      setResultado({
        funcoesDados: calcData.function_data,
        taxaBDI: calcData.total_bdi,
        totalContrato: calcData.total_contract,
      });
    } else {
      setResultado(null);
    }

    if (data && data.length > 0) {
      console.log('📥 Carregando funções do banco:', data);

      const { data: cities } = await supabase
        .from('cities')
        .select('*');

      const cityMap = new Map(cities?.map(c => [c.name, c.iss_rate]) || []);

      const loadedFunctions: FunctionConfig[] = data.map((item) => {
        console.log('🔍 Processando item do banco:', {
          id: item.id,
          nome: item.function_name,
          escala_raw: item.scale,
          shift_type_raw: item.shift_type,
          shift_type_type: typeof item.shift_type,
          shift_type_is_null: item.shift_type === null,
          shift_type_is_undefined: item.shift_type === undefined,
          has_intrajornada_raw: item.has_intrajornada,
          intrajornada_percent_raw: item.intrajornada_percent,
          item_completo: JSON.stringify(item, null, 2)
        });
        let savedConfig = null;

        if (calcData && calcData.function_data) {
          savedConfig = calcData.function_data.find(
            (fc: any) => fc.config.nome === item.function_name && fc.config.escala === item.scale
          );
        }

        if (savedConfig) {
          console.log('📦 Usando savedConfig para função (MAS dados do banco):', {
            nome: savedConfig.config.nome,
            horarioTipo_saved: savedConfig.config.horarioTipo,
            shift_type_banco: item.shift_type,
            vtValue_banco: parseFloatSafe(item.vt_value, 5.5),
            horas_banco: parseFloatSafe(item.hours_per_day, 0),
            usando_banco: true
          });

          const funcCity = item.city || city;
          const funcIssRate = item.iss_rate || cityMap.get(funcCity) || 0;

          // IMPORTANTE: TODOS os campos de configuração vêm do banco!
          // O savedConfig é usado apenas para indicar que existe um cálculo salvo
          let horarioTipo: 'diurno' | 'noturno' = 'diurno';
          if (item.shift_type === 'noturno') {
            horarioTipo = 'noturno';
          } else if (item.shift_type === 'diurno') {
            horarioTipo = 'diurno';
          }

          const pericValue = parseFloatSafe(item.periculosity_percent, 0);

          // Buscar salário atualizado de config_functions, ou usar o salvo no orçamento
          const updatedSalary = salaryMap.get(item.function_name) || parseFloatSafe(item.salary, 0);

          return {
            id: item.id,
            nome: item.function_name || '',
            chaveSalario: '',
            qtd: item.quantity || 1,
            salario: updatedSalary,
            escala: item.scale || '12x36',
            horarioTipo: horarioTipo,
            peric: serviceType === 'vigilancia' ? 30 : pericValue,
            insal: parseFloatSafe(item.unhealthiness_percent, 0),
            grat: parseFloatSafe(item.bonus_percent, 0),
            notPerc: parseFloatSafe(item.night_additional_percent, 20),
            horas: parseFloatSafe(item.hours_per_day, 0),
            horaNotAd: parseFloatSafe(item.reduced_hour_percent, 14.2857),
            hasIntra: item.has_intrajornada ? 'sim' : 'nao',
            intraPerc: parseFloatSafe(item.intrajornada_percent, 0),
            vtValue: parseFloatSafe(item.vt_value, 5.5),
            city: funcCity,
            issRate: funcIssRate,
          };
        }

        const funcCity = item.city || city;
        const funcIssRate = item.iss_rate || cityMap.get(funcCity) || 0;

        // Garantir que shift_type seja 'diurno' ou 'noturno'
        let horarioTipo: 'diurno' | 'noturno' = 'diurno';
        if (item.shift_type === 'noturno') {
          horarioTipo = 'noturno';
        } else if (item.shift_type === 'diurno') {
          horarioTipo = 'diurno';
        }

        const pericValue = parseFloatSafe(item.periculosity_percent, 0);

        // Buscar salário atualizado de config_functions, ou usar o salvo no orçamento
        const updatedSalary = salaryMap.get(item.function_name) || parseFloatSafe(item.salary, 0);

        const funcConfig = {
          id: item.id,
          nome: item.function_name || '',
          chaveSalario: '',
          qtd: item.quantity || 1,
          salario: updatedSalary,
          escala: item.scale || '12x36',
          horarioTipo: horarioTipo,
          peric: serviceType === 'vigilancia' ? 30 : pericValue,
          insal: parseFloatSafe(item.unhealthiness_percent, 0),
          grat: parseFloatSafe(item.bonus_percent, 0),
          notPerc: parseFloatSafe(item.night_additional_percent, 20),
          horas: parseFloatSafe(item.hours_per_day, 0),
          horaNotAd: parseFloatSafe(item.reduced_hour_percent, 14.2857),
          hasIntra: item.has_intrajornada ? 'sim' : 'nao',
          intraPerc: parseFloatSafe(item.intrajornada_percent, 0),
          vtValue: parseFloatSafe(item.vt_value, vtValue),
          city: funcCity,
          issRate: funcIssRate,
        };

        console.log('✅ Função carregada:', {
          nome: funcConfig.nome,
          escala: funcConfig.escala,
          horarioTipo: funcConfig.horarioTipo,
          hasIntra: funcConfig.hasIntra,
          intraPerc: funcConfig.intraPerc
        });

        return funcConfig;
      });

      for (const func of loadedFunctions) {
        if (func.city && (func.issRate === 0 || !data.find(d => d.id === func.id)?.iss_rate)) {
          await updateFunctionInDatabase(func);
        }
      }

      console.log('✅ Funções carregadas com sucesso:', loadedFunctions.length);
      setFuncoes(loadedFunctions);
    } else {
      console.log('ℹ️ Nenhuma função encontrada para este orçamento');
      setFuncoes([]);
    }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do orçamento:', error);
      alert('Erro ao carregar dados do orçamento. Tente recarregar a página.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedCalculation = async () => {
    if (!activeBudget) return;

    const { data, error } = await supabase
      .from('budget_calculations')
      .select('*')
      .eq('budget_id', activeBudget.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar cálculo salvo:', error);
      return;
    }

    if (data) {
      setResultado({
        funcoesDados: data.function_data,
        taxaBDI: data.total_bdi,
        totalContrato: data.total_contract,
      });
    }
  };

  const saveCalculation = async (
    funcoesDados: FunctionData[],
    taxaBDI: number,
    totalContrato: number
  ) => {
    if (!activeBudget) return;

    const functionDataWithConfig = funcoesDados.map((funcData) => {
      const originalConfig = funcoes.find(f => f.nome === funcData.nome && f.id === funcData.id);
      if (!originalConfig) {
        console.warn('Config não encontrado para função:', funcData.nome);
        return funcData;
      }
      return {
        ...funcData,
        config: {
          nome: originalConfig.nome,
          qtd: originalConfig.qtd,
          salario: originalConfig.salario,
          escala: originalConfig.escala,
          horarioTipo: originalConfig.horarioTipo,
          peric: originalConfig.peric,
          insal: originalConfig.insal,
          grat: originalConfig.grat,
          notPerc: originalConfig.notPerc,
          horas: originalConfig.horas,
          horaNotAd: originalConfig.horaNotAd,
          hasIntra: originalConfig.hasIntra,
          intraPerc: originalConfig.intraPerc,
          vtValue: originalConfig.vtValue,
          city: originalConfig.city,
          issRate: originalConfig.issRate,
        }
      };
    });

    const { error } = await supabase
      .from('budget_calculations')
      .upsert({
        budget_id: activeBudget.id,
        function_data: functionDataWithConfig,
        total_bdi: taxaBDI,
        total_contract: totalContrato,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'budget_id'
      });

    if (error) {
      console.error('Erro ao salvar cálculo:', error);
      alert('Erro ao salvar o cálculo. Tente novamente.');
    } else {
      console.log('Cálculo salvo com sucesso');
    }
  };

  const deleteCalculation = async () => {
    if (!activeBudget) return;

    if (!confirm('Tem certeza que deseja excluir o cálculo salvo? Esta ação não pode ser desfeita.')) {
      return;
    }

    const { error } = await supabase
      .from('budget_calculations')
      .delete()
      .eq('budget_id', activeBudget.id);

    if (error) {
      console.error('Erro ao excluir cálculo:', error);
      alert('Erro ao excluir o cálculo.');
    } else {
      setResultado(null);
      alert('Cálculo excluído com sucesso!');
    }
  };

  const saveFunctionToDatabase = async (funcao: FunctionConfig) => {
    if (!activeBudget) return null;

    // Validar e garantir que não há NaN
    const dataToInsert = {
      budget_id: activeBudget.id,
      function_name: funcao.nome || '',
      quantity: funcao.qtd || 1,
      salary: isNaN(funcao.salario) ? 0 : funcao.salario,
      scale: funcao.escala || '12x36',
      shift_type: funcao.horarioTipo || 'diurno',
      periculosity_percent: isNaN(funcao.peric) ? 0 : funcao.peric,
      unhealthiness_percent: isNaN(funcao.insal) ? 0 : funcao.insal,
      bonus_percent: isNaN(funcao.grat) ? 0 : funcao.grat,
      night_additional_percent: isNaN(funcao.notPerc) ? 20 : funcao.notPerc,
      hours_per_day: isNaN(funcao.horas) ? 0 : funcao.horas,
      reduced_hour_percent: isNaN(funcao.horaNotAd) ? 14.2857 : funcao.horaNotAd,
      has_intrajornada: funcao.hasIntra === 'sim',
      intrajornada_percent: isNaN(funcao.intraPerc) ? 0 : funcao.intraPerc,
      vt_value: isNaN(funcao.vtValue) ? 5.5 : funcao.vtValue,
      city: funcao.city || '',
      iss_rate: isNaN(funcao.issRate) ? 0 : funcao.issRate,
    };

    console.log('💾 Salvando função no banco:', {
      nome: funcao.nome,
      escala: funcao.escala,
      horario: funcao.horarioTipo,
      horario_type: typeof funcao.horarioTipo,
      hasIntra: funcao.hasIntra,
      funcao_completa: JSON.stringify(funcao, null, 2),
      data: dataToInsert,
      data_shift_type: dataToInsert.shift_type,
      data_shift_type_type: typeof dataToInsert.shift_type
    });

    const { data, error } = await supabase
      .from('budget_functions')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar função:', error);
      return null;
    } else {
      console.log('✅ Função salva com sucesso, ID:', data.id);
      return data.id;
    }
  };

  const updateFunctionInDatabase = async (funcao: FunctionConfig) => {
    if (!activeBudget) return;

    setIsSaving(true);
    console.log('💾 Salvando alterações da função:', funcao.nome);

    // Validar e garantir que não há NaN
    const dataToUpdate = {
      function_name: funcao.nome || '',
      quantity: funcao.qtd || 1,
      salary: isNaN(funcao.salario) ? 0 : funcao.salario,
      scale: funcao.escala || '12x36',
      shift_type: funcao.horarioTipo || 'diurno',
      periculosity_percent: isNaN(funcao.peric) ? 0 : funcao.peric,
      unhealthiness_percent: isNaN(funcao.insal) ? 0 : funcao.insal,
      bonus_percent: isNaN(funcao.grat) ? 0 : funcao.grat,
      night_additional_percent: isNaN(funcao.notPerc) ? 20 : funcao.notPerc,
      hours_per_day: isNaN(funcao.horas) ? 0 : funcao.horas,
      reduced_hour_percent: isNaN(funcao.horaNotAd) ? 14.2857 : funcao.horaNotAd,
      has_intrajornada: funcao.hasIntra === 'sim',
      intrajornada_percent: isNaN(funcao.intraPerc) ? 0 : funcao.intraPerc,
      vt_value: isNaN(funcao.vtValue) ? 5.5 : funcao.vtValue,
      city: funcao.city || '',
      iss_rate: isNaN(funcao.issRate) ? 0 : funcao.issRate,
    };

    console.log('🔄 Atualizando função no banco:', {
      id: funcao.id,
      nome: funcao.nome,
      escala: funcao.escala,
      horario: funcao.horarioTipo,
      horario_type: typeof funcao.horarioTipo,
      hasIntra: funcao.hasIntra,
      funcao_completa: JSON.stringify(funcao, null, 2),
      data: dataToUpdate,
      data_shift_type: dataToUpdate.shift_type,
      data_shift_type_type: typeof dataToUpdate.shift_type
    });

    const { error } = await supabase
      .from('budget_functions')
      .update(dataToUpdate)
      .eq('id', funcao.id);

    if (error) {
      console.error('❌ Erro ao atualizar função:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    } else {
      console.log('✅ Função atualizada com sucesso');
    }

    setIsSaving(false);
  };

  const deleteFunctionFromDatabase = async (id: string) => {
    const { error } = await supabase.from('budget_functions').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir função:', error);
    }
  };

  const handleAddFunction = async (funcao: FunctionConfig) => {
    const newId = await saveFunctionToDatabase(funcao);

    if (newId) {
      const funcaoComIdCorreto = { ...funcao, id: newId };
      setFuncoes([...funcoes, funcaoComIdCorreto]);
      setShowFunctionSelector(false);
    } else {
      alert('Erro ao adicionar função. Tente novamente.');
    }
  };

  const handleUpdateFunction = async (funcao: FunctionConfig) => {
    setFuncoes(funcoes.map((f) => (f.id === funcao.id ? funcao : f)));
    await updateFunctionInDatabase(funcao);
  };

  const handleDeleteFunction = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta função?')) {
      setFuncoes(funcoes.filter((f) => f.id !== id));
      await deleteFunctionFromDatabase(id);
    }
  };

  const handleCalcular = async () => {
    if (!activeBudget) {
      alert('Você precisa criar um orçamento primeiro!\n\nVá para a aba "Novo Orçamento" e crie um orçamento antes de adicionar funções.');
      return;
    }

    if (funcoes.length === 0) {
      alert('Adicione pelo menos uma função antes de gerar a planilha!\n\nClique em "Nova Função" para adicionar uma função ao orçamento.');
      return;
    }

    const funcoesComCidadePendente = funcoes.filter(f => !f.city || f.city.trim() === '');
    if (funcoesComCidadePendente.length > 0) {
      const nomesFuncoes = funcoesComCidadePendente.map(f => f.nome).join(', ');
      alert(`Selecione a Cidade (ISSQN) para as seguintes funções antes de gerar a planilha:\n\n${nomesFuncoes}\n\nAbra o card de cada função e selecione uma cidade.`);
      return;
    }

    try {
      const { data: configBenefits, error: benefitsError } = await supabase
        .from('config_benefits')
        .select('*')
        .eq('is_active', true)
        .eq('service_type', serviceType)
        .order('order_index');

      if (benefitsError) {
        console.error('Erro ao carregar benefícios:', benefitsError);
        alert('Erro ao carregar configuração de benefícios. Verifique se há benefícios cadastrados nas configurações.');
        return;
      }

      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('budget_id', activeBudget.id);

      if (materialsError) {
        console.error('Erro ao carregar materiais:', materialsError);
      }

      const { data: capex, error: capexError } = await supabase
        .from('capex')
        .select('*')
        .eq('budget_id', activeBudget.id);

      if (capexError) {
        console.error('Erro ao carregar capex:', capexError);
      }

      const { data: equipments, error: equipmentsError } = await supabase
        .from('equipments')
        .select('*')
        .eq('budget_id', activeBudget.id);

      if (equipmentsError) {
        console.error('Erro ao carregar equipamentos:', equipmentsError);
      }

      const { data: uniformes, error: uniformesError } = await supabase
        .from('uniforms')
        .select('*')
        .eq('budget_id', activeBudget.id);

      if (uniformesError) {
        console.error('Erro ao carregar uniformes:', uniformesError);
      }

      const { data: others, error: othersError } = await supabase
        .from('others')
        .select('*')
        .eq('budget_id', activeBudget.id);

      if (othersError) {
        console.error('Erro ao carregar outros itens:', othersError);
      }

      const { data: beneficiosDiferenciados, error: beneficiosError } = await supabase
        .from('differentiated_benefits')
        .select('*')
        .eq('budget_id', activeBudget.id);

      if (beneficiosError) {
        console.error('Erro ao carregar benefícios diferenciados:', beneficiosError);
      }

      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('*');

      if (citiesError) {
        console.error('Erro ao carregar cidades:', citiesError);
      }

      const cityMap = new Map(cities?.map(c => [c.name, c.iss_rate]) || []);

      const funcoesDados: FunctionData[] = await Promise.all(funcoes.map(async (funcao) => {
        const materiaisParaEstaFuncao = materials?.filter(m => {
          const allocatedFunctions = m.allocated_functions || [];
          return allocatedFunctions.length === 0 || allocatedFunctions.includes(funcao.id);
        }) || [];

        const capexParaEstaFuncao = capex?.filter(c => {
          const allocatedFunctions = c.allocated_functions || [];
          return allocatedFunctions.length === 0 || allocatedFunctions.includes(funcao.id);
        }) || [];

        // Equipamentos e uniformes funcionam por função (function_id) - valores para 1 funcionário, multiplicados pela qtd
        const equipamentosParaEstaFuncao = equipments?.filter(e => e.function_id === funcao.id) || [];
        const uniformesParaEstaFuncao = uniformes?.filter(u => u.function_id === funcao.id) || [];
        const beneficiosDiferenciadosParaEstaFuncao = beneficiosDiferenciados?.filter(b => b.function_id === funcao.id) || [];

        const totalMateriaisFuncao = materiaisParaEstaFuncao.reduce((sum, m) => sum + m.monthly_value, 0);
        const totalCapexFuncao = capexParaEstaFuncao.reduce((sum, c) => sum + c.monthly_value, 0);

        // Equipamentos: valores são para 1 funcionário, multiplicar pela quantidade de funcionários da função
        const escalaConfig = ESCALAS[funcao.escala];
        if (!escalaConfig) {
          console.warn(`⚠️ Escala não encontrada para função ${funcao.nome}: ${funcao.escala}`);
          return null;
        }
        const funcionariosDaFuncao = funcao.qtd * escalaConfig.multiplier;
        const totalEquipamentosFuncao = equipamentosParaEstaFuncao.reduce((sum, e) => sum + e.monthly_value, 0) * funcionariosDaFuncao;

        // Uniformes: valores são para 1 funcionário, multiplicar pela quantidade de funcionários da função
        const totalUniformesFuncao = uniformesParaEstaFuncao.reduce((sum, u) => sum + u.monthly_value, 0) * funcionariosDaFuncao;

        // Outros: valores rateados como materiais
        const outrosParaEstaFuncao = others?.filter(o => {
          const allocatedFunctions = o.allocated_functions || [];
          return allocatedFunctions.length === 0 || allocatedFunctions.includes(funcao.id);
        }) || [];

        const totalOutrosFuncao = outrosParaEstaFuncao.reduce((sum, o) => sum + o.monthly_value, 0);

        const totalBeneficiosDiferenciadosFuncao = beneficiosDiferenciadosParaEstaFuncao.reduce((sum, b) => sum + b.monthly_value, 0);

        const funcoesQueReceberamMateriais = funcoes.filter(f => {
          return materiaisParaEstaFuncao.some(m => {
            const allocatedFunctions = m.allocated_functions || [];
            return allocatedFunctions.length === 0 || allocatedFunctions.includes(f.id);
          });
        });

        const funcoesQueReceberamCapex = funcoes.filter(f => {
          return capexParaEstaFuncao.some(c => {
            const allocatedFunctions = c.allocated_functions || [];
            return allocatedFunctions.length === 0 || allocatedFunctions.includes(f.id);
          });
        });

        const funcoesQueReceberamOutros = funcoes.filter(f => {
          return outrosParaEstaFuncao.some(o => {
            const allocatedFunctions = o.allocated_functions || [];
            return allocatedFunctions.length === 0 || allocatedFunctions.includes(f.id);
          });
        });

        const totalPessoasMateriais = funcoesQueReceberamMateriais.reduce((sum, f) => {
          const escalaConfigTemp = ESCALAS[f.escala];
          if (!escalaConfigTemp) return sum;
          const funcionarios = f.qtd * escalaConfigTemp.multiplier;
          return sum + funcionarios;
        }, 0);
        const totalPessoasCapex = funcoesQueReceberamCapex.reduce((sum, f) => {
          const escalaConfigTemp = ESCALAS[f.escala];
          if (!escalaConfigTemp) return sum;
          const funcionarios = f.qtd * escalaConfigTemp.multiplier;
          return sum + funcionarios;
        }, 0);
        const totalPessoasOutros = funcoesQueReceberamOutros.reduce((sum, f) => {
          const escalaConfigTemp = ESCALAS[f.escala];
          if (!escalaConfigTemp) return sum;
          const funcionarios = f.qtd * escalaConfigTemp.multiplier;
          return sum + funcionarios;
        }, 0);

        const totalPessoasParaCalculo = totalPessoasMateriais > 0 ? totalPessoasMateriais : (totalPessoasCapex > 0 ? totalPessoasCapex : (totalPessoasOutros > 0 ? totalPessoasOutros : funcionariosDaFuncao));

        return await calcularFuncaoComOverrides(
          funcao,
          activeBudget.id,
          funcao.vtValue,
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
      })).then(results => results.filter((f): f is FunctionData => f !== null));

      funcoesDados.forEach((f) => {
        const remunValues = [f.s, f.vPeric, f.vInsal, f.vGrat, f.vNot, f.vRed];
        remunValues.forEach((val) => {
          f.totalAcumulado += val * f.q;
        });
      });

      const encargosComOverrides = await budgetEncargosService.getEncargosWithOverrides(
        activeBudget.id,
        GRUPOS_ENCARGOS
      );

      encargosComOverrides.forEach((grupo) => {
        grupo.i.forEach((item: any) => {
          funcoesDados.forEach((f) => {
            const v = f.baseCalculoGeral * item.p;
            f.totalAcumulado += v;
            f.encargosAcumulado += v;
          });
        });
      });

      funcoesDados.forEach((f) => {
        const vTotalIntra = f.vIntra * f.q;
        f.totalAcumulado += vTotalIntra;
      });

      funcoesDados.forEach((f) => {
        f.beneficios.forEach((benef) => {
          f.totalAcumulado += benef.v;
        });
      });

      funcoesDados.forEach((f) => {
        f.totalAcumulado += f.materiais;
      });

      funcoesDados.forEach((f) => {
        f.totalAcumulado += f.capex;
      });

      funcoesDados.forEach((f) => {
        f.totalAcumulado += f.equipamentos;
      });

      funcoesDados.forEach((f) => {
        f.totalAcumulado += f.uniformes;
      });

      funcoesDados.forEach((f) => {
        f.totalAcumulado += f.outros;
      });

      funcoesDados.forEach((f) => {
        f.totalAcumulado += f.beneficiosDiferenciados;
      });

      funcoesDados.forEach((f) => {
        const funcaoConfig = funcoes.find(fc => fc.nome === f.nome && fc.id === f.id);
        if (!funcaoConfig) {
          console.warn('Config não encontrado para função no cálculo de BDI:', f.nome);
          return;
        }
        const funcaoIssRate = funcaoConfig.issRate ?? (cityMap.get(funcaoConfig.city) || 0);
        // Cálculo do BDI incluindo IRPJ (15% do lucro) e CSLL (9% do lucro)
        // Lucro + IRPJ + CSLL = Lucro * (1 + 0.15 + 0.09) = Lucro * 1.24
        const lucroComImpostos = (margemLucro / 100) * 1.24;
        const taxaBDI = margemAdm / 100 + lucroComImpostos + 0.0065 + 0.03 + funcaoIssRate / 100;

        f.totalComBDI = f.totalAcumulado / (1 - taxaBDI);
        f.valorTotalBDI = f.totalComBDI - f.totalAcumulado;
        f.issRate = funcaoIssRate;
      });

      const totalContrato = funcoesDados.reduce(
        (acc, f) => acc + f.totalComBDI,
        0
      );

      // Buscar encargos customizados para exibição
      const encargosCustomizados = await budgetEncargosService.getEncargosWithOverrides(activeBudget.id, GRUPOS_ENCARGOS);
      setEncargosComOverrides(encargosCustomizados);

      setResultado({ funcoesDados, taxaBDI: 0, totalContrato });

      await saveCalculation(funcoesDados, 0, totalContrato);

      setTimeout(() => {
        const resultsElement = document.querySelector('.results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao calcular:', error);
      alert('Ocorreu um erro ao gerar a planilha. Verifique o console para mais detalhes.');
    }
  };

  const handleOpenMargemModal = () => {
    setTempMargemLucro(margemLucro);
    setTempMargemAdm(margemAdm);
    setShowMargemModal(true);
  };

  const handleSaveMargens = async () => {
    if (!activeBudget) return;

    const { error } = await supabase
      .from('budgets')
      .update({
        margem_lucro: tempMargemLucro,
        margem_adm: tempMargemAdm,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeBudget.id);

    if (error) {
      console.error('Erro ao salvar margens:', error);
      alert('Erro ao salvar margens. Tente novamente.');
      return;
    }

    setMargemLucro(tempMargemLucro);
    setMargemAdm(tempMargemAdm);
    setShowMargemModal(false);
    if (resultado && funcoes.length > 0) {
      handleCalcular();
    }
  };

  return (
    <div className="space-y-8">
      {(isLoading || isSaving) && (
        <div className={`${isLoading ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'} border-l-4 p-4 mb-4 rounded-r-lg shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            <p className={`text-sm font-semibold ${isLoading ? 'text-blue-800' : 'text-green-800'}`}>
              {isLoading ? 'Carregando configurações das funções...' : 'Salvando alterações...'}
            </p>
          </div>
        </div>
      )}

      {!activeBudget && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-8 shadow-lg">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-amber-900 mb-3">
                Nenhum orçamento ativo
              </h3>
              <p className="text-amber-800 mb-4 text-lg">
                Para usar esta funcionalidade, você precisa primeiro criar um orçamento.
              </p>
              <p className="text-amber-700">
                Vá para a aba <strong>"Novo Orçamento"</strong> e clique em <strong>"Incluir Novo Orçamento"</strong> para começar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 no-print">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Relação de postos do orçamento
            </h3>
          </div>
          {activeBudget && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
              serviceType === 'vigilancia'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
            }`}>
              {serviceType === 'vigilancia' ? (
                <>
                  <Shield size={18} />
                  <span>Vigilância</span>
                </>
              ) : (
                <>
                  <Building2 size={18} />
                  <span>Facilities</span>
                </>
              )}
            </div>
          )}
        </div>

        {resultado && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 my-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
              <div className="text-sm font-semibold text-purple-700 mb-2">
                TOTAL FUNCIONÁRIOS
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatPeopleCount(
                  funcoes.reduce((total, funcao) => {
                    const escalaConfig = ESCALAS[funcao.escala];
                    if (!escalaConfig) {
                      console.warn(`⚠️ Escala não encontrada: ${funcao.escala}`);
                      return total;
                    }
                    return total + (funcao.qtd * escalaConfig.multiplier);
                  }, 0)
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border-2 border-pink-200 shadow-lg">
              <div className="text-sm font-semibold text-pink-700 mb-2">
                CUSTO MÉDIO/FUNCIONÁRIO
              </div>
              <div className="text-2xl font-bold text-pink-900">
                {(() => {
                  const totalFuncionarios = funcoes.reduce((total, funcao) => {
                    const escalaConfig = ESCALAS[funcao.escala];
                    if (!escalaConfig) return total;
                    return total + (funcao.qtd * escalaConfig.multiplier);
                  }, 0);
                  return totalFuncionarios > 0
                    ? (resultado.totalContrato / totalFuncionarios).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : 'R$ 0,00';
                })()}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 shadow-lg">
              <div className="text-sm font-semibold text-orange-700 mb-2">
                CUSTO MÉDIO/POSTO
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {(resultado.totalContrato / funcoes.length).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
              <div className="text-sm font-semibold text-blue-700 mb-2">
                TOTAL MENSAL
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {resultado.totalContrato.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-lg">
              <div className="text-sm font-semibold text-green-700 mb-2">
                TOTAL ANUAL
              </div>
              <div className="text-2xl font-bold text-green-900">
                {(resultado.totalContrato * 12).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
            </div>
          </div>
        )}

        {showFunctionSelector && (
          <div className="mb-4">
            <FunctionSelector
              onAddFunction={handleAddFunction}
              serviceType={serviceType}
              defaultCity={city}
              defaultIssRate={issRate}
              defaultVtValue={vtValue}
            />
          </div>
        )}

        {funcoes.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 shadow-inner">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-700 text-lg font-semibold">
              Nenhuma função adicionada. Clique em "Nova Função" para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="overflow-x-auto rounded-lg border-2 border-gray-200 shadow-md">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left font-bold text-gray-900 text-xs w-[25%]">
                      Função
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-gray-900 text-xs w-[7%]">
                      N° postos
                    </th>
                    <th className="px-2 py-3 text-center font-bold text-gray-900 text-xs w-[7%]">
                      N° pessoas
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-900 text-xs w-[15%]">
                      Valor por posto
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900 text-xs w-[16%]">
                      Escala
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-900 text-xs w-[12%]">
                      Horário
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-gray-900 text-xs w-[18%]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funcoes.map((funcao, index) => {
                    const escalaConfig = ESCALAS[funcao.escala];
                    if (!escalaConfig) {
                      console.warn(`⚠️ Escala não encontrada para tabela: ${funcao.escala}`);
                      return null;
                    }
                    const numeroPessoas = funcao.qtd * escalaConfig.multiplier;
                    const funcaoResultado = resultado?.funcoesDados.find(
                      (fd: any) => fd.id === funcao.id
                    );
                    const valorPorPosto = funcaoResultado ? funcaoResultado.totalComBDI / funcao.qtd : 0;
                    const total = valorPorPosto * funcao.qtd;

                    return (
                      <tr key={funcao.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all ${index !== funcoes.length - 1 ? 'border-b border-gray-200' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-gray-900 text-xs">
                          {funcao.nome}
                        </td>
                        <td className="px-2 py-3 text-center text-gray-700 text-xs">
                          {funcao.qtd}
                        </td>
                        <td className="px-2 py-3 text-center text-gray-700 font-medium text-xs">
                          {formatPeopleCount(numeroPessoas)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium text-xs">
                          {funcaoResultado ? (
                            valorPorPosto.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          ) : (
                            <span className="text-gray-400 text-[10px]">Calcular planilha</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-semibold whitespace-nowrap inline-block">
                            {ESCALAS[funcao.escala]?.nome || funcao.escala}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap inline-block ${
                            funcao.horarioTipo === 'noturno'
                              ? 'bg-slate-700 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {funcao.horarioTipo === 'noturno' ? 'Noturno' : 'Diurno'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-bold text-xs">
                          {funcaoResultado ? (
                            total.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-md">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Configurar Funções Detalhadamente
            </h3>
          </div>
          <button
            onClick={() => {
              if (!activeBudget) {
                alert('Você precisa criar um orçamento primeiro!\n\nVá para a aba "Novo Orçamento" e crie um orçamento antes de adicionar funções.');
                return;
              }
              setShowFunctionSelector(!showFunctionSelector);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={!activeBudget}
          >
            <Plus size={22} />
            Nova Função
          </button>
        </div>
        {funcoes.map((funcao) => (
          <FunctionCard
            key={funcao.id}
            funcao={funcao}
            onUpdate={handleUpdateFunction}
            onDelete={handleDeleteFunction}
            serviceType={serviceType}
            budgetId={activeBudget?.id}
          />
        ))}
      </div>

      {encargosOverridesCount > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-xl p-4 no-print">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-orange-900 text-lg mb-1">
                Encargos Sociais Customizados Ativos
              </h4>
              <p className="text-orange-800 text-sm mb-2">
                Este orçamento possui <span className="font-bold">{encargosOverridesCount} encargo(s) social(is) customizado(s)</span>.
                Os valores customizados serão aplicados automaticamente ao recalcular a planilha.
              </p>
              <div className="flex items-center gap-2 text-xs text-orange-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Clique em "RECALCULAR PLANILHA" para aplicar as customizações</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 no-print">
        <button
          onClick={handleCalcular}
          className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
        >
          <Calculator size={26} />
          {resultado ? 'RECALCULAR PLANILHA' : 'GERAR PLANILHA COMPLETA'}
        </button>

        {resultado && (
          <>
            <button
              onClick={handleOpenMargemModal}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <Percent size={26} />
              ALTERAR LUCRO
            </button>
            <button
              onClick={() => setShowEncargosModal(true)}
              className="relative flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold text-lg rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              title="Customizar Encargos Sociais"
            >
              <Settings size={26} />
              ALTERAR ENCARGOS
              {encargosOverridesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                  {encargosOverridesCount}
                </span>
              )}
            </button>
            <button
              onClick={deleteCalculation}
              className="flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold text-lg rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              title="Excluir cálculo salvo"
            >
              <X size={26} />
              LIMPAR
            </button>
          </>
        )}
      </div>

      {resultado && (
        <div className="results-section">
          <ResultsTable
            funcoesDados={resultado.funcoesDados}
            issRate={issRate}
            margemLucro={margemLucro}
            margemAdm={margemAdm}
            encargosComOverrides={encargosComOverrides}
            budgetNumber={activeBudget?.budget_number}
            clientName={activeBudget?.client_name}
          />
        </div>
      )}

      {showMargemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 rounded-xl shadow-md">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Alterar Margens
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Margem de Lucro (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tempMargemLucro}
                  onChange={(e) => setTempMargemLucro(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Margem Administrativa (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tempMargemAdm}
                  onChange={(e) => setTempMargemAdm(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-lg"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowMargemModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMargens}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Salvar e Recalcular
              </button>
            </div>
          </div>
        </div>
      )}

      {activeBudget && (
        <EncargosOverridesModal
          isOpen={showEncargosModal}
          onClose={() => setShowEncargosModal(false)}
          budgetId={activeBudget.id}
          budgetName={`${activeBudget.budget_number} - ${activeBudget.client_name}`}
          onSave={handleEncargosModalSave}
        />
      )}
    </div>
  );
};
