import React from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { CategoryNode } from '../../../types';
import { formatCurrency } from '../../../utils';

interface CategoryRowProps {
  node: CategoryNode;
  monthKey: string;
  allMonthsLength: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  isNodeExpanded?: (code: string) => boolean;
  toggleNodeExpansion?: (code: string) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  node,
  monthKey,
  allMonthsLength,
  expanded,
  onToggleExpanded,
  isNodeExpanded,
  toggleNodeExpansion,
}) => {
  const monthValue = node.monthlyValues[monthKey] || 0;
  const monthlyBudgeted = allMonthsLength > 0 ? node.budgeted / allMonthsLength : 0;
  const monthVariance = monthValue - monthlyBudgeted;
  const monthVariancePercent =
    monthlyBudgeted !== 0 ? (monthVariance / monthlyBudgeted) * 100 : 0;

  const isSubtotal = node.natureza === 'subtotal';
  const isIndicator = node.natureza === 'indicador';
  const isGroup = node.level === 1;
  const isSubGroup = node.level === 2;
  const hasChildren = node.children.length > 0;

  return (
    <>
      <tr
        className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
          isSubtotal || isIndicator
            ? 'bg-slate-100'
            : isGroup
            ? 'bg-slate-50'
            : 'bg-white'
        }`}
      >
        <td
          className={`py-3 px-4 text-sm text-slate-900 ${
            isSubtotal || isIndicator ? 'font-bold' : ''
          }`}
          style={{ paddingLeft: `${(node.level - 1) * 20 + 16}px` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpanded();
                }}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            <div>
              <div
                className={`${
                  isSubtotal || isIndicator
                    ? 'text-base'
                    : isGroup
                    ? 'font-bold text-slate-900 uppercase tracking-wide'
                    : isSubGroup
                    ? 'font-semibold text-slate-800'
                    : 'font-medium text-slate-600'
                }`}
              >
                {node.nome}
              </div>
              {node.codigo && (
                <div className="text-xs text-slate-500 mt-0.5">{node.codigo}</div>
              )}
            </div>
          </div>
        </td>
        <td
          className={`py-3 px-4 text-sm text-right ${
            isIndicator && node.nome === 'Margem Bruta %'
              ? ''
              : node.budgeted >= 0
              ? 'text-blue-600'
              : 'text-rose-600'
          } ${isSubtotal || isIndicator ? 'font-bold' : ''}`}
        >
          {node.budgeted !== 0
            ? isIndicator && node.nome === 'Margem Bruta %'
              ? `${node.budgeted.toFixed(1)}%`
              : formatCurrency(node.budgeted)
            : '-'}
        </td>
        <td
          className={`py-3 px-4 text-sm text-right ${
            isSubtotal || isIndicator ? 'font-bold' : ''
          } text-emerald-600`}
        >
          {monthValue !== 0 ? formatCurrency(monthValue) : '-'}
        </td>
        <td className="py-3 px-4 text-sm text-right">
          {node.budgeted !== 0 || monthValue !== 0 ? (
            <div className="flex items-center justify-end gap-2">
              {monthVariance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-rose-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              )}
              <span
                className={`font-bold ${
                  monthVariance >= 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(Math.abs(monthVariance))}
              </span>
              {node.budgeted !== 0 && !(isIndicator && node.nome === 'Margem Bruta %') && (
                <span
                  className={`text-xs ${
                    monthVariance >= 0 ? 'text-rose-500' : 'text-emerald-500'
                  }`}
                >
                  ({Math.abs(monthVariancePercent).toFixed(1)}%)
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </td>
      </tr>

      {expanded &&
        node.children.map((child) => (
          <CategoryRow
            key={`${child.codigo || child.nome}-${child.ordem}`}
            node={child}
            monthKey={monthKey}
            allMonthsLength={allMonthsLength}
            expanded={
              isNodeExpanded && child.codigo ? isNodeExpanded(child.codigo) : true
            }
            onToggleExpanded={
              toggleNodeExpansion && child.codigo
                ? () => toggleNodeExpansion(child.codigo!)
                : () => {}
            }
            isNodeExpanded={isNodeExpanded}
            toggleNodeExpansion={toggleNodeExpansion}
          />
        ))}
    </>
  );
};

export default CategoryRow;
