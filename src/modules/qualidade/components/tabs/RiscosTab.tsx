import React, { useState } from 'react';
import { AlertTriangle, Plus, TrendingUp } from 'lucide-react';

const RiscosTab: React.FC = () => {
  const [selectedTipo, setSelectedTipo] = useState<'risco' | 'oportunidade' | 'all'>('all');

  const calcularNivel = (prob: number, impacto: number) => prob * impacto;
  const getCorNivel = (nivel: number) => {
    if (nivel >= 15) return 'bg-rose-100 text-rose-700 border-rose-300';
    if (nivel >= 9) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (nivel >= 5) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const items = [
    {
      id: 1,
      tipo: 'risco',
      descricao: 'Falha no equipamento crítico de produção',
      processo: 'Produção',
      probabilidade: 3,
      impacto: 5,
      acoes: 'Implementar manutenção preventiva mensal',
      responsavel: 'João Silva',
      status: 'em_andamento'
    },
    {
      id: 2,
      tipo: 'oportunidade',
      descricao: 'Nova tecnologia para redução de custos',
      processo: 'Financeiro',
      probabilidade: 4,
      impacto: 4,
      acoes: 'Avaliar viabilidade e fazer projeto piloto',
      responsavel: 'Maria Santos',
      status: 'aberto'
    },
    {
      id: 3,
      tipo: 'risco',
      descricao: 'Perda de fornecedor único',
      processo: 'Compras',
      probabilidade: 2,
      impacto: 5,
      acoes: 'Buscar fornecedores alternativos',
      responsavel: 'Pedro Costa',
      status: 'em_andamento'
    },
  ];

  const filteredItems = selectedTipo === 'all' ? items : items.filter(i => i.tipo === selectedTipo);

  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Riscos e Oportunidades</h2>
          <p className="text-gray-600">Identifique e gerencie riscos e oportunidades</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          Novo Item
        </button>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setSelectedTipo('all')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedTipo === 'all' ? 'bg-brand-primary text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedTipo('risco')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedTipo === 'risco' ? 'bg-brand-primary text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'}`}
        >
          Riscos
        </button>
        <button
          onClick={() => setSelectedTipo('oportunidade')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedTipo === 'oportunidade' ? 'bg-brand-primary text-white' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'}`}
        >
          Oportunidades
        </button>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => {
          const nivel = calcularNivel(item.probabilidade, item.impacto);
          return (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${item.tipo === 'risco' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {item.tipo === 'risco' ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-brand-dark">{item.descricao}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.tipo === 'risco' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.tipo === 'risco' ? 'Risco' : 'Oportunidade'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Processo: <span className="font-bold">{item.processo}</span></p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border-2 ${getCorNivel(nivel)} font-bold text-sm`}>
                      Nível: {nivel}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">Probabilidade</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${n <= item.probabilidade ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">Impacto</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${n <= item.impacto ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">Ações de Tratamento</p>
                      <p className="text-sm text-gray-700">{item.acoes}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-500">Responsável</p>
                        <p className="text-sm text-gray-700 font-bold">{item.responsavel}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'concluido' ? 'bg-green-100 text-green-700' : item.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.status === 'concluido' ? 'Concluído' : item.status === 'em_andamento' ? 'Em Andamento' : 'Aberto'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiscosTab;
