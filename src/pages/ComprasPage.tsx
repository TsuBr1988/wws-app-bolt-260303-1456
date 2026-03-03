import React, { useState } from 'react';
import { ShoppingCart, Shirt, Droplet, Shield, Wrench, Fuel, CreditCard, Building2 } from 'lucide-react';
import { UniformsCard } from '@/components/indicators/UniformsCard';
import { CleaningMaterialsCard } from '@/components/indicators/CleaningMaterialsCard';
import { EPIsCard } from '@/components/indicators/EPIsCard';
import { EquipamentosCard } from '@/components/indicators/EquipamentosCard';
import { CombustivelCard } from '@/components/indicators/CombustivelCard';
import { SemPararCard } from '@/components/indicators/SemPararCard';
import { useAuth } from '@/hooks/useAuth';

type ComprasTab = 'uniformes' | 'limpeza' | 'epis' | 'equipamentos' | 'combustivel' | 'sem-parar';

const ComprasSidebar = ({ activeTab, setActiveTab, hasAccess }: {
  activeTab: ComprasTab;
  setActiveTab: (tab: ComprasTab) => void;
  hasAccess: (indicator: string) => boolean;
}) => {
  const menuItems = [
    { id: 'uniformes', label: 'Uniformes', icon: Shirt, color: 'text-teal-500', indicator: 'Uniformes' },
    { id: 'limpeza', label: 'Materiais de Limpeza', icon: Droplet, color: 'text-blue-500', indicator: 'Material de Limpeza' },
    { id: 'epis', label: 'EPIs', icon: Shield, color: 'text-orange-500', indicator: 'EPIs' },
    { id: 'equipamentos', label: 'Equipamentos', icon: Wrench, color: 'text-purple-500', indicator: 'Equipamentos' },
    { id: 'combustivel', label: 'Combustível', icon: Fuel, color: 'text-rose-500', indicator: 'Combustível' },
    { id: 'sem-parar', label: 'Sem Parar', icon: CreditCard, color: 'text-indigo-500', indicator: 'Sem Parar' }
  ];

  const availableItems = menuItems.filter(item => hasAccess(item.indicator));

  return (
    <div className="w-48 bg-zinc-900/95 backdrop-blur-xl text-slate-300 flex flex-col fixed left-0 top-0 h-screen z-20 border-r border-white/5 shadow-2xl transition-all duration-300">
      <div className="h-20 flex items-center px-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mr-2 shadow-lg shadow-teal-500/20">
          <ShoppingCart className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Compras</h1>
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
              onClick={() => setActiveTab(item.id as ComprasTab)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-white/10 text-white shadow-lg shadow-black/5'
                  : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-500 rounded-r-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />}

              <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export function ComprasPage() {
  const { hasIndicatorAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<ComprasTab>(() => {
    if (hasIndicatorAccess('Compras', 'Uniformes')) return 'uniformes';
    if (hasIndicatorAccess('Compras', 'Material de Limpeza')) return 'limpeza';
    if (hasIndicatorAccess('Compras', 'EPIs')) return 'epis';
    if (hasIndicatorAccess('Compras', 'Equipamentos')) return 'equipamentos';
    if (hasIndicatorAccess('Compras', 'Combustível')) return 'combustivel';
    return 'sem-parar';
  });

  const hasAccess = (indicator: string) => hasIndicatorAccess('Compras', indicator);

  return (
    <div className="flex text-slate-900 font-sans min-h-[calc(100vh-80px)]">
      <ComprasSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasAccess={hasAccess}
      />

      <main className="flex-1 ml-48 overflow-auto">
        <div className="p-3">
          {activeTab === 'uniformes' && hasAccess('Uniformes') && <UniformsCard />}
          {activeTab === 'limpeza' && hasAccess('Material de Limpeza') && <CleaningMaterialsCard />}
          {activeTab === 'epis' && hasAccess('EPIs') && <EPIsCard />}
          {activeTab === 'equipamentos' && hasAccess('Equipamentos') && <EquipamentosCard />}
          {activeTab === 'combustivel' && hasAccess('Combustível') && <CombustivelCard />}
          {activeTab === 'sem-parar' && hasAccess('Sem Parar') && <SemPararCard />}
        </div>
      </main>
    </div>
  );
}
