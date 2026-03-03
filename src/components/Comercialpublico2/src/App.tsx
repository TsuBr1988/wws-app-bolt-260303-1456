import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Licitacoes } from './components/Licitacoes/Licitacoes';
import { ContractsPage } from '../../../pages/ContractsPage';
import { Commissions } from './components/Commissions/Commissions';
import { BonusFund } from './components/BonusFund/BonusFund';
import { EmployeeManagement } from './components/Employees/EmployeeManagement';
import { UserManagement } from './components/UserManagement/UserManagement';
import { Settings } from './components/Settings/Settings';
import { Challenges } from './components/Challenges/Challenges';
import { Certidoes } from './components/Certidoes/Certidoes';
import { Orcamentos } from './components/Orcamentos/Orcamentos';
import { Notificacoes } from './components/Notificacoes/Notificacoes';
import { Tarefas } from './components/Tarefas/Tarefas';
import { LembreteLicitacoes } from './components/Dashboard/LembreteLicitacoes';
import { useSupabaseQuery } from './hooks/useSupabase';
import { useAccess } from './contexts/AccessContext';

const menuItems = [
  { id: 'dashboard', permissionName: 'Dashboard', adminOnly: false },
  { id: 'licitacoes', permissionName: 'Licitações', adminOnly: false },
  { id: 'notificacoes', permissionName: 'Notificações', adminOnly: false },
  { id: 'contracts', permissionName: 'Contratos', adminOnly: true },
  { id: 'commissions', permissionName: 'Comissões', adminOnly: true },
  { id: 'bonus-fund', permissionName: 'Fundo de Bônus', adminOnly: true },
  { id: 'challenges', permissionName: 'Desafios', adminOnly: true },
  { id: 'certidoes', permissionName: 'Certidões', adminOnly: false },
  { id: 'tarefas', permissionName: 'Tarefas', adminOnly: false },
  { id: 'orcamentos', permissionName: 'Orçamentos', adminOnly: false },
  { id: 'settings', permissionName: 'Configurações', adminOnly: false },
];

function App() {
  const { isAuthenticated, accessType } = useAccess();
  const [activeTab, setActiveTab] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Definir a primeira aba disponível baseado nas permissões do usuário
  useEffect(() => {
    if (!isAuthenticated) return;

    const getUserPermissions = () => {
      try {
        const storedUser = localStorage.getItem('app_user');
        if (!storedUser) return null;

        const user = JSON.parse(storedUser);

        if (user.is_admin) {
          return { is_admin: true };
        }

        const storedPermissions = localStorage.getItem('app_user_permissions');
        return storedPermissions ? JSON.parse(storedPermissions) : null;
      } catch (error) {
        console.error('Error loading permissions:', error);
        return null;
      }
    };

    const hasIndicatorAccess = (indicatorName: string, permissions: any): boolean => {
      if (!permissions) return false;
      if (permissions.is_admin) return true;

      const indicators = permissions.indicators?.['comercial_publico'];
      if (!indicators) return false;

      const level = indicators[indicatorName];
      return level === 'view' || level === 'edit';
    };

    const getFirstAvailableTab = (): string => {
      const userPermissions = getUserPermissions();

      for (const item of menuItems) {
        if (accessType === 'comercial' && item.adminOnly) {
          continue;
        }

        if (userPermissions && !hasIndicatorAccess(item.permissionName, userPermissions)) {
          continue;
        }

        return item.id;
      }

      return 'licitacoes';
    };

    if (!activeTab) {
      const firstTab = getFirstAvailableTab();
      setActiveTab(firstTab);
    }
  }, [isAuthenticated, accessType, activeTab]);

  // Desbloquear áudio na primeira interação do usuário
  useEffect(() => {
    const desbloquearAudio = () => {
      const audio = new Audio('/sounds/Som_alerta.mp3');
      audio.volume = 0;
      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log('🔓 Áudio desbloqueado pelo navegador');
        })
        .catch((err) => {
          console.warn('⚠️ Falha ao desbloquear áudio:', err);
        });
      
      window.removeEventListener('click', desbloquearAudio);
    };

    window.addEventListener('click', desbloquearAudio);
  }, []);

  // Buscar dados de performance semanal para passar para o componente EmployeeOfMonth
  const { data: weeklyPerformanceData = [] } = useSupabaseQuery('weekly_performance', {
    // Force refresh when key changes
    orderBy: { column: 'created_at', ascending: false }
  });

  // Function to refresh all data across the app
  const refreshAllData = () => {
    console.log('Refreshing all app data...');
    setRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Fechar sidebar no mobile após selecionar
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Não Configurado
            </h2>
            <p className="text-gray-600 mb-4">
              Seu usuário não possui um tipo de acesso configurado para o módulo Comercial Público.
            </p>
            <p className="text-sm text-gray-500">
              Entre em contato com o administrador do sistema para solicitar a configuração do seu acesso.
            </p>
          </div>
        </div>
      );
    }

    if (!activeTab) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={`dashboard-${refreshKey}`} />;
      case 'licitacoes':
        return <Licitacoes key={`licitacoes-${refreshKey}`} onDataChange={refreshAllData} />;
      case 'notificacoes':
        return <Notificacoes key={`notificacoes-${refreshKey}`} />;
      case 'contracts':
        return <ContractsPage key={`contracts-${refreshKey}`} modulo="COMERCIAL_PUBLICO" />;
      case 'commissions':
        return <Commissions key={`commissions-${refreshKey}`} />;
      case 'bonus-fund':
        return <BonusFund key={`bonus-fund-${refreshKey}`} />;
      case 'challenges':
        return <Challenges key={`challenges-${refreshKey}`} />;
      case 'certidoes':
        return <Certidoes key={`certidoes-${refreshKey}`} />;
      case 'tarefas':
        return <Tarefas key={`tarefas-${refreshKey}`} />;
      case 'orcamentos':
        return <Orcamentos key={`orcamentos-${refreshKey}`} />;
      case 'settings':
        return <Settings />;
      default:
        return <Licitacoes key={`licitacoes-${refreshKey}`} onDataChange={refreshAllData} />;
    }
  };

  if (!isAuthenticated) {
    return renderContent();
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sistema Global de Alertas de Licitações */}
      <LembreteLicitacoes />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => {
          setSidebarOpen(true);
          setSidebarExpanded(true);
        }}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-lg border border-gray-200"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-all duration-300 ease-in-out
        md:relative md:translate-x-0 md:block
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
          onClose={() => setSidebarOpen(false)}
          showCloseButton={true}
          expanded={true}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden h-16"></div> {/* Spacer for mobile menu button */}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;