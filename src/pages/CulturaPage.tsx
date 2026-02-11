import { useState } from 'react';
import { Book, BookOpen, Target } from 'lucide-react';
import EmprestimoLivrosTab from '../components/cultura/EmprestimoLivrosTab';
import FundamentosBSCTab from '../components/cultura/FundamentosBSCTab';
import OrganogramaEstrategicoTab from '../components/cultura/OrganogramaEstrategicoTab';
import { useAuth } from '../hooks/useAuth';

export default function CulturaPage() {
  const { hasIndicatorAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('emprestimo-livros');

  const tabs = [
    { id: 'emprestimo-livros', label: 'Empréstimo de livros', icon: BookOpen, indicator: 'Empréstimo de Livros' },
    { id: 'fundamentos-bsc', label: 'Missão, Visão e Valores', icon: BookOpen, indicator: 'Missão, Visão e Valores' },
    { id: 'organograma-estrategico', label: 'Plano Estratégico', icon: Target, indicator: 'Plano Estratégico' },
  ].filter(tab => hasIndicatorAccess('cultura', tab.indicator));

  return (
    <div className="flex">
      <aside className="w-64 min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50 to-white border-r border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-300">
          <div className="gradient-tecnologia p-2 rounded-lg shadow-md">
            <Book className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-brand-dark">Cultura</h2>
        </div>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-dark shadow-md border-2 border-gray-300'
                    : 'text-gray-600 hover:bg-white hover:text-brand-dark hover:shadow-md border-2 border-transparent'
                }`}
              >
                <div className={`${activeTab === tab.id ? 'gradient-tecnologia' : 'bg-gray-200'} p-1.5 rounded-md transition-all ${activeTab === tab.id ? '' : 'group-hover:gradient-tecnologia'}`}>
                  <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} />
                </div>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-white">
        {activeTab === 'emprestimo-livros' && <EmprestimoLivrosTab />}
        {activeTab === 'fundamentos-bsc' && <FundamentosBSCTab />}
        {activeTab === 'organograma-estrategico' && <OrganogramaEstrategicoTab />}
      </main>
    </div>
  );
}
