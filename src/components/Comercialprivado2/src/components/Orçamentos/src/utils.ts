import { FunctionConfig, FunctionData, Benefit, ConfigBenefit } from './types';
import { ESCALAS } from './constants';
import { supabase } from './lib/supabase';
import { budgetBenefitsService } from './services/budgetBenefitsService';

type FormulaVars = Record<string, number>;

type FormulaToken =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '%' | 'u-' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' }
  | { type: 'func'; name: string; argc: number };

const tokenizeFormula = (expr: string): FormulaToken[] => {
  const tokens: FormulaToken[] = [];
  const s = expr.trim();
  let i = 0;

  const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
  const isIdentChar = (c: string) => /[A-Za-z0-9_]/.test(c);

  let prevType: FormulaToken['type'] | null = null;

  while (i < s.length) {
    const ch = s[i];
    if (!ch) break;
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      prevType = 'lparen';
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      prevType = 'rparen';
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma' });
      prevType = 'comma';
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%') {
      const isUnaryMinus =
        ch === '-' && (prevType === null || prevType === 'op' || prevType === 'lparen' || prevType === 'comma');
      tokens.push({ type: 'op', value: isUnaryMinus ? 'u-' : (ch as any) });
      prevType = 'op';
      i++;
      continue;
    }

    if (ch === '.' || /\d/.test(ch)) {
      let j = i;
      while (j < s.length && (s[j] === '.' || /\d/.test(s[j]))) j++;
      const raw = s.slice(i, j);
      const num = Number(raw);
      if (!Number.isFinite(num)) {
        throw new Error(`Número inválido na fórmula: ${raw}`);
      }
      tokens.push({ type: 'number', value: num });
      prevType = 'number';
      i = j;
      continue;
    }

    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < s.length && isIdentChar(s[j])) j++;
      const ident = s.slice(i, j);
      tokens.push({ type: 'ident', value: ident });
      prevType = 'ident';
      i = j;
      continue;
    }

    throw new Error(`Caractere inválido na fórmula: ${ch}`);
  }

  return tokens;
};

const toRpn = (tokens: FormulaToken[]): FormulaToken[] => {
  const out: FormulaToken[] = [];
  const ops: FormulaToken[] = [];
  const argCounts: number[] = [];

  const precedence = (op: FormulaToken & { type: 'op' }) => {
    switch (op.value) {
      case 'u-':
        return 3;
      case '*':
      case '/':
      case '%':
        return 2;
      case '+':
      case '-':
        return 1;
      default:
        return 0;
    }
  };

  const isLeftAssoc = (op: FormulaToken & { type: 'op' }) => op.value !== 'u-';

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'number' || t.type === 'ident') {
      out.push(t);
      continue;
    }

    if (t.type === 'comma') {
      while (ops.length > 0 && ops[ops.length - 1]?.type !== 'lparen') {
        out.push(ops.pop()!);
      }
      if (argCounts.length === 0) {
        throw new Error('Vírgula fora de chamada de função');
      }
      argCounts[argCounts.length - 1] += 1;
      continue;
    }

    if (t.type === 'op') {
      while (ops.length > 0) {
        const top = ops[ops.length - 1]!;
        if (top.type !== 'op') break;
        const p1 = precedence(t);
        const p2 = precedence(top);
        if ((isLeftAssoc(t) && p1 <= p2) || (!isLeftAssoc(t) && p1 < p2)) {
          out.push(ops.pop()!);
          continue;
        }
        break;
      }
      ops.push(t);
      continue;
    }

    if (t.type === 'lparen') {
      const prev = tokens[i - 1];
      if (prev && prev.type === 'ident') {
        // transform ident + '(' into function call
        ops.pop();
        ops.push({ type: 'func', name: prev.value, argc: 0 });
        argCounts.push(1);
      }
      ops.push(t);
      continue;
    }

    if (t.type === 'rparen') {
      while (ops.length > 0 && ops[ops.length - 1]?.type !== 'lparen') {
        out.push(ops.pop()!);
      }
      if (ops.length === 0) throw new Error('Parênteses desbalanceados');
      ops.pop(); // pop '(' 

      const top = ops[ops.length - 1];
      if (top && top.type === 'func') {
        const argc = argCounts.pop() ?? 0;
        out.push({ type: 'func', name: top.name, argc });
        ops.pop();
      }
      continue;
    }
  }

  while (ops.length > 0) {
    const top = ops.pop()!;
    if (top.type === 'lparen' || top.type === 'rparen') {
      throw new Error('Parênteses desbalanceados');
    }
    out.push(top);
  }

  return out;
};

