import { X, Printer, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { moeda, calcularFuncao, calcularFuncaoComOverrides } from '../utils';
import { ESCALAS, GRUPOS_ENCARGOS } from '../constants';
import { budgetEncargosService } from '../services/budgetEncargosService';
import { getMinimumWage } from '../services/systemConfigService';
import type { FunctionConfig } from '../types';

interface PrintProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  budgetNumber: string;
  clientName: string;
  description: string;
}

interface FunctionData {
  id: string;
  nome: string;
  q: number;
  s: number;
  totalComBDI: number;
  config?: {
    qtd?: number;
    escala?: string;
    horarioTipo?: string;
  };
}

interface Material {
  id: string;
  name: string;
  monthly_value: number;
  quantity?: number;
  unit_value?: number;
}

export const PrintProposalModal = ({
  isOpen,
  onClose,
  budgetId,
  budgetNumber,
  clientName,
  description,
}: PrintProposalModalProps) => {
  const [functions, setFunctions] = useState<FunctionData[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [capex, setCapex] = useState<Material[]>([]);
  const [equipments, setEquipments] = useState<Material[]>([]);
  const [uniforms, setUniforms] = useState<Material[]>([]);
  const [others, setOthers] = useState<Material[]>([]);
  const [differentiatedBenefits, setDifferentiatedBenefits] = useState<Material[]>([]);
  const [createdDate, setCreatedDate] = useState<string>('');
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [costPerPosition, setCostPerPosition] = useState<number>(0);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [annualTotal, setAnnualTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [margemLucro, setMargemLucro] = useState(10);
  const [margemAdm, setMargemAdm] = useState(5);
  const [issRate, setIssRate] = useState(0);
  const [vtValue, setVtValue] = useState(5.5);
  const [detailedFunctions, setDetailedFunctions] = useState<Array<{
    config: FunctionConfig;
    data: FunctionData;
  }>>([]);
  const [encargosComOverrides, setEncargosComOverrides] = useState<any[]>(GRUPOS_ENCARGOS);
  const [minimumWage, setMinimumWage] = useState(1621.00);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, budgetId]);

  const loadData = async () => {
    setIsLoading(true);

    // Carregar salário mínimo
    const wage = await getMinimumWage();
    setMinimumWage(wage);

    // Carregar dados do orçamento
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('created_at, margem_lucro, margem_adm')
      .eq('id', budgetId)
      .maybeSingle();

    // Usar valores locais das margens para cálculos imediatos
    const margemLucroAtual = budgetData?.margem_lucro || 10;
    const margemAdmAtual = budgetData?.margem_adm || 5;

    if (budgetData) {
      const date = new Date(budgetData.created_at);
      setCreatedDate(date.toLocaleDateString('pt-BR'));
      setMargemLucro(margemLucroAtual);
      setMargemAdm(margemAdmAtual);
    }

    // Carregar cálculos
    const { data: calculation } = await supabase
      .from('budget_calculations')
      .select('function_data, total_contract')
      .eq('budget_id', budgetId)
      .maybeSingle();

    if (calculation && calculation.function_data) {
      const funcData = calculation.function_data as FunctionData[];
      setFunctions(funcData);

      // Calcular totais
      const totalFunc = funcData.reduce((sum, f) => sum + (f.q * 1), 0);
      setTotalEmployees(totalFunc);

      const totalPosts = funcData.reduce((sum, f) => sum + (f.config?.qtd || 1), 0);

      const monthlyTotalCalc = parseFloat(calculation.total_contract) || 0;
      setMonthlyTotal(monthlyTotalCalc);
      setAnnualTotal(monthlyTotalCalc * 12);

      if (totalPosts > 0) {
        setCostPerPosition(monthlyTotalCalc / totalPosts);
      }
    }

    // Carregar materiais
    const { data: materialsData } = await supabase
      .from('materials')
      .select('*')
      .eq('budget_id', budgetId);

    if (materialsData) {
      setMaterials(materialsData);
    }

    // Carregar capex
    const { data: capexData } = await supabase
      .from('capex')
      .select('*')
      .eq('budget_id', budgetId);

    if (capexData) {
      setCapex(capexData);
    }

    // Carregar equipamentos
    const { data: equipmentsData } = await supabase
      .from('equipments')
      .select('*')
      .eq('budget_id', budgetId);

    if (equipmentsData) {
      setEquipments(equipmentsData);
    }

    // Carregar uniformes
    const { data: uniformsData } = await supabase
      .from('uniforms')
      .select('*')
      .eq('budget_id', budgetId);

    if (uniformsData) {
      setUniforms(uniformsData);
    }

    // Carregar outros
    const { data: othersData } = await supabase
      .from('others')
      .select('*')
      .eq('budget_id', budgetId);

    if (othersData) {
      setOthers(othersData);
    }

    // Carregar benefícios diferenciados
    const { data: benefitsData } = await supabase
      .from('differentiated_benefits')
      .select('*')
      .eq('budget_id', budgetId);

    if (benefitsData) {
      setDifferentiatedBenefits(benefitsData);
    }

    // Carregar benefícios configuráveis
    const { data: configBenefits } = await supabase
      .from('config_benefits')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    // Carregar encargos customizados
    const encargosCustomizados = await budgetEncargosService.getEncargosWithOverrides(budgetId, GRUPOS_ENCARGOS);
    setEncargosComOverrides(encargosCustomizados);

    // Carregar funções do banco
    const { data: budgetFunctions } = await supabase
      .from('budget_functions')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: true });

    // Calcular dados detalhados para cada função
    if (budgetFunctions && materialsData && capexData && equipmentsData && uniformsData && othersData && benefitsData && configBenefits) {
      const detailed = await Promise.all(budgetFunctions.map(async (func: any) => {
        // Converter função do banco para FunctionConfig
        const functionConfig: FunctionConfig = {
          id: func.id,
          nome: func.function_name || '',
          chaveSalario: '',
          qtd: func.quantity || 1,
          salario: func.salary || 0,
          escala: func.scale || '12x36',
          horarioTipo: func.shift_type || 'diurno',
          peric: func.periculosity_percent || 0,
          insal: func.unhealthiness_percent || 0,
          grat: func.bonus_percent || 0,
          notPerc: func.night_additional_percent || 20,
          horas: func.hours_per_day || 0,
          horaNotAd: func.reduced_hour_percent || 14.2857,
          hasIntra: func.has_intrajornada ? 'sim' : 'nao',
          intraPerc: func.intrajornada_percent || 0,
          vtValue: func.vt_value || 5.5,
          city: func.city || '',
          issRate: func.iss_rate || 0,
        };

        // Filtrar materiais, capex, equipamentos alocados para esta função
        const materiaisParaEstaFuncao = materialsData.filter((m: any) => {
          const allocatedFunctions = m.allocated_functions || [];
          return allocatedFunctions.length === 0 || allocatedFunctions.includes(func.id);
        });

        const capexParaEstaFuncao = capexData.filter((c: any) => {
          const allocatedFunctions = c.allocated_functions || [];
          return allocatedFunctions.length === 0 || allocatedFunctions.includes(func.id);
        });

        const equipamentosParaEstaFuncao = equipmentsData.filter((e: any) => {
          const allocatedFunctions = e.allocated_functions || [];
          return allocatedFunctions.length === 0 || allocatedFunctions.includes(func.id);
        });

        const uniformesParaEstaFuncao = uniformsData.filter(
          (u: any) => u.function_id === func.id
        );

        const outrosParaEstaFuncao = othersData.filter((o: any) => {
          const allocatedFunctions = o.allocated_functions || [];
          return allocatedFunctions.length === 0 || allocatedFunctions.includes(func.id);
        });

        const beneficiosDiferenciadosParaEstaFuncao = benefitsData.filter(
          (b: any) => b.function_id === func.id
        );

        // Calcular totais
        const totalMateriaisFuncao = materiaisParaEstaFuncao.reduce((sum: number, m: any) => sum + m.monthly_value, 0);
        const totalCapexFuncao = capexParaEstaFuncao.reduce((sum: number, c: any) => sum + c.monthly_value, 0);
        const totalEquipamentosFuncao = equipamentosParaEstaFuncao.reduce((sum: number, e: any) => sum + e.monthly_value, 0);
        const totalUniformesFuncao = uniformesParaEstaFuncao.reduce((sum: number, u: any) => sum + u.monthly_value, 0);
        const totalOutrosFuncao = outrosParaEstaFuncao.reduce((sum: number, o: any) => sum + o.monthly_value, 0);
        const totalBeneficiosDiferenciadosFuncao = beneficiosDiferenciadosParaEstaFuncao.reduce((sum: number, b: any) => sum + b.monthly_value, 0);

        // Calcular número total de pessoas para divisão de materiais/equipamentos
        const funcoesQueReceberamMateriais = budgetFunctions.filter((f: any) => {
          return materiaisParaEstaFuncao.some((m: any) => {
            const allocatedFunctions = m.allocated_functions || [];
            return allocatedFunctions.length === 0 || allocatedFunctions.includes(f.id);
          });
        });

        const funcoesQueReceberamEquipamentos = budgetFunctions.filter((f: any) => {
          return equipamentosParaEstaFuncao.some((e: any) => {
            const allocatedFunctions = e.allocated_functions || [];
            return allocatedFunctions.length === 0 || allocatedFunctions.includes(f.id);
          });
        });

        const totalPessoasMateriais = funcoesQueReceberamMateriais.reduce((sum: number, f: any) => {
          const escalaConfig = ESCALAS[f.scale || '12x36'];
          const funcionarios = f.quantity * escalaConfig.multiplier;
          return sum + funcionarios;
        }, 0);

        const totalPessoasEquipamentos = funcoesQueReceberamEquipamentos.reduce((sum: number, f: any) => {
          const escalaConfig = ESCALAS[f.scale || '12x36'];
          const funcionarios = f.quantity * escalaConfig.multiplier;
          return sum + funcionarios;
        }, 0);

        // Calcular dados detalhados da função
        const functionData = await calcularFuncaoComOverrides(
          functionConfig,
          budgetId,
          functionConfig.vtValue,
          configBenefits || [],
          totalMateriaisFuncao,
          totalCapexFuncao,
          totalEquipamentosFuncao,
          totalUniformesFuncao,
          totalPessoasMateriais || totalPessoasEquipamentos || 1,
          totalBeneficiosDiferenciadosFuncao,
          totalOutrosFuncao,
          wage
        );

        // Calcular totalAcumulado e encargos
        let totalAcumulado = 0;
        const remunValues = [
          functionData.s,
          functionData.vPeric,
          functionData.vInsal,
          functionData.vGrat,
          functionData.vNot,
          functionData.vRed,
        ];
        remunValues.forEach((val) => {
          totalAcumulado += val * functionData.q;
        });

        // Adicionar encargos (usando valores customizados se disponíveis)
        let encargosAcumulado = 0;
        encargosComOverrides.forEach((grupo) => {
          grupo.i.forEach((item) => {
            const v = functionData.baseCalculoGeral * item.p;
            totalAcumulado += v;
            encargosAcumulado += v;
          });
        });

        const vTotalIntra = functionData.vIntra * functionData.q;
        totalAcumulado += vTotalIntra;

        functionData.beneficios.forEach((benef) => {
          totalAcumulado += benef.v;
        });

        totalAcumulado += functionData.materiais;
        totalAcumulado += functionData.capex;
        totalAcumulado += functionData.equipamentos;
        totalAcumulado += functionData.uniformes;
        totalAcumulado += functionData.outros || 0;
        totalAcumulado += functionData.beneficiosDiferenciados;

        // Calcular BDI - A fórmula é: totalComBDI = totalSemBDI / (1 - somaDasPercentagens)
        // Isso garante que os itens do BDI (calculados sobre o totalComBDI) somem exatamente o valorTotalBDI
        // Exemplo: se total sem BDI = 11.837,58 e percentagens somam 21,65%:
        // totalComBDI = 11.837,58 / (1 - 0.2165) = 15.108,60
        // E cada item do BDI é calculado sobre os 15.108,60

        const funcIssRate = functionConfig.issRate || 0;
        const somaBDI = (margemAdmAtual / 100) + (margemLucroAtual / 100) + 0.0065 + 0.03 + (funcIssRate / 100);
        const totalComBDI = totalAcumulado / (1 - somaBDI);
        const valorTotalBDI = totalComBDI - totalAcumulado;

        // Atualizar functionData com os valores calculados
        functionData.totalAcumulado = totalAcumulado;
        functionData.encargosAcumulado = encargosAcumulado;
        functionData.totalComBDI = totalComBDI;
        functionData.valorTotalBDI = valorTotalBDI;
        functionData.issRate = funcIssRate;

        return {
          config: functionConfig,
          data: functionData
        };
      }));

      setDetailedFunctions(detailed);
    }

    setIsLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @media print {
          /* Forçar impressão de cores e backgrounds */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Esconder todo o resto da página */
          body * {
            visibility: hidden !important;
          }

          /* Tornar visível apenas o container do modal e seus filhos */
          #print-proposal-modal-container,
          #print-proposal-modal-container * {
            visibility: visible !important;
          }

          /* Resetar estilos do container do modal */
          #print-proposal-modal-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            z-index: 1 !important;
          }

          /* Resetar estilos do modal interno */
          #print-proposal-modal-content {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
          }

          /* Área de conteúdo */
          #print-proposal-modal-scroll {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            padding: 10mm !important;
          }

          /* Garantir que o conteúdo caiba */
          #proposalPrintModal {
            page-break-inside: auto;
            overflow: visible !important;
          }

          /* Cards individuais */
          #proposalPrintModal > * {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Garantir que tabelas sejam impressas corretamente */
          table {
            page-break-inside: auto !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          /* Garantir que as bordas das tabelas sejam impressas */
          table, th, td {
            border-color: #cbd5e1 !important;
          }

          /* Manter cores de background dos cards - cores específicas */
          .bg-blue-600 {
            background-color: #2563eb !important;
          }

          .bg-green-600 {
            background-color: #16a34a !important;
          }

          .bg-purple-600 {
            background-color: #9333ea !important;
          }

          .bg-orange-600 {
            background-color: #ea580c !important;
          }

          .bg-amber-600 {
            background-color: #d97706 !important;
          }

          .bg-teal-600 {
            background-color: #0d9488 !important;
          }

          .bg-pink-50 {
            background-color: #fdf2f8 !important;
          }

          .bg-purple-50 {
            background-color: #faf5ff !important;
          }

          .bg-orange-50 {
            background-color: #fff7ed !important;
          }

          .bg-blue-50 {
            background-color: #eff6ff !important;
          }

          .bg-green-50 {
            background-color: #f0fdf4 !important;
          }

          /* Cores de texto */
          .text-white {
            color: #ffffff !important;
          }

          .text-blue-600 {
            color: #2563eb !important;
          }

          .text-green-700 {
            color: #15803d !important;
          }

          .text-purple-700 {
            color: #7e22ce !important;
          }

          .text-orange-700 {
            color: #c2410c !important;
          }

          .text-amber-700 {
            color: #b45309 !important;
          }

          .text-teal-700 {
            color: #0f766e !important;
          }

          .text-pink-700 {
            color: #be185d !important;
          }

          /* Garantir que cores de borda sejam impressas */
          .border-blue-200 {
            border-color: #bfdbfe !important;
          }

          .border-green-200 {
            border-color: #bbf7d0 !important;
          }

          .border-purple-200 {
            border-color: #e9d5ff !important;
          }

          .border-orange-200 {
            border-color: #fed7aa !important;
          }

          .border-pink-200 {
            border-color: #fbcfe8 !important;
          }

          /* Background gradiente do total */
          .bg-gradient-to-r {
            background: linear-gradient(to right, #2563eb, #1d4ed8) !important;
          }
        }
      `}</style>
      <div id="print-proposal-modal-container" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div id="print-proposal-modal-content" className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - não imprime */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Imprimir Proposta</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Printer size={18} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Fechar"
            >
              <X size={24} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div id="print-proposal-modal-scroll" className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6 print:space-y-4" id="proposalPrintModal">
              {/* Primeira página - resumo compacto */}
              <div className="print-summary space-y-5 print:space-y-4">
              {/* Cabeçalho da Proposta */}
              <div className="bg-white p-4 rounded-lg border border-slate-200" data-print="summary-header">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                        {budgetNumber}
                      </span>
                      <span className="text-xs text-slate-600">Data: {createdDate}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{clientName}</h3>
                    {description && (
                      <p className="text-slate-700 mt-1 text-sm">{description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <img
                      src="/grupo_wws.jpeg"
                      alt="Grupo WWS"
                      className="h-12 w-auto object-contain"
                      style={{ height: '48px', width: 'auto' }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 1: Relação de postos do orçamento */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid">
                <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2">
                  <FileText size={20} />
                  <h3 className="text-base font-bold">Relação de postos do orçamento</h3>
                </div>
                <div className="p-4">
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-5 gap-3 mb-4" data-print="summary-cards">
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                      <div className="text-xs font-semibold text-purple-900 uppercase mb-1">
                        Total Funcionários
                      </div>
                      <div className="text-xl font-bold text-purple-700">
                        {totalEmployees}
                      </div>
                    </div>
                    <div className="bg-pink-50 p-3 rounded border border-pink-200">
                      <div className="text-xs font-semibold text-pink-900 uppercase mb-1">
                        Custo Médio/Funcionário
                      </div>
                      <div className="text-xl font-bold text-pink-700">
                        {totalEmployees > 0 ? moeda(monthlyTotal / totalEmployees) : 'R$ 0,00'}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <div className="text-xs font-semibold text-orange-900 uppercase mb-1">
                        Custo Médio/Posto
                      </div>
                      <div className="text-xl font-bold text-orange-700">
                        {moeda(costPerPosition)}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="text-xs font-semibold text-blue-900 uppercase mb-1">
                        Total Mensal
                      </div>
                      <div className="text-xl font-bold text-blue-700">
                        {moeda(monthlyTotal)}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="text-xs font-semibold text-green-900 uppercase mb-1">
                        Total Anual
                      </div>
                      <div className="text-xl font-bold text-green-700">
                        {moeda(annualTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Tabela de funções */}
                  {functions.length > 0 && (
                    <div className="overflow-x-auto" data-print="summary-relacao-postos">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-300 px-2 py-1 text-left">Função</th>
                            <th className="border border-slate-300 px-2 py-1 text-center">Nº postos</th>
                            <th className="border border-slate-300 px-2 py-1 text-center">Nº pessoas</th>
                            <th className="border border-slate-300 px-2 py-1 text-right">Valor por posto</th>
                            <th className="border border-slate-300 px-2 py-1 text-center">Escala</th>
                            <th className="border border-slate-300 px-2 py-1 text-center">Horário</th>
                            <th className="border border-slate-300 px-2 py-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {functions.map((func) => {
                            const numPosts = func.config?.qtd || 1;
                            const numPeople = func.q;
                            const escalaKey = func.config?.escala || '';
                            const escalaFormatted = ESCALAS[escalaKey]?.nome || escalaKey;

                            return (
                              <tr key={func.id}>
                                <td className="border border-slate-300 px-2 py-1 font-medium">
                                  {func.nome}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-center">
                                  {numPosts}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-center">
                                  {numPeople}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-right">
                                  {moeda(func.totalComBDI / numPosts)}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-center text-xs">
                                  <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                    {escalaFormatted}
                                  </span>
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-center text-xs">
                                  <span
                                    className={`px-1 py-0.5 rounded text-xs font-medium ${
                                      func.config?.horarioTipo === 'noturno'
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {func.config?.horarioTipo === 'noturno' ? 'Noturno' : 'Diurno'}
                                  </span>
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-right font-bold text-blue-700">
                                  {moeda(func.totalComBDI)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid otimizado - 3 colunas para caber todos os cards */}
              {(materials.length > 0 || capex.length > 0 || equipments.length > 0 || uniforms.length > 0 || others.length > 0 || differentiatedBenefits.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Materiais de consumo */}
                  {materials.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid" data-print="summary-materiais">
                      <div className="bg-green-600 text-white px-3 py-2 flex items-center gap-2">
                        <FileText size={16} />
                        <h3 className="text-sm font-bold">Materiais de Consumo</h3>
                      </div>
                      <div className="p-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-300 px-1 py-1 text-left text-[10px]">Item</th>
                                <th className="border border-slate-300 px-1 py-1 text-right text-[10px]">V. Mensal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {materials.map((material) => (
                                <tr key={material.id}>
                                  <td className="border border-slate-300 px-1 py-1 text-[10px]">{material.name}</td>
                                  <td className="border border-slate-300 px-1 py-1 text-right font-bold text-green-700 text-[10px]">
                                    {moeda(material.monthly_value)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-green-50 font-bold">
                                <td className="border border-slate-300 px-1 py-1 text-right text-[10px]">
                                  Total:
                                </td>
                                <td className="border border-slate-300 px-1 py-1 text-right text-green-700 text-[10px]">
                                  {moeda(materials.reduce((sum, m) => sum + m.monthly_value, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Capex */}
                  {capex.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid" data-print="summary-capex">
                      <div className="bg-purple-600 text-white px-3 py-2 flex items-center gap-2">
                        <FileText size={16} />
                        <h3 className="text-sm font-bold">Capex</h3>
                      </div>
                      <div className="p-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-300 px-1 py-1 text-left text-[10px]">Item</th>
                                <th className="border border-slate-300 px-1 py-1 text-right text-[10px]">V. Mensal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {capex.map((item) => (
                                <tr key={item.id}>
                                  <td className="border border-slate-300 px-1 py-1 text-[10px]">{item.name}</td>
                                  <td className="border border-slate-300 px-1 py-1 text-right font-bold text-purple-700 text-[10px]">
                                    {moeda(item.monthly_value)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-purple-50 font-bold">
                                <td className="border border-slate-300 px-1 py-1 text-right text-[10px]">
                                  Total:
                                </td>
                                <td className="border border-slate-300 px-1 py-1 text-right text-purple-700 text-[10px]">
                                  {moeda(capex.reduce((sum, c) => sum + c.monthly_value, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Equipamentos por Função */}
                  {equipments.length > 0 && (() => {
                    // Agrupar equipamentos por função
                    const equipmentsByFunction = new Map<string, Material[]>();
                    equipments.forEach((equipment: any) => {
                      const functionId = equipment.function_id;
                      if (functionId) {
                        if (!equipmentsByFunction.has(functionId)) {
                          equipmentsByFunction.set(functionId, []);
                        }
                        equipmentsByFunction.get(functionId)?.push(equipment);
                      }
                    });

                    return Array.from(equipmentsByFunction.entries()).map(([functionId, items]) => {
                      // Encontrar nome da função
                      const functionData = functions.find((f: any) => f.id === functionId);
                      const functionName = functionData?.nome || 'Função não identificada';

                      return (
                        <div key={functionId} className="bg-white border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid" data-print="summary-equipamentos">
                          <div className="bg-orange-600 text-white px-3 py-2 flex items-center gap-2">
                            <FileText size={16} />
                            <h3 className="text-sm font-bold">Equipamentos - {functionName}</h3>
                          </div>
                          <div className="p-3">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-1 py-1 text-left text-[10px]">Item</th>
                                    <th className="border border-slate-300 px-1 py-1 text-right text-[10px]">V. Mensal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((equipment) => (
                                    <tr key={equipment.id}>
                                      <td className="border border-slate-300 px-1 py-1 text-[10px]">{equipment.name}</td>
                                      <td className="border border-slate-300 px-1 py-1 text-right font-bold text-orange-700 text-[10px]">
                                        {moeda(equipment.monthly_value)}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="bg-orange-50 font-bold">
                                    <td className="border border-slate-300 px-1 py-1 text-right text-[10px]">
                                      Total:
                                    </td>
                                    <td className="border border-slate-300 px-1 py-1 text-right text-orange-700 text-[10px]">
                                      {moeda(items.reduce((sum, e) => sum + e.monthly_value, 0))}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Uniformes por Função */}
                  {uniforms.length > 0 && (() => {
                    // Agrupar uniformes por função
                    const uniformsByFunction = new Map<string, Material[]>();
                    uniforms.forEach((uniform: any) => {
                      const functionId = uniform.function_id;
                      if (functionId) {
                        if (!uniformsByFunction.has(functionId)) {
                          uniformsByFunction.set(functionId, []);
                        }
                        uniformsByFunction.get(functionId)?.push(uniform);
                      }
                    });

                    return Array.from(uniformsByFunction.entries()).map(([functionId, items]) => {
                      // Encontrar nome da função
                      const functionData = functions.find((f: any) => f.id === functionId);
                      const functionName = functionData?.nome || 'Função não identificada';

                      return (
                        <div key={functionId} className="bg-white border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid" data-print="summary-uniformes">
                          <div className="bg-blue-600 text-white px-3 py-2 flex items-center gap-2">
                            <FileText size={16} />
                            <h3 className="text-sm font-bold">Uniformes - {functionName}</h3>
                          </div>
                          <div className="p-3">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-1 py-1 text-left text-[10px]">Item</th>
                                    <th className="border border-slate-300 px-1 py-1 text-right text-[10px]">V. Mensal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((uniform) => (
                                    <tr key={uniform.id}>
                                      <td className="border border-slate-300 px-1 py-1 text-[10px]">{uniform.name}</td>
                                      <td className="border border-slate-300 px-1 py-1 text-right font-bold text-blue-700 text-[10px]">
                                        {moeda(uniform.monthly_value)}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="bg-blue-50 font-bold">
                                    <td className="border border-slate-300 px-1 py-1 text-right text-[10px]">
                                      Total:
                                    </td>
                                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700 text-[10px]">
                                      {moeda(items.reduce((sum, u) => sum + u.monthly_value, 0))}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Outros */}
                  {others.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid" data-print="summary-outros">
                      <div className="bg-amber-600 text-white px-3 py-2 flex items-center gap-2">
                        <FileText size={16} />
                        <h3 className="text-sm font-bold">Outros</h3>
                      </div>
                      <div className="p-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-300 px-1 py-1 text-left text-[10px]">Item</th>
                                <th className="border border-slate-300 px-1 py-1 text-right text-[10px]">V. Mensal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {others.map((other) => (
                                <tr key={other.id}>
                                  <td className="border border-slate-300 px-1 py-1 text-[10px]">{other.name}</td>
                                  <td className="border border-slate-300 px-1 py-1 text-right font-bold text-amber-700 text-[10px]">
                                    {moeda(other.monthly_value)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-amber-50 font-bold">
                                <td className="border border-slate-300 px-1 py-1 text-right text-[10px]">
                                  Total:
                                </td>
                                <td className="border border-slate-300 px-1 py-1 text-right text-amber-700 text-[10px]">
                                  {moeda(others.reduce((sum, o) => sum + o.monthly_value, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Benefícios Diferenciados */}
                  {differentiatedBenefits.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid" data-print="summary-beneficios">
                      <div className="bg-teal-600 text-white px-3 py-2 flex items-center gap-2">
                        <FileText size={16} />
                        <h3 className="text-sm font-bold">Benefícios Diferenciados</h3>
                      </div>
                      <div className="p-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-300 px-1 py-1 text-left text-[10px]">Item</th>
                                <th className="border border-slate-300 px-1 py-1 text-right text-[10px]">V. Mensal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {differentiatedBenefits.map((benefit) => (
                                <tr key={benefit.id}>
                                  <td className="border border-slate-300 px-1 py-1 text-[10px]">{benefit.name}</td>
                                  <td className="border border-slate-300 px-1 py-1 text-right font-bold text-teal-700 text-[10px]">
                                    {moeda(benefit.monthly_value)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-teal-50 font-bold">
                                <td className="border border-slate-300 px-1 py-1 text-right text-[10px]">
                                  Total:
                                </td>
                                <td className="border border-slate-300 px-1 py-1 text-right text-teal-700 text-[10px]">
                                  {moeda(differentiatedBenefits.reduce((sum, b) => sum + b.monthly_value, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total Geral */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg print:break-inside-avoid" data-print="summary-totais">
                <h3 className="text-lg font-bold mb-1">TOTAL MENSAL DO ORÇAMENTO: {moeda(monthlyTotal)}</h3>
                <h4 className="text-base font-semibold">TOTAL ANUAL DO ORÇAMENTO: {moeda(annualTotal)}</h4>
              </div>
              </div>
              {/* Fim da primeira página - resumo compacto */}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
