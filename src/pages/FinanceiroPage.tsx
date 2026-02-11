import { MainFinancialMetricsCard } from '@/components/indicators/MainFinancialMetricsCard';
import { ForecastVsActualCard } from '@/components/indicators/ForecastVsActualCard';
import { BillingCard } from '@/components/indicators/BillingCard';
import { StationResultsCard } from '@/components/indicators/StationResultsCard';
import { AdministrativeExpensesCard } from '@/components/indicators/AdministrativeExpensesCard';
import { useAuth } from '@/hooks/useAuth';

export function FinanceiroPage() {
  const { hasIndicatorAccess } = useAuth();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financeiro</h2>
          <p className="text-gray-600">Indicadores financeiros e de receita</p>
        </div>
      </div>

      <div className="grid gap-6">
        {hasIndicatorAccess('Financeiro', 'Métricas Principais') && <MainFinancialMetricsCard />}
        <ForecastVsActualCard />
        {hasIndicatorAccess('Financeiro', 'Faturamento') && <BillingCard />}
        {hasIndicatorAccess('Financeiro', 'Resultado Estações') && <StationResultsCard />}
        {hasIndicatorAccess('Financeiro', 'Despesas Administrativas') && <AdministrativeExpensesCard />}
      </div>
    </div>
  );
}