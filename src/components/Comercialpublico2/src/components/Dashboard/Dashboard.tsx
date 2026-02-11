import React from 'react';
import { SalesChart } from './SalesChart';
import { CommercialGoalCard } from './CommercialGoalCard';
import { DashboardChallengesCarousel } from './DashboardChallengesCarousel';
import { EmployeeHighlight } from './EmployeeHighlight';
import { GuaranteedCommissions } from './GuaranteedCommissions';
import { PossibleCommissions } from './PossibleCommissions';
import { ContractsSection } from './ContractsSection';
import { PendingPlanilhasCard } from './PendingPlanilhasCard';
import { MonthlyAuctionGoalChart } from './MonthlyAuctionGoalChart';
import { CertidoesAvisoCard } from './CertidoesAvisoCard';
import { ProximasLicitacoesCard } from './ProximasLicitacoesCard';
import { CommercialKPIs } from './CommercialKPIs';
import { useDepartment } from '../../contexts/DepartmentContext';
import { useYear } from '../../contexts/YearContext';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useAccess } from '../../contexts/AccessContext';
import { TarefasPendentesCard } from './TarefasPendentesCard';
import { NotificacoesHojeCard } from './NotificacoesHojeCard';
import { NotificacoesAVencerCard } from './NotificacoesAVencerCard';
import { NotificacoesVencidasCard } from './NotificacoesVencidasCard';

export const Dashboard: React.FC = () => {
  const { selectedDepartment } = useDepartment();
  const { selectedYear } = useYear();
  const { accessType } = useAccess();
  
  // All hooks must be called unconditionally at the top level
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');

  // LOG PRINCIPAL: Debug dos dados no Dashboard
  React.useEffect(() => {
    if (!proposalsLoading && !employeesLoading) {
      console.log('🏠 [Dashboard] DEBUG - Dados carregados:', {
        proposals: proposals.length,
        employees: employees.length,
        selectedDepartment,
        proposalsByStatus: proposals.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        proposalsAguardandoOuEmAndamento: proposals.filter(p => 
          p.status === 'Proposta' || p.status === 'Negociação'
        ).length,
        amostraPropostas: proposals.slice(0, 3).map(p => ({
          client: p.client,
          status: p.status,
          total_value: p.total_value,
          nosso_lance: p.nosso_lance,
          department: p.department
        }))
      });
    }
  }, [proposals, employees, proposalsLoading, employeesLoading, selectedDepartment]);
  const loading = proposalsLoading || employeesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Cards de Licitações e Planilhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-6">
        <ProximasLicitacoesCard />
      </div>

      {/* Commercial Goal Card or Challenges Carousel */}
      {accessType !== 'comercial' && selectedYear === 2026 ? (
        <DashboardChallengesCarousel />
      ) : accessType !== 'comercial' ? (
        <CommercialGoalCard />
      ) : null}

      {/* KPIs Comerciais */}
      <CommercialKPIs />

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SalesChart />
        <div>
          <MonthlyAuctionGoalChart />
        </div>
      </div>

      {/* Planilhas Pendentes e Avisos de Certidões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingPlanilhasCard />
        <CertidoesAvisoCard />
      </div>

    </main>
  );
};