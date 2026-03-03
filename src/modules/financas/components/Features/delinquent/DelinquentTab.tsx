
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Check, AlertCircle, TableProperties, Tag, ChevronDown, XCircle, PieChart, X, ChevronRight, Calendar, Clock } from 'lucide-react';
import { format, compareAsc, addDays } from 'date-fns';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction, Company, ClientMetadata, ClientCategoryFilter } from '../../../types';
import { formatCurrency, formatCurrencyNoSymbol, getCompanyShortName, getCompanyTextClass, getEffectiveDate } from '../../../utils';

interface DelinquentTabProps {
    data: Transaction[];
    selectedCompany: Company | 'all';
    selectedCostCenters: string[];
    clientMetadata: Record<string, ClientMetadata>;
    selectedClientCategory: ClientCategoryFilter;
}

const DelinquentTab: React.FC<DelinquentTabProps> = ({
    data,
    selectedCompany,
    selectedCostCenters,
    clientMetadata,
    selectedClientCategory
}) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showPieChart, setShowPieChart] = useState(false);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [showAllDelinquents, setShowAllDelinquents] = useState(false);
    const [viewType, setViewType] = useState<'overdue' | 'upcoming'>('overdue');
    const ITEMS_PER_PAGE = 100;

    // Allowed categories
    const allowedCategories = [
        '1.1.1',
        '1.2.1',
        'COFINS Retido sobre a Receita',
        'CSLL Retido sobre a Receita',
        'INSS Retido sobre a Receita',
        'IRPJ Retido sobre a Receita',
        'ISS Retido sobre a Receita'
    ];

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCompany, selectedCostCenters, selectedClientCategory, viewType]);

    const filteredData = useMemo(() => {
        // Calculate date ranges based on viewType
        let minDate: Date;
        let maxDate: Date;

        if (viewType === 'overdue') {
            // Vencidos: from oldest to today
            minDate = new Date(0); // Beginning of time
            maxDate = new Date();
            maxDate.setHours(23, 59, 59, 999); // End of today
        } else {
            // A vencer: tomorrow (D+1) to 20 days ahead (D+20)
            minDate = addDays(new Date(), 1);
            minDate.setHours(0, 0, 0, 0); // Start of tomorrow
            maxDate = addDays(new Date(), 20);
            maxDate.setHours(23, 59, 59, 999); // End of D+20
        }

        // Filter for open receivables only
        const openReceivables = data.filter(t => {
            // Must be receive type and pending status
            if (t.type !== 'receive' || t.status !== 'pending') return false;

            // Date filter: apply date range based on viewType
            const effectiveDate = getEffectiveDate(t);
            if (effectiveDate < minDate || effectiveDate > maxDate) return false;

            // Company filter
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            if (!companyMatch) return false;

            // Cost center filter
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!ccMatch) return false;

            // Client category filter
            if (selectedClientCategory !== 'all') {
                const meta = clientMetadata[t.costCenter];
                const category = meta ? meta.category : 'administrative';
                if (category !== selectedClientCategory) return false;
            }

            // Category filter - check if category matches any allowed category
            const categoryMatch = allowedCategories.some(allowed => {
                if (allowed.includes('.')) {
                    // For code-based categories like "1.1.1", check if the category starts with it
                    return t.category.startsWith(allowed);
                } else {
                    // For text-based categories, check if it includes the text
                    return t.category.toLowerCase().includes(allowed.toLowerCase());
                }
            });
            if (!categoryMatch) return false;

            // Search filter
            if (search.trim() !== '') {
                const query = search.toLowerCase();
                const match = t.description.toLowerCase().includes(query) ||
                             t.category.toLowerCase().includes(query) ||
                             t.costCenter.toLowerCase().includes(query) ||
                             t.amount.toString().includes(query) ||
                             (t.nome && t.nome.toLowerCase().includes(query));
                if (!match) return false;
            }

            return true;
        });

        // Sort by due date (oldest first)
        return openReceivables.sort((a, b) => {
            const dateA = getEffectiveDate(a);
            const dateB = getEffectiveDate(b);
            const dateComparison = compareAsc(dateA, dateB);
            if (dateComparison !== 0) return dateComparison;
            return a.id.localeCompare(b.id);
        });
    }, [data, selectedCompany, selectedCostCenters, selectedClientCategory, search, clientMetadata, viewType]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = filteredData.reduce((acc, t) => acc + t.amount, 0);
        const count = filteredData.length;

        // Calculate average days overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalDaysOverdue = 0;
        let overdueCount = 0;

        filteredData.forEach(t => {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate < today) {
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                totalDaysOverdue += daysOverdue;
                overdueCount++;
            }
        });

        const avgDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;

        // Group by category
        const byCategory: Record<string, number> = {};
        filteredData.forEach(t => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        });

        // Group by cost center for pie chart
        const byCostCenter: Record<string, number> = {};
        filteredData.forEach(t => {
            byCostCenter[t.costCenter] = (byCostCenter[t.costCenter] || 0) + t.amount;
        });

        // Count unique clients
        const uniqueClients = new Set(filteredData.map(t => t.costCenter)).size;

        return { total, count, byCategory, byCostCenter, avgDaysOverdue, uniqueClients };
    }, [filteredData]);

    // Prepare pie chart data
    const pieChartData = useMemo(() => {
        return Object.entries(stats.byCostCenter)
            .map(([costCenter, amount]) => ({
                name: costCenter,
                value: Math.abs(amount),
                originalValue: amount
            }))
            .sort((a, b) => b.value - a.value);
    }, [stats.byCostCenter]);

    // Top 5 delinquents
    const top5Delinquents = useMemo(() => {
        return pieChartData.slice(0, 5);
    }, [pieChartData]);

    // Transactions for selected client
    const selectedClientTransactions = useMemo(() => {
        if (!selectedClient) return [];
        return filteredData.filter(t => t.costCenter === selectedClient);
    }, [selectedClient, filteredData]);

    // Colors for pie chart
    const COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e'
    ];

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, ITEMS_PER_PAGE]);

    return (
        <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 animate-fade-in pb-20">
            {/* View Type Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setViewType('overdue')}
                    className={`flex-1 sm:flex-initial sm:min-w-[180px] px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        viewType === 'overdue'
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 border-2 border-rose-600'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                >
                    <AlertCircle className="w-4 h-4" />
                    Vencidos
                </button>
                <button
                    onClick={() => setViewType('upcoming')}
                    className={`flex-1 sm:flex-initial sm:min-w-[180px] px-6 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        viewType === 'upcoming'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 border-2 border-blue-600'
                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    A Vencer
                </button>
            </div>

            {/* Header Cards - Grid 3 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
                {/* Card 1: Resumo Geral */}
                <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl lg:rounded-[2rem] border border-rose-100 p-4 sm:p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200 flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-rose-900 mb-0.5">Resumo Geral</h2>
                            <p className="text-xs text-rose-700">
                                Métricas principais
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-white rounded-xl p-3 border border-rose-100">
                            <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">
                                {viewType === 'overdue' ? 'Total Inadimplente' : 'Total a Vencer'}
                            </p>
                            <p className={`text-xl font-bold ${stats.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(stats.total)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl p-3 border border-rose-100">
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">Lançamentos</p>
                                <p className="text-xl font-bold text-rose-900">{stats.count}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-rose-100">
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">Clientes</p>
                                <p className="text-xl font-bold text-rose-900">{stats.uniqueClients}</p>
                            </div>
                        </div>
                        {viewType === 'overdue' && (
                            <div className="bg-white rounded-xl p-3 border border-rose-100">
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">Atraso Médio</p>
                                <p className="text-xl font-bold text-rose-900">
                                    {stats.avgDaysOverdue} {stats.avgDaysOverdue === 1 ? 'dia' : 'dias'}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => setShowPieChart(true)}
                            className="w-full bg-rose-100 rounded-xl p-3 border border-rose-200 flex items-center justify-center gap-2 hover:bg-rose-200 transition-all group"
                        >
                            <PieChart className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Ver Gráfico</span>
                        </button>
                    </div>
                </div>

                {/* Card 2: Top 5 Inadimplentes */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl lg:rounded-[2rem] border border-amber-100 p-4 sm:p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 flex-shrink-0">
                            <Tag className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-amber-900 mb-0.5">
                                {viewType === 'overdue' ? 'Top 5 Inadimplentes' : 'Top 5 a Vencer'}
                            </h2>
                            <p className="text-xs text-amber-700">
                                Maiores valores em aberto
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {top5Delinquents.length > 0 ? (
                            <>
                                {top5Delinquents.map((client, index) => (
                                    <button
                                        key={client.name}
                                        onClick={() => setSelectedClient(client.name)}
                                        className="w-full bg-white rounded-xl p-2.5 border border-amber-100 flex items-center justify-between gap-2 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200 flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                                                <span className="text-xs font-bold text-amber-600">#{index + 1}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-800 truncate text-left">
                                                {client.name}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold flex-shrink-0 ${client.originalValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(client.originalValue)}
                                        </span>
                                    </button>
                                ))}
                                {pieChartData.length > 5 && (
                                    <button
                                        onClick={() => setShowAllDelinquents(true)}
                                        className="w-full bg-amber-100 rounded-xl p-2.5 border border-amber-200 flex items-center justify-center gap-2 hover:bg-amber-200 transition-all group"
                                    >
                                        <span className="text-xs font-bold text-amber-700">Ver Todos ({pieChartData.length})</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="bg-white rounded-xl p-6 border border-amber-100 text-center">
                                <p className="text-xs text-amber-600">
                                    {viewType === 'overdue' ? 'Nenhum inadimplente encontrado' : 'Nenhuma receita a vencer encontrada'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 3: Distribuição por Categoria */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl lg:rounded-[2rem] border border-blue-100 p-4 sm:p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200 flex-shrink-0">
                            <Filter className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-blue-900 mb-0.5">Por Categoria</h2>
                            <p className="text-xs text-blue-700">
                                Top 5 categorias
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(stats.byCategory)
                            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                            .slice(0, 5)
                            .map(([category, amount], index) => (
                                <div
                                    key={category}
                                    className="bg-white rounded-xl p-2.5 border border-blue-100 flex items-center justify-between gap-2"
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200 flex-shrink-0">
                                            <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 truncate" title={category}>
                                            {category.split('. ')[1] || category}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-bold flex-shrink-0 ${amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(amount)}
                                    </span>
                                </div>
                            ))}
                        {Object.keys(stats.byCategory).length === 0 && (
                            <div className="bg-white rounded-xl p-6 border border-blue-100 text-center">
                                <p className="text-xs text-blue-600">Nenhuma categoria encontrada</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 shadow-sm transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                {/* Table Header */}
                <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm flex-shrink-0">
                            <TableProperties className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                {viewType === 'overdue' ? 'Receitas Vencidas' : 'Receitas a Vencer'}
                            </h3>
                            <p className="text-xs font-medium text-slate-500">{filteredData.length} registros</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-2 sm:px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vencimento</th>
                                <th className="hidden xl:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fornecedor</th>
                                <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                                <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                                <th className="hidden xl:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">C. Custo</th>
                                <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empresa</th>
                                <th className="px-2 sm:px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedData.map(t => (
                                <tr key={t.id} className="hover:bg-rose-50/30 transition-colors group">
                                    <td className="px-2 sm:px-3 py-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                                        {format(t.dueDate, 'dd/MM/yyyy')}
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
                                        <span className={`text-[10px] font-bold uppercase tracking-wide ${getCompanyTextClass(t.company)}`}>{getCompanyShortName(t.company)}</span>
                                    </td>
                                    <td className={`px-2 sm:px-4 py-2 text-right text-xs font-bold whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        {viewType === 'overdue'
                                            ? 'Nenhuma receita vencida encontrada.'
                                            : 'Nenhuma receita a vencer encontrada.'}
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
                                ({((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} registros)
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
                                                    ? 'bg-rose-600 text-white shadow-md'
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

            {/* Client Transactions Modal */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-br from-amber-50 to-yellow-50 border-b border-amber-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                                    <Tag className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-amber-900">{selectedClient}</h2>
                                    <p className="text-sm text-amber-700">Lançamentos em aberto</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-amber-50 flex items-center justify-center border border-amber-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-amber-600" />
                            </button>
                        </div>

                        {/* Summary */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Total em Aberto</p>
                                    <p className={`text-2xl font-bold ${selectedClientTransactions.reduce((acc, t) => acc + t.amount, 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(selectedClientTransactions.reduce((acc, t) => acc + t.amount, 0))}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Lançamentos</p>
                                    <p className="text-2xl font-bold text-slate-900">{selectedClientTransactions.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="p-6">
                            {selectedClientTransactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Vencimento</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Descrição</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Categoria</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Fornecedor</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedClientTransactions.map(t => (
                                                <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-600 whitespace-nowrap">
                                                        {format(t.dueDate, 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-semibold text-slate-800 uppercase tracking-tight">
                                                            {t.description}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wide">
                                                            {t.category.split('. ')[1] || t.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {t.nome || '-'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-3 text-right text-sm font-bold whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {formatCurrency(t.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    Nenhum lançamento encontrado
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* All Delinquents Modal */}
            {showAllDelinquents && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-br from-amber-50 to-yellow-50 border-b border-amber-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                                    <Tag className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-amber-900">
                                        {viewType === 'overdue' ? 'Todos os Inadimplentes' : 'Todos a Vencer'}
                                    </h2>
                                    <p className="text-sm text-amber-700">Ranking completo por valor em aberto</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAllDelinquents(false)}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-amber-50 flex items-center justify-center border border-amber-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-amber-600" />
                            </button>
                        </div>

                        {/* Summary */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                                        {viewType === 'overdue' ? 'Total Inadimplente' : 'Total a Vencer'}
                                    </p>
                                    <p className={`text-2xl font-bold ${stats.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(stats.total)}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Clientes</p>
                                    <p className="text-2xl font-bold text-slate-900">{pieChartData.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* List of All Delinquents */}
                        <div className="p-6">
                            <div className="space-y-2">
                                {pieChartData.map((client, index) => (
                                    <button
                                        key={client.name}
                                        onClick={() => {
                                            setShowAllDelinquents(false);
                                            setSelectedClient(client.name);
                                        }}
                                        className="w-full bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-3 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0 transition-colors ${
                                                index < 5
                                                    ? 'bg-amber-100 border-amber-200 group-hover:bg-amber-200'
                                                    : 'bg-slate-100 border-slate-200 group-hover:bg-slate-200'
                                            }`}>
                                                <span className={`text-sm font-bold ${
                                                    index < 5 ? 'text-amber-600' : 'text-slate-600'
                                                }`}>
                                                    #{index + 1}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800 truncate text-left">
                                                {client.name}
                                            </span>
                                        </div>
                                        <span className={`text-base font-bold flex-shrink-0 ${client.originalValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(client.originalValue)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pie Chart Modal */}
            {showPieChart && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-br from-rose-50 to-orange-50 border-b border-rose-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200">
                                    <PieChart className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-rose-900">Distribuição por Cliente</h2>
                                    <p className="text-sm text-rose-700">
                                        {viewType === 'overdue'
                                            ? 'Valores inadimplentes por centro de custo'
                                            : 'Valores a vencer por centro de custo'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPieChart(false)}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 flex items-center justify-center border border-rose-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-rose-600" />
                            </button>
                        </div>

                        {/* Chart */}
                        <div className="p-6">
                            {pieChartData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={450}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${(((percent ?? 0) as number) * 100).toFixed(1)}%`}
                                                outerRadius={150}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name, props: any) => [
                                                    formatCurrency(Number(props?.payload?.originalValue ?? 0)),
                                                    String(props?.payload?.name ?? name ?? '')
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.75rem',
                                                    padding: '12px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600
                                                }}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>

                                    {/* Data Table */}
                                    <div className="mt-6 border-t border-slate-100 pt-6">
                                        <h3 className="text-sm font-bold text-slate-900 mb-4">Detalhamento por Cliente</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {pieChartData.map((item, index) => (
                                                <div
                                                    key={item.name}
                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <div
                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                        <span className="text-xs font-medium text-slate-700 truncate">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className={`text-sm font-bold ml-2 flex-shrink-0 ${item.originalValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {formatCurrency(item.originalValue)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    Nenhum dado disponível para exibir
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DelinquentTab;
