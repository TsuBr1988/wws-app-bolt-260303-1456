
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { format, eachMonthOfInterval } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  CoaNode,
  MonthlyValues,
  Transaction,
  CoaViewMode,
  CashSubView,
  Company,
  ClientStatusFilter,
  ClientMetadata,
} from '../../types';
import { formatCurrency, CAT_COL_WIDTH, MONTH_COL_WIDTH } from '../../utils';
import CoaRow from './Coa/CoaRow';
import TransactionDetailsModal from './Coa/TransactionDetailsModal';
import { TrendingUp, Settings, X, ChevronDown, ChevronRight, Table2, BarChart3 } from 'lucide-react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';

interface CoaTabProps {
  chartOfAccountsTree: CoaNode[];
  months: Date[];
  grandTotals: Record<string, MonthlyValues>;
  viewMode: CoaViewMode;
  cashSubView: CashSubView;
  onRename: (code: string, newName: string) => void;
  excludedCodes: Set<string>;
  onToggleExclusion: (code: string) => void;
  data: Transaction[];
  selectedCompany: Company | 'all';
  selectedCostCenters: string[];
  selectedClientStatus?: ClientStatusFilter;
  clientMetadata?: Record<string, ClientMetadata>;
  selectedCities?: string[];
}

const HEADER_BG = '#f8fafc'; // fundo sólido para sticky top
const FOOTER_BG = '#0f172a'; // slate-900
const BORDER_LIGHT = 'rgba(226, 232, 240, 1)'; // slate-200
const BORDER_DARK = 'rgba(30, 41, 59, 1)';     // slate-800
const RIGHT_EDGE_SHADOW = 'inset -10px 0 12px -10px rgba(0,0,0,.20)';

