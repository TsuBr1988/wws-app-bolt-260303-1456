import { FileText, ClipboardList, Package, Wrench, Shirt, Users, Settings } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasActiveBudget: boolean;
}

const tabs = [
  { id: 'novo' as TabType, label: 'Novo Orçamento', icon: FileText, enabled: true },
  { id: 'geral' as TabType, label: 'Orçamento Geral', icon: ClipboardList, enabled: false },
  { id: 'materiais' as TabType, label: 'Materiais', icon: Package, enabled: false },
  { id: 'equipamentos' as TabType, label: 'Equipamentos', icon: Wrench, enabled: false },
  { id: 'uniformes' as TabType, label: 'Uniformes', icon: Shirt, enabled: false },
  { id: 'posto' as TabType, label: 'Orçamento por Posto', icon: Users, enabled: false },
];

const configTab = { id: 'configuracoes' as TabType, label: 'Configurações', icon: Settings, enabled: true };

export const Sidebar = ({ activeTab, onTabChange, hasActiveBudget }: SidebarProps) => {
  return (
    <div className="w-64 bg-white shadow-xl border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Navegação</h2>
      </div>
      <nav className="flex-1 p-4 flex flex-col">
        <ul className="space-y-2 flex-1">
          {tabs.map((tab) => {
            const isEnabled = tab.id === 'novo' || hasActiveBudget;
            const Icon = tab.icon;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => isEnabled && onTabChange(tab.id)}
                  disabled={!isEnabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : isEnabled
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <button
            onClick={() => onTabChange(configTab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === configTab.id
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <configTab.icon size={20} />
            <span className="font-medium">{configTab.label}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
