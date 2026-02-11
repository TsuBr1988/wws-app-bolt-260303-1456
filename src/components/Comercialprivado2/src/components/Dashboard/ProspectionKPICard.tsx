import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Target, TrendingUp, Activity, Users, Link2 } from 'lucide-react';
import { useYear } from '../../contexts/YearContext';
import { getProspectionTeamKPIs, ProspectionTeamKPIs } from '../../services/prospectionKPIService';
import MiniBar from './MiniBar';

const ChangeIndicator: React.FC<{ value: number; percentage: number }> = ({ value, percentage }) => {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : ChevronDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <span className={`text-xs font-medium ${colorClass} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}{value} ({percentage.toFixed(1)}%)
    </span>
  );
};

export const ProspectionKPICard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedYear } = useYear();
  const [kpis, setKpis] = useState<ProspectionTeamKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKPIs = async () => {
      setLoading(true);
      try {
        const data = await getProspectionTeamKPIs(selectedYear);
        setKpis(data);
      } catch (error) {
        console.error('Error loading KPIs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadKPIs();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">Erro ao carregar KPIs de prospecção</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 my-6">
      <div
        className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900">KPI's de Prospecção</h2>
          <p className="text-sm text-gray-500">
            {isExpanded ? 'Clique para recolher os indicadores' : 'Clique para expandir e ver todos os indicadores'}
          </p>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isExpanded ? 'Recolher KPIs' : 'Expandir KPIs'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {isExpanded && (
          <div className="px-6 pb-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Indicadores Principais</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Contatos Ativados */}
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      Contatos Ativados
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {kpis.currentMonth.contatosAtivados.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">vs mês anterior</p>
                    <ChangeIndicator
                      value={kpis.changes.contatosAtivados.value}
                      percentage={kpis.changes.contatosAtivados.percentage}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Mês anterior: <strong>{kpis.previousMonth.contatosAtivados.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Total de Atividades */}
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      Total de Atividades
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {kpis.currentMonth.totalAtividades.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">vs mês anterior</p>
                    <ChangeIndicator
                      value={kpis.changes.totalAtividades.value}
                      percentage={kpis.changes.totalAtividades.percentage}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Mês anterior: <strong>{kpis.previousMonth.totalAtividades.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Total de Conexões */}
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-purple-500" />
                      Total de Conexões
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {kpis.currentMonth.totalConexoes.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">vs mês anterior</p>
                    <ChangeIndicator
                      value={kpis.changes.totalConexoes.value}
                      percentage={kpis.changes.totalConexoes.percentage}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Mês anterior: <strong>{kpis.previousMonth.totalConexoes.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Reuniões */}
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      Reuniões
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {kpis.currentMonth.reunioes.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">vs mês anterior</p>
                    <ChangeIndicator
                      value={kpis.changes.reunioes.value}
                      percentage={kpis.changes.reunioes.percentage}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Mês anterior: <strong>{kpis.previousMonth.reunioes.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Indicadores de Qualificação</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* MQL */}
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      MQL
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {kpis.currentMonth.mql.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Marketing Qualified Leads</p>
                    <ChangeIndicator
                      value={kpis.changes.mql.value}
                      percentage={kpis.changes.mql.percentage}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Mês anterior: <strong>{kpis.previousMonth.mql.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* SQL */}
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Target className="w-4 h-4 text-teal-500" />
                      SQL
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-teal-600 mb-2">
                    {kpis.currentMonth.sql.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Sales Qualified Leads</p>
                    <ChangeIndicator
                      value={kpis.changes.sql.value}
                      percentage={kpis.changes.sql.percentage}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Mês anterior: <strong>{kpis.previousMonth.sql.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Funil de Qualificação */}
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">
                      Funil de Qualificação
                    </h3>
                  </div>

                  <div className="text-lg font-bold text-gray-900 mb-2">
                    {kpis.currentMonth.mql} → {kpis.currentMonth.sql} → {kpis.currentMonth.reunioes}
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    MQL → SQL → Reuniões
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Taxa MQL→SQL:</span>
                      <strong className="text-teal-600">
                        {kpis.currentMonth.mql > 0
                          ? ((kpis.currentMonth.sql / kpis.currentMonth.mql) * 100).toFixed(1)
                          : '0.0'}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Taxa SQL→Reuniões:</span>
                      <strong className="text-orange-600">
                        {kpis.currentMonth.sql > 0
                          ? ((kpis.currentMonth.reunioes / kpis.currentMonth.sql) * 100).toFixed(1)
                          : '0.0'}%
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Informações do Módulo de Prospecção</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800 text-sm">
                <div>
                  <p>• <strong>Fonte:</strong> Dados da tabela individual_prospection</p>
                  <p>• <strong>Período:</strong> Dados agregados do mês atual vs mês anterior</p>
                  <p>• <strong>Equipe:</strong> Soma de todos os colaboradores (André, Andressa, Pedro)</p>
                </div>
                <div>
                  <p>• <strong>Atualização:</strong> Automática ao adicionar/editar dados</p>
                  <p>• <strong>Funil:</strong> Contatos Ativados → MQL → SQL → Reuniões</p>
                  <p>• <strong>Acesso completo:</strong> Aba Prospecção para visualização detalhada</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
