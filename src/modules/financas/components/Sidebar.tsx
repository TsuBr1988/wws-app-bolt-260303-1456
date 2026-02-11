
import React from 'react';
import { LayoutDashboard, TableProperties, BrainCircuit, LineChart as LineChartIcon, FolderTree, BarChart3, FolderInput, Settings, Building2, ScrollText, AlertCircle, Wallet, PiggyBank } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
    activeTab: ViewState;
    setActiveTab: (tab: ViewState) => void;
    hasIndicatorAccess?: (page: string, indicator: string) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, hasIndicatorAccess }) => {
    const allMenuItems = [
        { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, color: 'text-ambiental' },
        { id: 'statement', label: 'Extrato', icon: TableProperties, color: 'text-parking' },
        { id: 'delinquent', label: 'Inadimplentes', icon: AlertCircle, color: 'text-facilities' },
        { id: 'loans', label: 'Empréstimos', icon: Wallet, color: 'text-tecnologia' },
        { id: 'simulations', label: 'Simulações', icon: BrainCircuit, color: 'text-facilities-dark' },
        { id: 'coa', label: 'Plano de Contas', icon: FolderTree, color: 'text-seguranca' },
        { id: 'budget', label: 'Controle Orçamentário', icon: PiggyBank, color: 'text-parking' },
        { id: 'kpis', label: 'KPIs', icon: BarChart3, color: 'text-seguranca' },
        { id: 'contract_sheets', label: 'Fichas de Contratos', icon: ScrollText, color: 'text-parking' },
        { id: 'files', label: 'Importação', icon: FolderInput, color: 'text-tecnologia' },
        { id: 'settings', label: 'Ajustes', icon: Settings, color: 'text-gray-400' },
    ];

    const menuItems = hasIndicatorAccess
        ? allMenuItems.filter(item => hasIndicatorAccess('financas', item.label))
        : allMenuItems;

    return (
        <div className="w-48 bg-brand-dark text-slate-300 flex flex-col fixed left-0 top-0 h-screen z-20 border-r border-gray-700 shadow-2xl transition-all duration-300">
            <div className="h-20 flex items-center px-4 border-b border-gray-700">
                <div className="gradient-parking w-8 h-8 rounded-xl flex items-center justify-center mr-2 shadow-lg">
                    <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Financeiro</h1>
                    <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Dashboard</p>
                </div>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                <p className="px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Menu</p>

                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as ViewState)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                                isActive
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-parking rounded-r-full shadow-lg" />}

                            <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-300'}`} />
                            <span className={`flex-1 text-left text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-3">
                <div className="bg-brand-graphite rounded-xl p-3 border border-gray-700 shadow-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-ambiental animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-300">Sistema Online</span>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-relaxed">
                        Sincronização com Supabase ativa.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
