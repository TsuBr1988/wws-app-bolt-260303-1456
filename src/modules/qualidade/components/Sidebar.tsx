import React from 'react';
import { FileText, Users, AlertTriangle, FolderOpen, GitBranch, FileCheck, AlertCircle, MessageSquare, RefreshCw, Package, FileSpreadsheet, ClipboardCheck } from 'lucide-react';
import { QualidadeViewState } from '../types';

interface SidebarProps {
  activeTab: QualidadeViewState;
  setActiveTab: (tab: QualidadeViewState) => void;
  hasIndicatorAccess: (page: string, indicator: string) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, hasIndicatorAccess }) => {
  const tabs = [
    { id: 'politica' as QualidadeViewState, label: 'Política da Qualidade', icon: FileText, indicator: 'Política da Qualidade' },
    { id: 'contextos' as QualidadeViewState, label: 'Contextos e Partes', icon: Users, indicator: 'Contextos e Partes' },
    { id: 'riscos' as QualidadeViewState, label: 'Riscos e Oportunidades', icon: AlertTriangle, indicator: 'Riscos e Oportunidades' },
    { id: 'documentos' as QualidadeViewState, label: 'Info. Documentada', icon: FolderOpen, indicator: 'Informação Documentada' },
    { id: 'processos' as QualidadeViewState, label: 'Mapas de Processos', icon: GitBranch, indicator: 'Mapas de Processos' },
    { id: 'procedimentos' as QualidadeViewState, label: 'Procedimentos', icon: FileCheck, indicator: 'Procedimentos' },
    { id: 'rnc' as QualidadeViewState, label: 'RNC', icon: AlertCircle, indicator: 'RNC' },
    { id: 'pesquisa' as QualidadeViewState, label: 'Pesquisa de Satisfação', icon: MessageSquare, indicator: 'Pesquisa de Satisfação' },
    { id: 'mudancas' as QualidadeViewState, label: 'Controle de Mudanças', icon: RefreshCw, indicator: 'Controle de Mudanças' },
    { id: 'propriedade' as QualidadeViewState, label: 'Propriedade de Terceiros', icon: Package, indicator: 'Propriedade de Terceiros' },
    { id: 'ata' as QualidadeViewState, label: 'Ata de Análise Crítica', icon: FileSpreadsheet, indicator: 'Ata de Análise Crítica' }
  ];

  return (
    <aside className="w-64 min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50 to-white border-r border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-300">
        <div className="gradient-seguranca p-2 rounded-lg shadow-md">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-brand-dark">Qualidade</h2>
      </div>
      <nav className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const canView = hasIndicatorAccess('qualidade', tab.indicator);

          if (!canView) return null;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-white text-brand-dark shadow-md border-2 border-gray-300'
                  : 'text-gray-600 hover:bg-white hover:text-brand-dark hover:shadow-md border-2 border-transparent'
              }`}
            >
              <div className={`${isActive ? 'gradient-seguranca' : 'bg-gray-200'} p-1.5 rounded-md transition-all ${isActive ? '' : 'group-hover:gradient-seguranca'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} />
              </div>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
