import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Proposals } from './components/Proposals/Proposals';
import { Commissions } from './components/Commissions/Commissions';
import { BonusFund } from './components/BonusFund/BonusFund';
import { Settings } from './components/Settings/Settings';
import { Challenges } from './components/Challenges/Challenges';
import { CommercialGoals } from './components/CommercialGoals/CommercialGoals';
import { OrcamentosApp } from './components/Budgets/OrcamentosApp';
import { Marketing } from './components/Marketing/Marketing';
import { AppBuildTag } from './components/AppBuildTag';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to refresh all data across the app
  const refreshAllData = () => {
    console.log('Refreshing all app data...');
    setRefreshKey(prev => prev + 1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    closeSidebar(); // Fechar sidebar ao selecionar uma aba
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={`dashboard-${refreshKey}`} />;
      case 'commercial-goals':
        return <CommercialGoals key={`commercial-goals-${refreshKey}`} />;
      case 'proposals':
        return <Proposals key={`proposals-${refreshKey}`} onDataChange={refreshAllData} />;
      case 'marketing':
        return <Marketing key={`marketing-${refreshKey}`} />;
      case 'commissions':
        return <Commissions key={`commissions-${refreshKey}`} />;
      case 'bonus-fund':
        return <BonusFund key={`bonus-fund-${refreshKey}`} />;
      case 'challenges':
        return <Challenges key={`challenges-${refreshKey}`} />;
      case 'budgets':
        return <OrcamentosApp key={`budgets-${refreshKey}`} />;
      case 'settings':
        return <Settings />;
      default:
        return <Proposals key={`proposals-${refreshKey}`} onDataChange={refreshAllData} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50" 
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:ml-0 pt-16 md:pt-0">
        {renderContent()}
        <AppBuildTag />
      </main>
    </div>
  );
}

export default App;