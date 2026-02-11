
import React, { useState, useMemo } from 'react';
import { Database, Calendar, ChevronDown, Building2, Layers, Check, Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Company, ViewState, CoaViewMode, CashSubView, ClientCategoryFilter, ClientStatusFilter, ClientTypeFilter, ClientMetadata } from '../types';
import { COMPANIES, getCompanyShortName } from '../utils';

interface TopBarProps {
    activeTab: ViewState;
    isConnected: boolean;
    startDate: Date;
    endDate: Date;
    setStart: (d: Date) => void;
    setEnd: (d: Date) => void;
    selectedCompany: Company | 'all';
    setSelectedCompany: (c: Company | 'all') => void;
    selectedCostCenters: string[];
    setSelectedCostCenters: (cc: string[]) => void;
    availableCostCenters: string[];
    activeViewMode: CoaViewMode;
    setActiveViewMode: (mode: CoaViewMode) => void;
    activeSubView: CashSubView;
    setActiveSubView: (mode: CashSubView) => void;
    selectedClientCategory: ClientCategoryFilter;
    setSelectedClientCategory: (cat: ClientCategoryFilter) => void;
    selectedClientStatus?: ClientStatusFilter;
    setSelectedClientStatus?: (status: ClientStatusFilter) => void;
    selectedClientType?: ClientTypeFilter;
    setSelectedClientType?: (type: ClientTypeFilter) => void;
    selectedCities?: string[];
    setSelectedCities?: (cities: string[]) => void;
    availableCities?: string[];
    clientMetadata?: Record<string, ClientMetadata>;
}

