import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { formatCurrency } from '../../../utils';
import { CategoryRow, hasChildren, isRowVisible, monthKey, normalizeCode, parseBR } from './sheetDetailUtils';
import { SheetDetailRow } from './SheetDetailRow';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { Transaction, CoaViewMode, CashSubView } from '../../../types';

interface SheetDetailTableProps {
  categoryData: CategoryRow[];
  rangeMonths: Date[];
  rangeCount: number;
  expandedMap: Record<string, boolean>;
  setExpandedMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  totalsRange: {
    avgBudgetedTotal: number;
    avgRealizedTotal: number;
    varianceAvg: number;
    varianceAvgPct: number;
    accumBudgetedTotal: number;
    accumRealizedTotal: number;
    varianceAccum: number;
    varianceAccumPct: number;
  };
  transactions: Transaction[];
  clientName: string;
  viewMode: CoaViewMode;
  cashSubView: CashSubView;
  excludedSheetCodes: Set<string>;
  onToggleSheetExclusion: (code: string) => void;
}

export const SheetDetailTable: React.FC<SheetDetailTableProps> = ({
  categoryData,
  rangeMonths,
  rangeCount,
  expandedMap,
  setExpandedMap,
  totalsRange,
  transactions,
  clientName,
  viewMode,
  cashSubView,
  excludedSheetCodes,
  onToggleSheetExclusion
}) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    categoryCode: string;
    categoryName: string;
    column: string;
    value: number;
  } | null>(null);

  const handleValueClick = (
    categoryCode: string,
    categoryName: string,
    column: string,
    value: number
  ) => {
    setModalState({
      isOpen: true,
      categoryCode,
      categoryName,
      column,
      value
    });
  };

  const filteredTransactions = useMemo(() => {
    if (!modalState) return [];

    const code = normalizeCode(modalState.categoryCode);

    const inMonth = (t: Transaction, monthStart: Date, monthEnd: Date) => {
      if (viewMode === 'cash') {
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
        if (cashSubView === 'all') return within;
        if (cashSubView === 'realized') return within && isCompleted;
        if (cashSubView === 'projected') return within && !isCompleted;
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

    return transactions.filter((t) => {
      if (t.costCenter !== clientName) return false;

      const categoryStr = (t.category || '').trim();
      const m = categoryStr.match(/^([\d\.]+)/);
      const txCode = normalizeCode(m ? m[1] : '');

      if (!txCode.startsWith(code)) return false;

      return rangeMonths.some((month) => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1);
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        return inMonth(t, start, end);
      });
    });
  }, [modalState, transactions, clientName, rangeMonths, viewMode, cashSubView]);

  const periodLabel = useMemo(() => {
    if (!rangeMonths.length) return '';
    if (rangeMonths.length === 1) {
      return format(rangeMonths[0], 'MMMM/yyyy', { locale: ptBR });
    }
    return `${format(rangeMonths[0], 'MMM/yy', { locale: ptBR })} — ${format(
      rangeMonths[rangeMonths.length - 1],
      'MMM/yy',
      { locale: ptBR }
    )}`;
  }, [rangeMonths]);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
          </colgroup>
          <thead className="sticky top-0 bg-white z-10 border-b border-slate-200">
            <tr className="border-b border-slate-100">
              <th
                rowSpan={2}
                className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide border-r border-slate-100"
              >
                Categoria
              </th>
              <th
                colSpan={3}
                className="text-center py-2 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50/50 border-r border-slate-100"
              >
                Média
              </th>
              <th
                colSpan={3}
                className="text-center py-2 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50/50"
              >
                Acumulado
              </th>
            </tr>
            <tr className="border-b border-slate-200">
              <th className="text-right py-2 px-3 text-xs font-normal text-slate-500 bg-slate-50/30 whitespace-nowrap">
                Resultado Operacional
              </th>
              <th className="text-right py-2 px-3 text-xs font-normal text-slate-500 bg-slate-50/30 whitespace-nowrap">
                Resultado Realizado
              </th>
              <th className="text-right py-2 px-3 text-xs font-normal text-slate-500 bg-slate-50/30 border-r border-slate-100 whitespace-nowrap">
                Variação (%)
              </th>
              <th className="text-right py-2 px-3 text-xs font-normal text-slate-500 bg-slate-50/30 whitespace-nowrap">
                Acum. Orçado
              </th>
              <th className="text-right py-2 px-3 text-xs font-normal text-slate-500 bg-slate-50/30 whitespace-nowrap">
                Acum. Realizado
              </th>
              <th className="text-right py-2 px-3 text-xs font-normal text-slate-500 bg-slate-50/30 whitespace-nowrap">
                Variação (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryData.map((row, idx) => {
              if (!isRowVisible(categoryData, idx, expandedMap)) return null;
              const child = hasChildren(categoryData, idx);
              return (
                <SheetDetailRow
                  key={`${row.codigo || row.nome}-${idx}`}
                  row={row}
                  index={idx}
                  hasChild={child}
                  rangeMonths={rangeMonths}
                  rangeCount={rangeCount}
                  expandedMap={expandedMap}
                  setExpandedMap={setExpandedMap}
                  onValueClick={handleValueClick}
                  excludedSheetCodes={excludedSheetCodes}
                  onToggleSheetExclusion={onToggleSheetExclusion}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/50">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '12.5%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="py-3 px-4 text-xs font-semibold text-slate-700 border-r border-slate-100">
                Total
              </td>
              <td className="py-3 px-3 text-xs text-right font-semibold text-blue-600">
                {formatCurrency(totalsRange.avgBudgetedTotal)}
              </td>
              <td className="py-3 px-3 text-xs text-right font-semibold text-emerald-600">
                {formatCurrency(totalsRange.avgRealizedTotal)}
              </td>
              <td className="py-3 px-3 text-xs text-right border-r border-slate-100">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className={`font-semibold ${
                      totalsRange.varianceAvg >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(Math.abs(totalsRange.varianceAvg))}
                  </span>
                  <span
                    className={`text-xs ${
                      totalsRange.varianceAvg >= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    ({Math.abs(totalsRange.varianceAvgPct).toFixed(1)}%)
                  </span>
                </div>
              </td>
              <td className={`py-3 px-3 text-xs text-right font-semibold ${
                totalsRange.accumBudgetedTotal >= 0 ? 'text-blue-600' : 'text-rose-600'
              }`}>
                {formatCurrency(totalsRange.accumBudgetedTotal)}
              </td>
              <td className={`py-3 px-3 text-xs text-right font-semibold ${
                totalsRange.accumRealizedTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCurrency(totalsRange.accumRealizedTotal)}
              </td>
              <td className="py-3 px-3 text-xs text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className={`font-semibold ${
                      totalsRange.varianceAccum >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(Math.abs(totalsRange.varianceAccum))}
                  </span>
                  <span
                    className={`text-xs ${
                      totalsRange.varianceAccum >= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    ({Math.abs(totalsRange.varianceAccumPct).toFixed(1)}%)
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {modalState?.isOpen && (
        <TransactionDetailsModal
          onClose={() => setModalState(null)}
          transactions={filteredTransactions}
          categoryName={modalState.categoryName}
          categoryCode={modalState.categoryCode}
          periodLabel={periodLabel}
          value={modalState.value}
        />
      )}
    </div>
  );
};
