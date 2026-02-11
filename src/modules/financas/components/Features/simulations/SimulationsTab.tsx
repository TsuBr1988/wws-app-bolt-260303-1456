
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, TrendingUp, BarChart3, PieChart as PieChartIcon, List, ChevronUp, ChevronDown, X, Plus, Trash2, Calendar, Tag } from 'lucide-react';
import { format, isBefore, compareDesc, compareAsc, eachDayOfInterval, startOfDay as startOfDayFns } from 'date-fns';
import { BalancesByCompany, Transaction, Company, ClientMetadata, CoaViewMode, CashSubView, ClientCategoryFilter } from '../../../types';
import { formatCurrency, getCompanyShortName, getCompanyTextClass, getEffectiveDate, startOfDay, sumBalances } from '../../../utils';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, PieChart, Pie, Cell } from 'recharts';

interface SimulationsTabProps {
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
    ignoredTransactionIds: Set<string>;
    onToggleIgnore: (id: string) => void;
    onBulkIgnore: (ids: string[], shouldIgnore: boolean) => void;
    simulationDates: Map<string, Date>;
    onSetSimulationDate: (id: string, date: Date | null) => void;
    onAddSimulation: (date: Date, description: string, amount: number) => void;
    onRemoveSimulation: (id: string) => void;
}