const TopBar: React.FC<TopBarProps> = ({
    activeTab,
    isConnected,
    startDate,
    endDate,
    setStart,
    setEnd,
    selectedCompany,
    setSelectedCompany,
    selectedCostCenters,
    setSelectedCostCenters,
    availableCostCenters,
    activeViewMode,
    setActiveViewMode,
    activeSubView,
    setActiveSubView,
    selectedClientCategory,
    setSelectedClientCategory,
    selectedClientStatus,
    setSelectedClientStatus,
    selectedClientType,
    setSelectedClientType,
    selectedCities,
    setSelectedCities,
    availableCities,
    clientMetadata
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isCcDropdownOpen, setIsCcDropdownOpen] = useState(false);
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [ccSearchTerm, setCcSearchTerm] = useState('');

    const isCoa = activeTab === 'coa';
    const isStatement = activeTab === 'statement';
    const isSimulations = activeTab === 'simulations';
    const isContractAnalysis = activeTab === 'contract_analysis';
    const isKpi = activeTab === 'kpis';
    const isBudget = activeTab === 'budget';
    const isDashboard = activeTab === 'dashboard';
    const isAdministrative = activeTab === 'administrative';

    const filteredCostCenters = useMemo(() => {
        let centers = availableCostCenters;

        if (isAdministrative && clientMetadata) {
            centers = centers.filter(cc => {
                const meta = clientMetadata[cc];
                const category = meta ? meta.category : 'administrative';
                return category === 'administrative';
            });
        }

        if (ccSearchTerm.trim() !== '') {
            const searchLower = ccSearchTerm.toLowerCase();
            centers = centers.filter(cc => cc.toLowerCase().includes(searchLower));
        }

        return centers;
    }, [isAdministrative, availableCostCenters, clientMetadata, ccSearchTerm]);

    const toggleCostCenter = (cc: string) => {
        if (selectedCostCenters.includes(cc)) {
            setSelectedCostCenters(selectedCostCenters.filter(c => c !== cc));
        } else {
            setSelectedCostCenters([...selectedCostCenters, cc]);
        }
    };

    const toggleCity = (city: string) => {
        if (!setSelectedCities || !selectedCities) return;
        if (selectedCities.includes(city)) {
            setSelectedCities(selectedCities.filter(c => c !== city));
        } else {
            setSelectedCities([...selectedCities, city]);
        }
    };

    const navigateStartMonth = (direction: 'prev' | 'next') => {
        const newDate = direction === 'prev' ? subMonths(startDate, 1) : addMonths(startDate, 1);
        setStart(startOfMonth(newDate));
    };

    const navigateEndMonth = (direction: 'prev' | 'next') => {
        const newDate = direction === 'prev' ? subMonths(endDate, 1) : addMonths(endDate, 1);
        setEnd(endOfMonth(newDate));
    };

    const getTabTitle = () => {
        switch(activeTab) {
            case 'files': return 'Importação de Arquivos';
            case 'dashboard': return 'Visão Geral';
            case 'statement': return 'Extrato Financeiro';
            case 'simulations': return 'Simulações e Cenários';
            case 'contract_analysis': return 'Análise de Contratos';
            case 'coa': return 'Plano de Contas';
            case 'budget': return 'Controle Orçamentário';
            case 'administrative': return 'Administrativo';
            case 'kpis': return 'Indicadores (KPIs)';
            case 'settings': return 'Configurações do Sistema';
            default: return 'Dashboard';
        }
    };

    return (
        <div className="sticky top-0 z-40 px-6 py-3 bg-[#F5F5F7]/90 backdrop-blur-md shrink-0 border-b border-slate-200/50 transition-all overflow-visible">
             <div className="mb-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                    {getTabTitle()}
                </h2>
                <p className="text-xs text-slate-400 font-medium">Gestão Financeira Inteligente</p>
            </div>

            {!isDashboard && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide overflow-y-visible">

                 {/* Client Type Filter */}
                 <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                    <button onClick={() => setSelectedClientCategory('all')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientCategory === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                    <button onClick={() => setSelectedClientCategory('client')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientCategory === 'client' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Clientes</button>
                    <button onClick={() => setSelectedClientCategory('administrative')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientCategory === 'administrative' ? 'bg-slate-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Adm</button>
                 </div>

                 {(isStatement || isSimulations || isCoa || isKpi || isAdministrative) && (
                    <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                        <button onClick={() => setActiveViewMode('cash')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeViewMode === 'cash' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Caixa</button>
                        <button onClick={() => setActiveViewMode('accrual')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeViewMode === 'accrual' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Competência</button>
                    </div>
                 )}

                 {((isStatement || isSimulations || isCoa || isKpi || isAdministrative) && activeViewMode === 'cash') && (
                    <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                        <button onClick={() => setActiveSubView('all')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeSubView === 'all' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Ambos</button>
                        <button onClick={() => setActiveSubView('realized')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeSubView === 'realized' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Real.</button>
                        <button onClick={() => setActiveSubView('projected')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeSubView === 'projected' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Prev.</button>
                    </div>
                 )}

                 {/* KPI & COA & Contract Analysis Specific Filter: Client Status */}
                 {(isKpi || isCoa || isContractAnalysis) && setSelectedClientStatus && (
                     <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                        <button onClick={() => setSelectedClientStatus('all')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientStatus === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                        <button onClick={() => setSelectedClientStatus('active')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientStatus === 'active' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Ativos</button>
                        <button onClick={() => setSelectedClientStatus('inactive')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientStatus === 'inactive' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Inativos</button>
                     </div>
                 )}

                 {/* KPI Specific Filter: Client Type (Public/Private) */}
                 {isKpi && setSelectedClientType && (
                     <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                        <button onClick={() => setSelectedClientType('all')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientType === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                        <button onClick={() => setSelectedClientType('public')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientType === 'public' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Público</button>
                        <button onClick={() => setSelectedClientType('private')} className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedClientType === 'private' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Privado</button>
                     </div>
                 )}

                 {/* KPI & COA Specific Filter: Cities */}
                 {(isKpi || isCoa) && availableCities && setSelectedCities && selectedCities && (
                     <div className="relative shrink-0">
                        <button
                            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-100"
                            id="city-picker-button"
                        >
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{selectedCities.length === 0 ? 'Cidades' : `${selectedCities.length}`}</span>
                            <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                        {isCityDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsCityDropdownOpen(false)}
                                />
                                <div
                                    className="fixed mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
                                    style={{
                                        top: document.getElementById('city-picker-button')?.getBoundingClientRect().bottom ?? 0,
                                        left: document.getElementById('city-picker-button')?.getBoundingClientRect().left ?? 0
                                    }}
                                >
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={() => setSelectedCities(availableCities)} className="flex-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors">Selecionar Todas</button>
                                        <button onClick={() => setSelectedCities([])} className="flex-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg transition-colors">Limpar</button>
                                    </div>
                                    <div className="space-y-1">
                                        {availableCities.map(city => (
                                            <div key={city} onClick={() => toggleCity(city)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs text-slate-700 transition-colors">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCities.includes(city) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                    {selectedCities.includes(city) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="truncate" title={city}>{city}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                 )}

                <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0">
                    {(isKpi || isBudget) ? (
                        <div className="flex items-center gap-2 border-r border-slate-100 px-1.5 mr-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <div className="flex items-center gap-1">
                                <button onClick={() => navigateStartMonth('prev')} className="p-0.5 hover:bg-slate-100 rounded transition-colors">
                                    <ChevronLeft className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                                </button>
                                <span className="text-[11px] font-bold text-slate-600 min-w-[45px] text-center">
                                    {format(startDate, 'MM/yy')}
                                </span>
                                <button onClick={() => navigateStartMonth('next')} className="p-0.5 hover:bg-slate-100 rounded transition-colors">
                                    <ChevronRight className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                                </button>
                            </div>
                            <span className="text-slate-400 text-[11px]">-</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => navigateEndMonth('prev')} className="p-0.5 hover:bg-slate-100 rounded transition-colors">
                                    <ChevronLeft className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                                </button>
                                <span className="text-[11px] font-bold text-slate-600 min-w-[45px] text-center">
                                    {format(endDate, 'MM/yy')}
                                </span>
                                <button onClick={() => navigateEndMonth('next')} className="p-0.5 hover:bg-slate-100 rounded transition-colors">
                                    <ChevronRight className="w-3 h-3 text-slate-500 hover:text-slate-700" />
                                </button>
                            </div>
                        </div>
                    ) : (isSimulations || isStatement) ? (
                        <div className="flex items-center gap-2 border-r border-slate-100 px-1.5 mr-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <input
                                type="date"
                                value={format(startDate, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    const [year, month, day] = e.target.value.split('-').map(Number);
                                    setStart(new Date(year, month - 1, day));
                                }}
                                className="text-[11px] font-bold text-slate-600 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                            />
                            <span className="text-slate-400 text-[11px]">-</span>
                            <input
                                type="date"
                                value={format(endDate, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    const [year, month, day] = e.target.value.split('-').map(Number);
                                    setEnd(new Date(year, month - 1, day));
                                }}
                                className="text-[11px] font-bold text-slate-600 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                            />
                        </div>
                    ) : (isCoa || isContractAnalysis || isAdministrative) ? (
                        <div className="flex items-center gap-2 border-r border-slate-100 px-1.5 mr-1">
                            <Calendar className="w-3 h-3 text-slate-500" />

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => navigateStartMonth('prev')}
                                    className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                                    title="Mês anterior"
                                >
                                    <ChevronLeft className="w-3 h-3 text-slate-600" />
                                </button>
                                <span className="text-[11px] font-bold text-slate-600 min-w-[38px] text-center">
                                    {format(startDate, 'MM/yy')}
                                </span>
                                <button
                                    onClick={() => navigateStartMonth('next')}
                                    className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                                    title="Próximo mês"
                                >
                                    <ChevronRight className="w-3 h-3 text-slate-600" />
                                </button>
                            </div>

                            <span className="text-slate-400 text-[11px]">-</span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => navigateEndMonth('prev')}
                                    className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                                    title="Mês anterior"
                                >
                                    <ChevronLeft className="w-3 h-3 text-slate-600" />
                                </button>
                                <span className="text-[11px] font-bold text-slate-600 min-w-[38px] text-center">
                                    {format(endDate, 'MM/yy')}
                                </span>
                                <button
                                    onClick={() => navigateEndMonth('next')}
                                    className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                                    title="Próximo mês"
                                >
                                    <ChevronRight className="w-3 h-3 text-slate-600" />
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-1.5 px-1.5 border-r border-slate-100">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <select className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:ring-0 cursor-pointer outline-none" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value as any)}>
                            <option value="all">Todas</option>
                            {COMPANIES.map(c => <option key={c} value={c}>{getCompanyShortName(c)}</option>)}
                        </select>
                    </div>

                    <div className={`relative px-1.5`}>
                        <button
                            onClick={() => setIsCcDropdownOpen(!isCcDropdownOpen)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                            id="cost-center-picker-button"
                        >
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span className="whitespace-nowrap">{selectedCostCenters.length === 0 ? 'Centros' : `${selectedCostCenters.length}`}</span>
                            <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                        {isCcDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsCcDropdownOpen(false)}
                                />
                                <div
                                    className="fixed mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
                                    style={{
                                        top: document.getElementById('cost-center-picker-button')?.getBoundingClientRect().bottom ?? 0,
                                        left: document.getElementById('cost-center-picker-button')?.getBoundingClientRect().left ?? 0
                                    }}
                                >
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Filtrar..."
                                            className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                                            value={ccSearchTerm}
                                            onChange={(e) => setCcSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={() => setSelectedCostCenters(filteredCostCenters)} className="flex-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors">Selecionar Todos</button>
                                        <button onClick={() => setSelectedCostCenters([])} className="flex-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg transition-colors">Limpar</button>
                                    </div>
                                    <div className="space-y-1">
                                        {filteredCostCenters.map(cc => (
                                            <div key={cc} onClick={() => toggleCostCenter(cc)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs text-slate-700 transition-colors">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCostCenters.includes(cc) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                    {selectedCostCenters.includes(cc) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="truncate" title={cc}>{cc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default TopBar;
