import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Pencil, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { CoaNode, CoaViewMode, CashSubView } from '../../../types';
import { formatCurrency, getValueColor, CAT_COL_WIDTH, MONTH_COL_WIDTH } from '../../../utils';

interface CoaRowProps {
  node: CoaNode;
  onNodeClick?: (node: CoaNode) => void;
  onValueClick?: (node: CoaNode, month: Date, valueType: 'projected' | 'realized' | 'accrual' | 'unrealized') => void;
  viewMode: CoaViewMode;
  months: Date[];
  cashSubView: CashSubView;
  onRename?: (code: string, newName: string) => void;
  excludedCodes: Set<string>;
  onToggleExclusion: (code: string) => void;
  categoryOnly?: boolean;
  dataOnly?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  isNodeExpanded?: (code: string) => boolean;
  toggleNodeExpansion?: (code: string) => void;
  showTotal?: boolean;
}

const CoaRow: React.FC<CoaRowProps> = ({
  node,
  onNodeClick,
  onValueClick,
  viewMode,
  months,
  cashSubView,
  onRename,
  excludedCodes,
  onToggleExclusion,
  categoryOnly = false,
  dataOnly = false,
  expanded: expandedProp,
  onToggleExpanded,
  isNodeExpanded,
  toggleNodeExpansion,
  showTotal = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);

  const expanded = expandedProp !== undefined ? expandedProp : true;

  const isExcluded = excludedCodes.has(node.code);

  useEffect(() => {
    setEditValue(node.name);
  }, [node.name]);

  const isGroup = node.level === 1;
  const isSubGroup = node.level === 2;

  const handleSaveRename = (e?: React.FormEvent) => {
    e?.stopPropagation();
    if (onRename && editValue.trim() !== '' && editValue !== node.name) {
      onRename(node.code, editValue);
    } else {
      setEditValue(node.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(node.name);
    }
  };

  // Calculate total for the period
  const calculateTotal = () => {
    let totalProjected = 0;
    let totalRealized = 0;
    let totalUnrealized = 0;
    let totalAccrual = 0;

    months.forEach((month) => {
      const key = format(month, 'yyyy-MM');
      const data = node.monthlyData[key] || { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
      totalProjected += data.projected;
      totalRealized += data.realized;
      totalUnrealized += data.unrealized;
      totalAccrual += data.accrual;
    });

    return { projected: totalProjected, realized: totalRealized, unrealized: totalUnrealized, accrual: totalAccrual };
  };

  const renderCellValues = (month: Date) => {
    const key = format(month, 'yyyy-MM');
    const data = node.monthlyData[key] || { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
    const hasValue = viewMode === 'accrual' ? data.accrual !== 0 : (data.projected !== 0 || data.realized !== 0 || data.unrealized !== 0);
    const canClick = node.isLeaf && hasValue && onValueClick;

    if (viewMode === 'accrual') {
      return (
        <div className="w-full text-right px-4">
          <span
            onClick={canClick ? (e) => { e.stopPropagation(); onValueClick(node, month, 'accrual'); } : undefined}
            className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
              isExcluded ? 'text-slate-300' : getValueColor(data.accrual)
            } ${canClick ? 'cursor-pointer hover:underline hover:text-indigo-600' : ''}`}
          >
            {formatCurrency(data.accrual)}
          </span>
        </div>
      );
    }

    if (cashSubView === 'all') {
      return (
        <div className="flex w-full h-full items-center">
          <div className="w-1/3 border-r border-slate-100 border-dashed text-right px-2 bg-slate-100">
            <span
              onClick={canClick ? (e) => { e.stopPropagation(); onValueClick(node, month, 'projected'); } : undefined}
              className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
                isExcluded ? 'text-slate-300' : getValueColor(data.projected)
              } ${canClick ? 'cursor-pointer hover:underline hover:text-indigo-600' : ''}`}
            >
              {formatCurrency(data.projected)}
            </span>
          </div>
          <div className="w-1/3 border-r border-slate-100 border-dashed text-right px-2">
            <span
              onClick={canClick ? (e) => { e.stopPropagation(); onValueClick(node, month, 'realized'); } : undefined}
              className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
                isExcluded ? 'text-slate-300' : getValueColor(data.realized)
              } ${canClick ? 'cursor-pointer hover:underline hover:text-indigo-600' : ''}`}
            >
              {formatCurrency(data.realized)}
            </span>
          </div>
          <div className="w-1/3 text-right px-2 bg-amber-50">
            <span
              onClick={canClick ? (e) => { e.stopPropagation(); onValueClick(node, month, 'unrealized'); } : undefined}
              className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
                isExcluded ? 'text-slate-300' : 'text-amber-600'
              } ${canClick ? 'cursor-pointer hover:underline hover:text-indigo-600' : ''}`}
            >
              {formatCurrency(data.unrealized)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full h-full items-center">
        {cashSubView === 'projected' && (
          <div className="w-full text-right px-2 bg-slate-100">
            <span
              onClick={canClick ? (e) => { e.stopPropagation(); onValueClick(node, month, 'projected'); } : undefined}
              className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
                isExcluded ? 'text-slate-300' : getValueColor(data.projected)
              } ${canClick ? 'cursor-pointer hover:underline hover:text-indigo-600' : ''}`}
            >
              {formatCurrency(data.projected)}
            </span>
          </div>
        )}
        {cashSubView === 'realized' && (
          <div className="w-full text-right px-2">
            <span
              onClick={canClick ? (e) => { e.stopPropagation(); onValueClick(node, month, 'realized'); } : undefined}
              className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
                isExcluded ? 'text-slate-300' : getValueColor(data.realized)
              } ${canClick ? 'cursor-pointer hover:underline hover:text-indigo-600' : ''}`}
            >
              {formatCurrency(data.realized)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderTotalCell = () => {
    const total = calculateTotal();

    if (viewMode === 'accrual') {
      return (
        <div className="w-full text-right px-4">
          <span className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
            isExcluded ? 'text-slate-300' : getValueColor(total.accrual)
          }`}>
            {formatCurrency(total.accrual)}
          </span>
        </div>
      );
    }

    if (cashSubView === 'all') {
      return (
        <div className="flex w-full h-full items-center">
          <div className="w-1/3 border-r border-slate-100 border-dashed text-right px-2 bg-slate-100">
            <span className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
              isExcluded ? 'text-slate-300' : getValueColor(total.projected)
            }`}>
              {formatCurrency(total.projected)}
            </span>
          </div>
          <div className="w-1/3 border-r border-slate-100 border-dashed text-right px-2">
            <span className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
              isExcluded ? 'text-slate-300' : getValueColor(total.realized)
            }`}>
              {formatCurrency(total.realized)}
            </span>
          </div>
          <div className="w-1/3 text-right px-2 bg-amber-50">
            <span className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
              isExcluded ? 'text-slate-300' : 'text-amber-600'
            }`}>
              {formatCurrency(total.unrealized)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full h-full items-center">
        {cashSubView === 'projected' && (
          <div className="w-full text-right px-2 bg-slate-100">
            <span className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
              isExcluded ? 'text-slate-300' : getValueColor(total.projected)
            }`}>
              {formatCurrency(total.projected)}
            </span>
          </div>
        )}
        {cashSubView === 'realized' && (
          <div className="w-full text-right px-2">
            <span className={`text-[10px] ${isGroup ? 'font-bold' : 'font-medium'} ${
              isExcluded ? 'text-slate-300' : getValueColor(total.realized)
            }`}>
              {formatCurrency(total.realized)}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (categoryOnly) {
    return (
      <>
        <div
          className={`group flex items-center border-b border-slate-100 cursor-pointer h-9 ${
            node.isProvisionLine ? 'bg-red-50' : isGroup ? 'bg-slate-50' : 'bg-white'
          } hover:bg-slate-50 transition-colors`}
          onClick={() => {
            if (isEditing) return;
            if (node.isLeaf && onNodeClick) onNodeClick(node);
            else if (onToggleExpanded) onToggleExpanded();
          }}
          style={{ paddingLeft: `${(node.level - 1) * 20 + 20}px` }}
        >
          <div
            className={`mr-2 w-5 flex items-center justify-center shrink-0 ${
              isExcluded ? 'text-slate-200' : 'text-slate-400'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleExpanded) onToggleExpanded();
            }}
          >
            {!node.isLeaf && (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-hidden pr-2">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[10px] border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white text-slate-900"
              />
            ) : (
              <>
                <span
                  title={node.name}
                  className={`text-[11px] truncate ${
                    isExcluded
                      ? 'text-slate-300 italic'
                      : isGroup
                      ? 'font-bold text-slate-900 uppercase tracking-wide'
                      : isSubGroup
                      ? 'font-semibold text-slate-800'
                      : 'font-medium text-slate-600'
                  }`}
                >
                  {node.name}
                </span>

                {onRename && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Renomear Categoria"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExclusion(node.code);
                  }}
                  className={`p-1 rounded transition-colors ml-1 ${
                    isExcluded
                      ? 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                      : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title={isExcluded ? 'Incluir no cálculo' : 'Excluir do cálculo'}
                >
                  {isExcluded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>

                {node.isLeaf && onNodeClick && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 bg-indigo-50 p-0.5 rounded shrink-0 ml-auto">
                    <Eye className="w-3 h-3" />
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {expanded &&
          node.children.map((child) => (
            <CoaRow
              key={child.code}
              node={child}
              onNodeClick={onNodeClick}
              onValueClick={onValueClick}
              viewMode={viewMode}
              months={months}
              cashSubView={cashSubView}
              onRename={onRename}
              excludedCodes={excludedCodes}
              onToggleExclusion={onToggleExclusion}
              categoryOnly={true}
              expanded={isNodeExpanded ? isNodeExpanded(child.code) : true}
              onToggleExpanded={toggleNodeExpansion ? () => toggleNodeExpansion(child.code) : undefined}
              isNodeExpanded={isNodeExpanded}
              toggleNodeExpansion={toggleNodeExpansion}
            />
          ))}
      </>
    );
  }

  if (dataOnly) {
    return (
      <>
        <div
          className={`flex items-center border-b border-slate-100 h-9 ${
            node.isProvisionLine ? 'bg-red-50' : isGroup ? 'bg-slate-50' : 'bg-white'
          }`}
        >
          {months.map((m) => (
            <div
              key={m.getTime()}
              className="h-full flex items-center justify-center border-r border-slate-50"
              style={{ width: `${MONTH_COL_WIDTH}px`, minWidth: `${MONTH_COL_WIDTH}px` }}
            >
              {renderCellValues(m)}
            </div>
          ))}
          {showTotal && (
            <div
              className="h-full flex items-center justify-center bg-indigo-50/50"
              style={{ width: `${MONTH_COL_WIDTH}px`, minWidth: `${MONTH_COL_WIDTH}px` }}
            >
              {renderTotalCell()}
            </div>
          )}
        </div>

        {expanded &&
          node.children.map((child) => (
            <CoaRow
              key={child.code}
              node={child}
              onNodeClick={onNodeClick}
              onValueClick={onValueClick}
              viewMode={viewMode}
              months={months}
              cashSubView={cashSubView}
              onRename={onRename}
              excludedCodes={excludedCodes}
              onToggleExclusion={onToggleExclusion}
              dataOnly={true}
              expanded={isNodeExpanded ? isNodeExpanded(child.code) : true}
              onToggleExpanded={toggleNodeExpansion ? () => toggleNodeExpansion(child.code) : undefined}
              isNodeExpanded={isNodeExpanded}
              toggleNodeExpansion={toggleNodeExpansion}
              showTotal={showTotal}
            />
          ))}
      </>
    );
  }

  return null;
};

export default CoaRow;

