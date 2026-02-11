import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { QualidadeViewState } from './types';

import Sidebar from './components/Sidebar';
import PoliticaTab from './components/tabs/PoliticaTab';
import ContextosTab from './components/tabs/ContextosTab';
import RiscosTab from './components/tabs/RiscosTab';
import DocumentosTab from './components/tabs/DocumentosTab';
import ProcessosTab from './components/tabs/ProcessosTab';
import ProcedimentosTab from './components/tabs/ProcedimentosTab';
import RNCTab from './components/tabs/RNCTab';
import PesquisaTab from './components/tabs/PesquisaTab';
import MudancasTab from './components/tabs/MudancasTab';
import PropriedadeTab from './components/tabs/PropriedadeTab';
import AtaTab from './components/tabs/AtaTab';

const App = () => {
  const { hasIndicatorAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<QualidadeViewState>('politica');

  const tabToIndicator: Record<QualidadeViewState, string> = {
    'politica': 'Política da Qualidade',
    'contextos': 'Contextos e Partes',
    'riscos': 'Riscos e Oportunidades',
    'documentos': 'Informação Documentada',
    'processos': 'Mapas de Processos',
    'procedimentos': 'Procedimentos',
    'rnc': 'RNC',
    'pesquisa': 'Pesquisa de Satisfação',
    'mudancas': 'Controle de Mudanças',
    'propriedade': 'Propriedade de Terceiros',
    'ata': 'Ata de Análise Crítica'
  };

  const canViewTab = (tab: QualidadeViewState): boolean => {
    const indicatorName = tabToIndicator[tab];
    if (!indicatorName) return true;
    return hasIndicatorAccess('qualidade', indicatorName);
  };

  return (
    <div className="flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasIndicatorAccess={hasIndicatorAccess}
      />

      <main className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-white">
        {activeTab === 'politica' && canViewTab('politica') && <PoliticaTab />}
        {activeTab === 'contextos' && canViewTab('contextos') && <ContextosTab />}
        {activeTab === 'riscos' && canViewTab('riscos') && <RiscosTab />}
        {activeTab === 'documentos' && canViewTab('documentos') && <DocumentosTab />}
        {activeTab === 'processos' && canViewTab('processos') && <ProcessosTab />}
        {activeTab === 'procedimentos' && canViewTab('procedimentos') && <ProcedimentosTab />}
        {activeTab === 'rnc' && canViewTab('rnc') && <RNCTab />}
        {activeTab === 'pesquisa' && canViewTab('pesquisa') && <PesquisaTab />}
        {activeTab === 'mudancas' && canViewTab('mudancas') && <MudancasTab />}
        {activeTab === 'propriedade' && canViewTab('propriedade') && <PropriedadeTab />}
        {activeTab === 'ata' && canViewTab('ata') && <AtaTab />}
      </main>
    </div>
  );
};

export default App;