const evalRpn = (rpn: FormulaToken[], vars: FormulaVars): number => {
  const stack: number[] = [];

  const getVar = (name: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name]!;
    throw new Error(`Variável desconhecida na fórmula: ${name}`);
  };

  for (const t of rpn) {
    if (t.type === 'number') {
      stack.push(t.value);
      continue;
    }
    if (t.type === 'ident') {
      stack.push(getVar(t.value));
      continue;
    }
    if (t.type === 'op') {
      if (t.value === 'u-') {
        const a = stack.pop();
        if (a === undefined) throw new Error('Expressão inválida');
        stack.push(-a);
        continue;
      }
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('Expressão inválida');
      switch (t.value) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          stack.push(a / b);
          break;
        case '%':
          stack.push(a % b);
          break;
      }
      continue;
    }
    if (t.type === 'func') {
      const name = t.name.toLowerCase();
      const argc = t.argc;
      const args = stack.splice(-argc);
      if (args.length !== argc) throw new Error('Chamada de função inválida');

      switch (name) {
        case 'max':
          if (argc !== 2) throw new Error('max() requer 2 argumentos');
          stack.push(Math.max(args[0]!, args[1]!));
          break;
        case 'min':
          if (argc !== 2) throw new Error('min() requer 2 argumentos');
          stack.push(Math.min(args[0]!, args[1]!));
          break;
        case 'abs':
          if (argc !== 1) throw new Error('abs() requer 1 argumento');
          stack.push(Math.abs(args[0]!));
          break;
        case 'round':
          if (argc !== 1) throw new Error('round() requer 1 argumento');
          stack.push(Math.round(args[0]!));
          break;
        case 'ceil':
          if (argc !== 1) throw new Error('ceil() requer 1 argumento');
          stack.push(Math.ceil(args[0]!));
          break;
        case 'floor':
          if (argc !== 1) throw new Error('floor() requer 1 argumento');
          stack.push(Math.floor(args[0]!));
          break;
        default:
          throw new Error(`Função não suportada na fórmula: ${t.name}`);
      }
      continue;
    }
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0]!)) {
    throw new Error('Expressão inválida');
  }
  return stack[0]!;
};

const evaluateFormula = (formula: string, vars: FormulaVars): number => {
  const normalized = formula
    .replace(/Math\.(max|min|abs|round|ceil|floor)\b/g, '$1')
    .trim();
  const tokens = tokenizeFormula(normalized);
  const rpn = toRpn(tokens);
  return evalRpn(rpn, vars);
};

