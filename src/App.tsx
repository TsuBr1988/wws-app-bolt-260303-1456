import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/auth/LoginPage';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { WelcomePage } from '@/pages/WelcomePage';
import { RHPage } from '@/pages/RHPage';
import { ComprasPage } from '@/pages/ComprasPage';
import { OperacionalPage } from '@/pages/OperacionalPage';
import { ComercialPage } from '@/pages/ComercialPage';
import { FinanceiroPage } from '@/pages/FinanceiroPage';
import { FinancasPage } from '@/pages/FinancasPage';
import { QualidadePage } from '@/pages/QualidadePage';
import { ConfiguracoesPage } from '@/pages/ConfiguracoesPage';
import { ContractsPage } from '@/pages/ContractsPage';
import CulturaPage from '@/pages/CulturaPage';
import { AtasAcoesPage } from '@/pages/AtasAcoesPage';
import { TIPage } from '@/pages/TIPage';

function App() {
  const { user, loading, hasPageAccess } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return saved || 'home';
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const tabs = [
    { value: 'rh', label: 'RH', page: 'rh', component: <RHPage /> },
    { value: 'operacional', label: 'Operacional', page: 'operacional', component: <OperacionalPage /> },
    { value: 'comercial', label: 'Comercial', page: 'comercial', component: <ComercialPage /> },
    { value: 'compras', label: 'Compras', page: 'compras', component: <ComprasPage /> },
    { value: 'financas', label: 'Finanças', page: 'financas', component: <FinancasPage /> },
    { value: 'qualidade', label: 'Qualidade', page: 'qualidade', component: <QualidadePage /> },
    { value: 'contratos', label: 'Contratos', page: 'contracts', component: <ContractsPage /> },
    { value: 'cultura', label: 'Cultura', page: 'cultura', component: <CulturaPage /> },
    { value: 'atas-acoes', label: 'Atas e Ações', page: 'atas-acoes', component: <AtasAcoesPage /> },
    { value: 'ti', label: 'TI', page: 'ti', component: <TIPage /> },
  ];

  const availableTabs = tabs.filter(tab => {
    if (tab.page === 'comercial') {
      return hasPageAccess('comercial_publico') || hasPageAccess('comercial_privado');
    }
    return hasPageAccess(tab.page);
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('activeTab', value);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        onSettingsClick={() => setActiveTab('configuracoes')}
        isSettingsActive={activeTab === 'configuracoes'}
        onLogoClick={() => setActiveTab('home')}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        availableTabs={availableTabs}
      />
      <main className={
        activeTab === 'financas' || activeTab === 'comercial' || activeTab === 'qualidade' || activeTab === 'ti'
          ? 'w-full'
          : 'container mx-auto px-2 sm:px-4 py-4 sm:py-8'
      }>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="home">
            <WelcomePage onNavigate={setActiveTab} />
          </TabsContent>

          {availableTabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.component}
            </TabsContent>
          ))}

          {user.is_admin && (
            <TabsContent value="configuracoes">
              <ConfiguracoesPage />
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}

export default App;