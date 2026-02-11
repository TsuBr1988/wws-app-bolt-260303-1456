
import React from 'react';
import { X, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from './utils';

interface KPIDetailChartModalProps {
    title: string;
    data: { name: string; value: number }[];
    onClose: () => void;
    averageValue?: number;
    showAverage?: boolean;
}

const KPIDetailChartModal: React.FC<KPIDetailChartModalProps> = ({ title, data, onClose, averageValue, showAverage }) => {
    // Sort data descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                             {showAverage && averageValue !== undefined && (
                                 <p className="text-xs text-slate-500 font-medium">Média do Período: {formatCurrency(averageValue)}</p>
                             )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    {sortedData.length > 0 ? (
                         <div className="h-[500px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={sortedData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        width={200}
                                        tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}}
                                        interval={0}
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'}}
                                        formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                                    />
                                    <Bar 
                                        dataKey="value" 
                                        fill="#6366f1" 
                                        radius={[0, 4, 4, 0]}
                                        barSize={24}
                                        name="Faturamento"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <p>Nenhum dado disponível para este filtro.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KPIDetailChartModal;
