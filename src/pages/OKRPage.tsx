import { useState, useEffect } from 'react';
import { Target, TrendingUp, Users, Settings, Shield, Award, Monitor, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDatabase } from '@/lib/databaseResolver';
import { InsertKpiDataModal } from '@/components/okr/InsertKpiDataModal';
import { KpiHistoryModal } from '@/components/okr/KpiHistoryModal';

const supabase = getDatabase('RH');

interface KPI {
  name: string;
  value?: string;
  target?: string;
}

interface OKR {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  keyResults: string[];
  kpis: KPI[];
}

const okrs: OKR[] = [
  {
    id: 1,
    icon: TrendingUp,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Previsibilidade Financeira',
    description: 'Garantir sustentabilidade e margem positiva em todos os contratos',
    keyResults: [
      'Eliminar contratos com margem negativa até Q2',
      'Garantir margem mínima ≥ 10% em 100% dos contratos ativos',
      'EBITDA operacional dos contratos ativos positivo a partir do Q3'
    ],
    kpis: [
      { name: 'Margem por contrato (%)' },
      { name: 'Quantidade de contratos com margem negativa' },
      { name: 'EBITDA operacional mensal' },
      { name: 'Fluxo de caixa projetado vs realizado' },
      { name: 'Custo financeiro mensal (juros, antecipações)' }
    ]
  },
  {
    id: 2,
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Comercial Privado Estruturado',
    description: 'Estruturar operação comercial privada com times regionais',
    keyResults: [
      'Diretores regionais contratados até jan/26',
      'Times comerciais operando até fim do Q1',
      'Pipeline privado ≥ 3x a meta mensal até Q2',
      'Utilizar pelo menos 6 canais de tração ativos'
    ],
    kpis: [
      { name: 'Pipeline qualificado (R$)' },
      { name: 'Taxa de conversão por etapa do funil' },
      { name: 'Ticket médio dos contratos privados' },
      { name: 'Margem média dos contratos privados' },
      { name: 'Faturamento privado (% do total)' }
    ]
  },
  {
    id: 3,
    icon: Settings,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Eficiência Operacional',
    description: 'Otimizar processos e reduzir custos operacionais',
    keyResults: [
      '100% dos processos críticos padronizados até Q2',
      'Indicador operacional de presenças/faltas em tempo real ativo até Q1',
      'Redução de absenteísmo em 20% até Q2'
    ],
    kpis: [
      { name: 'Índice de absenteísmo' },
      { name: 'Índice de cobertura de postos' },
      { name: 'Custo por posto' },
      { name: 'Retrabalho operacional (ocorrências)' },
      { name: 'SLA de resolução de faltas' }
    ]
  },
  {
    id: 4,
    icon: Shield,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'Redução de Risco Trabalhista',
    description: 'Minimizar passivos trabalhistas e melhorar ambiente de trabalho',
    keyResults: [
      'Redução de turnover em 15%',
      '100% das lideranças treinadas até Q3'
    ],
    kpis: [
      { name: 'Turnover geral e por contrato' },
      { name: 'Quantidade de ações trabalhistas' },
      { name: 'Custo trabalhista por colaborador' },
      { name: 'Absenteísmo recorrente' },
      { name: 'Índice de participação em treinamentos' }
    ]
  },
  {
    id: 5,
    icon: Award,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: 'ISO 9001',
    description: 'Obter certificação de qualidade internacional',
    keyResults: [
      'Certificação ISO 9001 concluída até Q4'
    ],
    kpis: [
      { name: '% de processos documentados' },
      { name: 'Número de não conformidades internas' },
      { name: 'Status do cronograma ISO (on track / at risk)' },
      { name: 'Resultado de auditorias internas' }
    ]
  },
  {
    id: 6,
    icon: Monitor,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: 'Tecnologia como Execução',
    description: 'Integrar tecnologia como base de decisões estratégicas',
    keyResults: [
      'OKRs e KPIs integrados ao sistema até Q2'
    ],
    kpis: [
      { name: '% de áreas usando o sistema como fonte principal de decisão' },
      { name: 'Quantidade de dashboards ativos' },
      { name: 'Número de processos automatizados' }
    ]
  }
];

interface OKRCardProps {
  okr: OKR;
  kpiValues: Record<string, string>;
  onKpiClick: (okrId: number, kpiName: string, okrTitle: string) => void;
}

function OKRCard({ okr, kpiValues, onKpiClick }: OKRCardProps) {
  const Icon = okr.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-6">
        <div className="w-1/3 space-y-4">
          <div className={`${okr.iconBg} w-16 h-16 rounded-xl flex items-center justify-center`}>
            <Icon className={`h-8 w-8 ${okr.iconColor}`} />
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{okr.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{okr.description}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Resultados-chave:</h4>
            <ul className="space-y-1.5">
              {okr.keyResults.map((result, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-xs mt-0.5">•</span>
                  <span>{result}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-2/3 border-l border-gray-200 pl-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">KPIs de Acompanhamento</h4>
          <div className="grid grid-cols-1 gap-3">
            {okr.kpis.map((kpi, idx) => {
              const key = `${okr.id}-${kpi.name}`;
              const value = kpiValues[key];

              return (
                <button
                  key={idx}
                  onClick={() => onKpiClick(okr.id, kpi.name, okr.title)}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {kpi.name}
                    </span>
                    <div className="flex items-center gap-3">
                      {value ? (
                        <span className="text-lg font-semibold text-blue-600">
                          {value}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sem dados</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OKRPage() {
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<{ okrId: number; kpiName: string; okrTitle: string } | null>(null);
  const [kpiValues, setKpiValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const allKpis = okrs.flatMap(okr =>
    okr.kpis.map(kpi => ({
      name: kpi.name,
      okrId: okr.id
    }))
  );

  useEffect(() => {
    loadLatestValues();
  }, []);

  const loadLatestValues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('okr_kpi_data')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const latestValues: Record<string, string> = {};
      const seenKpis = new Set<string>();

      data?.forEach((item: any) => {
        const key = `${item.okr_id}-${item.kpi_name}`;
        if (!seenKpis.has(key)) {
          latestValues[key] = item.value;
          seenKpis.add(key);
        }
      });

      setKpiValues(latestValues);
    } catch (error) {
      console.error('Error loading latest KPI values:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiClick = (okrId: number, kpiName: string, okrTitle: string) => {
    setSelectedKpi({ okrId, kpiName, okrTitle });
    setShowHistoryModal(true);
  };

  const handleDataSaved = () => {
    loadLatestValues();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg">
            <Target className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              OKR 2026
            </h1>
            <p className="text-gray-600 mt-1">
              Objectives and Key Results - Metas Estratégicas
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowInsertModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Inserir Dados
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {okrs.map((okr) => (
            <OKRCard
              key={okr.id}
              okr={okr}
              kpiValues={kpiValues}
              onKpiClick={handleKpiClick}
            />
          ))}
        </div>
      )}

      <InsertKpiDataModal
        isOpen={showInsertModal}
        onClose={() => setShowInsertModal(false)}
        allKpis={allKpis}
        onDataSaved={handleDataSaved}
      />

      {selectedKpi && (
        <KpiHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedKpi(null);
          }}
          okrId={selectedKpi.okrId}
          kpiName={selectedKpi.kpiName}
          okrTitle={selectedKpi.okrTitle}
        />
      )}
    </div>
  );
}
