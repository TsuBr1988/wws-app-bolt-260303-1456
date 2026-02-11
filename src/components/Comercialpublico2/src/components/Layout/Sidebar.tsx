import React from 'react';
import {
  Home,
  FileText,
  DollarSign,
  Calendar,
  PiggyBank,
  Users,
  Trophy,
  Award,
  Settings,
  CalendarDays,
  Clipboard,
  X,
  CheckCircle
} from 'lucide-react';
import { VersionSelector } from './VersionSelector';
import { useYear } from '../../contexts/YearContext';
import { useAccess } from '../../contexts/AccessContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', permissionName: 'Dashboard', icon: Home, adminOnly: false },
  { id: 'licitacoes', label: 'Licitações', permissionName: 'Licitações', icon: FileText, adminOnly: false },
  { id: 'contracts', label: 'Contratos', permissionName: 'Contratos', icon: Clipboard, adminOnly: true },
  { id: 'commissions', label: 'Comissões', permissionName: 'Comissões', icon: DollarSign, adminOnly: true },
  { id: 'bonus-fund', label: 'Fundo de Bônus', permissionName: 'Fundo de Bônus', icon: PiggyBank, adminOnly: true },
  { id: 'challenges', label: 'Desafios', permissionName: 'Desafios', icon: Award, adminOnly: true },
  { id: 'certidoes', label: 'Certidões', permissionName: 'Certidões', icon: CheckCircle, adminOnly: false },
  { id: 'settings', label: 'Configurações', permissionName: 'Configurações', icon: Settings, adminOnly: false },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onClose,
  showCloseButton = false,
  expanded = true,
  onToggleExpanded
}) => {
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const { accessType } = useAccess();
  const [hasNewChallenge, setHasNewChallenge] = React.useState(false);

  // Carregar permissões do localStorage
  const [userPermissions, setUserPermissions] = React.useState<any>(null);

  React.useEffect(() => {
    const loadPermissions = () => {
      try {
        const storedUser = localStorage.getItem('app_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);

          if (user.is_admin) {
            setUserPermissions({ is_admin: true });
            return;
          }

          const storedPermissions = localStorage.getItem('app_user_permissions');
          if (storedPermissions) {
            setUserPermissions(JSON.parse(storedPermissions));
          }
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      }
    };

    loadPermissions();

    const handleStorageChange = () => loadPermissions();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const hasIndicatorAccess = (indicatorName: string): boolean => {
    if (!userPermissions) return false;
    if (userPermissions.is_admin) return true;

    const indicators = userPermissions.indicators?.['comercial_publico'];
    if (!indicators) return false;

    const level = indicators[indicatorName];
    return level === 'view' || level === 'edit';
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (accessType === 'comercial' && item.adminOnly) {
      return false;
    }

    if (userPermissions) {
      return hasIndicatorAccess(item.permissionName);
    }

    return !item.adminOnly;
  });

  // Verificar se há desafio novo criado nas últimas 24 horas
  React.useEffect(() => {
    const checkNewChallenge = () => {
      const newChallengeTimestamp = localStorage.getItem('newChallengeCreatedAt');
      
      if (!newChallengeTimestamp) {
        setHasNewChallenge(false);
        return;
      }
      
      const createdAt = new Date(newChallengeTimestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        // Remove do localStorage se passou de 24 horas
        localStorage.removeItem('newChallengeCreatedAt');
        setHasNewChallenge(false);
      } else {
        setHasNewChallenge(true);
      }
    };
    
    // Verificar imediatamente
    checkNewChallenge();
    
    // Verificar a cada minuto
    const interval = setInterval(checkNewChallenge, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`${expanded ? 'w-64' : 'w-16'} border-r h-screen flex flex-col transition-all duration-300 bg-white border-gray-200`}>
      <div className={expanded ? "p-6" : "p-3"}>
        {/* Mobile Close Button */}
        {showCloseButton && onClose && (
          <div className="flex justify-end mb-4 md:hidden">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
        
        <div className={`flex items-center ${expanded ? 'space-x-2' : 'justify-center'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg hidden md:flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          {expanded && (
            <h1 className="text-xl font-bold text-gray-900">Grupo WWS</h1>
          )}
        </div>
        
        {/* Year Selector */}
        {expanded ? (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Ano:</span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1 text-gray-500">
              Ano fiscal para metas e relatórios
            </p>
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            <div className="p-2 rounded-lg bg-gray-100" title={`Ano: ${selectedYear}`}>
              <CalendarDays className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>
      
      <nav className={`flex-1 ${expanded ? 'px-4' : 'px-2'} overflow-y-auto`}>
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isNewChallenge = item.id === 'challenges' && hasNewChallenge;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${expanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={!expanded ? item.label : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {expanded && (
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="font-medium">{item.label}</span>
                      {isNewChallenge && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white animate-pulse bg-gradient-to-r from-red-500 to-pink-500">
                          NOVO!
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {expanded && (
        <VersionSelector />
      )}

    </div>
  );
};