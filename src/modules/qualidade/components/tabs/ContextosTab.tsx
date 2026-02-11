import React, { useState } from 'react';
import { Users, Plus, Building, UserCircle } from 'lucide-react';

const ContextosTab: React.FC = () => {
  const [selectedTipo, setSelectedTipo] = useState<'interno' | 'externo' | 'all'>('all');

  const partes = [
    { id: 1, tipo: 'externo', nome: 'Clientes', necessidades: 'Produtos de qualidade, prazos cumpridos', expectativas: 'Atendimento rápido e eficiente' },
    { id: 2, tipo: 'externo', nome: 'Fornecedores', necessidades: 'Pagamentos em dia, contratos claros', expectativas: 'Parcerias de longo prazo' },
    { id: 3, tipo: 'interno', nome: 'Colaboradores', necessidades: 'Ambiente seguro, treinamento', expectativas: 'Crescimento profissional, reconhecimento' },
    { id: 4, tipo: 'interno', nome: 'Direção', necessidades: 'Metas alcançadas, resultados financeiros', expectativas: 'Crescimento sustentável' },
  ];

  const filteredPartes = selectedTipo === 'all' ? partes : partes.filter(p => p.tipo === selectedTipo);

  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Contextos e Partes Interessadas</h2>
          <p className="text-gray-600">Identifique e gerencie as necessidades das partes interessadas</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          Nova Parte Interessada
        </button>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setSelectedTipo('all')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedTipo === 'all' ? 'bg-brand-primary text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'}`}
        >
          Todas
        </button>
        <button
          onClick={() => setSelectedTipo('interno')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedTipo === 'interno' ? 'bg-brand-primary text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'}`}
        >
          Internas
        </button>
        <button
          onClick={() => setSelectedTipo('externo')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedTipo === 'externo' ? 'bg-brand-primary text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'}`}
        >
          Externas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPartes.map((parte) => (
          <div key={parte.id} className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-all hover:scale-102">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${parte.tipo === 'interno' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                {parte.tipo === 'interno' ? <UserCircle className="w-6 h-6" /> : <Building className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-brand-dark">{parte.nome}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${parte.tipo === 'interno' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {parte.tipo === 'interno' ? 'Interna' : 'Externa'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">Necessidades</p>
                    <p className="text-sm text-gray-700">{parte.necessidades}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">Expectativas</p>
                    <p className="text-sm text-gray-700">{parte.expectativas}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextosTab;
