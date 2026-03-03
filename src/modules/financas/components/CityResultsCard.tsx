import React, { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { isWithinInterval, differenceInCalendarMonths } from 'date-fns';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, startOfMonth, endOfMonth } from '../utils';
import { Company, Transaction, ClientMetadata, ClientCategoryFilter, ClientStatusFilter, ClientTypeFilter } from '../types';

interface CityResultsCardProps {
    data: Transaction[];
    clientMetadata: Record<string, ClientMetadata>;
    selectedCompany: Company | 'all';
    selectedCostCenters: string[];
    startDate: Date;
    endDate: Date;
    selectedClientCategory?: ClientCategoryFilter;
    selectedClientStatus?: ClientStatusFilter;
    selectedClientType?: ClientTypeFilter;
    selectedCities?: string[];
}

type TabType = 'revenue' | 'expenses' | 'result';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#10b981', '#14b8a6', '#06b6d4'];

const CityResultsCard: React.FC<CityResultsCardProps> = ({
    data,
    clientMetadata,
    selectedCompany,
    selectedCostCenters,
    startDate,
    endDate,
    selectedClientCategory = 'all',
    selectedClientStatus = 'all',
    selectedClientType = 'all',
    selectedCities = []
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('revenue');

    const cityData = useMemo(() => {
        const monthsCount = Math.max(1, differenceInCalendarMonths(endDate, startDate) + 1);
        const start = startOfMonth(startDate);
        const end = endOfMonth(endDate);

        const filtered = data.filter(t => {
            const date = t.paymentDate || t.dueDate;
            const meta = clientMetadata[t.costCenter];
            const category = meta ? meta.category : 'administrative';
            const status = meta ? meta.status : 'active';
            const type = meta ? meta.type : 'private';

            if (category === 'administrative') return false;

            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            const dateMatch = isWithinInterval(date, { start, end });

            if (selectedClientStatus === 'active' && status === 'inactive') return false;
            if (selectedClientStatus === 'inactive' && status !== 'inactive') return false;

            if (selectedClientType === 'public' && type !== 'public') return false;
            if (selectedClientType === 'private' && type !== 'private') return false;

            if (selectedCities.length > 0) {
                const city = meta ? meta.city : '';
                if (!selectedCities.includes(city)) return false;
            }

            const hasCity = meta && meta.city && meta.city.trim() !== '';

            return companyMatch && ccMatch && dateMatch && hasCity;
        });

        const cityStats: Record<string, { revenue: number; expenses: number }> = {};

        filtered.forEach(t => {
            const meta = clientMetadata[t.costCenter];
            if (!meta || !meta.city) return;

            const city = meta.city;
            if (!cityStats[city]) {
                cityStats[city] = { revenue: 0, expenses: 0 };
            }

            if (t.type === 'receive') {
                cityStats[city].revenue += t.amount;
            } else {
                cityStats[city].expenses += Math.abs(t.amount);
            }
        });

        const revenueData = Object.entries(cityStats)
            .map(([name, stats]) => ({ name, value: stats.revenue / monthsCount }))
            .sort((a, b) => b.value - a.value)
            .filter(item => item.value > 0);

        const expensesData = Object.entries(cityStats)
            .map(([name, stats]) => ({ name, value: stats.expenses / monthsCount }))
            .sort((a, b) => b.value - a.value)
            .filter(item => item.value > 0);

        const resultData = Object.entries(cityStats)
            .map(([name, stats]) => ({
                name,
                value: (stats.revenue - stats.expenses) / monthsCount
            }))
            .sort((a, b) => b.value - a.value);

        return {
            revenue: revenueData,
            expenses: expensesData,
            result: resultData,
            monthsCount
        };
    }, [data, clientMetadata, selectedCompany, selectedCostCenters, startDate, endDate, selectedClientCategory, selectedClientStatus, selectedClientType, selectedCities]);

    const currentData = cityData[activeTab];
    const showAverage = cityData.monthsCount > 1;

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                        <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Resultado por Cidade</h3>
                        {showAverage && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Média de {cityData.monthsCount} {cityData.monthsCount === 1 ? 'mês' : 'meses'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'revenue'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Faturamento
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'expenses'
                                ? 'bg-rose-500 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Despesas
                    </button>
                    <button
                        onClick={() => setActiveTab('result')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'result'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Resultado
                    </button>
                </div>
            </div>

            {currentData.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">Nenhum dado encontrado</p>
                    <p className="text-sm">
                        Configure as cidades dos clientes nas configurações para visualizar este relatório
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-8">
                    <div className="w-1/3">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={currentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {currentData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="w-2/3 space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {currentData.map((item: any, index: number) => {
                            const isPositive = item.value >= 0;
                            const colorClass = activeTab === 'result'
                                ? (isPositive ? 'text-emerald-600' : 'text-rose-600')
                                : (activeTab === 'revenue' ? 'text-emerald-600' : 'text-rose-600');

                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between group cursor-default p-4 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white flex-shrink-0"
                                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                        />
                                        <span
                                            className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors"
                                            title={item.name}
                                        >
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-bold ${colorClass}`}>
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CityResultsCard;
