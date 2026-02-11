import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface Tab {
  value: string;
  label: string;
}

interface HeaderProps {
  onSettingsClick?: () => void;
  isSettingsActive?: boolean;
  onLogoClick?: () => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  availableTabs: Tab[];
}

export function Header({ onSettingsClick, isSettingsActive, onLogoClick, activeTab, onTabChange, availableTabs }: HeaderProps) {
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  const handleTabClick = (value: string) => {
    onTabChange(value);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b bg-white sticky top-0 z-40 shadow-sm">
      <div className="gradient-2ws h-1"></div>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-2 shrink-0">
            <div
              className="bg-white p-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={onLogoClick}
              title="Voltar para Home"
            >
              <img
                src="/grupo_wws.jpeg"
                alt="Grupo WWS"
                className="h-6 sm:h-7 w-auto"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            <button
              onClick={() => handleTabClick('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-brand-dark text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-brand-dark'
              }`}
            >
              Home
            </button>
            {availableTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.value
                    ? 'bg-brand-dark text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-brand-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {user && (
              <div className="hidden md:flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="truncate max-w-[120px]">{user.name || user.email}</span>
                {user.is_admin && (
                  <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded font-medium">
                    Admin
                  </span>
                )}
              </div>
            )}
            {user?.is_admin && onSettingsClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
                className={`text-gray-600 hover:text-gray-900 ${
                  isSettingsActive ? 'bg-gray-100' : ''
                }`}
                title="Configurações"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-3 pb-2 border-t pt-3">
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => handleTabClick('home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                  activeTab === 'home'
                    ? 'bg-brand-dark text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-brand-dark'
                }`}
              >
                Home
              </button>
              {availableTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                    activeTab === tab.value
                      ? 'bg-brand-dark text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-brand-dark'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}