interface CategoryTreeItemProps {
  node: CoaNode;
  selectedCategories: string[];
  onToggle: (name: string) => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({ node, selectedCategories, onToggle }) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedCategories.includes(node.name);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors ${node.level === 1 ? 'mt-2' : ''}`}
        style={{ paddingLeft: `${(node.level - 1) * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-1 mr-1 text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <div className="w-5 mr-1" />
        )}

        <label className="flex items-center gap-3 cursor-pointer flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(node.name)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className={`text-sm ${node.level === 1 ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
            {node.name}
          </span>
        </label>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <CategoryTreeItem
              key={child.code}
              node={child}
              selectedCategories={selectedCategories}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CoaTab: React.FC<CoaTabProps> = ({
  chartOfAccountsTree,
  months,
  grandTotals,
  viewMode,
  cashSubView,
  onRename,
  excludedCodes,
  onToggleExclusion,
  data,
  selectedCompany,
  selectedCostCenters,
  selectedClientStatus,
  clientMetadata,
  selectedCities,
}) => {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const footerScrollRef = useRef<HTMLDivElement>(null);
  const categoryBodyRef = useRef<HTMLDivElement>(null);
  const [selectedCoaNode, setSelectedCoaNode] = useState<CoaNode | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedValueType, setSelectedValueType] = useState<'projected' | 'realized' | 'accrual' | 'unrealized' | null>(null);

  const [displayMode, setDisplayMode] = useState<'table' | 'chart'>('table');
  const [bar1Categories, setBar1Categories] = useState<string[]>([]);
  const [bar2Categories, setBar2Categories] = useState<string[]>([]);
  const [bar3Categories, setBar3Categories] = useState<string[]>([]);
  const [activeBarConfig, setActiveBarConfig] = useState<number | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (headerScrollRef.current) headerScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    if (bodyScrollRef.current) bodyScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    if (footerScrollRef.current) footerScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
  }, [months]);

  const handleHorizontalScroll = (source: HTMLDivElement) => {
    const scrollLeft = source.scrollLeft;
    if (headerScrollRef.current && headerScrollRef.current !== source) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
    if (bodyScrollRef.current && bodyScrollRef.current !== source) {
      bodyScrollRef.current.scrollLeft = scrollLeft;
    }
    if (footerScrollRef.current && footerScrollRef.current !== source) {
      footerScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleBodyVerticalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (categoryBodyRef.current) {
      categoryBodyRef.current.style.transform = `translateY(-${target.scrollTop}px)`;
    }
  };

  const handleNodeClick = (node: CoaNode) => {
    setSelectedCoaNode(node);
    setSelectedMonth(null);
    setSelectedValueType(null);
  };

  const handleValueClick = (node: CoaNode, month: Date, valueType: 'projected' | 'realized' | 'accrual') => {
    setSelectedCoaNode(node);
    setSelectedMonth(month);
    setSelectedValueType(valueType);
  };

  const toggleNodeExpansion = (code: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [code]: prev[code] === undefined ? false : !prev[code]
    }));
  };

  const isNodeExpanded = (code: string) => {
    return expandedNodes[code] === undefined ? true : expandedNodes[code];
  };

  const getTransactionsForNode = (node: CoaNode): Transaction[] => {
    return data.filter((t) => {
      const match = t.category.match(/^([\d\.]+)\s*(.*)/);
      const code = match ? match[1] : t.type === 'receive' ? '1.99' : '3.99';
      const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
      const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);

      let statusMatch = true;
      if (selectedClientStatus && clientMetadata) {
        const meta = clientMetadata[t.costCenter];
        const status = meta ? meta.status : 'active';
        if (selectedClientStatus === 'active' && status === 'inactive') statusMatch = false;
        if (selectedClientStatus === 'inactive' && status !== 'inactive') statusMatch = false;
      }

      let cityMatch = true;
      if (selectedCities && selectedCities.length > 0 && clientMetadata) {
        const meta = clientMetadata[t.costCenter];
        const city = meta ? meta.city : '';
        cityMatch = selectedCities.includes(city);
      }

      return code === node.code && companyMatch && ccMatch && statusMatch && cityMatch;
    });
  };

  const barConfig = {
    1: { color: '#f43f5e', name: 'Barra de Despesa 1', bg: 'bg-rose-500', text: 'text-rose-500', bgLight: 'bg-rose-50', border: 'border-rose-100' },
    2: { color: '#f59e0b', name: 'Barra de Despesa 2', bg: 'bg-amber-500', text: 'text-amber-500', bgLight: 'bg-amber-50', border: 'border-amber-100' },
    3: { color: '#8b5cf6', name: 'Barra de Despesa 3', bg: 'bg-violet-500', text: 'text-violet-500', bgLight: 'bg-violet-50', border: 'border-violet-100' },
  };

  const contractAnalysisData = useMemo(() => {
    const range = months;
    return range.map(date => {
      const monthKey = format(date, 'yyyy-MM');
      let revenue = 0;
      let bar1 = 0;
      let bar2 = 0;
      let bar3 = 0;

      const isAccrual = viewMode === 'accrual';

      const sumForCategories = (categories: string[]) => {
        let total = 0;
        const traverse = (nodes: CoaNode[]) => {
          nodes.forEach(node => {
            if (categories.includes(node.name)) {
              if (node.monthlyData[monthKey]) {
                const val = isAccrual ? node.monthlyData[monthKey].accrual : node.monthlyData[monthKey].realized;
                if (isAccrual) {
                  total += Math.abs(val);
                } else {
                  if (cashSubView === 'projected') total += Math.abs(node.monthlyData[monthKey].projected);
                  else if (cashSubView === 'realized') total += Math.abs(node.monthlyData[monthKey].realized);
                  else total += Math.abs(node.monthlyData[monthKey].realized);
                }
              }
            }
            traverse(node.children);
          });
        };
        traverse(chartOfAccountsTree);
        return total;
      };

      const revenueNode = chartOfAccountsTree.find(n => n.code === '1');
      if (revenueNode && revenueNode.monthlyData[monthKey]) {
        if (isAccrual) revenue = revenueNode.monthlyData[monthKey].accrual;
        else {
          if (cashSubView === 'projected') revenue = revenueNode.monthlyData[monthKey].projected;
          else if (cashSubView === 'realized') revenue = revenueNode.monthlyData[monthKey].realized;
          else revenue = revenueNode.monthlyData[monthKey].realized;
        }
      }

      if (bar1Categories.length > 0) bar1 = sumForCategories(bar1Categories);
      if (bar2Categories.length > 0) bar2 = sumForCategories(bar2Categories);
      if (bar3Categories.length > 0) bar3 = sumForCategories(bar3Categories);

      return {
        name: format(date, 'MMM yy', { locale: ptBR }).toUpperCase(),
        revenue,
        bar1,
        bar2,
        bar3
      };
    });
  }, [chartOfAccountsTree, months, viewMode, cashSubView, bar1Categories, bar2Categories, bar3Categories]);

  const calculateGrandTotal = () => {
    let totalProjected = 0;
    let totalRealized = 0;
    let totalUnrealized = 0;
    let totalAccrual = 0;

    months.forEach((m) => {
      const key = format(m, 'yyyy-MM');
      const data = grandTotals[key] || { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
      totalProjected += data.projected;
      totalRealized += data.realized;
      totalUnrealized += data.unrealized;
      totalAccrual += data.accrual;
    });

    return { projected: totalProjected, realized: totalRealized, unrealized: totalUnrealized, accrual: totalAccrual };
  };

  const renderFooterCell = (data: MonthlyValues) => {
    const color = (v: number) => (v === 0 ? 'text-slate-500' : v > 0 ? 'text-emerald-400' : 'text-rose-400');

    if (viewMode === 'accrual') {
      return (
        <div className="w-full text-right px-4">
          <span className={`text-[10px] font-bold whitespace-nowrap ${color(data.accrual)}`}>{formatCurrency(data.accrual)}</span>
        </div>
      );
    }

    if (cashSubView === 'all') {
      return (
        <div className="flex w-full h-full items-center">
          <div className="w-1/3 border-r border-slate-700 border-dashed text-right px-2">
            <span className={`text-[10px] font-bold whitespace-nowrap ${color(data.projected)}`}>{formatCurrency(data.projected)}</span>
          </div>
          <div className="w-1/3 border-r border-slate-700 border-dashed text-right px-2">
            <span className={`text-[10px] font-bold whitespace-nowrap ${color(data.realized)}`}>{formatCurrency(data.realized)}</span>
          </div>
          <div className="w-1/3 text-right px-2">
            <span className="text-[10px] font-bold whitespace-nowrap text-amber-400">{formatCurrency(data.unrealized)}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full h-full items-center">
        {cashSubView === 'projected' && (
          <div className="w-full text-right px-2">
            <span className={`text-[10px] font-bold whitespace-nowrap ${color(data.projected)}`}>{formatCurrency(data.projected)}</span>
          </div>
        )}
        {cashSubView === 'realized' && (
          <div className="w-full text-right px-2">
            <span className={`text-[10px] font-bold whitespace-nowrap ${color(data.realized)}`}>{formatCurrency(data.realized)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-85px)] w-full p-6 animate-fade-in flex flex-col" style={{ transform: 'none' }}>
      {/* Toggle Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setDisplayMode('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            displayMode === 'table'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Table2 className="w-4 h-4" />
          Tabela
        </button>
        <button
          onClick={() => setDisplayMode('chart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            displayMode === 'chart'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Gráficos
        </button>
      </div>

      {displayMode === 'table' ? (
      <div className="flex-1 bg-white rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200 flex flex-col" style={{ overflow: 'hidden', maxWidth: '100%' }}>

        {/* =================== LINHA 1: HEADER (FIXO) =================== */}
        <div className="flex shrink-0">
          {/* Canto superior esquerdo - célula "Categoria" (fixo em ambos eixos) */}
          <div
            className="px-4 flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider h-12 border-b border-r shrink-0"
            style={{
              width: `${CAT_COL_WIDTH}px`,
              minWidth: `${CAT_COL_WIDTH}px`,
              background: HEADER_BG,
              borderColor: BORDER_LIGHT,
              boxShadow: '2px 0 8px -2px rgba(0,0,0,0.1)',
              zIndex: 30,
              position: 'sticky',
              left: 0,
            }}
          >
            Categoria
          </div>

          {/* Headers dos meses (fixo verticalmente, rola horizontalmente) */}
          <div
            ref={headerScrollRef}
            onScroll={(e) => handleHorizontalScroll(e.currentTarget)}
            className="flex-1 custom-scrollbar"
            style={{ overflow: 'auto', overflowY: 'hidden' }}
          >
            <div className="flex h-12 border-b" style={{ minWidth: 'max-content' }}>
              {months.map((m) => (
                <div
                  key={m.getTime()}
                  className="flex flex-col items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r"
                  style={{
                    width: `${MONTH_COL_WIDTH}px`,
                    minWidth: `${MONTH_COL_WIDTH}px`,
                    background: HEADER_BG,
                    borderColor: BORDER_LIGHT,
                  }}
                >
                  <div className="text-[9px] text-slate-400 mb-0.5">
                    {format(m, 'MMM yyyy', { locale: ptBR })}
                  </div>
                  {viewMode === 'cash' && cashSubView === 'all' && (
                    <div className="flex w-full text-[8px] font-semibold">
                      <div className="w-1/3 text-center py-0.5 bg-slate-100 border-r border-slate-200">
                        Previsto
                      </div>
                      <div className="w-1/3 text-center py-0.5 border-r border-slate-200">
                        Realizado
                      </div>
                      <div className="w-1/3 text-center py-0.5 bg-amber-50">
                        Não Realizado
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* TOTAL Column Header */}
              <div
                className="flex flex-col items-center justify-center text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/50"
                style={{
                  width: `${MONTH_COL_WIDTH}px`,
                  minWidth: `${MONTH_COL_WIDTH}px`,
                  borderColor: BORDER_LIGHT,
                }}
              >
                <div className="text-[9px] mb-0.5">
                  TOTAL
                </div>
                {viewMode === 'cash' && cashSubView === 'all' && (
                  <div className="flex w-full text-[8px] font-semibold">
                    <div className="w-1/3 text-center py-0.5 bg-slate-100 border-r border-slate-200">
                      Previsto
                    </div>
                    <div className="w-1/3 text-center py-0.5 border-r border-slate-200">
                      Realizado
                    </div>
                    <div className="w-1/3 text-center py-0.5 bg-amber-50">
                      Não Realizado
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =================== LINHA 2: BODY (ROLÁVEL) =================== */}
        <div className="flex flex-1 overflow-hidden">
          {/* Coluna categoria (fixo horizontalmente, rola verticalmente) */}
          <div
            className="flex flex-col overflow-hidden relative shrink-0"
            style={{
              width: `${CAT_COL_WIDTH}px`,
              minWidth: `${CAT_COL_WIDTH}px`,
              borderRight: `1px solid ${BORDER_LIGHT}`,
              boxShadow: '2px 0 8px -2px rgba(0,0,0,0.1)',
              zIndex: 20,
              position: 'sticky',
              left: 0,
              backgroundColor: 'white',
            }}
          >
            <div className="flex-1 overflow-hidden relative">
              <div ref={categoryBodyRef}>
                {chartOfAccountsTree.map((node) => (
                  <CoaRow
                    key={node.code}
                    node={node}
                    onNodeClick={handleNodeClick}
                    onValueClick={handleValueClick}
                    viewMode={viewMode}
                    months={[]}
                    cashSubView={cashSubView}
                    onRename={onRename}
                    excludedCodes={excludedCodes}
                    onToggleExclusion={onToggleExclusion}
                    categoryOnly={true}
                    expanded={isNodeExpanded(node.code)}
                    onToggleExpanded={() => toggleNodeExpansion(node.code)}
                    isNodeExpanded={isNodeExpanded}
                    toggleNodeExpansion={toggleNodeExpansion}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Área de dados (rola em ambos os eixos) */}
          <div
            ref={bodyScrollRef}
            onScroll={(e) => {
              handleHorizontalScroll(e.currentTarget);
              handleBodyVerticalScroll(e);
            }}
            className="flex-1 custom-scrollbar"
            style={{ overflow: 'auto' }}
          >
            <div style={{ minWidth: 'max-content' }}>
              {chartOfAccountsTree.map((node) => (
                <CoaRow
                  key={node.code}
                  node={node}
                  onNodeClick={handleNodeClick}
                  onValueClick={handleValueClick}
                  viewMode={viewMode}
                  months={months}
                  cashSubView={cashSubView}
                  onRename={onRename}
                  excludedCodes={excludedCodes}
                  onToggleExclusion={onToggleExclusion}
                  dataOnly={true}
                  expanded={isNodeExpanded(node.code)}
                  onToggleExpanded={() => toggleNodeExpansion(node.code)}
                  isNodeExpanded={isNodeExpanded}
                  toggleNodeExpansion={toggleNodeExpansion}
                  showTotal={true}
                />
              ))}
            </div>
          </div>
        </div>

        {/* =================== LINHA 3: FOOTER (FIXO) =================== */}
        <div className="flex shrink-0">
          {/* Footer da categoria (fixo em ambos eixos) */}
          <div
            className="px-6 flex items-center justify-between text-white h-14 shrink-0 border-r"
            style={{
              width: `${CAT_COL_WIDTH}px`,
              minWidth: `${CAT_COL_WIDTH}px`,
              background: FOOTER_BG,
              borderTop: `1px solid ${BORDER_DARK}`,
              borderRight: `1px solid ${BORDER_LIGHT}`,
              boxShadow: '2px 0 8px -2px rgba(0,0,0,0.1)',
              zIndex: 30,
              position: 'sticky',
              left: 0,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">Geração de Caixa</span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          {/* Footer dos totais (fixo verticalmente, rola horizontalmente) */}
          <div
            ref={footerScrollRef}
            onScroll={(e) => handleHorizontalScroll(e.currentTarget)}
            className="flex-1"
            style={{ overflow: 'auto', overflowY: 'hidden' }}
          >
            <div className="flex h-14" style={{ minWidth: 'max-content', borderTop: `1px solid ${BORDER_DARK}` }}>
              {months.map((m) => (
                <div
                  key={m.getTime()}
                  className="flex items-center justify-center border-r"
                  style={{
                    width: `${MONTH_COL_WIDTH}px`,
                    minWidth: `${MONTH_COL_WIDTH}px`,
                    background: FOOTER_BG,
                    borderColor: BORDER_DARK,
                  }}
                >
                  {renderFooterCell(
                    grandTotals[format(m, 'yyyy-MM')] || { projected: 0, realized: 0, accrual: 0, unrealized: 0 }
                  )}
                </div>
              ))}
              {/* TOTAL Column Footer */}
              <div
                className="flex items-center justify-center bg-indigo-900"
                style={{
                  width: `${MONTH_COL_WIDTH}px`,
                  minWidth: `${MONTH_COL_WIDTH}px`,
                }}
              >
                {renderFooterCell(calculateGrandTotal())}
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="flex-1 overflow-auto animate-fade-in pb-20">
          {/* Gráfico Principal */}
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 mb-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Análise Comparativa</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="text-xs font-medium text-slate-500">Despesa 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-medium text-slate-500">Despesa 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  <span className="text-xs font-medium text-slate-500">Despesa 3</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-medium text-slate-500">Receita</span>
                </div>
              </div>
            </div>

            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={contractAnalysisData} margin={{ top: 50, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(value) => `R$${value/1000}k`} />
                  <Tooltip
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'}}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="bar1"
                    name="Barra de Despesa 1"
                    fill={barConfig[1].color}
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    isAnimationActive={false}
                    label={{
                      position: 'top',
                      content: (props: any) => {
                        if (!props.value || props.value === 0) return null;
                        const dataPoint = contractAnalysisData.find((d: any) => d.name === props.name);
                        if (!dataPoint || !dataPoint.revenue || dataPoint.revenue === 0) return null;
                        const percentage = ((props.value / dataPoint.revenue) * 100).toFixed(1);
                        return (
                          <text
                            x={props.x + props.width / 2}
                            y={props.y - 5}
                            fill={barConfig[1].color}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight="600"
                          >
                            {percentage}%
                          </text>
                        );
                      }
                    }}
                  />
                  <Bar
                    dataKey="bar2"
                    name="Barra de Despesa 2"
                    fill={barConfig[2].color}
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    isAnimationActive={false}
                    label={{
                      position: 'top',
                      content: (props: any) => {
                        if (!props.value || props.value === 0) return null;
                        const dataPoint = contractAnalysisData.find((d: any) => d.name === props.name);
                        if (!dataPoint || !dataPoint.revenue || dataPoint.revenue === 0) return null;
                        const percentage = ((props.value / dataPoint.revenue) * 100).toFixed(1);
                        return (
                          <text
                            x={props.x + props.width / 2}
                            y={props.y - 5}
                            fill={barConfig[2].color}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight="600"
                          >
                            {percentage}%
                          </text>
                        );
                      }
                    }}
                  />
                  <Bar
                    dataKey="bar3"
                    name="Barra de Despesa 3"
                    fill={barConfig[3].color}
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    isAnimationActive={false}
                    label={{
                      position: 'top',
                      content: (props: any) => {
                        if (!props.value || props.value === 0) return null;
                        const dataPoint = contractAnalysisData.find((d: any) => d.name === props.name);
                        if (!dataPoint || !dataPoint.revenue || dataPoint.revenue === 0) return null;
                        const percentage = ((props.value / dataPoint.revenue) * 100).toFixed(1);
                        return (
                          <text
                            x={props.x + props.width / 2}
                            y={props.y - 5}
                            fill={barConfig[3].color}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight="600"
                          >
                            {percentage}%
                          </text>
                        );
                      }
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards de Configuração das Barras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => {
              const id = i as 1 | 2 | 3;
              const categories = id === 1 ? bar1Categories : (id === 2 ? bar2Categories : bar3Categories);
              const config = barConfig[id];

              return (
                <div
                  key={i}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${config.bg}`}>
                        {i}
                      </div>
                      <button
                        onClick={() => setActiveBarConfig(id)}
                        className={`p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors`}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Configuração da Barra {i}</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {categories.length === 0 ? 'Nenhuma Categoria' : `${categories.length} Categorias`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal de Configuração Hierárquica */}
          {activeBarConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setActiveBarConfig(null)} />
              <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Configurar Barra {activeBarConfig}</h3>
                    <p className="text-sm text-slate-500">Selecione as categorias ou grupos.</p>
                  </div>
                  <button
                    onClick={() => setActiveBarConfig(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {chartOfAccountsTree.map(node => (
                    <CategoryTreeItem
                      key={node.code}
                      node={node}
                      selectedCategories={activeBarConfig === 1 ? bar1Categories : (activeBarConfig === 2 ? bar2Categories : bar3Categories)}
                      onToggle={(name) => {
                        const current = activeBarConfig === 1 ? bar1Categories : (activeBarConfig === 2 ? bar2Categories : bar3Categories);
                        const setter = activeBarConfig === 1 ? setBar1Categories : (activeBarConfig === 2 ? setBar2Categories : setBar3Categories);
                        if (current.includes(name)) setter(current.filter(c => c !== name));
                        else setter([...current, name]);
                      }}
                    />
                  ))}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem]">
                  <button
                    onClick={() => setActiveBarConfig(null)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    Concluir Configuração
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCoaNode && (
        <TransactionDetailsModal
          node={selectedCoaNode}
          transactions={getTransactionsForNode(selectedCoaNode)}
          onClose={() => {
            setSelectedCoaNode(null);
            setSelectedMonth(null);
            setSelectedValueType(null);
          }}
          month={selectedMonth || undefined}
          valueType={selectedValueType || undefined}
        />
      )}
    </div>
  );
};

export default CoaTab;