const AddSimulationModal = ({
    isOpen,
    onClose,
    onAdd
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (date: Date, description: string, amount: number) => void;
}) => {
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!date || !description || !amount) {
            setError('Todos os campos são obrigatórios');
            return;
        }

        const dateParts = date.split('/');
        if (dateParts.length !== 3) {
            setError('Data inválida. Use o formato DD/MM/AAAA');
            return;
        }

        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
            setError('Data inválida. Use o formato DD/MM/AAAA');
            return;
        }

        const selectedDate = new Date(year, month - 1, day);
        const today = startOfDayFns(new Date());

        if (selectedDate < today) {
            setError('Não é permitido inserir lançamentos com data passada');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            setError('Valor inválido');
            return;
        }

        onAdd(selectedDate, description, numAmount);
        setDate('');
        setDescription('');
        setAmount('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setDate('');
        setDescription('');
        setAmount('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity" onClick={handleClose} />
            <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Inserir Simulação</h3>
                            <p className="text-sm text-slate-500 font-medium">Adicionar lançamento simulado</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                        <input
                            type="text"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="DD/MM/AAAA"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Entrada de receita extra"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Valor</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ex: 5000 (positivo=entrada, negativo=saída)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            step="0.01"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">Use valores positivos para entradas e negativos para saídas</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                    <button onClick={handleClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">
                        Adicionar
                    </button>
                </div>
            </div>
        </div>
    );
};

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
                            <p className="text-sm text-slate-500 font-medium">Análise completa da simulação</p>
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

const BulkDateChangeModal = ({
    isOpen,
    onClose,
    onApply,
    count
}: {
    isOpen: boolean;
    onClose: () => void;
    onApply: (date: Date | null) => void;
    count: number;
}) => {
    const [date, setDate] = useState('');
    const [error, setError] = useState('');

    const handleApply = () => {
        if (!date) {
            setError('Selecione uma data');
            return;
        }

        const dateParts = date.split('/');
        if (dateParts.length !== 3) {
            setError('Data inválida. Use o formato DD/MM/AAAA');
            return;
        }

        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
            setError('Data inválida. Use o formato DD/MM/AAAA');
            return;
        }

        const selectedDate = new Date(year, month - 1, day);
        const today = startOfDayFns(new Date());

        if (selectedDate < today) {
            setError('Não é permitido inserir datas passadas');
            return;
        }

        onApply(selectedDate);
        setDate('');
        setError('');
        onClose();
    };

    const handleClear = () => {
        onApply(null);
        setDate('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setDate('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity" onClick={handleClose} />
            <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Alterar Data em Lote</h3>
                            <p className="text-sm text-slate-500 font-medium">{count} transação{count !== 1 ? 'ões' : ''} selecionada{count !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nova Data de Simulação</label>
                        <input
                            type="text"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="DD/MM/AAAA"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">Esta data será aplicada a todas as transações filtradas e selecionadas</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                    <button onClick={handleClear} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                        Limpar Datas
                    </button>
                    <button onClick={handleClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                        Cancelar
                    </button>
                    <button onClick={handleApply} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-amber-700 transition-all">
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
};

type StatusFilter = 'all' | 'receitas-aberto' | 'receitas-realizadas' | 'despesas-aberto' | 'despesas-realizadas';

const SimulationsTab: React.FC<SimulationsTabProps> = ({
    data,
    startDate,
    endDate,
    viewMode,
    cashSubView,
    selectedCompany,
    selectedCostCenters,
    clientMetadata,
    selectedClientCategory,
    initialBalances,
    ignoredTransactionIds,
    onToggleIgnore,
    onBulkIgnore,
    simulationDates,
    onSetSimulationDate,
    onAddSimulation,
    onRemoveSimulation
}) => {
    const [search, setSearch] = useState('');
    const [viewType, setViewType] = useState<'balance' | 'chart' | 'categories'>('balance');
    const [isCategoryDetailsModalOpen, setIsCategoryDetailsModalOpen] = useState(false);
    const [isAddSimulationModalOpen, setIsAddSimulationModalOpen] = useState(false);
    const [isBulkDateChangeModalOpen, setIsBulkDateChangeModalOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategories, statusFilter, startDate, endDate, selectedCompany, selectedCostCenters, selectedClientCategory, viewMode, cashSubView]);

    const getSimulationEffectiveDate = (t: Transaction): Date => {
        const simDate = simulationDates.get(t.id);
        if (simDate) return simDate;
        return getEffectiveDate(t);
    };

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

    const summaryData = useMemo(() => {
        const allTransactions = data.filter(t => {
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!companyMatch || !ccMatch) return false;

            if (selectedClientCategory !== 'all') {
                const meta = clientMetadata[t.costCenter];
                const category = meta ? meta.category : 'administrative';
                if (category !== selectedClientCategory) return false;
            }

            if (viewMode === 'cash') {
                const inRange = (d?: Date) => d && d >= startDate && d <= endDate;
                const isRealizedInRange = t.status === 'completed' && inRange(t.paymentDate);
                const isProjectedInRange = t.status === 'pending' && inRange(t.dueDate);
                return isRealizedInRange || isProjectedInRange;
            } else {
                const d = t.competencyDate || t.dueDate;
                return d >= startDate && d <= endDate;
            }
        });

        const notIgnored = allTransactions.filter(t => !ignoredTransactionIds.has(t.id));

        const receitasAberto = notIgnored.filter(t => t.status === 'pending' && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const receitasRealizadas = notIgnored.filter(t => t.status === 'completed' && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const despesasAberto = notIgnored.filter(t => t.status === 'pending' && t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
        const despesasRealizadas = notIgnored.filter(t => t.status === 'completed' && t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
        const totalPeriodo = receitasAberto + receitasRealizadas + despesasAberto + despesasRealizadas;

        return {
            receitasAberto,
            receitasRealizadas,
            despesasAberto,
            despesasRealizadas,
            totalPeriodo
        };
    }, [data, selectedCompany, selectedCostCenters, startDate, endDate, viewMode, ignoredTransactionIds, clientMetadata, selectedClientCategory]);

    const simTableData = useMemo(() => {
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
  
        const sortedAll = [...allRelevant].sort((a, b) => {
             const dateA = getSimulationEffectiveDate(a);
             const dateB = getSimulationEffectiveDate(b);
             const dateComparison = compareAsc(dateA, dateB);
             if (dateComparison !== 0) return dateComparison;
             return a.id.localeCompare(b.id);
        });
  
                let currentBalance = (selectedCompany === 'all') 
                    ? sumBalances(initialBalances)
                    : (initialBalances[selectedCompany as Company] ?? 0);
  
        const realizedBeforeToday = sortedAll.reduce((acc, t) => {
            if (ignoredTransactionIds.has(t.id)) return acc;

            const effectiveDate = getSimulationEffectiveDate(t);
            if (t.status === 'completed' && isBefore(effectiveDate, today)) {
               return acc + t.amount;
            }
            return acc;
        }, 0);
  
        currentBalance = currentBalance - realizedBeforeToday;
  
        const balanceMap = new Map<string, number>();
        
        sortedAll.forEach(t => {
            if (ignoredTransactionIds.has(t.id)) {
                 balanceMap.set(t.id, currentBalance);
                 return;
            }

            const effectiveDate = getSimulationEffectiveDate(t);
            const isPast = isBefore(effectiveDate, today);

            let affectsBalance = false;

            if (t.status === 'completed') {
                affectsBalance = true;
            } else if (t.status === 'pending') {
                if (!isPast) affectsBalance = true;
            }

            if (affectsBalance) {
                currentBalance += t.amount;
            }

            balanceMap.set(t.id, currentBalance);
        });
  
        const viewFiltered = sortedAll.filter(t => {
             if (viewMode === 'cash') {
                const inRange = (d?: Date) => d && d >= startDate && d <= endDate;
                const isRealizedInRange = t.status === 'completed' && inRange(t.paymentDate);
                const isProjectedInRange = t.status === 'pending' && inRange(t.dueDate);
                if (cashSubView === 'realized' && !isRealizedInRange) return false;
                if (cashSubView === 'projected' && !isProjectedInRange) return false;
                return isRealizedInRange || isProjectedInRange;
            } else {
                const d = t.competencyDate || t.dueDate;
                const inRange = d >= startDate && d <= endDate;
                if (cashSubView === 'realized' && t.status !== 'completed') return false;
                if (cashSubView === 'projected' && t.status !== 'pending') return false;
                return inRange;
            }
        });
  
        const statusFiltered = viewFiltered.filter(t => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'receitas-aberto') return t.status === 'pending' && t.amount > 0;
            if (statusFilter === 'receitas-realizadas') return t.status === 'completed' && t.amount > 0;
            if (statusFilter === 'despesas-aberto') return t.status === 'pending' && t.amount < 0;
            if (statusFilter === 'despesas-realizadas') return t.status === 'completed' && t.amount < 0;
            return true;
        });

        const categoryFiltered = statusFiltered.filter(t => {
            if (selectedCategories.length === 0) return true;
            return selectedCategories.includes(t.category);
        });

        const searched = categoryFiltered.filter(t => {
            if (search.trim() !== '') {
                const query = search.toLowerCase();
                const match = t.description.toLowerCase().includes(query) || t.category.toLowerCase().includes(query) || t.costCenter.toLowerCase().includes(query) || t.amount.toString().includes(query) || (t.nome && t.nome.toLowerCase().includes(query));
                if (!match) return false;
            }
            return true;
        });
  
        return searched.map(t => ({
            ...t,
            accumulatedBalance: balanceMap.get(t.id) || 0
        })).sort((a, b) => {
             const dateA = getSimulationEffectiveDate(a);
             const dateB = getSimulationEffectiveDate(b);
             const dateComparison = compareAsc(dateA, dateB);
             if (dateComparison !== 0) return dateComparison;
             return a.id.localeCompare(b.id);
        });

    }, [data, selectedCompany, selectedCostCenters, startDate, endDate, viewMode, cashSubView, search, initialBalances, ignoredTransactionIds, clientMetadata, selectedClientCategory, simulationDates, statusFilter, selectedCategories]);

    // Pagination calculations
    const totalPages = Math.ceil(simTableData.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return simTableData.slice(startIndex, endIndex);
    }, [simTableData, currentPage, ITEMS_PER_PAGE]);

    // Daily Cash Flow Chart Data
    const dailyCashFlowData = useMemo(() => {
        if (simTableData.length === 0) return [];

        // Obter todos os dias no intervalo
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        // Agrupar transações por dia separando entradas e saídas
        const transactionsByDay = new Map<string, { inflows: number; outflows: number; balance: number }>();

        // Usar a tabela já calculada para obter os saldos corretos
        simTableData.forEach(t => {
            const effectiveDate = getSimulationEffectiveDate(t);
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

        // Pegar o saldo inicial do primeiro item da tabela ajustado
        const firstTransaction = [...simTableData].sort((a, b) => {
            const dateA = getSimulationEffectiveDate(a);
            const dateB = getSimulationEffectiveDate(b);
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
    }, [simTableData, startDate, endDate]);

    const categoryData = useMemo(() => {
        const includedTransactions = simTableData.filter(t => !ignoredTransactionIds.has(t.id));

        const categoryMap = new Map<string, { total: number; transactions: Transaction[] }>();

        includedTransactions.forEach(t => {
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
    }, [simTableData, ignoredTransactionIds]);

    const topCategoryData = useMemo(() => {
        return categoryData.slice(0, 5).map(cat => ({
            name: cat.name,
            value: cat.total,
            absValue: Math.abs(cat.total) // For pie chart visualization
        }));
    }, [categoryData]);

    // Checkbox Header Logic
    const visibleIds = useMemo(() => simTableData.map(t => t.id), [simTableData]);
    const allVisibleIncluded = visibleIds.length > 0 && visibleIds.every(id => !ignoredTransactionIds.has(id));
    const allVisibleIgnored = visibleIds.length > 0 && visibleIds.every(id => ignoredTransactionIds.has(id));
    
    // Header checkbox state
    // If all included -> checked
    // If all ignored -> unchecked
    // If mixed -> unchecked (standard behavior is usually "indeterminate", but simple toggle works too)
    const isHeaderChecked = allVisibleIncluded;

    const handleHeaderClick = () => {
        if (visibleIds.length === 0) return;

        if (allVisibleIncluded) {
            onBulkIgnore(visibleIds, true);
        } else {
            onBulkIgnore(visibleIds, false);
        }
    };

    const handleToggleCategory = (category: string) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const handleBulkDateChange = (date: Date | null) => {
        const selectedIds = visibleIds.filter(id => !ignoredTransactionIds.has(id) && !id.startsWith('sim-'));
        selectedIds.forEach(id => {
            onSetSimulationDate(id, date);
        });
    };

    const handleBulkDateClear = () => {
        const selectedIds = visibleIds.filter(id => !ignoredTransactionIds.has(id) && !id.startsWith('sim-'));
        selectedIds.forEach(id => {
            onSetSimulationDate(id, null);
        });
    };

    const selectedCount = useMemo(() => {
        return visibleIds.filter(id => !ignoredTransactionIds.has(id) && !id.startsWith('sim-')).length;
    }, [visibleIds, ignoredTransactionIds]);

    return (
        <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 animate-fade-in pb-20">
            {viewType === 'balance' ? (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-indigo-200 mb-6 sm:mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Simulador de Fluxo de Caixa</h3>
                                <p className="text-indigo-100 max-w-lg leading-relaxed text-xs sm:text-sm opacity-90">Desmarque transações para simular o impacto no saldo futuro. As transações ignoradas não afetarão o cálculo do saldo nesta visualização.</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setViewType('chart')}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-xs sm:text-sm font-semibold backdrop-blur-sm border border-white/20 whitespace-nowrap"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Gráfico Caixa</span>
                                    <span className="sm:hidden">Caixa</span>
                                </button>
                                <button
                                    onClick={() => setViewType('categories')}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-xs sm:text-sm font-semibold backdrop-blur-sm border border-white/20 whitespace-nowrap"
                                >
                                    <PieChartIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Gráfico Categorias</span>
                                    <span className="sm:hidden">Categorias</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end items-end">
                            <div className="text-center sm:text-right">
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">Saldo Simulado Final</p>
                                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{simTableData.length > 0 ? formatCurrency(simTableData[simTableData.length - 1].accumulatedBalance) : 'R$ 0,00'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : viewType === 'chart' ? (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-indigo-200 mb-6 sm:mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Fluxo de Caixa Projetado</h3>
                                <p className="text-indigo-100 max-w-lg leading-relaxed text-xs sm:text-sm opacity-90">Visualização dia a dia do saldo projetado baseado no saldo real atual e nas transações futuras.</p>
                            </div>
                            <button
                                onClick={() => setViewType('balance')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-semibold backdrop-blur-sm border border-white/20 whitespace-nowrap"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Ver Saldo
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
                                        formatter={(value: number, name: string) => {
                                            const labels: Record<string, string> = {
                                                'inflows': 'Entradas',
                                                'outflows': 'Saídas',
                                                'balance': 'Saldo Projetado'
                                            };
                                            return [formatCurrency(value), labels[name] || name];
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
                                                'balance': 'Saldo Projetado'
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
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">Saldo Projetado Final</p>
                                <p className="text-xl sm:text-2xl font-bold">
                                    {simTableData.length > 0 ? formatCurrency(simTableData[simTableData.length - 1].accumulatedBalance) : 'R$ 0,00'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2rem] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-indigo-200 mb-6 sm:mb-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Análise por Categorias</h3>
                                <p className="text-indigo-100 max-w-lg leading-relaxed text-xs sm:text-sm opacity-90">Distribuição de lançamentos por categoria na simulação. As transações ignoradas não são consideradas.</p>
                            </div>
                            <button
                                onClick={() => setViewType('balance')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-semibold backdrop-blur-sm border border-white/20 whitespace-nowrap"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Ver Saldo
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
                                                        formatter={(value: number, name: string, props: any) => formatCurrency(props.payload.value)}
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

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                 <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-50 space-y-4">
                     <div className="flex flex-wrap items-center gap-2">
                         <button
                             onClick={() => setStatusFilter('receitas-aberto')}
                             className={`flex-1 min-w-[140px] max-w-[200px] px-3 py-2 rounded-xl border transition-all ${statusFilter === 'receitas-aberto' ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                         >
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Receitas em Aberto</p>
                             <p className="text-sm font-bold text-blue-600">{formatCurrency(summaryData.receitasAberto)}</p>
                         </button>

                         <button
                             onClick={() => setStatusFilter('receitas-realizadas')}
                             className={`flex-1 min-w-[140px] max-w-[200px] px-3 py-2 rounded-xl border transition-all ${statusFilter === 'receitas-realizadas' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                         >
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Receitas Realizadas</p>
                             <p className="text-sm font-bold text-emerald-600">{formatCurrency(summaryData.receitasRealizadas)}</p>
                         </button>

                         <button
                             onClick={() => setStatusFilter('despesas-aberto')}
                             className={`flex-1 min-w-[140px] max-w-[200px] px-3 py-2 rounded-xl border transition-all ${statusFilter === 'despesas-aberto' ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                         >
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Despesas em Aberto</p>
                             <p className="text-sm font-bold text-amber-600">{formatCurrency(summaryData.despesasAberto)}</p>
                         </button>

                         <button
                             onClick={() => setStatusFilter('despesas-realizadas')}
                             className={`flex-1 min-w-[140px] max-w-[200px] px-3 py-2 rounded-xl border transition-all ${statusFilter === 'despesas-realizadas' ? 'bg-red-50 border-red-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                         >
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Despesas Realizadas</p>
                             <p className="text-sm font-bold text-red-600">{formatCurrency(summaryData.despesasRealizadas)}</p>
                         </button>

                         <button
                             onClick={() => setStatusFilter('all')}
                             className={`flex-1 min-w-[140px] max-w-[200px] px-3 py-2 rounded-xl border transition-all ${statusFilter === 'all' ? 'bg-slate-50 border-slate-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                         >
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total do Período</p>
                             <p className={`text-sm font-bold ${summaryData.totalPeriodo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(summaryData.totalPeriodo)}</p>
                         </button>
                     </div>

                     <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 w-full">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                              <div className="relative flex-1 sm:flex-initial">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input
                                      type="text"
                                      placeholder="Buscar..."
                                      value={search}
                                      onChange={(e) => setSearch(e.target.value)}
                                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-64 lg:w-72 transition-all placeholder:text-slate-400"
                                  />
                              </div>
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
                                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                          {selectedCategories.includes(cat) && <Check className="w-3 h-3 text-white" />}
                                                      </div>
                                                      <span className="truncate flex-1" title={cat}>{cat}</span>
                                                  </div>
                                              ))
                                          ) : (
                                              <p className="text-center text-xs text-slate-400 py-4">Nenhuma categoria encontrada</p>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                          <button
                              onClick={() => setIsAddSimulationModalOpen(true)}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap"
                          >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Inserir Simulação</span>
                              <span className="sm:hidden">Nova Simulação</span>
                          </button>
                          <button
                              onClick={() => setIsBulkDateChangeModalOpen(true)}
                              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap ${selectedCount === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                              disabled={selectedCount === 0}
                          >
                              <Calendar className="w-4 h-4" />
                              <span className="hidden lg:inline">Alterar data em lote de filtrados</span>
                              <span className="hidden sm:inline lg:hidden">Data em lote</span>
                              <span className="sm:hidden">Lote</span>
                          </button>
                          <button
                              onClick={handleBulkDateClear}
                              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap ${selectedCount === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-600 hover:bg-slate-700 text-white'}`}
                              disabled={selectedCount === 0}
                          >
                              <X className="w-4 h-4" />
                              <span className="hidden lg:inline">Limpar data em lote dos filtrados</span>
                              <span className="hidden sm:inline lg:hidden">Limpar lote</span>
                              <span className="sm:hidden">Limpar</span>
                          </button>
                          </div>

                          {/* Pagination Controls - Top */}
                          {simTableData.length > ITEMS_PER_PAGE && (
                              <div className="hidden lg:flex items-center gap-2">
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
                                  <div className="flex items-center gap-1">
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
                          )}
                     </div>
                 </div>
  
                 <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[800px]">
                         <thead className="bg-slate-50/50 border-b border-slate-100">
                             <tr>
                                 <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12 sm:w-16 text-center">
                                     <button
                                          onClick={handleHeaderClick}
                                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isHeaderChecked ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-300'}`}
                                          title={isHeaderChecked ? "Desmarcar todos visíveis" : "Marcar todos visíveis"}
                                     >
                                         {isHeaderChecked && <Check className="w-3 h-3" />}
                                     </button>
                                 </th>
                                 <th className="px-2 sm:px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vencimento</th>
                                 <th className="hidden lg:table-cell px-2 sm:px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Efetivação</th>
                                 <th className="hidden xl:table-cell px-2 sm:px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulação</th>
                                 <th className="hidden 2xl:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fornecedor</th>
                                 <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                                 <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                                 <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Centro de Custo</th>
                                 <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                                 <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Saldo</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                             {paginatedData.map(t => {
                                 const isIgnored = ignoredTransactionIds.has(t.id);
                                 const hasSimulation = simulationDates.has(t.id);
                                 const isSimulated = t.id.startsWith('sim-');
                                 return (
                                     <tr key={t.id} className={`transition-colors group ${isIgnored ? 'opacity-50 bg-slate-50/50 grayscale' : hasSimulation ? 'bg-amber-100/70 hover:bg-amber-100' : isSimulated ? 'bg-emerald-100/70 hover:bg-emerald-100' : 'hover:bg-slate-50'}`}>
                                         <td className="px-2 sm:px-4 py-2 text-center">
                                             {isSimulated ? (
                                                 <button
                                                     onClick={() => onRemoveSimulation(t.id)}
                                                     className="w-5 h-5 rounded-md border border-red-300 bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all mx-auto"
                                                     title="Remover simulação"
                                                 >
                                                     <Trash2 className="w-3 h-3 text-red-600" />
                                                 </button>
                                             ) : (
                                                 <button
                                                      onClick={() => onToggleIgnore(t.id)}
                                                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mx-auto ${!isIgnored ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-300'}`}
                                                 >
                                                     {!isIgnored && <Check className="w-3 h-3" />}
                                                 </button>
                                             )}
                                         </td>
                                         <td className="px-2 sm:px-3 py-2 text-xs font-medium text-slate-500 whitespace-nowrap">
                                             {format(t.dueDate, 'dd/MM/yyyy')}
                                         </td>
                                         <td className="hidden lg:table-cell px-2 sm:px-3 py-2 text-xs font-medium text-slate-800 whitespace-nowrap">
                                            {t.paymentDate ? (
                                                <span className="font-bold text-slate-700">{format(t.paymentDate, 'dd/MM/yyyy')}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="hidden xl:table-cell px-2 sm:px-3 py-2 text-xs font-medium whitespace-nowrap">
                                            <input
                                                type="text"
                                                key={t.id}
                                                defaultValue={hasSimulation ? format(simulationDates.get(t.id)!, 'dd/MM/yyyy') : ''}
                                                onBlur={(e) => {
                                                    const value = e.target.value;

                                                    if (!value || value.trim() === '') {
                                                        onSetSimulationDate(t.id, null);
                                                        return;
                                                    }

                                                    // Parse DD/MM/YYYY format
                                                    const parts = value.split('/');
                                                    if (parts.length === 3) {
                                                        const day = parseInt(parts[0], 10);
                                                        const month = parseInt(parts[1], 10);
                                                        const year = parseInt(parts[2], 10);

                                                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                                            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
                                                                const date = new Date(year, month - 1, day);
                                                                if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                                                                    onSetSimulationDate(t.id, date);
                                                                    e.target.value = format(date, 'dd/MM/yyyy');
                                                                } else {
                                                                    // Invalid date, restore previous value
                                                                    e.target.value = hasSimulation ? format(simulationDates.get(t.id)!, 'dd/MM/yyyy') : '';
                                                                }
                                                            } else {
                                                                // Out of range, restore previous value
                                                                e.target.value = hasSimulation ? format(simulationDates.get(t.id)!, 'dd/MM/yyyy') : '';
                                                            }
                                                        } else {
                                                            // Invalid numbers, restore previous value
                                                            e.target.value = hasSimulation ? format(simulationDates.get(t.id)!, 'dd/MM/yyyy') : '';
                                                        }
                                                    } else {
                                                        // Invalid format, restore previous value
                                                        e.target.value = hasSimulation ? format(simulationDates.get(t.id)!, 'dd/MM/yyyy') : '';
                                                    }
                                                }}
                                                className={`w-full px-2 py-1 text-xs border rounded ${hasSimulation ? 'border-amber-400 bg-amber-50 font-bold text-amber-700' : 'border-slate-200 bg-white text-slate-500'} focus:outline-none focus:ring-2 focus:ring-amber-200`}
                                                placeholder="dd/mm/aaaa"
                                            />
                                        </td>
                                        <td className="hidden 2xl:table-cell px-2 sm:px-4 py-2">
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
                                             <p className={`text-xs font-semibold truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[300px] ${isIgnored ? 'text-slate-500 line-through' : 'text-slate-700'}`} title={t.description}>{t.description}</p>
                                         </td>
                                         <td className="hidden lg:table-cell px-2 sm:px-4 py-2">
                                             <span className="inline-flex px-2 py-0.5 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px] xl:max-w-[200px] shadow-sm" title={t.costCenter}>
                                                 {t.costCenter}
                                             </span>
                                         </td>
                                         <td className={`px-2 sm:px-4 py-2 text-right text-xs font-bold whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${isIgnored ? 'line-through' : ''}`}>
                                             {formatCurrency(t.amount)}
                                         </td>
                                         <td className="px-2 sm:px-4 py-2 text-right text-xs font-bold text-slate-500 whitespace-nowrap">
                                             {formatCurrency(t.accumulatedBalance)}
                                         </td>
                                     </tr>
                                 );
                             })}
                         </tbody>
                     </table>
                 </div>

                 {/* Pagination Controls */}
                 {totalPages > 1 && (
                     <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="text-xs sm:text-sm text-slate-600 font-medium">
                             Página <span className="font-bold text-slate-800">{currentPage}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
                             <span className="text-slate-400 ml-2">
                                 ({((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, simTableData.length)} de {simTableData.length} registros)
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

            <AddSimulationModal
                isOpen={isAddSimulationModalOpen}
                onClose={() => setIsAddSimulationModalOpen(false)}
                onAdd={onAddSimulation}
            />

            <BulkDateChangeModal
                isOpen={isBulkDateChangeModalOpen}
                onClose={() => setIsBulkDateChangeModalOpen(false)}
                onApply={handleBulkDateChange}
                count={selectedCount}
            />
        </div>
    );
};

export default SimulationsTab;
