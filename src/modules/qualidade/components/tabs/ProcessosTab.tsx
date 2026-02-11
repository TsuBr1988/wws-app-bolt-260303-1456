import React from 'react';
import { GitBranch, Plus } from 'lucide-react';

const ProcessosTab: React.FC = () => {
  const processos = [
    { id: 1, codigo: 'PE-001', nome: 'Planejamento Estratégico', tipo: 'estrategico', responsavel: 'Diretoria' },
    { id: 2, codigo: 'PO-001', nome: 'Produção', tipo: 'operacional', responsavel: 'Gerente de Produção' },
    { id: 3, codigo: 'PA-001', nome: 'Recursos Humanos', tipo: 'apoio', responsavel: 'Gerente de RH' },
  ];

  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Mapas de Processos</h2>
          <p className="text-gray-600">Visualize e gerencie os processos da organização</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          Novo Processo
        </button>
      </div>

      <div className="space-y-4">
        {processos.map((proc) => (
          <div key={proc.id} className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${proc.tipo === 'estrategico' ? 'bg-purple-50 text-purple-600' : proc.tipo === 'operacional' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-brand-dark">{proc.nome}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${proc.tipo === 'estrategico' ? 'bg-purple-100 text-purple-700' : proc.tipo === 'operacional' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {proc.tipo === 'estrategico' ? 'Estratégico' : proc.tipo === 'operacional' ? 'Operacional' : 'Apoio'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{proc.codigo}</span>
                  <span className="text-sm text-gray-600">Responsável: <span className="font-bold">{proc.responsavel}</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessosTab;
