import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

const MudancasTab: React.FC = () => {
  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Controle de Mudanças</h2>
          <p className="text-gray-600">Gerencie mudanças organizacionais planejadas</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          Nova Mudança
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 text-center">
        <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Nenhuma mudança registrada</p>
      </div>
    </div>
  );
};

export default MudancasTab;
