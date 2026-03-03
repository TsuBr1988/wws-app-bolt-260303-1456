
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Check, Loader2, TableProperties, Tag, ArrowUpRight, ArrowDownLeft, ChevronDown, XCircle, Download, BarChart3, PieChart as PieChartIcon, TrendingUp, List, ChevronUp, X } from 'lucide-react';
import { format, isBefore, compareDesc, compareAsc, eachDayOfInterval } from 'date-fns';
import { BalancesByCompany, Transaction, Company, ClientMetadata, CoaViewMode, CashSubView, ClientCategoryFilter } from '../../../types';
import { formatCurrency, getCompanyShortName, getCompanyTextClass, getEffectiveDate, startOfDay, sumBalances } from '../../../utils';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts';

interface StatementTabProps {
    data: Transaction[];
    startDate: Date;
    endDate: Date;
    viewMode: CoaViewMode;
    cashSubView: CashSubView;
    selectedCompany: Company | 'all';
    selectedCostCenters: string[];
    clientMetadata: Record<string, ClientMetadata>;
    selectedClientCategory: ClientCategoryFilter;
    initialBalances: BalancesByCompany;
}

type QuickFilterType = 'all' | 'open_rev' | 'realized_rev' | 'open_exp' | 'realized_exp';
type ViewType = 'table' | 'chart' | 'categories';

