import React from 'react';
import { MessageSquare, Plus, Star } from 'lucide-react';

const PesquisaTab: React.FC = () => {
  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Pesquisa de Satisfação</h2>
          <p className="text-gray-600">Colete e analise feedback dos clientes</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          Nova Pesquisa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h3 className="text-3xl font-bold text-brand-dark">4.5</h3>
          </div>
          <p className="text-sm text-gray-600">Média Geral</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200">
          <h3 className="text-3xl font-bold text-brand-dark mb-2">128</h3>
          <p className="text-sm text-gray-600">Pesquisas Realizadas</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200">
          <h3 className="text-3xl font-bold text-emerald-600 mb-2">92%</h3>
          <p className="text-sm text-gray-600">Taxa de Satisfação</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Nenhuma pesquisa recente</p>
      </div>
    </div>
  );
};

export default PesquisaTab;
