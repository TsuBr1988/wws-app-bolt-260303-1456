import React from 'react';
import { Wallet, TrendingUp, AlertTriangle, BarChart3, Users, Calendar, Award, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../../utils';
import { Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CFOReportProps {
    currentBalance: number;
    endMonthBalance: number;
    nextMonthBalance: number;
    topExpenses: Array<{ category: string; amount: number }>;
    delinquentData: {
        total: number;
        count: number;
        avgDaysOverdue: number;
        topDelinquents: Array<{ name: string; amount: number }>;
    };
    kpiData: {
        totalRev: number;
        revWWS: number;
        revWorldwide: number;
        totalMargin: number;
        totalPositiveMargin: number;
        totalNegativeMargin: number;
    };
    monthAnalysis: string;
    yearAnalysis: string;
    aiInsights: string;
    projectionData: Array<{
        month: string;
        projected: number;
        realized?: number;
    }>;
    isLoading?: boolean;
}

const MetricCardSmall = ({ title, value, icon: Icon, type = 'neutral', subtitle }: {
    title: string;
    value: number | string;
    icon: any;
    type?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
    subtitle?: string;
}) => {
    const colors = {
        success: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-600',
        danger: 'from-rose-50 to-red-50 border-rose-200 text-rose-600',
        warning: 'from-amber-50 to-orange-50 border-amber-200 text-amber-600',
        info: 'from-blue-50 to-cyan-50 border-blue-200 text-blue-600',
        neutral: 'from-slate-50 to-gray-50 border-slate-200 text-slate-600'
    };

    const textColors = {
        success: 'text-emerald-600',
        danger: 'text-rose-600',
        warning: 'text-amber-600',
        info: 'text-blue-600',
        neutral: 'text-slate-600'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[type]} rounded-xl border p-4 shadow-sm`}>
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-white/70 ${textColors[type]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
            <p className={`text-xl font-bold ${textColors[type]} mb-1`}>
                {typeof value === 'number' ? formatCurrency(value) : value}
            </p>
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
    );
};

const CFOReport: React.FC<CFOReportProps> = ({
    currentBalance,
    endMonthBalance,
    nextMonthBalance,
    topExpenses,
    delinquentData,
    kpiData,
    monthAnalysis,
    yearAnalysis,
    aiInsights,
    projectionData,
    isLoading = false
}) => {
    const currentDate = new Date();
    const currentMonthName = format(currentDate, 'MMMM', { locale: ptBR });
    const nextMonth = addMonths(currentDate, 1);
    const secondNextMonth = addMonths(currentDate, 2);
    const thirdNextMonth = addMonths(currentDate, 3);

    if (isLoading) {
        return (
            <div className="bg-white rounded-b-[2rem] border border-t-0 border-slate-100 p-8 animate-pulse">
                <div className="space-y-4">
                    <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-b-[2rem] border border-t-0 border-slate-100 overflow-hidden animate-in slide-in-from-top duration-500">
            <div className="p-8 space-y-8">
                {/* Header Section */}
                <div className="border-b border-slate-100 pb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        Relatório Executivo do CFO
                    </h2>
                    <p className="text-sm text-slate-600 ml-14">
                        Gerado em {format(currentDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                </div>

                {/* Seção 1: Saldo e Projeções */}
                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-600" />
                        Saldo e Projeções
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <MetricCardSmall
                            title="Saldo Atual"
                            value={currentBalance}
                            icon={Wallet}
                            type={currentBalance >= 0 ? 'success' : 'danger'}
                            subtitle="Realizado hoje"
                        />
                        <MetricCardSmall
                            title="Final do Mês"
                            value={endMonthBalance}
                            icon={TrendingUp}
                            type={endMonthBalance >= 0 ? 'info' : 'warning'}
                            subtitle={`Projeção ${currentMonthName}`}
                        />
                        <MetricCardSmall
                            title={`Final ${format(nextMonth, 'MMM', { locale: ptBR })}`}
                            value={nextMonthBalance}
                            icon={Calendar}
                            type={nextMonthBalance >= 0 ? 'info' : 'warning'}
                            subtitle="Projeção próximo mês"
                        />
                        <MetricCardSmall
                            title="Variação Mensal"
                            value={endMonthBalance - currentBalance}
                            icon={Activity}
                            type={(endMonthBalance - currentBalance) >= 0 ? 'success' : 'danger'}
                            subtitle="Geração de caixa"
                        />
                    </div>

                    {/* Chart de Projeção */}
                    {projectionData && projectionData.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <h4 className="text-sm font-bold text-slate-700 mb-4">Projeção de Saldo - Próximos Meses</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={projectionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            axisLine={{ stroke: '#cbd5e1' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            axisLine={{ stroke: '#cbd5e1' }}
                                            tickFormatter={(value) => {
                                                const millions = value / 1000000;
                                                return millions >= 1 || millions <= -1 ? `R$ ${millions.toFixed(1)}M` : `R$ ${(value / 1000).toFixed(0)}k`;
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="realized" name="Realizado" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        <Line type="monotone" dataKey="projected" name="Projetado" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </section>

                {/* Seção 2: Top 10 Despesas */}
                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-rose-600" />
                        Top 10 Principais Despesas do Mês
                    </h3>
                    <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-6 border border-rose-100">
                        <div className="space-y-3">
                            {topExpenses.slice(0, 10).map((expense, index) => {
                                const maxAmount = Math.max(...topExpenses.slice(0, 10).map(e => Math.abs(e.amount)));
                                const percentage = (Math.abs(expense.amount) / maxAmount) * 100;

                                return (
                                    <div key={index} className="bg-white rounded-lg p-4 border border-rose-200 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-800 truncate">{expense.category}</span>
                                            </div>
                                            <span className="text-base font-bold text-rose-600 ml-4 flex-shrink-0">
                                                {formatCurrency(Math.abs(expense.amount))}
                                            </span>
                                        </div>
                                        <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-rose-500 to-orange-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {topExpenses.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    Nenhuma despesa registrada no período
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Seção 3: Inadimplentes */}
                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Análise de Inadimplência
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <MetricCardSmall
                            title="Total Inadimplente"
                            value={delinquentData.total}
                            icon={DollarSign}
                            type="warning"
                            subtitle={`${delinquentData.count} lançamentos`}
                        />
                        <MetricCardSmall
                            title="Atraso Médio"
                            value={`${delinquentData.avgDaysOverdue} dias`}
                            icon={Calendar}
                            type="warning"
                        />
                        <MetricCardSmall
                            title="% do Faturamento"
                            value={`${((Math.abs(delinquentData.total) / kpiData.totalRev) * 100).toFixed(1)}%`}
                            icon={Activity}
                            type={(Math.abs(delinquentData.total) / kpiData.totalRev) > 0.1 ? 'danger' : 'warning'}
                        />
                    </div>

                    {delinquentData.topDelinquents.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="text-sm font-bold text-amber-900 mb-4">Top 5 Clientes Inadimplentes</h4>
                            <div className="space-y-2">
                                {delinquentData.topDelinquents.slice(0, 5).map((client, index) => (
                                    <div key={index} className="bg-white rounded-lg p-3 border border-amber-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-200 flex-shrink-0">
                                                <span className="text-xs font-bold text-amber-600">#{index + 1}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800 truncate">{client.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-amber-700 ml-4 flex-shrink-0">
                                            {formatCurrency(Math.abs(client.amount))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Seção 4: KPIs */}
                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        Indicadores-Chave (KPIs)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCardSmall
                            title="Faturamento Total"
                            value={kpiData.totalRev}
                            icon={BarChart3}
                            type="info"
                            subtitle="Receita do período"
                        />
                        <MetricCardSmall
                            title="WWS Services"
                            value={kpiData.revWWS}
                            icon={Users}
                            type="success"
                        />
                        <MetricCardSmall
                            title="Worldwide Segurança"
                            value={kpiData.revWorldwide}
                            icon={Users}
                            type="warning"
                        />
                        <MetricCardSmall
                            title="Margem Total"
                            value={kpiData.totalMargin}
                            icon={TrendingUp}
                            type={kpiData.totalMargin >= 0 ? 'success' : 'danger'}
                            subtitle={`${((kpiData.totalMargin / kpiData.totalRev) * 100).toFixed(1)}% do faturamento`}
                        />
                        <MetricCardSmall
                            title="Margens Positivas"
                            value={kpiData.totalPositiveMargin}
                            icon={TrendingUp}
                            type="success"
                        />
                        <MetricCardSmall
                            title="Margens Negativas"
                            value={kpiData.totalNegativeMargin}
                            icon={TrendingDown}
                            type="danger"
                        />
                    </div>
                </section>

                {/* Seção 5: Análises com IA */}
                {aiInsights && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            Insights e Análises
                        </h3>

                        <div className="space-y-4">
                            {/* Análise do Mês */}
                            {monthAnalysis && (
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                                    <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Análise do Mês Atual
                                    </h4>
                                    <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                                        {monthAnalysis.split('\n').map((line, i) => (
                                            line.trim() && <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Análise do Ano */}
                            {yearAnalysis && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                                    <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Análise Anual
                                    </h4>
                                    <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                                        {yearAnalysis.split('\n').map((line, i) => (
                                            line.trim() && <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Insights IA */}
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-900 mb-3">Insights Estratégicos (IA)</h4>
                                <div className="prose prose-sm max-w-none text-slate-700">
                                    {aiInsights.split('\n').map((line, i) => {
                                        if (line.startsWith('### ')) return <h4 key={i} className="text-base font-bold text-indigo-900 mt-4 mb-2">{line.replace('### ', '')}</h4>;
                                        if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold text-indigo-900 mt-6 mb-3">{line.replace('## ', '')}</h3>;
                                        if (line.startsWith('# ')) return <h2 key={i} className="text-xl font-bold text-indigo-900 mb-4">{line.replace('# ', '')}</h2>;
                                        if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
                                        if (line.trim() === '') return <br key={i} />;
                                        return <p key={i} className="mb-2">{line}</p>;
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default CFOReport;
