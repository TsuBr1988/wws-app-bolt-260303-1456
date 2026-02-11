import React from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../../../utils';
import {
  CategoryRow,
  getRowKey,
  getCategoryLabel,
  monthKey,
  getMonthlyBudgetForRow
} from './sheetDetailUtils';

interface SheetDetailRowProps {
  row: CategoryRow;
  index: number;
  hasChild: boolean;
  rangeMonths: Date[];
  rangeCount: number;
  expandedMap: Record<string, boolean>;
  setExpandedMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onValueClick?: (categoryCode: string, categoryName: string, column: string, value: number) => void;
  excludedSheetCodes: Set<string>;
  onToggleSheetExclusion: (code: string) => void;
}

export const SheetDetailRow: React.FC<SheetDetailRowProps> = ({
  row,
  index,
  hasChild,
  rangeMonths,
  rangeCount,
  expandedMap,
  setExpandedMap,
  onValueClick,
  excludedSheetCodes,
  onToggleSheetExclusion
}) => {
  // Calculate sum and count only months with actual values
  let budgetedSumRange = 0;
  let budgetedMonthsCount = 0;
  let realizedSumRange = 0;
  let realizedMonthsCount = 0;

  rangeMonths.forEach((m) => {
    const budgetValue = row.monthlyBudgetValues?.[monthKey(m)] || 0;
    const realizedValue = row.monthlyValues[monthKey(m)] || 0;

    budgetedSumRange += budgetValue;
    if (budgetValue !== 0) {
      budgetedMonthsCount++;
    }

    realizedSumRange += realizedValue;
    if (realizedValue !== 0) {
      realizedMonthsCount++;
    }
  });

  // Todas as categorias dividem pela quantidade de meses do filtro
  const avgBudgeted = budgetedMonthsCount > 0 ? budgetedSumRange / budgetedMonthsCount : 0;
  const avgRealized = realizedSumRange / rangeCount;

  const accumBudgeted = budgetedSumRange;
  const accumRealized = realizedSumRange;

  const varianceAvg = avgRealized - avgBudgeted;
  const varianceAvgPct = avgBudgeted !== 0 ? (varianceAvg / avgBudgeted) * 100 : 0;

  const varianceAccum = accumRealized - accumBudgeted;
  const varianceAccumPct =
    accumBudgeted !== 0 ? (varianceAccum / accumBudgeted) * 100 : 0;

  // Parent nodes (non-leaf) are styled differently
  const isParent = hasChild;

  const key = getRowKey(row);
  const expanded = expandedMap[key] ?? true;

  const isExcluded = excludedSheetCodes.has(row.codigo || '');

  return (
    <tr
      key={`${row.codigo || row.nome}-${index}`}
      className={`border-b border-slate-100 hover:bg-slate-50/40 transition-colors group ${
        isParent ? 'bg-slate-50/60' : 'bg-white'
      }`}
    >
      <td
        className={`py-2.5 px-4 text-xs border-r border-slate-100 ${
          isParent ? 'font-semibold' : 'font-normal'
        } ${isExcluded ? 'text-slate-300' : 'text-slate-700'}`}
      >
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: (row.level - 1) * 12 }}
        >
          {hasChild && (
            <button
              type="button"
              onClick={() =>
                setExpandedMap((prev) => ({
                  ...prev,
                  [key]: !expanded
                }))
              }
              className={`mr-1.5 p-0.5 rounded hover:bg-slate-200 ${
                isExcluded ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <span className={`flex-1 ${isParent ? '' : isExcluded ? 'text-slate-300 italic' : 'text-slate-600'}`}>
            {getCategoryLabel(row)}
          </span>
          {row.isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSheetExclusion(row.codigo || '');
              }}
              className={`p-1 rounded transition-colors ${
                isExcluded
                  ? 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                  : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title={isExcluded ? 'Incluir no cálculo' : 'Excluir do cálculo'}
            >
              {isExcluded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
        </div>
      </td>

      <td
        className={`py-2.5 px-3 text-xs text-right ${
          isParent ? 'font-semibold' : 'font-normal'
        } ${isExcluded ? 'text-slate-300' : avgBudgeted >= 0 ? 'text-blue-600' : 'text-rose-600'}`}
      >
        {avgBudgeted !== 0 ? formatCurrency(avgBudgeted) : '-'}
      </td>

      <td
        className={`py-2.5 px-3 text-xs text-right ${
          isParent ? 'font-semibold' : 'font-normal'
        } ${isExcluded ? 'text-slate-300' : avgRealized >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
      >
        {avgRealized !== 0 ? (
          <button
            onClick={() =>
              onValueClick?.(row.codigo || '', row.nome, 'avgRealized', avgRealized)
            }
            className="hover:underline cursor-pointer hover:opacity-80 transition-opacity"
          >
            {formatCurrency(avgRealized)}
          </button>
        ) : (
          '-'
        )}
      </td>

      <td className={`py-2.5 px-3 text-xs text-right border-r border-slate-100 ${isExcluded ? 'text-slate-300' : ''}`}>
        {avgBudgeted !== 0 || avgRealized !== 0 ? (
          <div className="flex items-center justify-end gap-1.5">
            {varianceAvg >= 0 ? (
              <TrendingUp className={`w-3 h-3 ${isExcluded ? 'text-slate-300' : 'text-emerald-500'}`} />
            ) : (
              <TrendingDown className={`w-3 h-3 ${isExcluded ? 'text-slate-300' : 'text-rose-500'}`} />
            )}
            <span
              className={`font-medium ${
                isExcluded ? 'text-slate-300' : varianceAvg >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(Math.abs(varianceAvg))}
            </span>
            {avgBudgeted !== 0 && (
              <span
                className={`text-[10px] ${
                  isExcluded ? 'text-slate-300' : varianceAvg >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                ({Math.abs(varianceAvgPct).toFixed(1)}%)
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      <td className={`py-2.5 px-3 text-xs text-right ${isParent ? 'font-semibold' : 'font-normal'} ${isExcluded ? 'text-slate-300' : accumBudgeted >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
        {accumBudgeted !== 0 ? formatCurrency(accumBudgeted) : '-'}
      </td>

      <td className={`py-2.5 px-3 text-xs text-right ${isParent ? 'font-semibold' : 'font-normal'} ${isExcluded ? 'text-slate-300' : accumRealized >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {accumRealized !== 0 ? (
          <button
            onClick={() =>
              onValueClick?.(row.codigo || '', row.nome, 'accumRealized', accumRealized)
            }
            className="hover:underline cursor-pointer hover:opacity-80 transition-opacity"
          >
            {formatCurrency(accumRealized)}
          </button>
        ) : (
          '-'
        )}
      </td>

      <td className={`py-2.5 px-3 text-xs text-right ${isExcluded ? 'text-slate-300' : ''}`}>
        {accumBudgeted !== 0 || accumRealized !== 0 ? (
          <div className="flex items-center justify-end gap-1.5">
            {varianceAccum >= 0 ? (
              <TrendingUp className={`w-3 h-3 ${isExcluded ? 'text-slate-300' : 'text-emerald-500'}`} />
            ) : (
              <TrendingDown className={`w-3 h-3 ${isExcluded ? 'text-slate-300' : 'text-rose-500'}`} />
            )}
            <span
              className={`font-medium ${
                isExcluded ? 'text-slate-300' : varianceAccum >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(Math.abs(varianceAccum))}
            </span>
            {accumBudgeted !== 0 && (
              <span
                className={`text-[10px] ${
                  isExcluded ? 'text-slate-300' : varianceAccum >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                ({Math.abs(varianceAccumPct).toFixed(1)}%)
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>
    </tr>
  );
};