const CategoryDetailsModal = ({
    isOpen,
    onClose,
    categoryData,
    expandedCategory,
    onToggleCategory
}: {
    isOpen: boolean;
    onClose: () => void;
    categoryData: { name: string; total: number; transactions: Transaction[] }[];
    expandedCategory: string | null;
    onToggleCategory: (category: string) => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-5xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <List className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Detalhamento por Categorias</h3>
                            <p className="text-sm text-slate-500 font-medium">Análise completa do extrato</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                    {categoryData.length > 0 ? (
                        <div className="space-y-3">
                            {categoryData.map((category, idx) => (
                                <div key={category.name} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <button
                                        onClick={() => onToggleCategory(category.name)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'][idx % 5] }}>
                                                {idx + 1}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-slate-900">{category.name}</p>
                                                <p className="text-xs text-slate-500">{category.transactions.length} lançamento{category.transactions.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-base font-bold ${category.total >= 0 ? 'text-black' : 'text-red-600'}`}>{formatCurrency(category.total)}</span>
                                            {expandedCategory === category.name ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {expandedCategory === category.name && (
                                        <div className="border-t border-slate-100 bg-slate-50/50">
                                            <div className="p-4 space-y-2">
                                                {[...category.transactions]
                                                    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                                                    .map((transaction) => (
                                                    <div key={transaction.id} className="bg-white p-4 rounded-lg border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-slate-800">{transaction.description}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-xs text-slate-500">{format(transaction.dueDate, 'dd/MM/yyyy')}</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                <span className="text-xs text-slate-500">{transaction.costCenter}</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                <span className={`text-xs font-bold ${getCompanyTextClass(transaction.company)}`}>
                                                                    {getCompanyShortName(transaction.company)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className={`text-sm font-bold ml-4 ${transaction.amount >= 0 ? 'text-black' : 'text-red-600'}`}>{formatCurrency(transaction.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            Nenhuma transação encontrada para este período
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatementTab: React.FC<StatementTabProps> = ({
    data,
    startDate,
    endDate,
    viewMode,
    cashSubView,
    selectedCompany,
    selectedCostCenters,
    clientMetadata,
    selectedClientCategory,
    initialBalances
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    // State for the card-based quick filters
    const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');

    // State for view type (table, chart, categories)
    const [viewType, setViewType] = useState<ViewType>('table');

    // State for category details modal
    const [isCategoryDetailsModalOpen, setIsCategoryDetailsModalOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategories, quickFilter, startDate, endDate, selectedCompany, selectedCostCenters, selectedClientCategory, viewMode, cashSubView]);

    const availableCategories = useMemo(() => {
        const s = new Set<string>();
        data.forEach(t => s.add(t.category));
        return Array.from(s).sort();
    }, [data]);

    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return availableCategories;
        const query = categorySearch.toLowerCase();
        return availableCategories.filter(cat => cat.toLowerCase().includes(query));
    }, [availableCategories, categorySearch]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(cat)) return prev.filter(c => c !== cat);
            return [...prev, cat];
        });
    };

    const statementTableData = useMemo(() => {
        const today = startOfDay(new Date());
  
        // 1. First, identify ALL transactions relevant to the company/CC filters to build the balance timeline
        const allRelevant = data.filter(t => {
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!companyMatch || !ccMatch) return false;
  
            if (selectedClientCategory !== 'all') {
                const meta = clientMetadata[t.costCenter];
                const category = meta ? meta.category : 'administrative';
                if (category !== selectedClientCategory) return false;
            }
            return true;
        });
  
        // 2. Sort chronologically for balance calculation
        const sortedAll = [...allRelevant].sort((a, b) => {
             const dateA = getEffectiveDate(a);
             const dateB = getEffectiveDate(b);
             const dateComparison = compareAsc(dateA, dateB);
             if (dateComparison !== 0) return dateComparison;
             return a.id.localeCompare(b.id);
        });
  
        // 3. Determine the "Starting Balance"
                let currentBalance = (selectedCompany === 'all') 
                    ? sumBalances(initialBalances)
                    : (initialBalances[selectedCompany as Company] ?? 0);
        
        const realizedBeforeToday = sortedAll.reduce((acc, t) => {
            const effectiveDate = getEffectiveDate(t);
            if (t.status === 'completed' && isBefore(effectiveDate, today)) {
               return acc + t.amount;
            }
            return acc;
        }, 0);
  
        currentBalance = currentBalance - realizedBeforeToday;
  
        // 4. Calculate running balance
        const balanceMap = new Map<string, number>();
        
        sortedAll.forEach(t => {
            const effectiveDate = getEffectiveDate(t);
            const isPast = isBefore(effectiveDate, today);
            
            let affectsBalance = false;
            
            if (t.status === 'completed') {
                affectsBalance = true;
            } else if (t.status === 'pending') {
                if (!isPast) {
                    affectsBalance = true;
                }
            }
  
            if (affectsBalance) {
                currentBalance += t.amount;
            }
            
            balanceMap.set(t.id, currentBalance);
        });
  
        // 5. Now filter for the View (Date Range, Search, Category, QuickFilter)
        const viewFiltered = sortedAll.filter(t => {
            if (viewMode === 'cash') {
                const inRange = (d?: Date) => d && d >= startDate && d <= endDate;
                const isRealizedInRange = t.status === 'completed' && inRange(t.paymentDate);
                const isProjectedInRange = t.status === 'pending' && inRange(t.dueDate);
                
                // Quick Filter Logic Override
                if (quickFilter === 'open_rev') return isProjectedInRange && t.type === 'receive';
                if (quickFilter === 'realized_rev') return isRealizedInRange && t.type === 'receive';
                if (quickFilter === 'open_exp') return isProjectedInRange && t.type === 'pay';
                if (quickFilter === 'realized_exp') return isRealizedInRange && t.type === 'pay';

                // Standard SubView Logic (only if no quick filter)
                if (cashSubView === 'realized' && !isRealizedInRange) return false;
                if (cashSubView === 'projected' && !isProjectedInRange) return false;
                
                return isRealizedInRange || isProjectedInRange;
            } else {
                const d = t.competencyDate || t.dueDate;
                const inRange = d >= startDate && d <= endDate;

                // Quick Filter Logic Override (Accrual approximation based on status)
                if (quickFilter === 'open_rev') return inRange && t.type === 'receive' && t.status === 'pending';
                if (quickFilter === 'realized_rev') return inRange && t.type === 'receive' && t.status === 'completed';
                if (quickFilter === 'open_exp') return inRange && t.type === 'pay' && t.status === 'pending';
                if (quickFilter === 'realized_exp') return inRange && t.type === 'pay' && t.status === 'completed';

                // Standard SubView
                if (cashSubView === 'realized' && t.status !== 'completed') return false;
                if (cashSubView === 'projected' && t.status !== 'pending') return false;
                return inRange;
            }
        });
  
        // Apply Search & Category filters
        const searched = viewFiltered.filter(t => {
            if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
  
            if (search.trim() !== '') {
                const query = search.toLowerCase();
                const match = t.description.toLowerCase().includes(query) || t.category.toLowerCase().includes(query) || t.costCenter.toLowerCase().includes(query) || t.amount.toString().includes(query) || (t.nome && t.nome.toLowerCase().includes(query));
                if (!match) return false;
            }
            return true;
        });
  
        // 6. Final Sort for Display: Oldest -> Newest
        return searched.map(t => ({
            ...t,
            accumulatedBalance: balanceMap.get(t.id) || 0
        })).sort((a, b) => {
             const dateA = getEffectiveDate(a);
             const dateB = getEffectiveDate(b);
             const dateComparison = compareAsc(dateA, dateB);
             if (dateComparison !== 0) return dateComparison;
             return a.id.localeCompare(b.id);
        });
  
    }, [data, selectedCompany, selectedCostCenters, startDate, endDate, viewMode, cashSubView, selectedCategories, search, initialBalances, clientMetadata, selectedClientCategory, quickFilter]);

    // Calculate stats based on filtered data (INCLUDING search and category filters)
    const stats = useMemo(() => {
        const s = { openRev: 0, realizedRev: 0, openExp: 0, realizedExp: 0, totalPeriod: 0 };

        // Use the same filtering logic as statementTableData but WITHOUT quickFilter
        const today = startOfDay(new Date());

        const allRelevant = data.filter(t => {
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!companyMatch || !ccMatch) return false;

            if (selectedClientCategory !== 'all') {
                const meta = clientMetadata[t.costCenter];
                const category = meta ? meta.category : 'administrative';
                if (category !== selectedClientCategory) return false;
            }
            return true;
        });

        // Apply date range filter
        const viewFiltered = allRelevant.filter(t => {
            if (viewMode === 'cash') {
                const inRange = (d?: Date) => d && d >= startDate && d <= endDate;
                const isRealizedInRange = t.status === 'completed' && inRange(t.paymentDate);
                const isProjectedInRange = t.status === 'pending' && inRange(t.dueDate);

                // Standard SubView Logic (no quick filter here)
                if (cashSubView === 'realized' && !isRealizedInRange) return false;
                if (cashSubView === 'projected' && !isProjectedInRange) return false;

                return isRealizedInRange || isProjectedInRange;
            } else {
                const d = t.competencyDate || t.dueDate;
                const inRange = d >= startDate && d <= endDate;

                // Standard SubView
                if (cashSubView === 'realized' && t.status !== 'completed') return false;
                if (cashSubView === 'projected' && t.status !== 'pending') return false;
                return inRange;
            }
        });

        // Apply Search & Category filters (SAME as table)
        const searched = viewFiltered.filter(t => {
            if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;

            if (search.trim() !== '') {
                const query = search.toLowerCase();
                const match = t.description.toLowerCase().includes(query) || t.category.toLowerCase().includes(query) || t.costCenter.toLowerCase().includes(query) || t.amount.toString().includes(query) || (t.nome && t.nome.toLowerCase().includes(query));
                if (!match) return false;
            }
            return true;
        });

        // Calculate stats from filtered data
        searched.forEach(t => {
            if (t.type === 'receive') {
                if (t.status === 'pending') s.openRev += t.amount;
                else s.realizedRev += t.amount;
            } else {
                if (t.status === 'pending') s.openExp += t.amount;
                else s.realizedExp += t.amount;
            }
        });
        s.totalPeriod = (s.openRev + s.realizedRev) + (s.openExp + s.realizedExp);
        return s;
    }, [data, selectedCompany, selectedCostCenters, startDate, endDate, viewMode, cashSubView, selectedCategories, search, clientMetadata, selectedClientCategory]);

    // Pagination calculations
    const totalPages = Math.ceil(statementTableData.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return statementTableData.slice(startIndex, endIndex);
    }, [statementTableData, currentPage, ITEMS_PER_PAGE]);

    const exportToCSV = () => {
        if (statementTableData.length === 0) {
            alert('Nenhum dado para exportar');
            return;
        }

        const headers = [
            'Data Vencimento',
            'Data Efetivação',
            'Fornecedor',
            'Categoria',
            'Descrição',
            'Centro de Custo',
            'Empresa',
            'Tipo',
            'Status',
            'Valor',
            'Saldo Acumulado',
            'Arquivo Original'
        ];

        const rows = statementTableData.map(t => [
            format(t.dueDate, 'dd/MM/yyyy'),
            t.paymentDate ? format(t.paymentDate, 'dd/MM/yyyy') : '',
            t.nome || '',
            t.category,
            t.description,
            t.costCenter,
            t.company,
            t.type === 'receive' ? 'Receita' : 'Despesa',
            t.status === 'completed' ? 'Realizado' : 'Em Aberto',
            t.amount.toFixed(2).replace('.', ','),
            t.accumulatedBalance.toFixed(2).replace('.', ','),
            t.originalFile || ''
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
        ].join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `extrato_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Daily Cash Flow Chart Data
    const dailyCashFlowData = useMemo(() => {
        if (statementTableData.length === 0) return [];

        // Get all days in the interval
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        // Group transactions by day separating inflows and outflows
        const transactionsByDay = new Map<string, { inflows: number; outflows: number; balance: number }>();

        // Use the already calculated table to get correct balances
        statementTableData.forEach(t => {
            const effectiveDate = getEffectiveDate(t);
            const dayKey = format(effectiveDate, 'yyyy-MM-dd');
            const current = transactionsByDay.get(dayKey) || { inflows: 0, outflows: 0, balance: t.accumulatedBalance };

            if (t.amount > 0) {
                current.inflows += t.amount;
            } else {
                current.outflows += Math.abs(t.amount);
            }

            current.balance = t.accumulatedBalance;
            transactionsByDay.set(dayKey, current);
        });

        // Get initial balance from the first item in the table adjusted
        const firstTransaction = [...statementTableData].sort((a, b) => {
            const dateA = getEffectiveDate(a);
            const dateB = getEffectiveDate(b);
            return compareAsc(dateA, dateB);
        })[0];

        let initialBalance = firstTransaction
            ? firstTransaction.accumulatedBalance - firstTransaction.amount
            : 0;

        let runningBalance = initialBalance;

        return days.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayData = transactionsByDay.get(dayKey);

            if (dayData) {
                runningBalance = dayData.balance;
                return {
                    date: day,
                    dateLabel: format(day, 'dd/MM'),
                    balance: dayData.balance,
                    inflows: dayData.inflows,
                    outflows: dayData.outflows
                };
            } else {
                return {
                    date: day,
                    dateLabel: format(day, 'dd/MM'),
                    balance: runningBalance,
                    inflows: 0,
                    outflows: 0
                };
            }
        });
    }, [statementTableData, startDate, endDate]);

    // Category Data for Pie Chart
    const categoryData = useMemo(() => {
        const categoryMap = new Map<string, { total: number; transactions: Transaction[] }>();

        statementTableData.forEach(t => {
            const existing = categoryMap.get(t.category) || { total: 0, transactions: [] };
            existing.total += t.amount;
            existing.transactions.push(t);
            categoryMap.set(t.category, existing);
        });

        return Array.from(categoryMap.entries())
            .map(([name, data]) => ({
                name,
                total: data.total,
                transactions: data.transactions
            }))
            .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    }, [statementTableData]);

    const topCategoryData = useMemo(() => {
        return categoryData.slice(0, 5).map(cat => ({
            name: cat.name,
            value: cat.total,
            absValue: Math.abs(cat.total)
        }));
    }, [categoryData]);

    const handleToggleCategory = (category: string) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const FilterCard = ({
        title,
        value,
        colorClass,
        activeColorClass,
        filterType
    }: {
        title: string,
        value: number,
        colorClass: string,
        activeColorClass: string,
        filterType: QuickFilterType
    }) => {
        const isActive = quickFilter === filterType;

        return (
            <div
                onClick={() => setQuickFilter(isActive ? 'all' : filterType)}
                className={`
                    cursor-pointer p-4 sm:p-5 lg:p-6 rounded-2xl lg:rounded-[2rem] border transition-all duration-300 flex flex-col justify-center hover:scale-[1.02] relative overflow-hidden
                    ${isActive
                        ? `bg-white border-2 shadow-lg ${activeColorClass.replace('text-', 'border-')}`
                        : 'bg-white border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-md'
                    }
                `}
            >
                {isActive && (
                    <div className={`absolute top-0 right-0 p-2 sm:p-3`}>
                        <div className={`w-2 h-2 rounded-full ${activeColorClass.replace('text-', 'bg-')}`} />
                    </div>
                )}
                <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mb-1.5 sm:mb-2 ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>{title}</p>
                <p className={`text-lg sm:text-xl font-bold ${colorClass}`}>{formatCurrency(value)}</p>
            </div>
        );
    };

    return (
        <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 animate-fade-in pb-20">
            {/* Summary Cards acting as Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                 <FilterCard 
                    title="Receitas em Aberto" 
                    value={stats.openRev} 
                    colorClass="text-blue-600" 
                    activeColorClass="text-blue-600"
                    filterType="open_rev"
                 />
                 <FilterCard 
                    title="Receitas Realizadas" 
                    value={stats.realizedRev} 
                    colorClass="text-emerald-600" 
                    activeColorClass="text-emerald-600"
                    filterType="realized_rev"
                 />
                 <FilterCard 
                    title="Despesas em Aberto" 
                    value={stats.openExp} 
                    colorClass="text-amber-500" 
                    activeColorClass="text-amber-500"
                    filterType="open_exp"
                 />
                 <FilterCard 
                    title="Despesas Realizadas" 
                    value={stats.realizedExp} 
                    colorClass="text-rose-600" 
                    activeColorClass="text-rose-600"
                    filterType="realized_exp"
                 />
                 <div
                    onClick={() => setQuickFilter('all')}
                    className={`
                        cursor-pointer bg-slate-100 p-4 sm:p-5 lg:p-6 rounded-2xl lg:rounded-[2rem] border transition-all duration-300 flex flex-col justify-center
                        ${quickFilter === 'all' ? 'border-slate-400 shadow-inner ring-1 ring-slate-300' : 'border-slate-200 shadow-inner hover:bg-slate-200'}
                    `}
                 >
                     <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 sm:mb-2">Total do Período</p>
                     <p className={`text-lg sm:text-xl font-bold ${stats.totalPeriod >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(stats.totalPeriod)}</p>
                 </div>
            </div>
  
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="relative w-full sm:w-auto">
                    <button
                        onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                        className="flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold text-slate-600 shadow-sm w-full sm:w-56 justify-between"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{selectedCategories.length > 0 ? `${selectedCategories.length} Categorias` : 'Todas Categorias'}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>
                    {isCatDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-20 max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar categorias..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 font-medium"
                                />
                            </div>
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => setSelectedCategories([])} className="flex-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg transition-colors">Limpar</button>
                            </div>
                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map(cat => (
                                        <div key={cat} onClick={() => toggleCategory(cat)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs text-slate-700 transition-colors">
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${selectedCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                {selectedCategories.includes(cat) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="truncate">{cat}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                                        Nenhuma categoria encontrada
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative flex-1 sm:max-w-md">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm font-bold shadow-sm whitespace-nowrap"
                        title="Exportar para CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                        <span className="sm:hidden">CSV</span>
                    </button>

                    <button
                        onClick={() => setViewType('chart')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all text-sm font-bold shadow-sm whitespace-nowrap ${
                            viewType === 'chart'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Visualizar Gráfico de Caixa"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden lg:inline">Gráfico Caixa</span>
                        <span className="hidden sm:inline lg:hidden">Caixa</span>
                    </button>

                    <button
                        onClick={() => setViewType('categories')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all text-sm font-bold shadow-sm whitespace-nowrap ${
                            viewType === 'categories'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Visualizar Gráfico de Categorias"
                    >
                        <PieChartIcon className="w-4 h-4" />
                        <span className="hidden lg:inline">Gráfico Categorias</span>
                        <span className="hidden sm:inline lg:hidden">Categorias</span>
                    </button>
                </div>
            </div>
  
            {/* Chart View - Fluxo de Caixa */}
            {viewType === 'chart' && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-indigo-200 mb-6 sm:mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Fluxo de Caixa - Extrato</h3>
                                <p className="text-indigo-100 max-w-lg leading-relaxed text-xs sm:text-sm opacity-90">Visualização dia a dia do saldo baseado nos lançamentos filtrados do extrato.</p>
                            </div>
                            <button
                                onClick={() => setViewType('table')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-semibold backdrop-blur-sm border border-white/20 whitespace-nowrap"
                            >
                                <TableProperties className="w-4 h-4" />
                                Ver Tabela
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-indigo-100/20 shadow-lg">
                            <ResponsiveContainer width="100%" height={360}>
                                <ComposedChart data={dailyCashFlowData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis
                                        dataKey="dateLabel"
                                        stroke="#64748b"
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                        axisLine={{ stroke: '#cbd5e1' }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                        axisLine={{ stroke: '#cbd5e1' }}
                                        tickFormatter={(value) => `${value >= 1000000 ? `R$${(value / 1000000).toFixed(1)}M` : `R$${(value / 1000).toFixed(0)}K`}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            padding: '12px'
                                        }}
                                        labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}
                                        formatter={(value, name) => {
                                            const labels: Record<string, string> = {
                                                'inflows': 'Entradas',
                                                'outflows': 'Saídas',
                                                'balance': 'Saldo'
                                            };
                                            const key = String(name ?? '');
                                            return [formatCurrency(Number(value ?? 0)), labels[key] || key];
                                        }}
                                        labelFormatter={(label) => `Data: ${label}`}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        height={40}
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontWeight: 600 }}
                                        formatter={(value) => {
                                            const labels: Record<string, string> = {
                                                'inflows': 'Entradas',
                                                'outflows': 'Saídas',
                                                'balance': 'Saldo'
                                            };
                                            return labels[value] || value;
                                        }}
                                    />
                                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1.5} />
                                    <Bar
                                        dataKey="inflows"
                                        fill="#10b981"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40}
                                    />
                                    <Bar
                                        dataKey="outflows"
                                        fill="#ef4444"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                            <div>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">Saldo Inicial</p>
                                <p className="text-xl sm:text-2xl font-bold">
                                    {dailyCashFlowData.length > 0 ? formatCurrency(dailyCashFlowData[0].balance) : 'R$ 0,00'}
                                </p>
                            </div>
                            <div className="sm:text-right">
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">Saldo Final</p>
                                <p className="text-xl sm:text-2xl font-bold">
                                    {statementTableData.length > 0 ? formatCurrency(statementTableData[statementTableData.length - 1].accumulatedBalance) : 'R$ 0,00'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart View - Categorias */}
            {viewType === 'categories' && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-indigo-200 mb-6 sm:mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Análise por Categorias</h3>
                                <p className="text-indigo-100 max-w-lg leading-relaxed text-xs sm:text-sm opacity-90">Distribuição de lançamentos por categoria nos dados filtrados do extrato.</p>
                            </div>
                            <button
                                onClick={() => setViewType('table')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-semibold backdrop-blur-sm border border-white/20 whitespace-nowrap"
                            >
                                <TableProperties className="w-4 h-4" />
                                Ver Tabela
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border border-indigo-100/20 shadow-lg">
                            {topCategoryData.length > 0 ? (
                                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                                    <div className="w-full lg:w-1/3">
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={topCategoryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={65}
                                                        outerRadius={85}
                                                        paddingAngle={5}
                                                        dataKey="absValue"
                                                        stroke="none"
                                                    >
                                                        {topCategoryData.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'][index % 5]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value, name, props: any) => formatCurrency(Number(props?.payload?.value ?? value ?? 0))}
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                                            backgroundColor: '#ffffff'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-2/3 space-y-3 sm:space-y-4">
                                        {topCategoryData.map((item: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between group cursor-default p-3 sm:p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm ring-2 ring-white flex-shrink-0" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'][index % 5] }}></div>
                                                    <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors truncate" title={item.name}>{item.name}</span>
                                                </div>
                                                <span className={`text-xs sm:text-sm font-bold ml-2 whitespace-nowrap ${item.value >= 0 ? 'text-black' : 'text-red-600'}`}>{formatCurrency(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    Nenhuma transação encontrada
                                </div>
                            )}
                            {topCategoryData.length > 0 && (
                                <div className="mt-6 flex justify-start">
                                    <button
                                        onClick={() => setIsCategoryDetailsModalOpen(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
                                    >
                                        <List className="w-4 h-4" />
                                        Ver Mais
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table Container */}
            {viewType === 'table' && (
                <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">

                 {/* Table Header Section */}
                 <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm flex-shrink-0">
                            <TableProperties className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Extrato Consolidado</h3>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
                                <span className="whitespace-nowrap">{statementTableData.length} registros</span>
                                {quickFilter !== 'all' && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                                        <span className="text-indigo-600 font-bold flex items-center gap-1">
                                            <span className="hidden sm:inline">Filtro Ativo: </span>
                                            <span className="truncate">{
                                                quickFilter === 'open_rev' ? 'Receitas em Aberto' :
                                                quickFilter === 'realized_rev' ? 'Receitas Realizadas' :
                                                quickFilter === 'open_exp' ? 'Despesas em Aberto' :
                                                'Despesas Realizadas'
                                            }</span>
                                            <button onClick={() => setQuickFilter('all')} className="ml-1 hover:text-indigo-800 flex-shrink-0"><XCircle className="w-3.5 h-3.5" /></button>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[800px]">
                         <thead className="bg-slate-50/50 border-b border-slate-100">
                             <tr>
                                 <th className="px-2 sm:px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vencimento</th>
                                 <th className="hidden lg:table-cell px-2 sm:px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Efetivação</th>
                                 <th className="hidden xl:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fornecedor</th>
                                 <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                                 <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                                 <th className="hidden xl:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">C. Custo</th>
                                 <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empresa</th>
                                 <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                                 <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Saldo</th>
                                 <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                             {paginatedData.map(t => (
                                 <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                     <td className="px-2 sm:px-3 py-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                                         {format(t.dueDate, 'dd/MM/yyyy')}
                                     </td>
                                     <td className="hidden lg:table-cell px-2 sm:px-3 py-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                                         {t.paymentDate ? (
                                             <span className="font-bold text-slate-700">{format(t.paymentDate, 'dd/MM/yyyy')}</span>
                                         ) : (
                                             <span className="text-slate-300">-</span>
                                         )}
                                     </td>
                                     <td className="hidden xl:table-cell px-2 sm:px-4 py-2">
                                         <span className="text-xs font-medium text-slate-700 truncate max-w-[150px] block" title={t.nome || '-'}>
                                             {t.nome || '-'}
                                         </span>
                                     </td>
                                     <td className="hidden md:table-cell px-2 sm:px-4 py-2">
                                         <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[120px] lg:max-w-[180px]" title={t.category}>
                                             {t.category.split('. ')[1] || t.category}
                                         </span>
                                     </td>
                                     <td className="px-2 sm:px-4 py-2">
                                         <p className="text-xs font-semibold text-slate-800 uppercase tracking-tight truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[300px]" title={t.description}>{t.description}</p>
                                     </td>
                                     <td className="hidden xl:table-cell px-2 sm:px-4 py-2">
                                         <span className="inline-flex px-2 py-0.5 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px] shadow-sm" title={t.costCenter}>
                                             {t.costCenter}
                                         </span>
                                     </td>
                                     <td className="hidden lg:table-cell px-2 sm:px-4 py-2">
                                         <span className={`text-[10px] font-bold uppercase tracking-wide ${getCompanyTextClass(t.company)}`}>
                                             {getCompanyShortName(t.company)}
                                         </span>
                                     </td>
                                     <td className={`px-2 sm:px-4 py-2 text-right text-xs font-bold whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                         {formatCurrency(t.amount)}
                                     </td>
                                     <td className="hidden md:table-cell px-2 sm:px-4 py-2 text-right text-xs font-bold text-slate-400 whitespace-nowrap">
                                         {formatCurrency(t.accumulatedBalance)}
                                     </td>
                                     <td className="px-2 sm:px-4 py-2 text-right">
                                         <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide shadow-sm ${
                                             t.status === 'completed'
                                             ? 'bg-emerald-100 text-emerald-700'
                                             : 'bg-amber-100 text-amber-700'
                                         }`}>
                                             <span className="hidden sm:inline">{t.status === 'completed' ? 'Realizado' : 'Aberto'}</span>
                                             <span className="sm:hidden">{t.status === 'completed' ? 'OK' : 'Ab'}</span>
                                         </span>
                                     </td>
                                 </tr>
                             ))}
                             {statementTableData.length === 0 && (
                                 <tr>
                                     <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">
                                         Nenhuma transação encontrada para este período.
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>

                 {/* Pagination Controls */}
                 {totalPages > 1 && (
                     <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="text-xs sm:text-sm text-slate-600 font-medium">
                             Página <span className="font-bold text-slate-800">{currentPage}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
                             <span className="text-slate-400 ml-2">
                                 ({((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, statementTableData.length)} de {statementTableData.length} registros)
                             </span>
                         </div>
                         <div className="flex items-center gap-2">
                             <button
                                 onClick={() => setCurrentPage(1)}
                                 disabled={currentPage === 1}
                                 className="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                             >
                                 Primeira
                             </button>
                             <button
                                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                 disabled={currentPage === 1}
                                 className="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                             >
                                 Anterior
                             </button>

                             {/* Page Numbers */}
                             <div className="hidden sm:flex items-center gap-1">
                                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                     let pageNum;
                                     if (totalPages <= 5) {
                                         pageNum = i + 1;
                                     } else if (currentPage <= 3) {
                                         pageNum = i + 1;
                                     } else if (currentPage >= totalPages - 2) {
                                         pageNum = totalPages - 4 + i;
                                     } else {
                                         pageNum = currentPage - 2 + i;
                                     }

                                     return (
                                         <button
                                             key={pageNum}
                                             onClick={() => setCurrentPage(pageNum)}
                                             className={`w-9 h-9 text-xs font-bold rounded-lg transition-all ${
                                                 currentPage === pageNum
                                                     ? 'bg-indigo-600 text-white shadow-md'
                                                     : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                             }`}
                                         >
                                             {pageNum}
                                         </button>
                                     );
                                 })}
                             </div>

                             <button
                                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                 disabled={currentPage === totalPages}
                                 className="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                             >
                                 Próxima
                             </button>
                             <button
                                 onClick={() => setCurrentPage(totalPages)}
                                 disabled={currentPage === totalPages}
                                 className="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                             >
                                 Última
                             </button>
                         </div>
                     </div>
                 )}
                </div>
            )}

            <CategoryDetailsModal
                isOpen={isCategoryDetailsModalOpen}
                onClose={() => {
                    setIsCategoryDetailsModalOpen(false);
                    setExpandedCategory(null);
                }}
                categoryData={categoryData}
                expandedCategory={expandedCategory}
                onToggleCategory={handleToggleCategory}
            />
        </div>
    );
};

export default StatementTab;
