export type NaturezaRow = 'receita' | 'custo' | 'despesa';

export interface CategoryRow {
  codigo: string | null;
  nome: string;
  grupo: string;
  natureza: NaturezaRow;
  ordem: number;
  budgeted: number;
  realized: number;
  monthlyValues: Record<string, number>;
  monthlyBudgetValues?: Record<string, number>;
  level: number;
  isLeaf: boolean;
}

export const parseBR = (v: any): number => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim();
  if (!s) return 0;
  return Number(s.replace(/\./g, '').replace(',', '.')) || 0;
};

export const normalizeCode = (code?: string | null): string =>
  code ? code.trim() : '';

export const monthKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const isLeafRow = (r: CategoryRow): boolean => r.isLeaf;

export const getProportionalBudget = (
  monthlyBudget: number,
  monthDate: Date,
  contractStartDate: Date
): number => {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

  const contractStart = new Date(contractStartDate);
  const isSameMonth =
    contractStart.getFullYear() === monthStart.getFullYear() &&
    contractStart.getMonth() === monthStart.getMonth();

  if (!isSameMonth) {
    return monthlyBudget;
  }

  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const startDay = contractStart.getDate();
  const workedDays = daysInMonth - startDay + 1;

  return (monthlyBudget / daysInMonth) * workedDays;
};

export const getMonthlyBudgetForRow = (row: CategoryRow): number => row.budgeted;

export const getCategoryLabel = (row: CategoryRow): string => {
  return row.nome;
};

export const getRowKey = (r: CategoryRow): string =>
  r.codigo || `${r.nome}-${r.ordem}`;

export const hasChildren = (rows: CategoryRow[], index: number): boolean => {
  const row = rows[index];
  const level = row.level;
  for (let i = index + 1; i < rows.length; i++) {
    if (rows[i].level <= level) return false;
    if (rows[i].level === level + 1) return true;
  }
  return false;
};

export const isRowVisible = (
  rows: CategoryRow[],
  index: number,
  expandedMap: Record<string, boolean>
): boolean => {
  let level = rows[index].level;
  let i = index - 1;
  while (level > 1 && i >= 0) {
    const candidate = rows[i];
    if (candidate.level < level) {
      const key = getRowKey(candidate);
      if (!expandedMap[key]) return false;
      level = candidate.level;
    }
    i--;
  }
  return true;
};
