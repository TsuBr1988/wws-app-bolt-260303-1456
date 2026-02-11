
import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, BarChart3, BrainCircuit, Sparkles, Loader2, X, ChevronLeft, ChevronRight, Tag, ChevronDown, Check, Search, List, ChevronUp } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { endOfMonth, isWithinInterval, format, startOfYear, endOfYear, addYears, addDays, compareAsc, addMonths, differenceInCalendarMonths } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import MetricCard from '../../../MetricCard';
import { formatCurrency, getCompanyShortName, getCompanyTextClass, startOfMonth, getEffectiveDate } from '../../../utils';
import { Transaction, Company, ClientMetadata } from '../../../types';
import CFOReport from './CFOReport';

interface DashboardTabProps {
    kpiSaldoStats: { current: number; endMonth: number; endNextMonth: number };
    stats: { projectedIn: number; projectedOut: number };
    monthlyChartData: any[];
    categoryData: any[];
    data: Transaction[];
    clientMetadata: Record<string, ClientMetadata>;
    selectedCompany: Company | 'all';
    selectedCostCenters: string[];
    startDate?: Date;
    endDate?: Date;
}

const InsightModal = ({ isOpen, onClose, markdown, isLoading }: { isOpen: boolean; onClose: () => void; markdown: string; isLoading: boolean }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-2 border-gray-200">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-brand-dark">Insights do CFO</h3>
                            <p className="text-sm text-slate-500 font-medium">Análise de Inteligência Artificial</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                            <p className="text-slate-900 font-bold text-lg">Analisando dados financeiros...</p>
                            <p className="text-slate-500 text-sm mt-1 max-w-xs">Identificando padrões, calculando projeções e verificando anomalias.</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate prose-sm max-w-none">
                            {markdown.split('\n').map((line, i) => {
                                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-slate-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-indigo-900 mt-8 mb-4 border-b border-indigo-100 pb-2">{line.replace('## ', '')}</h2>;
                                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-slate-900 mb-6">{line.replace('# ', '')}</h1>;
                                if (line.startsWith('- ')) return <li key={i} className="ml-4 text-slate-700 mb-1">{line.replace('- ', '')}</li>;
                                if (line.trim() === '') return <br key={i} />;
                                return <p key={i} className="text-slate-600 leading-relaxed mb-3">{line}</p>;
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all">
                        Fechar Análise
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExpenseDetailsModal = ({
    isOpen,
    onClose,
    categoryData,
    monthYear,
    expandedCategory,
    onToggleCategory
}: {
    isOpen: boolean;
    onClose: () => void;
    categoryData: { name: string; total: number; transactions: Transaction[] }[];
    monthYear: string;
    expandedCategory: string | null;
    onToggleCategory: (category: string) => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-5xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-2 border-gray-200">

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                            <List className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-brand-dark">Detalhamento de Despesas</h3>
                            <p className="text-sm text-slate-500 font-medium">{monthYear}</p>
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
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-slate-900">{category.name}</p>
                                                <p className="text-xs text-slate-500">{category.transactions.length} lançamento{category.transactions.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-base font-bold text-rose-600">{formatCurrency(category.total)}</span>
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
                                                        <span className="text-sm font-bold text-rose-600 ml-4">{formatCurrency(Math.abs(transaction.amount))}</span>
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
                            Nenhuma despesa encontrada para este período
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

const DashboardTab: React.FC<DashboardTabProps> = ({ kpiSaldoStats, stats, monthlyChartData, categoryData, data, clientMetadata, selectedCompany, selectedCostCenters, startDate, endDate }) => {
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [insightResult, setInsightResult] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [selectedStartMonth, setSelectedStartMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), 0, 1);
    });
    const [selectedExpenseMonth, setSelectedExpenseMonth] = useState(new Date());
    const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<string[]>([]);
    const [isExpenseCatDropdownOpen, setIsExpenseCatDropdownOpen] = useState(false);
    const [expenseCategorySearch, setExpenseCategorySearch] = useState('');
    const [isExpenseDetailsModalOpen, setIsExpenseDetailsModalOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const currentMonthCashFlow = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const monthTransactions = data.filter(t => {
            const date = t.paymentDate || t.dueDate;
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            return companyMatch && ccMatch && isWithinInterval(date, { start: monthStart, end: monthEnd });
        });

        let entradas = 0;
        let saidas = 0;

        monthTransactions.forEach(t => {
            if (t.type === 'receive') {
                entradas += t.amount;
            } else {
                saidas += Math.abs(t.amount);
            }
        });

        return {
            geracao: entradas - saidas,
            entradas,
            saidas
        };
    }, [data, selectedCompany, selectedCostCenters]);

    const filteredMonthlyChartData = useMemo(() => {
        const chartData = [];
        const monthsShort = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

        let saldoRealAcumulado = 0;
        let saldoProjAcumulado = 0;

        for (let i = 0; i < 12; i++) {
            const currentDate = new Date(selectedStartMonth.getFullYear(), selectedStartMonth.getMonth() + i, 1);
            const monthStart = currentDate;
            const monthEnd = endOfMonth(currentDate);
            const monthShort = monthsShort[currentDate.getMonth()];
            const year = currentDate.getFullYear().toString().slice(-2);

            const monthTransactions = data.filter(t => {
                const date = t.paymentDate || t.dueDate;
                const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
                const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
                return companyMatch && ccMatch && isWithinInterval(date, { start: monthStart, end: monthEnd });
            });

            let recebido = 0, recebidoPrevisto = 0, pago = 0, pagoPrevisto = 0;
            monthTransactions.forEach(t => {
                if (t.type === 'receive') {
                    if (t.status === 'completed') recebido += t.amount;
                    else recebidoPrevisto += t.amount;
                } else {
                    if (t.status === 'completed') pago += Math.abs(t.amount);
                    else pagoPrevisto += Math.abs(t.amount);
                }
            });

            const saldoRealMes = recebido - pago;
            const saldoProjMes = (recebido + recebidoPrevisto) - (pago + pagoPrevisto);

            saldoRealAcumulado += saldoRealMes;
            saldoProjAcumulado += saldoProjMes;

            chartData.push({
                name: `${monthShort}/${year}`,
                Recebido: recebido,
                RecebidoPrevisto: recebidoPrevisto,
                Pago: pago,
                PagoPrevisto: pagoPrevisto,
                SaldoReal: saldoRealAcumulado,
                SaldoProj: saldoProjAcumulado
            });
        }

        return chartData;
    }, [data, selectedStartMonth, selectedCompany, selectedCostCenters]);

    const availableExpenseCategories = useMemo(() => {
        const monthStart = startOfMonth(selectedExpenseMonth);
        const monthEnd = endOfMonth(selectedExpenseMonth);

        const monthTransactions = data.filter(t => {
            const date = t.paymentDate || t.dueDate;
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            return companyMatch && ccMatch && t.type === 'pay' && isWithinInterval(date, { start: monthStart, end: monthEnd });
        });

        const s = new Set<string>();
        monthTransactions.forEach(t => s.add(t.category));
        return Array.from(s).sort();
    }, [data, selectedExpenseMonth, selectedCompany, selectedCostCenters]);

    const filteredExpenseCategories = useMemo(() => {
        if (!expenseCategorySearch.trim()) return availableExpenseCategories;
        const query = expenseCategorySearch.toLowerCase();
        return availableExpenseCategories.filter(cat => cat.toLowerCase().includes(query));
    }, [availableExpenseCategories, expenseCategorySearch]);

    const filteredCategoryData = useMemo(() => {
        const monthStart = startOfMonth(selectedExpenseMonth);
        const monthEnd = endOfMonth(selectedExpenseMonth);

        const monthTransactions = data.filter(t => {
            const date = t.paymentDate || t.dueDate;
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            const categoryMatch = selectedExpenseCategories.length === 0 || selectedExpenseCategories.includes(t.category);
            return companyMatch && ccMatch && t.type === 'pay' && categoryMatch && isWithinInterval(date, { start: monthStart, end: monthEnd });
        });

        const categorySummary: Record<string, number> = {};
        monthTransactions.forEach(t => {
            categorySummary[t.category] = (categorySummary[t.category] || 0) + Math.abs(t.amount);
        });

        return Object.entries(categorySummary)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    }, [data, selectedExpenseMonth, selectedCompany, selectedCostCenters, selectedExpenseCategories]);

    const allCategoryDetailsData = useMemo(() => {
        const monthStart = startOfMonth(selectedExpenseMonth);
        const monthEnd = endOfMonth(selectedExpenseMonth);

        const monthTransactions = data.filter(t => {
            const date = t.paymentDate || t.dueDate;
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            const categoryMatch = selectedExpenseCategories.length === 0 || selectedExpenseCategories.includes(t.category);
            return companyMatch && ccMatch && t.type === 'pay' && categoryMatch && isWithinInterval(date, { start: monthStart, end: monthEnd });
        });

        const categorySummary: Record<string, { total: number; transactions: Transaction[] }> = {};
        monthTransactions.forEach(t => {
            if (!categorySummary[t.category]) {
                categorySummary[t.category] = { total: 0, transactions: [] };
            }
            categorySummary[t.category].total += Math.abs(t.amount);
            categorySummary[t.category].transactions.push(t);
        });

        return Object.entries(categorySummary)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([name, data]) => ({ name, total: data.total, transactions: data.transactions }));
    }, [data, selectedExpenseMonth, selectedCompany, selectedCostCenters, selectedExpenseCategories]);

    const delinquentData = useMemo(() => {
        const allowedCategories = [
            '1.1.1',
            '1.2.1',
            'COFINS Retido sobre a Receita',
            'CSLL Retido sobre a Receita',
            'INSS Retido sobre a Receita',
            'IRPJ Retido sobre a Receita',
            'ISS Retido sobre a Receita'
        ];

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const openReceivables = data.filter(t => {
            if (t.type !== 'receive' || t.status !== 'pending') return false;
            const effectiveDate = getEffectiveDate(t);
            if (effectiveDate > today) return false;

            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);

            const categoryMatch = allowedCategories.some(allowed => {
                if (allowed.includes('.')) {
                    return t.category.startsWith(allowed);
                } else {
                    return t.category.toLowerCase().includes(allowed.toLowerCase());
                }
            });

            return companyMatch && ccMatch && categoryMatch;
        });

        const total = openReceivables.reduce((acc, t) => acc + t.amount, 0);
        const count = openReceivables.length;

        let totalDaysOverdue = 0;
        let overdueCount = 0;

        openReceivables.forEach(t => {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            if (dueDate < todayDate) {
                const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                totalDaysOverdue += daysOverdue;
                overdueCount++;
            }
        });

        const avgDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;

        const byCostCenter: Record<string, number> = {};
        openReceivables.forEach(t => {
            byCostCenter[t.costCenter] = (byCostCenter[t.costCenter] || 0) + t.amount;
        });

        const topDelinquents = Object.entries(byCostCenter)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return { total, count, avgDaysOverdue, topDelinquents };
    }, [data, selectedCompany, selectedCostCenters]);

    const kpiData = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);

        const filtered = data.filter(t => {
            const meta = clientMetadata[t.costCenter];
            const category = meta ? meta.category : 'administrative';
            if (category === 'administrative') return false;

            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!companyMatch || !ccMatch) return false;

            const d = t.competencyDate || t.dueDate;
            const inMonth = d >= monthStart && d <= monthEnd;
            return inMonth;
        });

        let totalRev = 0;
        let revWWS = 0;
        let revWorldwide = 0;

        const marginByCC: Record<string, { margin: number }> = {};

        filtered.forEach(t => {
            if (!marginByCC[t.costCenter]) marginByCC[t.costCenter] = { margin: 0 };

            if (t.type === 'receive') {
                totalRev += t.amount;
                if (t.company === 'WWS Services') revWWS += t.amount;
                if (t.company === 'Worldwide Segurança') revWorldwide += t.amount;
                marginByCC[t.costCenter].margin += t.amount;
            } else {
                marginByCC[t.costCenter].margin -= Math.abs(t.amount);
            }
        });

        const allMargins = Object.entries(marginByCC).map(([name, data]) => ({ name, ...data }));
        const totalPositiveMargin = allMargins.filter(m => m.margin > 0).reduce((acc, c) => acc + c.margin, 0);
        const totalNegativeMargin = allMargins.filter(m => m.margin < 0).reduce((acc, c) => acc + c.margin, 0);

        return {
            totalRev,
            revWWS,
            revWorldwide,
            totalMargin: totalPositiveMargin + totalNegativeMargin,
            totalPositiveMargin,
            totalNegativeMargin
        };
    }, [data, selectedCompany, selectedCostCenters, clientMetadata]);

    const goToPreviousMonth = () => {
        setSelectedStartMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setSelectedStartMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToPreviousExpenseMonth = () => {
        setSelectedExpenseMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextExpenseMonth = () => {
        setSelectedExpenseMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const toggleExpenseCategory = (cat: string) => {
        setSelectedExpenseCategories(prev => {
            if (prev.includes(cat)) return prev.filter(c => c !== cat);
            return [...prev, cat];
        });
    };

    const formatMonthYear = (date: Date) => {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatPeriodRange = () => {
        const startDate = selectedStartMonth;
        const endDate = new Date(selectedStartMonth.getFullYear(), selectedStartMonth.getMonth() + 11, 1);
        const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return `${monthsShort[startDate.getMonth()]}/${startDate.getFullYear().toString().slice(-2)} - ${monthsShort[endDate.getMonth()]}/${endDate.getFullYear().toString().slice(-2)}`;
    };

    const generateCfoInsights = async () => {
        if (showReport) {
            setShowReport(false);
            return;
        }

        setShowReport(true);
        setIsInsightLoading(true);

        try {
            const now = new Date();
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            const monthName = format(now, 'MMMM yyyy', { locale: ptBR });

            const currentMonthData = data.filter(t => {
                const date = t.paymentDate || t.dueDate;
                const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
                const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
                return companyMatch && ccMatch && isWithinInterval(date, { start, end });
            });

            let totalReceitas = 0;
            let totalDespesas = 0;
            const categorySummary: Record<string, number> = {};

            currentMonthData.forEach(t => {
                if (t.type === 'receive') {
                    totalReceitas += t.amount;
                } else {
                    totalDespesas += Math.abs(t.amount);
                    categorySummary[t.category] = (categorySummary[t.category] || 0) + Math.abs(t.amount);
                }
            });

            const topExpensesList = Object.entries(categorySummary)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([name, val]) => ({ category: name, amount: val }));

            const topExpensesText = topExpensesList
                .slice(0, 5)
                .map(({ category, amount }) => `- ${category}: ${formatCurrency(amount)}`)
                .join('\n');

            const projectionData = [
                { month: format(now, 'MMM/yy', { locale: ptBR }), projected: kpiSaldoStats.endMonth, realized: kpiSaldoStats.current },
                { month: format(addMonths(now, 1), 'MMM/yy', { locale: ptBR }), projected: kpiSaldoStats.endNextMonth },
                { month: format(addMonths(now, 2), 'MMM/yy', { locale: ptBR }), projected: kpiSaldoStats.endNextMonth + (currentMonthCashFlow.geracao * 0.8) },
                { month: format(addMonths(now, 3), 'MMM/yy', { locale: ptBR }), projected: kpiSaldoStats.endNextMonth + (currentMonthCashFlow.geracao * 1.5) }
            ];

            const promptMonthAnalysis = `
                Atue como um CFO experiente. Analise o mês de ${monthName}:
                - Receitas: ${formatCurrency(totalReceitas)}
                - Despesas: ${formatCurrency(totalDespesas)}
                - Resultado: ${formatCurrency(totalReceitas - totalDespesas)}
                - Saldo Atual: ${formatCurrency(kpiSaldoStats.current)}
                - Saldo Fim do Mês: ${formatCurrency(kpiSaldoStats.endMonth)}

                Forneça uma análise BREVE (máximo 3 parágrafos) sobre a saúde financeira do mês atual.
            `;

            const promptYearAnalysis = `
                Atue como um CFO experiente. Com base nos dados anuais:
                - Faturamento Total: ${formatCurrency(kpiData.totalRev)}
                - Margem Total: ${formatCurrency(kpiData.totalMargin)}
                - Inadimplência: ${formatCurrency(delinquentData.total)} (${delinquentData.count} lançamentos)

                Forneça uma análise BREVE (máximo 3 parágrafos) sobre o desempenho anual.
            `;

            const promptInsights = `
                Atue como um CFO experiente. Analise os dados:

                MÊS ATUAL (${monthName}):
                - Receitas: ${formatCurrency(totalReceitas)}
                - Despesas: ${formatCurrency(totalDespesas)}
                - Resultado: ${formatCurrency(totalReceitas - totalDespesas)}

                TOP 5 DESPESAS:
                ${topExpensesText}

                INADIMPLÊNCIA:
                - Total: ${formatCurrency(delinquentData.total)}
                - ${delinquentData.count} lançamentos
                - Atraso médio: ${delinquentData.avgDaysOverdue} dias

                KPIs:
                - Faturamento: ${formatCurrency(kpiData.totalRev)}
                - Margem: ${formatCurrency(kpiData.totalMargin)}
                - Margem %: ${((kpiData.totalMargin / kpiData.totalRev) * 100).toFixed(1)}%

                Forneça:
                1. Resumo executivo (2 parágrafos)
                2. 3 principais riscos ou pontos de atenção
                3. 3 ações estratégicas recomendadas

                Use formatação Markdown (##, -). Seja direto e conciso.
            `;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey || apiKey === 'SUA_CHAVE_AQUI') {
                throw new Error('Chave de API do Gemini não configurada. Por favor, adicione VITE_GEMINI_API_KEY no arquivo .env');
            }

            const ai = new GoogleGenAI({ apiKey });

            const [monthResponse, yearResponse, insightsResponse] = await Promise.all([
                ai.models.generateContent({ model: 'gemini-2.0-flash-exp', contents: promptMonthAnalysis }),
                ai.models.generateContent({ model: 'gemini-2.0-flash-exp', contents: promptYearAnalysis }),
                ai.models.generateContent({ model: 'gemini-2.0-flash-exp', contents: promptInsights })
            ]);

            setReportData({
                currentBalance: kpiSaldoStats.current,
                endMonthBalance: kpiSaldoStats.endMonth,
                nextMonthBalance: kpiSaldoStats.endNextMonth,
                topExpenses: topExpensesList,
                delinquentData,
                kpiData,
                monthAnalysis: monthResponse.text,
                yearAnalysis: yearResponse.text,
                aiInsights: insightsResponse.text,
                projectionData
            });

        } catch (error) {
            console.error("Error generating insights", error);
            setReportData({
                currentBalance: kpiSaldoStats.current,
                endMonthBalance: kpiSaldoStats.endMonth,
                nextMonthBalance: kpiSaldoStats.endNextMonth,
                topExpenses: [],
                delinquentData,
                kpiData,
                monthAnalysis: "Erro ao gerar análise do mês.",
                yearAnalysis: "Erro ao gerar análise do ano.",
                aiInsights: "Não foi possível gerar insights no momento. Verifique sua conexão ou a chave de API.",
                projectionData: []
            });
        } finally {
            setIsInsightLoading(false);
        }
    };

    return (
        <div className="px-10 py-6 animate-fade-in pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard title="Saldo Atual" value={kpiSaldoStats.current} subtitle="Hoje (Realizado)" icon={Wallet} type={kpiSaldoStats.current >= 0 ? 'success' : 'danger'} />

                <div className="bg-white p-7 rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all hover:scale-105 group overflow-hidden relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className={`p-3.5 rounded-2xl ${currentMonthCashFlow.geracao >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-slate-50 text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
                            Mês Atual
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-400 mb-1">Geração de Caixa do Mês</p>
                        <h3 className={`text-3xl font-bold tracking-tight mb-3 ${currentMonthCashFlow.geracao >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(currentMonthCashFlow.geracao)}
                        </h3>
                        <div className="space-y-1 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-emerald-600">Entradas</span>
                                <span className="text-xs font-bold text-emerald-600">{formatCurrency(currentMonthCashFlow.entradas)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-rose-600">Saídas</span>
                                <span className="text-xs font-bold text-rose-600">{formatCurrency(currentMonthCashFlow.saidas)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <MetricCard title="Saldo Final Mês" value={kpiSaldoStats.endMonth} subtitle="Projeção" icon={TrendingUp} type={kpiSaldoStats.endMonth >= 0 ? 'info' : 'warning'} />
                <MetricCard title="Saldo Final Próx. Mês" value={kpiSaldoStats.endNextMonth} subtitle="Projeção" icon={BarChart3} type={kpiSaldoStats.endNextMonth >= 0 ? 'info' : 'warning'} />
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-shadow duration-300 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                        Fluxo de Caixa (12 Meses)
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-bold text-slate-700 min-w-[140px] text-center">{formatPeriodRange()}</span>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={filteredMonthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} tickFormatter={(value) => {
                                const millions = value / 1000000;
                                return millions >= 1 || millions <= -1 ? `R$ ${millions.toFixed(0)} M` : `R$ ${(value / 1000).toFixed(0)} k`;
                            }} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                                formatter={(value: any, name: any) => [formatCurrency(value), name]}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Recebido" name="Receita Realizada" fill="#10b981" stackId="receitas" radius={[0, 0, 0, 0]} barSize={40} />
                            <Bar dataKey="RecebidoPrevisto" name="Receita Prevista" fill="#86efac" stackId="receitas" radius={[8, 8, 0, 0]} barSize={40} />
                            <Bar dataKey="Pago" name="Despesa Realizada" fill="#f43f5e" stackId="despesas" radius={[0, 0, 0, 0]} barSize={40} />
                            <Bar dataKey="PagoPrevisto" name="Despesa Prevista" fill="#fda4af" stackId="despesas" radius={[8, 8, 0, 0]} barSize={40} />
                            <Line type="monotone" dataKey="SaldoReal" name="Saldo Real" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#3b82f6' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="SaldoProj" name="Saldo Projetado" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#a855f7' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-shadow duration-300 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-brand-dark">Maiores Despesas</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsExpenseCatDropdownOpen(!isExpenseCatDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-xs font-bold text-slate-600"
                            >
                                <Tag className="w-4 h-4 text-slate-400" />
                                <span>{selectedExpenseCategories.length > 0 ? `${selectedExpenseCategories.length} Categorias` : 'Filtrar'}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            {isExpenseCatDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-20 max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar categorias..."
                                            value={expenseCategorySearch}
                                            onChange={(e) => setExpenseCategorySearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 font-medium"
                                        />
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={() => setSelectedExpenseCategories(availableExpenseCategories)} className="flex-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors">Selecionar Todas</button>
                                        <button onClick={() => setSelectedExpenseCategories([])} className="flex-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg transition-colors">Limpar</button>
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar flex-1">
                                        {filteredExpenseCategories.length > 0 ? (
                                            filteredExpenseCategories.map(cat => (
                                                <div key={cat} onClick={() => toggleExpenseCategory(cat)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs text-slate-700 transition-colors">
                                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${selectedExpenseCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                        {selectedExpenseCategories.includes(cat) && <Check className="w-3 h-3 text-white" />}
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
                        <button
                            onClick={goToPreviousExpenseMonth}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-bold text-slate-700 min-w-[140px] text-center">{formatMonthYear(selectedExpenseMonth)}</span>
                        <button
                            onClick={goToNextExpenseMonth}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="w-1/3">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={filteredCategoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {filteredCategoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="w-2/3 space-y-4">
                        {filteredCategoryData.length > 0 ? filteredCategoryData.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between group cursor-default p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'][index % 5] }}></div>
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors" title={item.name}>{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{formatCurrency(item.value)}</span>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-500">
                                Nenhuma despesa encontrada para este mês
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-6 flex justify-start">
                    <button
                        onClick={() => setIsExpenseDetailsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                        <List className="w-4 h-4" />
                        Ver Mais
                    </button>
                </div>
            </div>

            <div>
                <div className={`w-full bg-[#5b46e8] ${showReport ? 'rounded-t-[2rem]' : 'rounded-[2rem]'} p-8 shadow-[0_10px_40px_-10px_rgba(91,70,232,0.4)] relative overflow-hidden group mt-8`}>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-900/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                                <BrainCircuit className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-wide">Análise Financeira Inteligente</h3>
                        </div>

                        <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-2">
                            <p className="text-indigo-50 font-medium text-base mb-8 leading-relaxed opacity-95">
                                Utilize a inteligência artificial para identificar padrões, riscos e oportunidades nos seus dados financeiros.
                            </p>
                            <button
                                onClick={generateCfoInsights}
                                disabled={isInsightLoading}
                                className="px-8 py-3.5 bg-white text-[#5b46e8] rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isInsightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isInsightLoading ? 'Gerando Análise...' : showReport ? 'Fechar Relatório' : 'Gerar Insights CFO'}
                            </button>
                        </div>
                    </div>
                </div>

                {showReport && reportData && (
                    <CFOReport
                        currentBalance={reportData.currentBalance}
                        endMonthBalance={reportData.endMonthBalance}
                        nextMonthBalance={reportData.nextMonthBalance}
                        topExpenses={reportData.topExpenses}
                        delinquentData={reportData.delinquentData}
                        kpiData={reportData.kpiData}
                        monthAnalysis={reportData.monthAnalysis}
                        yearAnalysis={reportData.yearAnalysis}
                        aiInsights={reportData.aiInsights}
                        projectionData={reportData.projectionData}
                        isLoading={isInsightLoading}
                    />
                )}
            </div>

            <InsightModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                markdown={insightResult}
                isLoading={isInsightLoading}
            />

            <ExpenseDetailsModal
                isOpen={isExpenseDetailsModalOpen}
                onClose={() => {
                    setIsExpenseDetailsModalOpen(false);
                    setExpandedCategory(null);
                }}
                categoryData={allCategoryDetailsData}
                monthYear={formatMonthYear(selectedExpenseMonth)}
                expandedCategory={expandedCategory}
                onToggleCategory={(category) => {
                    setExpandedCategory(expandedCategory === category ? null : category);
                }}
            />
        </div>
    );
};

export default DashboardTab;
