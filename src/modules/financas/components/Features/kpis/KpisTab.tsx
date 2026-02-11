
import React, { useState } from 'react';
import { Trophy, Building2, Landmark, Users, Briefcase, BarChart3, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';
import MetricCard from '../../../MetricCard';
import KPIDetailChartModal from '../../../KPIDetailChartModal';
import ClientListModal from './components/ClientListModal';
import ClientCoaModal from './components/ClientCoaModal';
import CityResultsCard from '../../CityResultsCard';
import { formatCurrency } from '../../../utils';
import { Transaction, CoaViewMode, CashSubView, Company, ClientCategoryFilter, ClientStatusFilter, ClientTypeFilter } from '../../../types';

interface KpisTabProps {
    kpiData: any;
    data: Transaction[];
    startDate: Date;
    endDate: Date;
    viewMode: CoaViewMode;
    cashSubView: CashSubView;
    categoryRenames: Record<string, string>;
    selectedCities?: string[];
    clientMetadata?: Record<string, any>;
    selectedCompany: Company | 'all';
    selectedCostCenters: string[];
    selectedClientCategory?: ClientCategoryFilter;
    selectedClientStatus?: ClientStatusFilter;
    selectedClientType?: ClientTypeFilter;
}

const KpisTab: React.FC<KpisTabProps> = ({
    kpiData,
    data,
    startDate,
    endDate,
    viewMode,
    cashSubView,
    categoryRenames,
    selectedCities,
    clientMetadata,
    selectedCompany,
    selectedCostCenters,
    selectedClientCategory,
    selectedClientStatus,
    selectedClientType
}) => {
    const [kpiListModalType, setKpiListModalType] = useState<'positive' | 'negative' | null>(null);
    const [selectedKpiClient, setSelectedKpiClient] = useState<string | null>(null);
    const [kpiDetailModalData, setKpiDetailModalData] = useState<{title: string, data: {name: string, value: number}[], averageValue?: number} | null>(null);

    return (
        <div className="px-10 py-6 animate-fade-in pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <MetricCard 
                  title="Faturamento Total" 
                  value={kpiData.totalRev} 
                  subtitle="Clientes" 
                  icon={Trophy} 
                  type="info" 
                  onInfoClick={() => setKpiDetailModalData({
                      title: "Faturamento Total - Detalhamento",
                      data: kpiData.charts.total,
                      averageValue: kpiData.totalRev
                  })}
                />
                <MetricCard 
                  title="Faturamento WWS" 
                  value={kpiData.revWWS} 
                  subtitle="Serviços" 
                  icon={Building2} 
                  type="success"
                  onInfoClick={() => setKpiDetailModalData({
                      title: "Faturamento WWS Services",
                      data: kpiData.charts.wws,
                      averageValue: kpiData.revWWS
                  })}
                />
                <MetricCard 
                  title="Faturamento Worldwide" 
                  value={kpiData.revWorldwide} 
                  subtitle="Segurança" 
                  icon={Landmark} 
                  type="warning" 
                  onInfoClick={() => setKpiDetailModalData({
                      title: "Faturamento Worldwide Segurança",
                      data: kpiData.charts.worldwide,
                      averageValue: kpiData.revWorldwide
                  })}
                />

                                <MetricCard 
                                    title="Faturamento 2WS" 
                                    value={kpiData.rev2WS} 
                                    subtitle="2WS" 
                                    icon={Building2} 
                                    type="neutral" 
                                    onInfoClick={() => setKpiDetailModalData({
                                            title: "Faturamento 2WS",
                                            data: kpiData.charts.twoWs,
                                            averageValue: kpiData.rev2WS
                                    })}
                                />
            </div>
  
            <div className="grid grid-cols-3 gap-6 mb-6">
                <MetricCard 
                  title="Faturamento Público" 
                  value={kpiData.revPublic} 
                  subtitle="Setor Público" 
                  icon={Users} 
                  type="neutral"
                  onInfoClick={() => setKpiDetailModalData({
                      title: "Faturamento Setor Público",
                      data: kpiData.charts.public,
                      averageValue: kpiData.revPublic
                  })}
                />
                <MetricCard 
                  title="Faturamento Privado" 
                  value={kpiData.revPrivate} 
                  subtitle="Setor Privado" 
                  icon={Briefcase} 
                  type="neutral"
                  onInfoClick={() => setKpiDetailModalData({
                      title: "Faturamento Setor Privado",
                      data: kpiData.charts.private,
                      averageValue: kpiData.revPrivate
                  })}
                />
                <div className={`bg-white p-7 rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-50/50`}>
                     <div className="flex justify-between items-center mb-4">
                          <div className={`p-3.5 rounded-2xl bg-indigo-50 text-indigo-500`}>
                               <BarChart3 className="w-6 h-6" />
                          </div>
                          <span className="px-3 py-1 rounded-full bg-slate-50 text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
                               Margem de Contribuição
                          </span>
                     </div>
                     <div>
                          <p className="text-sm font-medium text-slate-400 mb-1">Resultado Operacional</p>
                          <h3 className={`text-3xl font-bold tracking-tight ${kpiData.totalMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(kpiData.totalMargin)}
                          </h3>
                           <div className="mt-2 text-xs font-medium text-slate-400">
                               {((kpiData.totalMargin / (kpiData.totalRev || 1)) * 100).toFixed(1)}% do Faturamento
                           </div>
                     </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Top 3 Margens Positivas</h3>
                        </div>
                        <button 
                          onClick={() => setKpiListModalType('positive')}
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {kpiData.top3Positive.length > 0 ? kpiData.top3Positive.map((m: any, i: number) => (
                            <div key={i} onClick={() => setSelectedKpiClient(m.name)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold text-emerald-600 shadow-sm flex-shrink-0">{i+1}</span>
                                    <span className="text-xs font-medium text-slate-700 truncate" title={m.name}>{m.name}</span>
                                </div>
                                <span className="text-sm font-bold text-emerald-600 ml-2 flex-shrink-0">{formatCurrency(m.margin)}</span>
                            </div>
                        )) : (
                            <div className="text-center text-slate-400 text-sm py-4">Nenhum contrato com margem positiva</div>
                        )}
                    </div>
                </div>
  
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Top 3 Margens Negativas</h3>
                        </div>
                        <button 
                          onClick={() => setKpiListModalType('negative')}
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {kpiData.top3Negative.length > 0 ? kpiData.top3Negative.map((m: any, i: number) => (
                            <div key={i} onClick={() => setSelectedKpiClient(m.name)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold text-rose-600 shadow-sm flex-shrink-0">{i+1}</span>
                                    <span className="text-xs font-medium text-slate-700 truncate" title={m.name}>{m.name}</span>
                                </div>
                                <span className="text-sm font-bold text-rose-600 ml-2 flex-shrink-0">{formatCurrency(m.margin)}</span>
                            </div>
                        )) : (
                            <div className="text-center text-slate-400 text-sm py-4">Nenhum contrato com margem negativa</div>
                        )}
                    </div>
                </div>
            </div>
            
             <div className="grid grid-cols-2 gap-6">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem]">
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="text-sm font-bold text-emerald-800 mb-1">Total Margem Positiva</p>
                             <h3 className="text-2xl font-bold text-emerald-700">{formatCurrency(kpiData.totalPositiveMargin)}</h3>
                             <p className="text-xs font-medium text-emerald-600 mt-1">{kpiData.countPositive} contratos</p>
                         </div>
                         <div className="p-2 bg-white rounded-full text-emerald-500 shadow-sm">
                             <TrendingUp className="w-5 h-5" />
                         </div>
                     </div>
                </div>
  
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem]">
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="text-sm font-bold text-rose-800 mb-1">Total Margem Negativa</p>
                             <h3 className="text-2xl font-bold text-rose-700">{formatCurrency(kpiData.totalNegativeMargin)}</h3>
                             <p className="text-xs font-medium text-rose-600 mt-1">{kpiData.countNegative} contratos</p>
                         </div>
                         <div className="p-2 bg-white rounded-full text-rose-500 shadow-sm">
                             <AlertCircle className="w-5 h-5" />
                         </div>
                     </div>
                </div>
            </div>

            <div className="mt-6">
                <CityResultsCard
                    data={data}
                    clientMetadata={clientMetadata || {}}
                    selectedCompany={selectedCompany}
                    selectedCostCenters={selectedCostCenters}
                    startDate={startDate}
                    endDate={endDate}
                    selectedClientCategory={selectedClientCategory}
                    selectedClientStatus={selectedClientStatus}
                    selectedClientType={selectedClientType}
                    selectedCities={selectedCities}
                />
            </div>

            {kpiListModalType && (
                <ClientListModal 
                    type={kpiListModalType}
                    clients={kpiListModalType === 'positive' 
                        ? kpiData.allMargins.filter((m: any) => m.margin > 0).sort((a: any,b: any) => b.margin - a.margin)
                        : kpiData.allMargins.filter((m: any) => m.margin < 0).sort((a: any,b: any) => a.margin - b.margin)
                    }
                    onClose={() => setKpiListModalType(null)}
                    onClientClick={(name) => setSelectedKpiClient(name)}
                />
            )}
  
            {selectedKpiClient && (
                <ClientCoaModal 
                    clientName={selectedKpiClient}
                    data={data}
                    startDate={startDate}
                    endDate={endDate}
                    viewMode={viewMode}
                    cashSubView={cashSubView}
                    onClose={() => setSelectedKpiClient(null)}
                    categoryRenames={categoryRenames}
                />
            )}
            
            {kpiDetailModalData && (
                <KPIDetailChartModal
                   title={kpiDetailModalData.title}
                   data={kpiDetailModalData.data}
                   averageValue={kpiDetailModalData.averageValue}
                   showAverage={kpiData.charts.monthsCount > 1}
                   onClose={() => setKpiDetailModalData(null)}
                />
            )}
        </div>
    );
};

export default KpisTab;
