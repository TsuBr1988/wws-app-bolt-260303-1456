import React, { useState } from 'react';
import { Shield, Users, Lock, DollarSign } from 'lucide-react';
import { useAccess } from '../../contexts/AccessContext';

export const AccessLogin: React.FC = () => {
  const { setAccessType } = useAccess();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAccessType, setPendingAccessType] = useState<'comercial' | 'interno' | 'administrativo' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleComercialAccess = () => {
    setPendingAccessType('comercial');
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handleAdministrativoAccess = () => {
    setPendingAccessType('administrativo');
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handleInternoAccess = () => {
    setPendingAccessType('interno');
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let correctPassword = '';
    if (pendingAccessType === 'comercial') {
      correctPassword = 'COMERCIAL';
    } else if (pendingAccessType === 'interno') {
      correctPassword = 'WWSINTERNO@@';
    } else if (pendingAccessType === 'administrativo') {
      correctPassword = '22595084';
    }

    if (password === correctPassword) {
      setAccessType(pendingAccessType!);
      setShowPasswordModal(false);
      setPendingAccessType(null);
    } else {
      setError('Senha incorreta');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Grupo WWS</h1>
          <p className="text-lg text-gray-600">Sistema de Gestão Comercial</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Selecione o Tipo de Acesso
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={handleComercialAccess}
              className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    Acesso Comercial
                  </h3>
                  <p className="text-sm text-blue-700">
                    Visualização de licitações, propostas e relatórios comerciais
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleAdministrativoAccess}
              className="group relative bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 hover:border-green-400 rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Acesso Administrativo
                  </h3>
                  <p className="text-sm text-green-700">
                    Acesso completo com permissões de gerenciamento
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleInternoAccess}
              className="group relative bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 hover:border-orange-400 rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-orange-900 mb-2">
                    Acesso Interno
                  </h3>
                  <p className="text-sm text-orange-700">
                    Acesso comercial com autenticação de senha
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          Escolha o tipo de acesso adequado para sua função
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 ${
                pendingAccessType === 'comercial'
                  ? 'bg-blue-100'
                  : pendingAccessType === 'administrativo'
                  ? 'bg-green-100'
                  : 'bg-orange-100'
              } rounded-full mb-4`}>
                <Lock className={`w-8 h-8 ${
                  pendingAccessType === 'comercial'
                    ? 'text-blue-600'
                    : pendingAccessType === 'administrativo'
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {pendingAccessType === 'comercial'
                  ? 'Acesso Comercial'
                  : pendingAccessType === 'administrativo'
                  ? 'Acesso Administrativo'
                  : 'Acesso Interno'}
              </h3>
              <p className="text-gray-600">
                Digite a senha para continuar
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Digite a senha"
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${
                    pendingAccessType === 'comercial'
                      ? 'focus:ring-blue-500 focus:border-blue-500'
                      : pendingAccessType === 'administrativo'
                      ? 'focus:ring-green-500 focus:border-green-500'
                      : 'focus:ring-orange-500 focus:border-orange-500'
                  }`}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className={`flex-1 ${
                    pendingAccessType === 'comercial'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : pendingAccessType === 'administrativo'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white py-3 px-4 rounded-lg font-medium transition-colors`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setError('');
                    setPendingAccessType(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