export const moeda = (v: number | undefined | null): string => {
  if (v === undefined || v === null || isNaN(v)) {
    return 'R$ 0,00';
  }
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const getBenefitsFromDatabase = async (serviceType: 'facilities' | 'vigilancia' = 'facilities'): Promise<ConfigBenefit[]> => {
  const { data, error } = await supabase
    .from('config_benefits')
    .select('*')
    .eq('is_active', true)
    .eq('service_type', serviceType)
    .order('order_index');

  if (error) {
    console.error('Erro ao carregar benefícios:', error);
    return [];
  }

  return data || [];
};

export const calculateBenefitValueWithOverride = async (
  benefit: ConfigBenefit,
  budgetId: string | undefined,
  functionId: string,
  vtU: number,
  diasU: number,
  q: number,
  vtDays: number = 62,
  vrDays: number = 22,
  salarioBase: number = 0,
  escalaKey?: string
): Promise<number> => {
  const isVT = benefit.code === 'VT' || benefit.name.toLowerCase().includes('vale transporte');

  if (isVT) {
    console.log('=== DEBUG VT - calculateBenefitValueWithOverride ===');
    console.log('benefit:', benefit.name, '| code:', benefit.code, '| type:', benefit.calculation_type);
    console.log('benefit.formula:', benefit.formula);
    console.log('vtU recebido:', vtU);
    console.log('q:', q, '| vrDays:', vrDays, '| salarioBase:', salarioBase);
    console.log('budgetId:', budgetId, '| functionId:', functionId);
  }

  if (!budgetId) {
    const result = calculateBenefitValue(benefit, vtU, diasU, q, vtDays, vrDays, salarioBase, escalaKey);
    if (isVT) console.log('Sem budgetId - resultado:', result);
    return result;
  }

  const override = await budgetBenefitsService.getOverride(budgetId, functionId, benefit.code);

  if (isVT) {
    console.log('Override encontrado:', override ? JSON.stringify(override) : 'null');
  }

  if (override) {
    // Se há fórmula customizada, usar ela
    if (override.custom_formula) {
      try {
        const formula = override.custom_formula;
        const v = override.custom_value;
        const valor = override.custom_value;
        const s = salarioBase;
        const salario = salarioBase;

        if (isVT) {
          console.log('Usando fórmula customizada:', formula);
          console.log('Variáveis disponíveis: vtU=', vtU, 'vrDays=', vrDays, 'q=', q, 's=', s);
        }

        const value = evaluateFormula(formula, {
          vtU,
          diasU,
          q,
          vtDays,
          vrDays,
          v: Number(v),
          valor: Number(valor),
          s: Number(s),
          salario: Number(salario),
        });

        if (isVT) console.log('Resultado fórmula customizada:', value);
        return value;
      } catch (error) {
        console.error('Erro ao calcular fórmula customizada:', benefit.name, 'Fórmula:', override.custom_formula, 'Erro:', error);
        console.error('Valores: vtU=', vtU, 'diasU=', diasU, 'q=', q, 'vtDays=', vtDays, 'vrDays=', vrDays, 'salarioBase=', salarioBase);
        return calculateBenefitValue(benefit, vtU, diasU, q, vtDays, vrDays, salarioBase, escalaKey);
      }
    }

    // Se o benefício é do tipo fórmula e há valor customizado
    // Usar o valor customizado como vtU e recalcular
    if (benefit.calculation_type === 'formula') {
      if (isVT) {
        console.log('Tipo fórmula com valor customizado:', override.custom_value);
        console.log('Chamando calculateBenefitValue com vtU=', override.custom_value);
      }

      const result = calculateBenefitValue(benefit, override.custom_value, diasU, q, vtDays, vrDays, salarioBase, escalaKey);

      if (isVT) console.log('Resultado com vtU customizado:', result);
      return result;
    }

    // Para outros tipos de benefícios, calcular o ratio e aplicar
    const baseValue = calculateBenefitValue(benefit, vtU, diasU, q, vtDays, vrDays, salarioBase, escalaKey);
    const benefitBase = Number(benefit.base_value ?? 0);
    if (benefitBase !== 0) {
      const ratio = baseValue / benefitBase;
      return override.custom_value * ratio;
    }

    return override.custom_value * q;
  }

  const result = calculateBenefitValue(benefit, vtU, diasU, q, vtDays, vrDays, salarioBase, escalaKey);
  if (isVT) console.log('Sem override - resultado:', result);
  return result;
};

export const calculateBenefitValue = (
  benefit: ConfigBenefit,
  vtU: number,
  diasU: number,
  q: number,
  vtDays: number = 62,
  vrDays: number = 22,
  salarioBase: number = 0,
  escalaKey?: string
): number => {
  const isVT = benefit.code === 'VT' ||
               benefit.code === 'VALE_TRANSPORTE' ||
               benefit.name.toLowerCase().includes('vale transporte');

  const isPPR = benefit.code === 'PPR' || benefit.code === 'PPR_VIGILANCIA';

  if (isVT) {
    console.log('=== DEBUG VT - calculateBenefitValue ===');
    console.log('Parâmetros recebidos:');
    console.log('  vtU:', vtU);
    console.log('  diasU:', diasU);
    console.log('  q:', q);
    console.log('  vtDays:', vtDays);
    console.log('  vrDays:', vrDays);
    console.log('  salarioBase:', salarioBase);
    console.log('  benefit.calculation_type:', benefit.calculation_type);
    console.log('  benefit.formula:', benefit.formula);
    console.log('  benefit.base_value:', benefit.base_value);
  }

  // PRIORIDADE 1: Se há uma fórmula definida, usar ela SEMPRE (independente do calculation_type)
  if (benefit.formula && benefit.formula.trim() !== '') {
    try {
      const formula = benefit.formula;
      // CRITICAL FIX: Converter base_value para número para garantir operações matemáticas corretas
      const v = Number(benefit.base_value);
      const valor = Number(benefit.base_value);
      const s = salarioBase;
      const salario = salarioBase;

      if (isVT) {
        console.log('  🎯 USANDO FÓRMULA (prioritário)');
        console.log('  formula:', formula);
        console.log('  Variáveis no escopo do eval:');
        console.log('    vtU:', vtU);
        console.log('    vtDays:', vtDays);
        console.log('    q:', q);
        console.log('    s:', s);
        console.log('  Calculando: ((', vtDays, '* 2 *', vtU, ') - (0.06 *', s, ')) *', q);
        const bruto = vtDays * 2 * vtU;
        const desconto = 0.06 * s;
        console.log('  Bruto por funcionário:', bruto, '| Desconto por funcionário:', desconto, '| Líquido por func:', bruto - desconto, '| Total (x', q, '):', (bruto - desconto) * q);
      }

      if (isPPR) {
        console.log('=== DEBUG PPR - calculateBenefitValue ===');
        console.log('  benefit.name:', benefit.name);
        console.log('  benefit.code:', benefit.code);
        console.log('  benefit.base_value (original):', benefit.base_value, 'tipo:', typeof benefit.base_value);
        console.log('  v (convertido):', v, 'tipo:', typeof v);
        console.log('  q:', q);
        console.log('  formula:', formula);
        console.log('  Calculando:', `(${v} / 12) * ${q}`);
      }

      const value = evaluateFormula(formula, {
        vtU,
        diasU,
        q,
        vtDays,
        vrDays,
        v: Number(v),
        valor: Number(valor),
        s: Number(s),
        salario: Number(salario),
      });

      if (isVT) {
        console.log('  ✅ Resultado do eval:', value);
      }

      if (isPPR) {
        console.log('  ✅ Resultado PPR:', value);
        console.log('  Esperado:', (v / 12) * q);
      }

      return value;
    } catch (error) {
      console.error('❌ Erro ao calcular fórmula do benefício:', benefit.name, 'Fórmula:', benefit.formula, 'Erro:', error);
      console.error('Valores: vtU=', vtU, 'diasU=', diasU, 'q=', q, 'vtDays=', vtDays, 'vrDays=', vrDays, 'salarioBase=', salarioBase);
      // Em caso de erro, continuar para o switch abaixo como fallback
    }
  }

  // FALLBACK: Se não há fórmula ou houve erro, usar o calculation_type
  switch (benefit.calculation_type) {
    case 'formula':
      // Se chegou aqui, é porque não tinha fórmula válida ou deu erro
      if (isVT) console.log('  ⚠️ Tipo formula mas sem fórmula válida');
      return 0;

    case 'fixed':
      return Number(benefit.base_value) * q;

    case 'per_day':
      const isTransportBenefit = benefit.name.toLowerCase().includes('transporte') ||
                                  benefit.name.toLowerCase().includes('vt') ||
                                  benefit.code.toLowerCase().includes('vt');

      const isRefeicaoBenefit = benefit.name.toLowerCase().includes('refeição') ||
                                benefit.name.toLowerCase().includes('refeicao') ||
                                benefit.name.toLowerCase().includes('vr') ||
                                benefit.code.toLowerCase().includes('vr');

      if (isTransportBenefit) {
        // VT: Quantidade × dias úteis × Valor VT Unitário × 2
        // Usar vtU que vem da função ao invés de base_value
        if (isVT) {
          console.log('  📦 USANDO LÓGICA per_day (fallback)');
          console.log('  Usando vtU=', vtU, 'ao invés de base_value=', benefit.base_value);
        }

        // CORREÇÃO ESPECIAL PARA ESCALA DIÁRIA (S_DIARIA)
        if (escalaKey === 'S_DIARIA') {
          // VT Diária: ((vtDays × 2 × vtU) - (6% × salárioBase × 0.05)) [APENAS 1 DIÁRIA, NÃO MULTIPLICA POR Q]
          // vtDays = 1 para diária, 0.05 é o multiplier proporcional da diária
          const vtBruto = vtDays * 2 * vtU;
          const vtDesconto = 0.06 * salarioBase * 0.05;
          const resultado = Math.max(0, vtBruto - vtDesconto);
          
          if (isVT) {
            console.log('  🎯 ESCALA DIÁRIA - VT: ((', vtDays, '× 2 ×', vtU, ') - (0.06 ×', salarioBase, '× 0.05)) =', resultado);
          }
          
          return resultado;
        }

        // VT Normal: [(Valor × dias × 2) - (6% × salário)] × quantidade
        // vtDays = dias de transporte, multiplica por 2 para ida e volta
        const vtPorFuncionario = (vtU * vtDays * 2) - (0.06 * salarioBase);
        const resultado = Math.max(0, vtPorFuncionario * q);

        if (isVT) {
          console.log('  VT Normal: ((', vtDays, '× 2 ×', vtU, ') - (0.06 ×', salarioBase, ')) ×', q, '=', resultado);
        }

        return resultado;
      } else if (isRefeicaoBenefit) {
        // CORREÇÃO ESPECIAL PARA ESCALA DIÁRIA (S_DIARIA)
        if (escalaKey === 'S_DIARIA') {
          // VR Diária: Valor × 1 [APENAS 1 DIÁRIA, NÃO MULTIPLICA POR Q]
          const resultado = Number(benefit.base_value) * 1;
          
          if (isVT) {
            console.log('  🎯 ESCALA DIÁRIA - VR:', benefit.base_value, '× 1 =', resultado);
          }
          
          return resultado;
        }
        // VR Normal: Quantidade × dias úteis × Valor VR
        return q * vrDays * Number(benefit.base_value);
      } else {
        // Outros benefícios diários
        return Number(benefit.base_value) * vrDays * q;
      }

    case 'per_month':
      return Number(benefit.base_value) * q;

    default:
      return 0;
  }
};

export const calcularFuncao = (
  funcao: FunctionConfig,
  vtU: number,
  configBenefits: ConfigBenefit[],
  totalMateriais: number = 0,
  totalCapex: number = 0,
  totalEquipamentos: number = 0,
  totalUniformes: number = 0,
  totalPessoas: number = 0,
  totalBeneficiosDiferenciados: number = 0,
  totalOutros: number = 0,
  minimumWage: number = 1621.00
): FunctionData => {
  const q = funcao.qtd;
  const s = funcao.salario;
  const escalaConfig = ESCALAS[funcao.escala];
  const diasU = escalaConfig.dias;
  const multiplier = escalaConfig.multiplier;
  const vrDays = escalaConfig.vrDays;
  const vtDays = escalaConfig.vtDays;
  const pPeric = funcao.peric / 100;
  const pInsal = funcao.insal / 100;
  const pGrat = funcao.grat / 100;

  const vPeric = s * pPeric;
  const vInsal = minimumWage * pInsal;
  const vGrat = s * pGrat;

  let vNot = 0;
  let vRed = 0;

  // Para escala diária, não usar vrDays nos cálculos de adicionais
  const diasParaCalculos = funcao.escala === 'S_DIARIA' ? 1 : vrDays;

  if (funcao.horarioTipo === 'noturno') {
    const h = funcao.horas;
    const pN = funcao.notPerc / 100;
    const pR = funcao.horaNotAd / 100;
    vNot = (((s + vPeric) * pN) / 220) * (diasParaCalculos * h) ;
    vRed = (((s + vPeric) * pR) / 220) * ((diasParaCalculos * h) / 7);
  }

  const somaRemunUnit = s + vPeric + vInsal + vNot + vRed + vGrat;

  let vIntra = 0;
  if (funcao.hasIntra === 'sim') {
    const pIntra = funcao.intraPerc / 100;
    vIntra = (somaRemunUnit / 220) * diasParaCalculos * (1 + pIntra);
  }

  const quantidadeEfetiva = q * multiplier;

  const beneficios: Benefit[] = configBenefits.map((benefit) => ({
    d: benefit.name,
    v: calculateBenefitValue(benefit, vtU, diasU, quantidadeEfetiva, vtDays, vrDays, s, funcao.escala),
  }));

  let materiaisValor = 0;
  if (totalMateriais > 0 && totalPessoas > 0) {
    const valorPorPessoa = totalMateriais / totalPessoas;
    materiaisValor = valorPorPessoa * quantidadeEfetiva;
  }

  let capexValor = 0;
  if (totalCapex > 0 && totalPessoas > 0) {
    const valorPorPessoa = totalCapex / totalPessoas;
    capexValor = valorPorPessoa * quantidadeEfetiva;
  }

  // Equipamentos já vêm pré-calculados (multiplicados pelo número de funcionários da função)
  // Não devem ser divididos/multiplicados novamente
  let equipamentosValor = totalEquipamentos;

  // Uniformes já vêm pré-calculados (multiplicados pelo número de funcionários da função)
  // Não devem ser divididos/multiplicados novamente
  let uniformesValor = totalUniformes;

  let outrosValor = 0;
  if (totalOutros > 0 && totalPessoas > 0) {
    const valorPorPessoa = totalOutros / totalPessoas;
    outrosValor = valorPorPessoa * quantidadeEfetiva;
  }

  let beneficiosDiferenciadosValor = 0;
  if (totalBeneficiosDiferenciados > 0) {
    beneficiosDiferenciadosValor = totalBeneficiosDiferenciados * quantidadeEfetiva;
  }

  return {
    id: funcao.id,
    nome: funcao.nome,
    q: quantidadeEfetiva,
    diasU,
    s,
    vPeric,
    vInsal,
    vGrat,
    vNot,
    vRed,
    vIntra,
    baseCalculoGeral: somaRemunUnit * quantidadeEfetiva,
    beneficios,
    materiais: materiaisValor,
    capex: capexValor,
    equipamentos: equipamentosValor,
    uniformes: uniformesValor,
    outros: outrosValor,
    beneficiosDiferenciados: beneficiosDiferenciadosValor,
    totalAcumulado: 0,
    encargosAcumulado: 0,
    totalComBDI: 0,
    valorTotalBDI: 0,
    issRate: 0,
  };
};

export const calcularFuncaoComOverrides = async (
  funcao: FunctionConfig,
  budgetId: string | undefined,
  vtU: number,
  configBenefits: ConfigBenefit[],
  totalMateriais: number = 0,
  totalCapex: number = 0,
  totalEquipamentos: number = 0,
  totalUniformes: number = 0,
  totalPessoas: number = 0,
  totalBeneficiosDiferenciados: number = 0,
  totalOutros: number = 0,
  minimumWage: number = 1621.00
): Promise<FunctionData> => {
  const baseData = calcularFuncao(
    funcao, vtU, configBenefits, totalMateriais, totalCapex,
    totalEquipamentos, totalUniformes, totalPessoas, totalBeneficiosDiferenciados, totalOutros, minimumWage
  );

  if (!budgetId) {
    return baseData;
  }

  const q = funcao.qtd;
  const s = funcao.salario;
  const escalaConfig = ESCALAS[funcao.escala];
  const diasU = escalaConfig.dias;
  const multiplier = escalaConfig.multiplier;
  const vrDays = escalaConfig.vrDays;
  const vtDays = escalaConfig.vtDays;
  const quantidadeEfetiva = q * multiplier;

  const beneficiosWithOverrides: Benefit[] = [];
  for (const benefit of configBenefits) {
    const value = await calculateBenefitValueWithOverride(
      benefit, budgetId, funcao.id, vtU, diasU, quantidadeEfetiva, vtDays, vrDays, s, funcao.escala
    );
    beneficiosWithOverrides.push({ d: benefit.name, v: value });
  }

  return {
    ...baseData,
    beneficios: beneficiosWithOverrides,
  };
};

export const calcularTotalComBDI = (
  funcao: FunctionConfig,
  vtU: number,
  configBenefits: ConfigBenefit[],
  issRate: number,
  totalMateriais: number = 0,
  totalCapex: number = 0,
  totalEquipamentos: number = 0,
  totalUniformes: number = 0,
  totalPessoas: number = 0,
  totalBeneficiosDiferenciados: number = 0,
  totalOutros: number = 0,
  minimumWage: number = 1621.00
): number => {
  const funcData = calcularFuncao(funcao, vtU, configBenefits, totalMateriais, totalCapex, totalEquipamentos, totalUniformes, totalPessoas, totalBeneficiosDiferenciados, totalOutros, minimumWage);

  let totalAcumulado = 0;

  const remunValues = [
    funcData.s,
    funcData.vPeric,
    funcData.vInsal,
    funcData.vGrat,
    funcData.vNot,
    funcData.vRed,
  ];
  remunValues.forEach((val) => {
    totalAcumulado += val * funcData.q;
  });

  const GRUPOS_ENCARGOS = [
    {
      g: 'GRUPO A - ENCARGOS SOCIAIS BÁSICOS',
      i: [
        { d: 'INSS - Previdência Social', p: 0.2 },
        { d: 'SESI / SESC', p: 0.015 },
        { d: 'SENAI / SENAC', p: 0.01 },
        { d: 'INCRA', p: 0.002 },
        { d: 'SEBRAE', p: 0.006 },
        { d: 'Salário Educação', p: 0.025 },
        { d: 'Seguro Acidente de Trabalho', p: 0.03 },
        { d: 'FGTS', p: 0.08 },
      ],
    },
    {
      g: 'GRUPO B - TEMPO REMUNERADO E NÃO TRABALHADO',
      i: [
        { d: 'Férias (sem abono)', p: 0.091518 },
        { d: 'Enfermidades (≤15 dias)', p: 0.016916 },
        { d: 'Ausências Legais', p: 0.009524 },
        { d: 'Licença Paternidade', p: 0.004178 },
        { d: 'Acidente de Trabalho', p: 0.006347 },
        { d: 'Aviso Prévio Trabalhado', p: 0.000254 },
      ],
    },
    {
      g: 'GRUPO C - ADICIONAL DE FÉRIAS E 13º SALÁRIO',
      i: [
        { d: 'Adicional de Férias', p: 0.030506 },
        { d: '13º Salário', p: 0.093839 },
      ],
    },
    {
      g: 'GRUPO D - OBRIGAÇÕES RESCISÓRIAS',
      i: [
        { d: 'Aviso Prévio Indenizado', p: 0.051285 },
        { d: 'Incidência do FGTS sobre aviso prévio', p: 0.004103 },
        { d: 'Incidência da Multa FGTS (Depósitos)', p: 0.012863 },
        { d: 'Incidência da multa FGTS (Aviso Indenizado)', p: 0.002222 },
        { d: 'Incidência da multa FGTS (Aviso Trabalhado)', p: 0.000004 },
      ],
    },
    {
      g: 'GRUPO E - APROVISIONAMENTO DE CASOS ESPECIAIS',
      i: [
        { d: 'Incidência Grupo A sobre Licença Maternidade', p: 0.00327 },
        { d: 'Incidência FGTS sobre Acidente Trabalho', p: 0.000015 },
        { d: 'Abono Pecuniário', p: 0.001305 },
        { d: 'Reflexo Aviso Indenizado s/ Férias e 13º', p: 0.009972 },
        { d: 'Incidência FGTS s/ Reflexo Aviso no 13º', p: 0.000342 },
      ],
    },
    {
      g: 'GRUPO F - INCIDÊNCIAS CUMULATIVAS',
      i: [
        { d: 'Encargos Grupo A sobre B', p: 0.043021 },
        { d: 'Encargos Grupo A sobre C', p: 0.045759 },
      ],
    },
  ];

  GRUPOS_ENCARGOS.forEach((grupo) => {
    grupo.i.forEach((item) => {
      const v = funcData.baseCalculoGeral * item.p;
      totalAcumulado += v;
    });
  });

  const vTotalIntra = funcData.vIntra * funcData.q;
  totalAcumulado += vTotalIntra;

  funcData.beneficios.forEach((benef) => {
    totalAcumulado += benef.v;
  });

  totalAcumulado += funcData.materiais;
  totalAcumulado += funcData.capex;
  totalAcumulado += funcData.equipamentos;
  totalAcumulado += funcData.uniformes;

  // Cálculo iterativo considerando IRPJ e CSLL sobre o lucro
  const margemAdm = 0.03;
  const margemLucro = 0.0135;
  const pis = 0.0065;
  const cofins = 0.03;
  const iss = issRate / 100;
  const irpjRate = 0.15; // 15% do lucro
  const csllRate = 0.09; // 9% do lucro

  // Como IRPJ e CSLL dependem do valor do lucro, precisamos resolver iterativamente
  // Fórmula: totalComBDI = totalSemBDI + BDI
  // BDI = admCentral + lucro + pis + cofins + iss + irpj + csll
  // onde: irpj = 0.15 * lucro e csll = 0.09 * lucro

  // Simplificando: BDI = admCentral + lucro + pis + cofins + iss + 0.15*lucro + 0.09*lucro
  // BDI = admCentral + lucro*(1 + 0.15 + 0.09) + pis + cofins + iss
  // BDI = admCentral + lucro*1.24 + pis + cofins + iss

  const lucroComImpostos = margemLucro * 1.24; // Lucro + IRPJ + CSLL
  const taxaBDI = margemAdm + lucroComImpostos + pis + cofins + iss;
  const totalComBDI = totalAcumulado / (1 - taxaBDI);

  return totalComBDI;
};

export const calcularOrcamento = (
  funcoes: FunctionConfig[],
  vtU: number,
  issP: number
) => {
  const funcoesDados: FunctionData[] = funcoes.map((f) =>
    calcularFuncao(f, vtU, [])
  );

  funcoesDados.forEach((f) => {
    const remunValues = [f.s, f.vPeric, f.vInsal, f.vGrat, f.vNot, f.vRed];
    remunValues.forEach((val) => {
      f.totalAcumulado += val * f.q;
    });
  });

  // Cálculo considerando IRPJ e CSLL sobre o lucro
  const margemAdm = 0.03;
  const margemLucro = 0.0135;
  const pis = 0.0065;
  const cofins = 0.03;
  const iss = issP / 100;

  // Lucro + IRPJ (15%) + CSLL (9%) = Lucro * 1.24
  const lucroComImpostos = margemLucro * 1.24;
  const taxaBDI = margemAdm + lucroComImpostos + pis + cofins + iss;

  funcoesDados.forEach((f) => {
    f.totalComBDI = f.totalAcumulado / (1 - taxaBDI);
    f.valorTotalBDI = f.totalComBDI - f.totalAcumulado;
  });

  return {
    funcoesDados,
    taxaBDI,
    totalContrato: funcoesDados.reduce((acc, f) => acc + f.totalComBDI, 0),
  };
};
