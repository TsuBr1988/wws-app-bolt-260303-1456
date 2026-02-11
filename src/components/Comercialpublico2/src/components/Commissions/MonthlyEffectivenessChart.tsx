import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface Proposal {
  id: string;
  status: string;
  created_at: string;
  closing_date?: string;
  closer_id?: string;
  sdr_id?: string;
  orcamentista_id?: string;
  nao_gera_comissao?: boolean;
}

interface MonthlyEffectivenessChartProps {
  employeeId: string;
  employeeRole: string;
  proposals: Proposal[];
  employeeName: string;
  selectedYear: number;
  department: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthlyEffectivenessChart({
  employeeId,
  employeeRole,
  proposals,
  employeeName,
  selectedYear,
  department
}: MonthlyEffectivenessChartProps) {
  const [monthlyData, setMonthlyData] = useState<Array<{
    month: string;
    participated: number;
    closed: number;
    participatedPercentage: number;
    closedPercentage: number;
  }>>([]);

  useEffect(() => {
    const data = MONTHS.map((month, index) => {
      // Filtrar propostas do mês
      const monthProposals = proposals.filter(p => {
        const createdDate = new Date(p.created_at);
        if (createdDate.getFullYear() !== selectedYear || createdDate.getMonth() !== index) return false;

        // Excluir licitações que não geram comissão
        if (p.nao_gera_comissao === true) return false;

        // Para orçamentistas, não filtrar por departamento
        if (employeeRole === 'orcamentista') {
          return true;
        }

        return true;
      });

      // Total de propostas do departamento no mês (todas as propostas criadas no mês)
      const totalDepartmentProposals = proposals.filter(p => {
        const createdDate = new Date(p.created_at);
        if (createdDate.getFullYear() !== selectedYear || createdDate.getMonth() !== index) return false;
        if (p.nao_gera_comissao === true) return false;
        return true;
      }).length;

      // Propostas em que o funcionário participou
      const participated = monthProposals.filter(p => {
        if (employeeRole === 'orcamentista') {
          return p.orcamentista_id === employeeId;
        } else if (employeeRole === 'closer') {
          return p.closer_id === employeeId;
        } else {
          return p.sdr_id === employeeId;
        }
      }).length;

      // Propostas fechadas pelo funcionário
      const closed = monthProposals.filter(p => {
        const isClosed = p.status === 'Fechado' || p.status === 'Contrato assinado';
        if (!isClosed) return false;

        if (employeeRole === 'orcamentista') {
          return p.orcamentista_id === employeeId;
        } else if (employeeRole === 'closer') {
          return p.closer_id === employeeId;
        } else {
          return p.sdr_id === employeeId;
        }
      }).length;

      const participatedPercentage = totalDepartmentProposals > 0
        ? (participated / totalDepartmentProposals) * 100
        : 0;

      const closedPercentage = participated > 0
        ? (closed / participated) * 100
        : 0;

      return {
        month,
        participated,
        closed,
        participatedPercentage,
        closedPercentage
      };
    });

    setMonthlyData(data);
  }, [employeeId, employeeRole, proposals, selectedYear, department]);

  const maxPercentage = Math.max(...monthlyData.map(d => Math.max(d.participatedPercentage, d.closedPercentage)), 10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Efetividade por Mês - {employeeName}</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Percentual de participação e conversão em {selectedYear}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {monthlyData.map((data, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium w-24">{data.month}</span>
              <div className="flex items-center space-x-4 text-xs text-gray-600">
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <span>{data.participatedPercentage.toFixed(1)}% participação ({data.participated})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>{data.closedPercentage.toFixed(1)}% conversão ({data.closed})</span>
                </span>
              </div>
            </div>

            <div className="flex space-x-1 h-8">
              {/* Participation bar */}
              <div className="relative flex-1">
                <div
                  className="bg-blue-500 h-full rounded-l transition-all duration-300"
                  style={{ width: `${(data.participatedPercentage / maxPercentage) * 100}%` }}
                />
              </div>

              {/* Conversion bar */}
              <div className="relative flex-1">
                <div
                  className="bg-green-500 h-full rounded-r transition-all duration-300"
                  style={{ width: `${(data.closedPercentage / maxPercentage) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">% Participação (do total do mês)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">% Conversão (das que participou)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
