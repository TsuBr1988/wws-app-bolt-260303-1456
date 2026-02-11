import { useMemo, useState, useEffect } from 'react';
import { eachMonthOfInterval, endOfMonth as dfnsEndOfMonth, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { SupabaseClient } from '@supabase/supabase-js';
import { startOfMonth, endOfMonth } from '../../../utils';
import {
  ContractSheet,
  Transaction,
  CoaNode,
  CoaViewMode,
  CashSubView
} from '../../../types';
import {
  CategoryRow,
  NaturezaRow,
  parseBR,
  normalizeCode,
  monthKey,
  isLeafRow,
  getMonthlyBudgetForRow,
  getProportionalBudget
} from './sheetDetailUtils';

interface Addendum {
  id: string;
  addendum_number: number;
  effective_date: string;
  items: AddendumItem[];
}

interface AddendumItem {
  category_code: string;
  budgeted_amount: number;
  start_date: string | null;
  end_date: string | null;
}

interface UseSheetDetailDataProps {
  sheet: ContractSheet;
  transactions: Transaction[];
  chartOfAccountsTree: CoaNode[];
  supabaseClient: SupabaseClient | null;
  startDate: Date;
  endDate: Date;
  startMonthSel: Date;
  endMonthSel: Date;
  localViewMode: CoaViewMode;
  localCashSubView: CashSubView;
  excludedSheetCodes: Set<string>;
}

export const useSheetDetailData = ({
  sheet,
  transactions,
  chartOfAccountsTree,
  supabaseClient,
  startDate,
  endDate,
  startMonthSel,
  endMonthSel,
  localViewMode,
  localCashSubView,
  excludedSheetCodes
}: UseSheetDetailDataProps) => {
  // Estado para armazenar os aditivos
  const [addendums, setAddendums] = useState<Addendum[]>([]);

  // Buscar aditivos quando a ficha mudar
  useEffect(() => {
    if (!supabaseClient) return;

    const loadAddendums = async () => {
      try {
        const { data: addendumsData, error: addendumsError } = await supabaseClient
          .from('contract_sheet_addendums')
          .select('*')
          .eq('sheet_id', sheet.id)
          .order('effective_date', { ascending: true });

        if (addendumsError) throw addendumsError;

        if (addendumsData && addendumsData.length > 0) {
          const addendumsWithItems = await Promise.all(
            addendumsData.map(async (addendum) => {
              const { data: items, error: itemsError } = await supabaseClient
                .from('contract_sheet_addendum_items')
                .select('category_code, budgeted_amount, start_date, end_date')
                .eq('addendum_id', addendum.id);

              if (itemsError) throw itemsError;

              return {
                id: addendum.id,
                addendum_number: addendum.addendum_number,
                effective_date: addendum.effective_date,
                items: items || []
              };
            })
          );

          setAddendums(addendumsWithItems);
        } else {
          setAddendums([]);
        }
      } catch (error) {
        console.error('Error loading addendums:', error);
        setAddendums([]);
      }
    };

    loadAddendums();
  }, [sheet.id, supabaseClient]);

  // Função para obter o valor orçado de uma categoria em um mês específico,
  // considerando aditivos e suas datas de início/fim, e a data de encerramento do contrato
  const getBudgetedAmountForMonth = (categoryCode: string, month: Date): number => {
    // Se o contrato foi encerrado e o mês é posterior ao encerramento, retornar 0
    if (sheet.termination_date) {
      const terminationDate = startOfMonth(new Date(sheet.termination_date));
      if (month >= terminationDate) {
        return 0;
      }
    }

    // Encontrar o item original da ficha
    const originalItem = sheet.items?.find(item => normalizeCode(item.category_code) === normalizeCode(categoryCode));
    let budgetedAmount = originalItem ? Number(originalItem.budgeted_amount) || 0 : 0;

    // Se não houver aditivos, retornar valor original
    if (addendums.length === 0) {
      return budgetedAmount;
    }

    // Encontrar o aditivo mais recente que esteja em vigência neste mês
    // Verificando start_date e end_date de cada item do aditivo
    let applicableAddendum: Addendum | null = null;
    let applicableItem: AddendumItem | null = null;

    for (const addendum of addendums) {
      const effectiveDate = startOfMonth(new Date(addendum.effective_date));
      if (effectiveDate <= month) {
        const item = addendum.items.find(
          item => normalizeCode(item.category_code) === normalizeCode(categoryCode)
        );

        if (item) {
          // Verificar se o mês está dentro do range do item
          const itemStartDate = item.start_date ? startOfMonth(new Date(item.start_date)) : effectiveDate;
          // Para end_date, usar o último dia do mês (não o primeiro)
          const itemEndDate = item.end_date ? dfnsEndOfMonth(new Date(item.end_date)) : null;

          // O mês deve estar >= start_date e <= end_date (se end_date existir)
          // Comparando o primeiro dia do mês com as datas de início e fim
          const monthEnd = dfnsEndOfMonth(month);
          if (month >= itemStartDate && (!itemEndDate || monthEnd <= itemEndDate)) {
            applicableAddendum = addendum;
            applicableItem = item;
          }
        }
      } else {
        break; // Como os aditivos estão ordenados por data, podemos parar aqui
      }
    }

    // Se houver um item aplicável, usar seu valor
    if (applicableItem) {
      budgetedAmount = Number(applicableItem.budgeted_amount) || 0;
    }

    return budgetedAmount;
  };

  const months = useMemo(
    () =>
      eachMonthOfInterval({
        start: startOfMonth(startDate),
        end: endOfMonth(endDate)
      }),
    [startDate, endDate]
  );

  const allMonths = useMemo(() => {
    const sheetStart = startOfMonth(new Date(sheet.start_date));
    const sheetEnd = dfnsEndOfMonth(new Date(sheet.end_date));

    // Se o contrato foi encerrado, ir apenas até o mês ANTERIOR ao encerramento
    if (sheet.termination_date) {
      const terminationDate = new Date(sheet.termination_date);
      // Último dia do mês anterior ao encerramento
      const lastMonthBeforeTermination = new Date(terminationDate);
      lastMonthBeforeTermination.setDate(1); // Primeiro dia do mês de encerramento
      lastMonthBeforeTermination.setMonth(lastMonthBeforeTermination.getMonth() - 1); // Vai para o mês anterior
      const effectiveEnd = dfnsEndOfMonth(lastMonthBeforeTermination);

      // Usa o menor entre effectiveEnd e sheetEnd
      const finalEnd = effectiveEnd < sheetEnd ? effectiveEnd : sheetEnd;
      return eachMonthOfInterval({ start: sheetStart, end: finalEnd });
    }

    // Usar APENAS a data de término da ficha (end_date)
    return eachMonthOfInterval({ start: sheetStart, end: sheetEnd });
  }, [sheet.start_date, sheet.end_date, sheet.termination_date]);

  const rangeMonths = useMemo(
    () =>
      eachMonthOfInterval({
        start: startOfMonth(startMonthSel),
        end: startOfMonth(endMonthSel)
      }),
    [startMonthSel, endMonthSel]
  );

  const rangeCount = rangeMonths.length;

  const inMonth = (t: Transaction, monthStart: Date, monthEnd: Date) => {
    if (localViewMode === 'cash') {
      const isCompleted = t.status === 'completed';
      const refDate = isCompleted
        ? t.paymentDate
          ? new Date(t.paymentDate)
          : null
        : t.dueDate
        ? new Date(t.dueDate)
        : null;
      if (!refDate) return false;

      const within = refDate >= monthStart && refDate <= monthEnd;
      if (localCashSubView === 'all') return within;
      if (localCashSubView === 'realized') return within && isCompleted;
      if (localCashSubView === 'projected') return within && !isCompleted;
      return false;
    } else {
      const refDate = t.competencyDate
        ? new Date(t.competencyDate)
        : t.dueDate
        ? new Date(t.dueDate)
        : null;
      if (!refDate) return false;
      return refDate >= monthStart && refDate <= monthEnd;
    }
  };

  const clientTx = useMemo(() => {
    // If sheet starts on any day of a month (e.g., 31/03/2025),
    // consider the entire month (e.g., 01/03/2025)
    const sheetStartDate = new Date(sheet.start_date);
    const sheetStartMonth = startOfMonth(sheetStartDate);

    const normalizedSheetName = sheet.client_name.trim().toLowerCase();

    const rangeStartDate = startOfMonth(startMonthSel);
    const rangeEndDate = endOfMonth(endMonthSel);

    const filtered = transactions.filter((t) => {
      const normalizedCostCenter = (t.costCenter || '').trim().toLowerCase();

      const exactMatch = normalizedCostCenter === normalizedSheetName;
      const partialMatch = normalizedCostCenter.includes(normalizedSheetName) ||
                          normalizedSheetName.includes(normalizedCostCenter);

      if (!exactMatch && !partialMatch) {
        return false;
      }

      let txDate: Date | null = null;
      if (localViewMode === 'cash') {
        const isCompleted = t.status === 'completed';
        txDate = isCompleted
          ? t.paymentDate
            ? new Date(t.paymentDate)
            : null
          : t.dueDate
          ? new Date(t.dueDate)
          : null;
      } else {
        txDate = t.competencyDate
          ? new Date(t.competencyDate)
          : t.dueDate
          ? new Date(t.dueDate)
          : null;
      }

      if (!txDate) return false;

      const dateMatch = txDate >= sheetStartMonth && txDate >= rangeStartDate && txDate <= rangeEndDate;

      return dateMatch;
    });

    return filtered;
  }, [transactions, sheet.client_name, sheet.start_date, localViewMode, startMonthSel, endMonthSel]);

  const budgetByCode = useMemo(() => {
    const m = new Map<string, number>();
    (sheet.items ?? []).forEach((it) => {
      const code = normalizeCode(it.category_code);
      const prev = m.get(code) ?? 0;
      m.set(code, prev + (Number(it.budgeted_amount) || 0));
    });
    return m;
  }, [sheet.items]);

  const budgetByCodeByMonth = useMemo(() => {
    const map = new Map<string, Record<string, number>>();

    // Coletar todos os códigos de categorias (da ficha original e de todos os aditivos)
    const allCategoryCodes = new Set<string>();
    (sheet.items ?? []).forEach((it) => {
      allCategoryCodes.add(normalizeCode(it.category_code));
    });
    addendums.forEach((addendum) => {
      addendum.items.forEach((item) => {
        allCategoryCodes.add(normalizeCode(item.category_code));
      });
    });

    // Para cada código de categoria
    allCategoryCodes.forEach((code) => {
      if (!map.has(code)) {
        map.set(code, {});
      }

      const monthlyValues = map.get(code)!;

      // Para cada mês, obter o valor orçado considerando aditivos
      allMonths.forEach((m) => {
        const key = monthKey(m);
        const budgetedAmount = getBudgetedAmountForMonth(code, m);
        const proportional = getProportionalBudget(
          budgetedAmount,
          m,
          new Date(sheet.start_date)
        );
        monthlyValues[key] = (monthlyValues[key] || 0) + proportional;
      });
    });

    return map;
  }, [sheet.items, sheet.start_date, allMonths, addendums]);

  // Flatten chartOfAccountsTree to get all nodes
  const flattenedNodes = useMemo(() => {
    const nodes: Array<{ code: string; name: string; level: number; isLeaf: boolean }> = [];
    const traverse = (nodeList: CoaNode[]) => {
      nodeList.forEach(node => {
        nodes.push({
          code: normalizeCode(node.code),
          name: node.name,
          level: node.level,
          isLeaf: node.isLeaf
        });
        if (node.children?.length) {
          traverse(node.children);
        }
      });
    };
    traverse(chartOfAccountsTree);
    return nodes;
  }, [chartOfAccountsTree]);

  const allCodesToShow = useMemo(() => {
    const s = new Set<string>();
    flattenedNodes.forEach(n => s.add(n.code));
    budgetByCode.forEach((_v, code) => s.add(normalizeCode(code)));
    clientTx.forEach((t) => {
      const categoryStr = (t.category || '').trim();
      const m = categoryStr.match(/^([\d\.]+)/);
      const c = normalizeCode(m ? m[1] : '');
      if (c) s.add(c);
    });
    return s;
  }, [flattenedNodes, budgetByCode, clientTx]);

  const categoryData: CategoryRow[] = useMemo(() => {
    // Create a map of flattened nodes for quick lookup
    const nodeMap = new Map<string, { code: string; name: string; level: number; isLeaf: boolean }>();
    flattenedNodes.forEach(n => {
      nodeMap.set(n.code, n);
    });

    const dataByCode = new Map<
      string,
      {
        name: string;
        group: string;
        natureza: NaturezaRow;
        ordem: number;
        budgeted: number;
        realized: number;
        monthlyValues: Record<string, number>;
        monthlyBudgetValues: Record<string, number>;
        level: number;
        isLeaf: boolean;
      }
    >();

    // Initialize from flattened nodes
    flattenedNodes.forEach((node, index) => {
      const code = node.code;
      // Determine natureza based on code pattern
      let natureza: NaturezaRow = 'despesa';
      if (code.startsWith('1.')) natureza = 'receita';
      else if (code.startsWith('2.')) natureza = 'custo';
      else if (code.startsWith('3.')) natureza = 'despesa';

      dataByCode.set(code, {
        name: node.name,
        group: code.split('.')[0] || 'Sem Grupo',
        natureza,
        ordem: index,
        budgeted: 0,
        realized: 0,
        monthlyValues: {},
        monthlyBudgetValues: {},
        level: node.level,
        isLeaf: node.isLeaf
      });
    });

    // Add any codes from budget that aren't in the tree
    budgetByCode.forEach((_val, code) => {
      if (!dataByCode.has(code)) {
        const node = nodeMap.get(code);
        dataByCode.set(code, {
          name: node?.name || code,
          group: 'Sem Grupo',
          natureza: 'despesa',
          ordem: 9999,
          budgeted: 0,
          realized: 0,
          monthlyValues: {},
          monthlyBudgetValues: {},
          level: 3,
          isLeaf: true
        });
      }
    });

    // Add any codes from transactions that aren't in the tree
    allCodesToShow.forEach((code) => {
      if (!dataByCode.has(code)) {
        const node = nodeMap.get(code);
        dataByCode.set(code, {
          name: node?.name || code,
          group: 'Sem Grupo',
          natureza: 'despesa',
          ordem: 9999,
          budgeted: 0,
          realized: 0,
          monthlyValues: {},
          monthlyBudgetValues: {},
          level: 3,
          isLeaf: true
        });
      }
    });

    dataByCode.forEach((_v, code) => {
      const monthly = budgetByCode.get(code) ?? 0;
      const monthlyBudgetValues = budgetByCodeByMonth.get(code) || {};

      const totalBudgetedAllMonths = Object.values(monthlyBudgetValues).reduce((sum, v) => sum + v, 0);
      const avgBudgeted = allMonths.length > 0 ? totalBudgetedAllMonths / allMonths.length : monthly;

      dataByCode.get(code)!.budgeted = avgBudgeted;
      dataByCode.get(code)!.monthlyBudgetValues = { ...monthlyBudgetValues };
    });

    // Calculate realized values for each code
    dataByCode.forEach((entry, code) => {
      let realizedTotal = 0;
      const monthlyValues: Record<string, number> = {};

      allMonths.forEach((m) => {
        const start = new Date(m.getFullYear(), m.getMonth(), 1);
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        const key = monthKey(start);

        const monthSum = clientTx
          .filter((t) => {
            const categoryStr = (t.category || '').trim();
            const match = categoryStr.match(/^([\d\.]+)/);
            const c = match ? normalizeCode(match[1]) : (t.type === 'receive' ? '1.99' : '3.99');
            return c === code && inMonth(t, start, end);
          })
          .reduce((acc, t) => acc + parseBR(t.amount), 0);

        monthlyValues[key] = monthSum;
        realizedTotal += monthSum;
      });

      entry.realized = realizedTotal;
      entry.monthlyValues = monthlyValues;
    });

    // Aggregate values from children to parents (bottom-up)
    // Group codes by level (descending order so we process deepest levels first)
    const codesByLevel = new Map<number, string[]>();
    dataByCode.forEach((d, code) => {
      const level = d.level;
      if (!codesByLevel.has(level)) {
        codesByLevel.set(level, []);
      }
      codesByLevel.get(level)!.push(code);
    });

    // Get max level
    const maxLevel = Math.max(...Array.from(codesByLevel.keys()));

    // Process from deepest to shallowest
    for (let level = maxLevel; level > 1; level--) {
      const codesAtLevel = codesByLevel.get(level) || [];

      codesAtLevel.forEach(childCode => {
        // Find parent code (remove last segment)
        const parts = childCode.split('.');
        if (parts.length > 1) {
          parts.pop();
          const parentCode = parts.join('.');

          const parent = dataByCode.get(parentCode);
          const child = dataByCode.get(childCode);

          if (parent && child) {
            // Sum budgeted
            parent.budgeted += child.budgeted;

            // Sum realized
            parent.realized += child.realized;

            // Sum monthly values
            Object.keys(child.monthlyValues).forEach(monthKey => {
              if (!parent.monthlyValues[monthKey]) {
                parent.monthlyValues[monthKey] = 0;
              }
              parent.monthlyValues[monthKey] += child.monthlyValues[monthKey];
            });

            // Sum monthly budget values
            Object.keys(child.monthlyBudgetValues).forEach(monthKey => {
              if (!parent.monthlyBudgetValues[monthKey]) {
                parent.monthlyBudgetValues[monthKey] = 0;
              }
              parent.monthlyBudgetValues[monthKey] += child.monthlyBudgetValues[monthKey];
            });
          }
        }
      });
    }

    // Build rows from dataByCode (which is already sorted by ordem from flattenedNodes)
    const rows: CategoryRow[] = [];
    dataByCode.forEach((d, code) => {
      rows.push({
        codigo: code,
        nome: d.name,
        grupo: d.group,
        natureza: d.natureza,
        ordem: d.ordem,
        budgeted: d.budgeted,
        realized: d.realized,
        monthlyValues: d.monthlyValues,
        monthlyBudgetValues: d.monthlyBudgetValues,
        level: d.level,
        isLeaf: d.isLeaf
      });
    });

    const sorted = rows.sort((a, b) => a.ordem - b.ordem);

    // Adicionar provisionamentos apenas para modo accrual
    if (localViewMode === 'accrual') {
      // Primeiro, garantir que as categorias de 13° e férias existam
      const hasNode_2_1_14 = sorted.some(r => normalizeCode(r.codigo || '') === '2.1.14');
      const hasNode_2_1_15 = sorted.some(r => normalizeCode(r.codigo || '') === '2.1.15');
      const hasNode_3_1_11 = sorted.some(r => normalizeCode(r.codigo || '') === '3.1.11');

      const node_2_1_index = sorted.findIndex(r => normalizeCode(r.codigo || '') === '2.1');
      const node_3_1_index = sorted.findIndex(r => normalizeCode(r.codigo || '') === '3.1');

      // Adicionar 2.1.14 (13° salário - postos) se não existir
      if (!hasNode_2_1_14 && node_2_1_index >= 0) {
        // Encontrar o último item de nível 3 dentro de 2.1
        let insertIndex = node_2_1_index + 1;
        while (insertIndex < sorted.length && normalizeCode(sorted[insertIndex].codigo || '').startsWith('2.1.') && sorted[insertIndex].level >= 3) {
          if (sorted[insertIndex].level === 3) {
            insertIndex++;
          } else {
            break;
          }
        }
        const maxOrdem = Math.max(...sorted.filter(r => normalizeCode(r.codigo || '').startsWith('2.1') && r.level === 3).map(r => r.ordem), 0);
        const newRow: CategoryRow = {
          codigo: '2.1.14',
          nome: '2.1.14 13º salário - postos',
          grupo: '2',
          natureza: 'custo',
          ordem: maxOrdem + 1,
          budgeted: 0,
          realized: 0,
          monthlyValues: {},
          monthlyBudgetValues: {},
          level: 3,
          isLeaf: true
        };
        sorted.splice(insertIndex, 0, newRow);
      }

      // Adicionar 2.1.15 (férias - postos) se não existir
      if (!hasNode_2_1_15 && node_2_1_index >= 0) {
        let insertIndex = node_2_1_index + 1;
        while (insertIndex < sorted.length && normalizeCode(sorted[insertIndex].codigo || '').startsWith('2.1.') && sorted[insertIndex].level >= 3) {
          if (sorted[insertIndex].level === 3) {
            insertIndex++;
          } else {
            break;
          }
        }
        const maxOrdem = Math.max(...sorted.filter(r => normalizeCode(r.codigo || '').startsWith('2.1') && r.level === 3).map(r => r.ordem), 0);
        const newRow: CategoryRow = {
          codigo: '2.1.15',
          nome: '2.1.15 férias + 1/3 férias - postos',
          grupo: '2',
          natureza: 'custo',
          ordem: maxOrdem + 2,
          budgeted: 0,
          realized: 0,
          monthlyValues: {},
          monthlyBudgetValues: {},
          level: 3,
          isLeaf: true
        };
        sorted.splice(insertIndex, 0, newRow);
      }

      // Adicionar 3.1.11 (13° salário - adm) se não existir
      if (!hasNode_3_1_11 && node_3_1_index >= 0) {
        let insertIndex = node_3_1_index + 1;
        while (insertIndex < sorted.length && normalizeCode(sorted[insertIndex].codigo || '').startsWith('3.1.') && sorted[insertIndex].level >= 3) {
          if (sorted[insertIndex].level === 3) {
            insertIndex++;
          } else {
            break;
          }
        }
        const maxOrdem = Math.max(...sorted.filter(r => normalizeCode(r.codigo || '').startsWith('3.1') && r.level === 3).map(r => r.ordem), 0);
        const newRow: CategoryRow = {
          codigo: '3.1.11',
          nome: '3.1.11 13º salário - adm',
          grupo: '3',
          natureza: 'despesa',
          ordem: maxOrdem + 1,
          budgeted: 0,
          realized: 0,
          monthlyValues: {},
          monthlyBudgetValues: {},
          level: 3,
          isLeaf: true
        };
        sorted.splice(insertIndex, 0, newRow);
      }

      const finalRows: CategoryRow[] = [];

      // FILTRAR provisionamentos antigos do sorted para evitar duplicação
      const sortedWithoutProvisions = sorted.filter(r => {
        if (!r.codigo) return true;
        const code = normalizeCode(r.codigo);
        // Remover provisionamentos antigos (códigos X.X.X.1 com nome contendo 'provisionamento')
        const isProvision = code.match(/^\d+\.\d+\.\d+\.1$/) &&
                           (r.nome.toLowerCase().includes('provisionamento'));
        return !isProvision;
      });

      for (let i = 0; i < sortedWithoutProvisions.length; i++) {
        finalRows.push(sortedWithoutProvisions[i]);

        // Procurar por categorias de 13° salário e férias para adicionar provisionamentos
        const row = sortedWithoutProvisions[i];
        const rowName = row.nome.toLowerCase();
        const rowCode = normalizeCode(row.codigo || '');

        // Verificar se é uma linha de 13° salário ou férias no nível 3
        const is13Salario = row.level === 3 && (
          rowName.includes('13º salário') ||
          rowName.includes('13° salário') ||
          rowName.includes('decimo terceiro')
        );

        const isFerias = row.level === 3 && (
          rowName.includes('férias') ||
          rowName.includes('ferias')
        );

        if (is13Salario || isFerias) {
          // Determinar se é postos (2.1) ou adm (3.1)
          const isPostos = rowCode.startsWith('2.1');
          const isAdm = rowCode.startsWith('3.1');

          if (isPostos || isAdm) {
            // Determinar divisor para cálculo
            let divisor = 0;

            if (is13Salario) {
              divisor = isPostos ? 8.7912 : 8.791209;
            } else if (isFerias && isPostos) {
              // Férias só para postos
              divisor = 6.595055;
            }

            // Criar linha de provisionamento se houver divisor
            if (divisor > 0) {
              const provisionCode = `${rowCode}.1`;
              const provisionName = is13Salario
                ? `${provisionCode} Provisionamento 13° salário`
                : `${provisionCode} Provisionamento Férias`;

              // Calcular valores mensais do provisionamento
              const monthlyValues: Record<string, number> = {};
              const monthlyBudgetValues: Record<string, number> = {};
              let totalProvisionRealized = 0;

              allMonths.forEach((m) => {
                const key = monthKey(m);

                // Calcular folha mensal USANDO A MESMA LÓGICA DO APP.TSX
                let folhaMensal = 0;
                if (isPostos) {
                  // Buscar linha 2.1.1 que contém "folha" no nome (igual ao KPI)
                  const folhaRow = sorted.find(r => {
                    const code = normalizeCode(r.codigo || '');
                    const name = (r.nome || '').toLowerCase();
                    return code === '2.1.1' && name.includes('folha');
                  });
                  folhaMensal = folhaRow ? (folhaRow.monthlyValues[key] || 0) : 0;

                  // Log detalhado do cálculo do provisionamento
                  if (rowCode === '2.1.14') {
                    console.log('=== CALCULANDO PROVISIONAMENTO 13° SALÁRIO ===');
                    console.log('Mês:', key);
                    console.log('Encontrou folhaRow?', !!folhaRow);
                    if (folhaRow) {
                      console.log('Folha código:', folhaRow.codigo);
                      console.log('Folha nome:', folhaRow.nome);
                      console.log('Folha mensal (key):', folhaMensal);
                    }
                    console.log('Divisor:', divisor);
                    console.log('Valor pago no mês (row.monthlyValues[key]):', row.monthlyValues[key]);
                    console.log('Provisionamento calculado: (', folhaMensal, '/', divisor, ') -', row.monthlyValues[key], '=', (folhaMensal / divisor) - (row.monthlyValues[key] || 0));
                  }
                } else if (isAdm) {
                  // Buscar linhas de folha CLT e PJ administrativa
                  const folhaCltRow = sorted.find(r => {
                    const name = (r.nome || '').toLowerCase();
                    return normalizeCode(r.codigo || '').startsWith('3.1') && name.includes('folha clt');
                  });
                  const folhaPjRow = sorted.find(r => {
                    const name = (r.nome || '').toLowerCase();
                    return normalizeCode(r.codigo || '').startsWith('3.1') && name.includes('folha pj');
                  });
                  folhaMensal = (folhaCltRow ? (folhaCltRow.monthlyValues[key] || 0) : 0) +
                                (folhaPjRow ? (folhaPjRow.monthlyValues[key] || 0) : 0);
                }

                // Calcular valor mensal do 13° ou férias PAGOS
                const valorMensal = row.monthlyValues[key] || 0;

                // Calcular provisionamento: (Folha do mês / divisor) - (Pago no mês)
                const provisionMensal = (folhaMensal / divisor) - valorMensal;
                monthlyValues[key] = provisionMensal;
                monthlyBudgetValues[key] = 0; // Orçado sempre zero para provisionamento
                totalProvisionRealized += provisionMensal;
              });

              const provisionRow: CategoryRow = {
                codigo: provisionCode,
                nome: provisionName,
                grupo: row.grupo,
                natureza: row.natureza,
                ordem: row.ordem + 0.1,
                budgeted: 0, // Orçado sempre zero para provisionamento
                realized: totalProvisionRealized,
                monthlyValues,
                monthlyBudgetValues,
                level: 4,
                isLeaf: true
              };

              finalRows.push(provisionRow);
            }
          }
        }
      }

      // Recalcular totais dos pais após adicionar provisionamentos
      const dataByCode = new Map<string, CategoryRow>();
      finalRows.forEach(row => {
        if (row.codigo) {
          dataByCode.set(normalizeCode(row.codigo), row);
        }
      });

      // Zerar totais de nós não-folha antes de recalcular
      dataByCode.forEach((row, code) => {
        if (!row.isLeaf) {
          // Log para categorias de 13º e férias
          if (code.includes('2.1.14') || code.includes('2.1.15')) {
            console.log('=== ZERANDO NÓ NÃO-FOLHA ===');
            console.log('Código:', code);
            console.log('Nome:', row.nome);
            console.log('Realized ANTES de zerar:', row.realized);
            console.log('isLeaf:', row.isLeaf);
            console.log('===============================');
          }

          row.budgeted = 0;
          row.realized = 0;
          row.monthlyValues = {};
          row.monthlyBudgetValues = {};
        }
      });

      // Agrupar códigos por nível (ordem decrescente)
      const codesByLevel = new Map<number, string[]>();
      dataByCode.forEach((row, code) => {
        const level = row.level;
        if (!codesByLevel.has(level)) {
          codesByLevel.set(level, []);
        }
        codesByLevel.get(level)!.push(code);
      });

      // Obter nível máximo
      const maxLevel = Math.max(...Array.from(codesByLevel.keys()));

      // Processar do mais profundo para o mais raso
      for (let level = maxLevel; level > 1; level--) {
        const codesAtLevel = codesByLevel.get(level) || [];

        codesAtLevel.forEach(childCode => {
          // Encontrar código pai (remover último segmento)
          const parts = childCode.split('.');
          if (parts.length > 1) {
            parts.pop();
            const parentCode = parts.join('.');

            const parent = dataByCode.get(parentCode);
            const child = dataByCode.get(childCode);

            if (parent && child) {
              // Detectar se o child é um provisionamento
              // Provisionamentos têm código X.X.X.1 e nome contendo "provisionamento"
              const isProvision = childCode.match(/^\d+\.\d+\.\d+\.1$/) &&
                                 (child.nome || '').toLowerCase().includes('provisionamento');

              // Provisionamentos NÃO devem ser somados na categoria pai
              // Eles aparecem separadamente e são somados apenas no total final
              if (!isProvision) {
                // Somar orçado
                parent.budgeted += child.budgeted;

                // Somar realizado
                parent.realized += child.realized;

                // Somar valores mensais
                Object.keys(child.monthlyValues).forEach(key => {
                  if (!parent.monthlyValues[key]) {
                    parent.monthlyValues[key] = 0;
                  }
                  parent.monthlyValues[key] += child.monthlyValues[key];
                });

                // Somar valores mensais de orçamento
                Object.keys(child.monthlyBudgetValues || {}).forEach(key => {
                  if (!parent.monthlyBudgetValues) {
                    parent.monthlyBudgetValues = {};
                  }
                  if (!parent.monthlyBudgetValues[key]) {
                    parent.monthlyBudgetValues[key] = 0;
                  }
                  parent.monthlyBudgetValues[key] += (child.monthlyBudgetValues || {})[key] || 0;
                });
              }
            }
          }
        });
      }

      return finalRows;
    }

    return sorted;
  }, [
    sheet.items,
    sheet.start_date,
    sheet.expense_year,
    clientTx,
    budgetByCode,
    budgetByCodeByMonth,
    flattenedNodes,
    allMonths,
    localViewMode,
    localCashSubView,
    allCodesToShow
  ]);

  const totalsRange = useMemo(() => {
    // Totals calculated by summing all leaf rows (excluding excluded ones)
    // This ensures that when a leaf is excluded, it's removed from parent totals
    let avgBudgetedTotal = 0;
    let avgRealizedTotal = 0;
    let accumBudgetedTotal = 0;
    let accumRealizedTotal = 0;

    // Sum all leaf categories (isLeaf = true), excluding those in excludedSheetCodes
    categoryData
      .filter(r => r.isLeaf)
      .filter(r => !excludedSheetCodes.has(r.codigo || ''))
      .forEach((row) => {
        // Calculate using the same logic as SheetDetailRow
        let budgetedSum = 0;
        let budgetedMonthsCount = 0;
        let realizedSum = 0;
        let realizedMonthsCount = 0;

        rangeMonths.forEach((m) => {
          const mKey = monthKey(m);
          const budgetValue = row.monthlyBudgetValues?.[mKey] || 0;
          const realizedValue = row.monthlyValues[mKey] || 0;

          budgetedSum += budgetValue;
          if (budgetValue !== 0) {
            budgetedMonthsCount++;
          }

          realizedSum += realizedValue;
          if (realizedValue !== 0) {
            realizedMonthsCount++;
          }
        });

        // Todas as categorias dividem pela quantidade de meses do filtro
        const avgBudgeted = budgetedMonthsCount > 0 ? budgetedSum / budgetedMonthsCount : 0;
        const avgRealized = realizedSum / rangeCount;

        avgBudgetedTotal += avgBudgeted;
        avgRealizedTotal += avgRealized;
        accumBudgetedTotal += budgetedSum;
        accumRealizedTotal += realizedSum;
      });

    const varianceAvg = avgRealizedTotal - avgBudgetedTotal;
    const varianceAvgPct =
      avgBudgetedTotal !== 0 ? (varianceAvg / avgBudgetedTotal) * 100 : 0;

    const varianceAccum = accumRealizedTotal - accumBudgetedTotal;
    const varianceAccumPct =
      accumBudgetedTotal !== 0 ? (varianceAccum / accumBudgetedTotal) * 100 : 0;

    return {
      avgBudgetedTotal,
      avgRealizedTotal,
      accumBudgetedTotal,
      accumRealizedTotal,
      varianceAvg,
      varianceAvgPct,
      varianceAccum,
      varianceAccumPct
    };
  }, [categoryData, rangeMonths, rangeCount, excludedSheetCodes]);

  const chartData = useMemo(() => {
    return rangeMonths.map((m) => {
      const mKey = monthKey(m);
      const monthLabel = format(m, 'MMM/yy', { locale: ptBR });

      // Sum all leaf rows - provisions are already included as leaf rows
      const budgeted = categoryData
        .filter(isLeafRow)
        .filter(r => !excludedSheetCodes.has(r.codigo || ''))
        .reduce((sum, cat) => sum + (cat.monthlyBudgetValues?.[mKey] || 0), 0);

      const realized = categoryData
        .filter(isLeafRow)
        .filter(r => !excludedSheetCodes.has(r.codigo || ''))
        .reduce((sum, cat) => sum + (cat.monthlyValues[mKey] || 0), 0);

      return { month: monthLabel, Orçado: budgeted, Realizado: realized };
    });
  }, [rangeMonths, categoryData, excludedSheetCodes]);

  const rangeLabel = `${format(startMonthSel, 'MMM/yy', {
    locale: ptBR
  })} — ${format(endMonthSel, 'MMM/yy', { locale: ptBR })}`;

  return {
    months,
    allMonths,
    rangeMonths,
    rangeCount,
    categoryData,
    totalsRange,
    chartData,
    rangeLabel
  };
};
