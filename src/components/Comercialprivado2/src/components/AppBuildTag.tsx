import React from 'react';
import { GitBranch } from 'lucide-react';

export const AppBuildTag: React.FC = () => {
  // Tentar obter SHA do commit das variáveis de ambiente
  const gitSha = import.meta.env.VITE_GIT_SHA;
  const buildDate = import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split('T')[0];
  
  if (!gitSha) {
    return null; // Não mostrar se não há SHA
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono flex items-center space-x-2">
        <GitBranch className="w-3 h-3" />
        <span>build: {gitSha.substring(0, 7)}</span>
        <span className="opacity-75">• {buildDate}</span>
      </div>
    </div>
  );
};