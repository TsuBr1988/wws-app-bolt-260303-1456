import React from 'react';
import { AlertCircle, Plus } from 'lucide-react';

const RNCTab: React.FC = () => {
  const rncs = [
    { id: 1, numero: 'RNC-2024-001', tipo: 'processo', origem: 'auditoria_interna', descricao: 'Falha no registro de inspeção', status: 'em_acao' },
    { id: 2, numero: 'RNC-2024-002', tipo: 'produto', origem: 'cliente', descricao: 'Produto fora das especificações', status: 'em_analise' },
  ];

  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Registro de Não Conformidades (RNC)</h2>
          <p className="text-gray-600">Gerencie não conformidades e ações corretivas</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          Nova RNC
        </button>
      </div>

      <div className="space-y-4">
        {rncs.map((rnc) => (
          <div key={rnc.id} className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-500">{rnc.numero}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${rnc.status === 'fechada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {rnc.status === 'em_acao' ? 'Em Ação' : 'Em Análise'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-2">{rnc.descricao}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Tipo: <span className="font-bold capitalize">{rnc.tipo}</span></span>
                  <span>Origem: <span className="font-bold capitalize">{rnc.origem.replace('_', ' ')}</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RNCTab;
