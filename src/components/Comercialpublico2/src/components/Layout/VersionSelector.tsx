import React, { useState } from 'react';
import { Shield, User, Lock, X, Eye, EyeOff } from 'lucide-react';
import { useSystemVersion, SystemVersion } from '../../contexts/SystemVersionContext';
import { useDepartment } from '../../contexts/DepartmentContext';

export const VersionSelector: React.FC = () => {
  const { selectedDepartment } = useDepartment();
  const { version, setVersion } = useSystemVersion();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_PASSWORD = '22595084';

  const handleVersionChange = (newVersion: SystemVersion) => {
    if (newVersion === 'administrative') {
      setShowPasswordModal(true);
    } else {
      setVersion(newVersion);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      setVersion('administrative');
      setShowPasswordModal(false);
      setPassword('');
      setError('');
      alert('✅ Acesso administrativo concedido!');
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setError('');
  };

  const getVersionInfo = (versionType: SystemVersion) => {
    switch (versionType) {
      case 'commercial':
        return {
          icon: User,
          title: 'Comercial',
          color: selectedDepartment === 'Petrobras' ? 'text-green-600' : 'text-blue-600',
          bgColor: selectedDepartment === 'Petrobras' ? 'bg-yellow-50' : 'bg-blue-50',
          borderColor: selectedDepartment === 'Petrobras' ? 'border-yellow-200' : 'border-blue-200'
        };
      case 'administrative':
        return {
          icon: Shield,
          title: 'Administrativa',
          color: selectedDepartment === 'Petrobras' ? 'text-green-600' : 'text-red-600',
          bgColor: selectedDepartment === 'Petrobras' ? 'bg-yellow-50' : 'bg-red-50',
          borderColor: selectedDepartment === 'Petrobras' ? 'border-yellow-200' : 'border-red-200'
        };
    }
  };

  return (
    <>
      <div className="px-3 py-2 border-t border-gray-200">
        <div className="space-y-1">
          {(['commercial', 'administrative'] as SystemVersion[]).map((versionType) => {
            const info = getVersionInfo(versionType);
            const Icon = info.icon;
            const isActive = version === versionType;

            return (
              <button
                key={versionType}
                onClick={() => handleVersionChange(versionType)}
                className={`w-full text-left px-2 py-1.5 rounded-lg border transition-all text-xs ${
                  isActive
                    ? `${info.bgColor} ${info.borderColor} border`
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? info.color : 'text-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium ${isActive ? info.color : 'text-gray-700'}`}>
                      {info.title}
                    </span>
                    {isActive && <span className="ml-1 text-gray-500">(Ativa)</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Acesso Administrativo</h2>
                  <p className="text-sm text-gray-600">Digite a senha para continuar</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Administrativa
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      error ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Digite a senha..."
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Modo Administrativo permite:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Editar todas as configurações do sistema</li>
                      <li>• Gerenciar funcionários e usuários</li>
                      <li>• Modificar metas e comissões</li>
                      <li>• Acesso completo a todas as funcionalidades</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Acessar
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};