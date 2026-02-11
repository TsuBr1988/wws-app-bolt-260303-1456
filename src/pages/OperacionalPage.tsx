import { useState } from 'react';
import { Settings, FileText, UserCheck, Building } from 'lucide-react';
import { FTsCard } from '@/components/indicators/FTsCard';
import { SupervisorVisitsCard } from '@/components/indicators/SupervisorVisitsCard';
import { ClientVisitsCard } from '@/components/indicators/ClientVisitsCard';
import { useAuth } from '@/hooks/useAuth';

type OperacionalTab = 'fts' | 'visitas-supervisor' | 'visitas-cliente';

const OperacionalSidebar = ({ activeTab, setActiveTab, hasAccess }: {
  activeTab: OperacionalTab;
  setActiveTab: (tab: OperacionalTab) => void;
  hasAccess: (indicator: string) => boolean;
}) => {
  const menuItems = [
    { id: 'fts', label: 'FTs Abertas', icon: FileText, color: 'text-orange-500', indicator: 'FTs Abertas' },
    { id: 'visitas-supervisor', label: 'Visitas Supervisor', icon: UserCheck, color: 'text-blue-500', indicator: 'Visitas Supervisor' },
    { id: 'visitas-cliente', label: 'Visitas Cliente', icon: Building, color: 'text-emerald-500', indicator: 'Visitas Cliente' }
  ];

  const availableItems = menuItems.filter(item => hasAccess(item.indicator));

  return (
    <div className="w-48 bg-zinc-900/95 backdrop-blur-xl text-slate-300 flex flex-col fixed left-0 top-0 h-screen z-20 border-r border-white/5 shadow-2xl transition-all duration-300">
      <div className="h-20 flex items-center px-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mr-2 shadow-lg shadow-orange-500/20">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Operacional</h1>
          <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Menu</p>

        {availableItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as OperacionalTab)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-white/10 text-white shadow-lg shadow-black/5'
                  : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-orange-500 rounded-r-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}

              <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-3 border border-white/5 shadow-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-300">Sistema Online</span>
          </div>
          <p className="text-[9px] text-zinc-500 leading-relaxed">
            Indicadores de performance operacional.
          </p>
        </div>
      </div>
    </div>
  );
};

export function OperacionalPage() {
  const { hasIndicatorAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<OperacionalTab>(() => {
    if (hasIndicatorAccess('Operacional', 'FTs Abertas')) return 'fts';
    if (hasIndicatorAccess('Operacional', 'Visitas Supervisor')) return 'visitas-supervisor';
    return 'visitas-cliente';
  });

  const hasAccess = (indicator: string) => hasIndicatorAccess('Operacional', indicator);

  return (
    <div className="flex text-slate-900 font-sans min-h-[calc(100vh-80px)]">
      <OperacionalSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasAccess={hasAccess}
      />

      <main className="flex-1 ml-48 p-3">
        {activeTab === 'fts' && hasAccess('FTs Abertas') && <FTsCard />}
        {activeTab === 'visitas-supervisor' && hasAccess('Visitas Supervisor') && <SupervisorVisitsCard />}
        {activeTab === 'visitas-cliente' && hasAccess('Visitas Cliente') && <ClientVisitsCard />}
      </main>
    </div>
  );
}
