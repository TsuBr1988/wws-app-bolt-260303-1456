/**
 * Componente: KPIsPage
 * 
 * Propósito: Página dedicada ao controle detalhado de indicadores de vendas
 * - Primeira seção: KPIs do Dashboard (4 existentes)
 * - Segunda seção: KPIs de Vendas (6 novos)
 * - Grid responsivo com modais informativos
 * - Integração com dados em tempo real
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { useYear } from '../../contexts/YearContext';
import { ExistingKPIs } from './ExistingKPIs';
import { SalesGrowthKPI } from './SalesGrowthKPI';
import { ProposalEvolutionKPI } from './ProposalEvolutionKPI';
import { LTVKpi } from './LTVKpi';
import { PipelineCoverageKPI } from './PipelineCoverageKPI';
import { SalesConversionKPI } from './SalesConversionKPI';
import { CustomerRetentionKPI } from './CustomerRetentionKPI';
import { SalesCycleTimeKPI } from './SalesCycleTimeKPI';

export const KPIsPage: React.FC = () => {
  const { selectedYear } = useYear();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KPIs de Vendas {selectedYear}</h1>
          <p className="text-gray-600">Controle detalhado de indicadores de performance comercial</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Calendar className="w-4 h-4" />
          <span>Ano Fiscal: {selectedYear}</span>
        </div>
      </div>

      {/* KPIs organizados em 3 linhas: 4+4+3 */}
      <div className="space-y-6">
        {/* Linha 1: 4 KPIs do Dashboard */}
        <div className="grid grid-cols-1 gap-6">
          <ExistingKPIs />
        </div>

        {/* Linha 2: 4 KPIs de Vendas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProposalEvolutionKPI />
          <SalesGrowthKPI />
          <LTVKpi />
          <PipelineCoverageKPI />
        </div>

        {/* Linha 3: 3 KPIs de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SalesConversionKPI />
          <CustomerRetentionKPI />
          <SalesCycleTimeKPI />
        </div>
      </div>

      {/* Informações de Atualização */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Informações dos KPIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800 text-sm">
          <div>
            <p>• <strong>Atualização:</strong> Dados em tempo real baseados nas propostas</p>
            <p>• <strong>Período base:</strong> Últimos 12 meses para cálculos históricos</p>
            <p>• <strong>Metodologia:</strong> Snapshot acumulativo e janelas móveis</p>
          </div>
          <div>
            <p>• <strong>Faturamento:</strong> Valor mensal por 12 meses após assinatura</p>
            <p>• <strong>Cliques:</strong> Cada KPI possui modal com detalhes e fórmulas</p>
            <p>• <strong>Minigráficos:</strong> Evolução mensal dos últimos 12 períodos</p>
          </div>
        </div>
      </div>
    </div>
  );
};