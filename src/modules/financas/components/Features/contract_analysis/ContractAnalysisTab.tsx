
import React, { useState, useMemo } from 'react';
import { Settings, X, ChevronDown, ChevronRight } from 'lucide-react';
import { format, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { CoaNode, CoaViewMode, CashSubView } from '../../../types';
import { formatCurrency } from '../../../utils';

interface ContractAnalysisTabProps {
    chartOfAccountsTree: CoaNode[];
    startDate: Date;
    endDate: Date;
    viewMode: CoaViewMode;
    cashSubView: CashSubView;
}

interface CategoryTreeItemProps {
    node: CoaNode;
    selectedCategories: string[];
    onToggle: (name: string) => void;
}

// Componente Recursivo para Árvore
const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({ node, selectedCategories, onToggle }) => {
    const [expanded, setExpanded] = useState(true); // Expandido por padrão para ver a estrutura
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
                    <div className="w-5 mr-1" /> // Espaçador
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

const ContractAnalysisTab: React.FC<ContractAnalysisTabProps> = ({ 
    chartOfAccountsTree, 
    startDate, 
    endDate, 
    viewMode, 
    cashSubView 
}) => {
    const [bar1Categories, setBar1Categories] = useState<string[]>([]);
    const [bar2Categories, setBar2Categories] = useState<string[]>([]);
    const [bar3Categories, setBar3Categories] = useState<string[]>([]);
    const [activeBarConfig, setActiveBarConfig] = useState<number | null>(null);

    // Configuração visual das barras
    const barConfig = {
        1: { color: '#f43f5e', name: 'Barra de Despesa 1', bg: 'bg-rose-500', text: 'text-rose-500', bgLight: 'bg-rose-50', border: 'border-rose-100' },
        2: { color: '#f59e0b', name: 'Barra de Despesa 2', bg: 'bg-amber-500', text: 'text-amber-500', bgLight: 'bg-amber-50', border: 'border-amber-100' },
        3: { color: '#8b5cf6', name: 'Barra de Despesa 3', bg: 'bg-violet-500', text: 'text-violet-500', bgLight: 'bg-violet-50', border: 'border-violet-100' },
    };

    const contractAnalysisData = useMemo(() => {
        const range = eachMonthOfInterval({ start: startDate, end: endDate });
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
                        // Se o nó atual está selecionado, soma seus valores
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
                        // Continua descendo na árvore mesmo se o pai não estiver selecionado (para pegar filhos selecionados individualmente)
                        // A lógica aqui depende se queremos que selecionar o pai inclua automaticamente os filhos no cálculo.
                        // No App.tsx, a árvore já vem com totais calculados nos pais.
                        // Então se selecionarmos um Pai, pegamos o total dele. Se selecionarmos o Filho, pegamos o total dele.
                        // Para evitar duplicação, o ideal é: se o pai está selecionado, não somamos os filhos novamente aqui se a lógica for de "drill-down",
                        // mas como a prop categories é uma lista plana de nomes selecionados, somamos o que estiver nela.
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
    }, [chartOfAccountsTree, startDate, endDate, viewMode, cashSubView, bar1Categories, bar2Categories, bar3Categories]);

    return (
        <div className="px-10 py-6 animate-fade-in pb-20">
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
                        <ComposedChart data={contractAnalysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(value) => `R$${value/1000}k`} />
                            <Tooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'}}
                              formatter={(value) => formatCurrency(Number(value ?? 0))}
                            />
                            {/* IMPORTANTE: Removido stackId para ficarem lado a lado */}
                            <Bar dataKey="bar1" name="Barra de Despesa 1" fill={barConfig[1].color} radius={[4, 4, 0, 0]} barSize={16} />
                            <Bar dataKey="bar2" name="Barra de Despesa 2" fill={barConfig[2].color} radius={[4, 4, 0, 0]} barSize={16} />
                            <Bar dataKey="bar3" name="Barra de Despesa 3" fill={barConfig[3].color} radius={[4, 4, 0, 0]} barSize={16} />
                            <Line type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ContractAnalysisTab;
