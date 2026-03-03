import { useState } from 'react';
import { Users, TrendingUp, UserCheck, UserMinus, AlertCircle, Scale, Briefcase } from 'lucide-react';
import { HrTurnoverCard } from '@/components/indicators/HrTurnoverCard';
import { HrContractVsEffectiveCard } from '@/components/indicators/HrContractVsEffectiveCard';
import { HrAbsenteeismCard } from '@/components/indicators/HrAbsenteeismCard';
import { HrSeveranceCard } from '@/components/indicators/HrSeveranceCard';
import { HrLaborLawsuitsCard } from '@/components/indicators/HrLaborLawsuitsCard';
import { OrganogramCard } from '@/components/indicators/OrganogramCard';
import { useAuth } from '@/hooks/useAuth';

type RHTab = 'organograma' | 'turnover' | 'contratado-efetivo' | 'absenteismo' | 'rescisoes' | 'acoes-trabalhistas';

const RHSidebar = ({ activeTab, setActiveTab, hasAccess }: {
  activeTab: RHTab;
  setActiveTab: (tab: RHTab) => void;
  hasAccess: (indicator: string) => boolean;
}) => {
  const menuItems = [
    { id: 'organograma', label: 'Organograma', icon: Briefcase, color: 'text-tecnologia', indicator: 'Organograma' },
    { id: 'turnover', label: 'Turnover', icon: TrendingUp, color: 'text-seguranca', indicator: 'Turnover' },
    { id: 'contratado-efetivo', label: 'Contratado vs Efetivo', icon: UserCheck, color: 'text-parking', indicator: 'Contratado vs Efetivo' },
    { id: 'absenteismo', label: 'Absenteísmo', icon: AlertCircle, color: 'text-facilities', indicator: 'Absenteísmo' },
    { id: 'rescisoes', label: 'Rescisões', icon: UserMinus, color: 'text-tecnologia', indicator: 'Rescisões' },
    { id: 'acoes-trabalhistas', label: 'Ações Trabalhistas', icon: Scale, color: 'text-facilities-dark', indicator: 'Ações Trabalhistas' }
  ];

  const availableItems = menuItems.filter(item => hasAccess(item.indicator));

  return (
    <div className="w-48 bg-brand-dark text-slate-300 flex flex-col fixed left-0 top-0 h-screen z-20 border-r border-gray-700 shadow-2xl transition-all duration-300">
      <div className="h-20 flex items-center px-4 border-b border-gray-700">
        <div className="gradient-ambiental w-8 h-8 rounded-xl flex items-center justify-center mr-2 shadow-lg">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight">RH</h1>
          <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Menu</p>

        {availableItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as RHTab)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-ambiental rounded-r-full shadow-lg" />}

              <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export function RHPage() {
  const { hasIndicatorAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<RHTab>(() => {
    if (hasIndicatorAccess('RH', 'Organograma')) return 'organograma';
    if (hasIndicatorAccess('RH', 'Turnover')) return 'turnover';
    if (hasIndicatorAccess('RH', 'Contratado vs Efetivo')) return 'contratado-efetivo';
    if (hasIndicatorAccess('RH', 'Absenteísmo')) return 'absenteismo';
    if (hasIndicatorAccess('RH', 'Rescisões')) return 'rescisoes';
    return 'acoes-trabalhistas';
  });

  const hasAccess = (indicator: string) => hasIndicatorAccess('RH', indicator);

  return (
    <div className="flex text-slate-900 font-sans min-h-[calc(100vh-80px)]">
      <RHSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasAccess={hasAccess}
      />

      <main className="flex-1 ml-48 p-3">
        {activeTab === 'organograma' && hasAccess('Organograma') && <OrganogramCard />}
        {activeTab === 'turnover' && hasAccess('Turnover') && <HrTurnoverCard />}
        {activeTab === 'contratado-efetivo' && hasAccess('Contratado vs Efetivo') && <HrContractVsEffectiveCard />}
        {activeTab === 'absenteismo' && hasAccess('Absenteísmo') && <HrAbsenteeismCard />}
        {activeTab === 'rescisoes' && hasAccess('Rescisões') && <HrSeveranceCard />}
        {activeTab === 'acoes-trabalhistas' && hasAccess('Ações Trabalhistas') && <HrLaborLawsuitsCard />}
      </main>
    </div>
  );
}
