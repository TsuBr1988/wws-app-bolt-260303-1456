import { BookOpen, Users, TrendingUp, ShoppingCart, DollarSign, FileText, Settings, ClipboardList, ClipboardCheck } from 'lucide-react';

interface WelcomePageProps {
  onNavigate: (tab: string) => void;
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
  const modules = [
    {
      id: 'cultura',
      title: 'Cultura',
      description: 'Gestão cultural - Empréstimo de livros, fundamentos do BSC e organograma estratégico',
      icon: BookOpen,
      gradient: 'gradient-tecnologia',
      iconColor: 'text-tecnologia',
    },
    {
      id: 'rh',
      title: 'RH',
      description: 'Recursos Humanos - Indicadores de pessoal, turnover, absenteísmo e organograma',
      icon: Users,
      gradient: 'gradient-ambiental',
      iconColor: 'text-ambiental',
    },
    {
      id: 'operacional',
      title: 'Operacional',
      description: 'Gestão operacional - FTs, visitas de supervisores e indicadores de campo',
      icon: Settings,
      gradient: 'gradient-seguranca',
      iconColor: 'text-seguranca',
    },
    {
      id: 'comercial',
      title: 'Comercial',
      description: 'Área comercial - Vendas, faturamento e resultados comerciais',
      icon: TrendingUp,
      gradient: 'gradient-facilities',
      iconColor: 'text-facilities',
    },
    {
      id: 'compras',
      title: 'Compras',
      description: 'Gestão de compras - Uniformes, EPIs, materiais de limpeza e equipamentos',
      icon: ShoppingCart,
      gradient: 'gradient-parking',
      iconColor: 'text-parking',
    },
    {
      id: 'financas',
      title: 'Financeiro',
      description: 'Indicadores financeiros - Receitas, margens, despesas e resultados das estações',
      icon: DollarSign,
      gradient: 'gradient-ambiental',
      iconColor: 'text-ambiental-dark',
    },
    {
      id: 'contratos',
      title: 'Contratos',
      description: 'Gestão de contratos - Controle de contratos, aditivos e receitas mensais',
      icon: FileText,
      gradient: 'gradient-tecnologia',
      iconColor: 'text-tecnologia-dark',
    },
    {
      id: 'atas-acoes',
      title: 'Atas e Ações',
      description: 'Gestão de ações - Controle de tarefas, responsáveis e prazos',
      icon: ClipboardList,
      gradient: 'gradient-parking',
      iconColor: 'text-parking-dark',
    },
    {
      id: 'qualidade',
      title: 'Qualidade',
      description: 'Sistema de Gestão da Qualidade - Processos, documentos, RNCs e auditorias',
      icon: ClipboardCheck,
      gradient: 'gradient-seguranca',
      iconColor: 'text-seguranca-dark',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
      <div className="text-center space-y-2 sm:space-y-4 py-4 sm:py-8 relative">
        <div className="absolute inset-0 gradient-2ws opacity-10 rounded-2xl blur-3xl"></div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-brand-dark px-2 relative">
          Bem-vindo ao Grupo WWS
        </h1>
        <p className="text-sm sm:text-base md:text-xl text-gray-700 max-w-3xl mx-auto px-2 relative font-medium">
          Desenvolver Pessoas • Sistema de Gestão Estratégica
        </p>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-brand-dark mb-4 sm:mb-6 md:mb-8 text-center">Explore nossos módulos</h2>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => onNavigate(module.id)}
                className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 text-left group overflow-hidden relative"
              >
                <div className={`absolute inset-0 ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="flex flex-col items-center text-center gap-2 sm:gap-3 md:gap-4 relative">
                  <div className={`${module.gradient} p-3 sm:p-3.5 md:p-4 rounded-xl group-hover:scale-110 transition-transform shadow-md`}>
                    <Icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg text-brand-dark mb-1 sm:mb-2">{module.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
    </div>
  );
}
