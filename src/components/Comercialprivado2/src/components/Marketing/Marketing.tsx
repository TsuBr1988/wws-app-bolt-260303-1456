import React, { useMemo, useState, useEffect } from 'react';
import { MarketingSummaryCards } from './MarketingSummaryCards';
import { ConsolidatedChart } from './ConsolidatedChart';
import { InstagramCard } from './InstagramCard';
import { LinkedInCard } from './LinkedInCard';
import { MarketingCalendar } from './MarketingCalendar';
import { ActionsTab } from '../Actions/ActionsTab';
import { AtasTab } from '../Atas/AtasTab';
import { marketingService, InstagramMetrics, LinkedInMetrics } from '../../services/marketingService';
import { supabase } from '../../lib/supabase';
import SolicitacoesTab from '../../modules/marketing/solicitacoes/components/SolicitacoesTab';
import { useAuth } from '@/hooks/useAuth';

export type MarketingTabType = 'requests' | 'metrics' | 'planning' | 'actions' | 'atas';

interface MarketingProps {
  initialTab?: MarketingTabType;
}

export const Marketing: React.FC<MarketingProps> = ({ initialTab }) => {
  const { user, hasIndicatorAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<MarketingTabType>(initialTab ?? 'metrics');
  const [instagramData, setInstagramData] = useState<InstagramMetrics[]>([]);
  const [linkedinData, setLinkedinData] = useState<LinkedInMetrics[]>([]);
  const [responsaveis, setResponsaveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openActionForm, setOpenActionForm] = useState(false);

  const canAccessTab = (tab: MarketingTabType) => {
    if (user?.is_admin) return true;

    const tabToIndicator: Record<MarketingTabType, string> = {
      requests: 'Marketing > Solicitações',
      metrics: 'Marketing > Comparativo de Plataformas',
      planning: 'Marketing > Planejamento',
      actions: 'Marketing > Tarefas',
      atas: 'Marketing > Atas',
    };

    return hasIndicatorAccess('marketing', tabToIndicator[tab]);
  };

  const allowedTabs = useMemo(() => {
    const order: MarketingTabType[] = ['requests', 'metrics', 'planning', 'actions', 'atas'];
    return order.filter(canAccessTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.is_admin, hasIndicatorAccess]);

  useEffect(() => {
    if (!initialTab) return;
    if (canAccessTab(initialTab)) {
      setActiveTab(initialTab);
      return;
    }

    if (allowedTabs.length > 0) {
      setActiveTab(allowedTabs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  useEffect(() => {
    if (allowedTabs.length === 0) return;
    if (!canAccessTab(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, allowedTabs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [igData, liData] = await Promise.all([
        marketingService.getInstagramMetrics(),
        marketingService.getLinkedInMetrics()
      ]);
      setInstagramData(igData || []);
      setLinkedinData(liData || []);
    } catch (error) {
      console.error('Error fetching marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponsaveis = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('name')
        .order('name');

      if (error) throw error;
      const names = data?.map(u => u.name) || [];
      setResponsaveis(names);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setResponsaveis([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchResponsaveis();
  }, []);

  const handleAddActionFromAta = () => {
    setActiveTab('actions');
    setOpenActionForm(true);
  };

  const handleActionCreated = () => {
    setOpenActionForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Métricas de Marketing...</div>
        </div>
      </div>
    );
  }

  if (!user?.is_admin && allowedTabs.length === 0) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4">
          Você não tem permissão para acessar nenhum item do Marketing.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing</h1>
        <p className="text-gray-600">Acompanhe as métricas, planeje postagens e gerencie tarefas</p>
      </div>

      {activeTab === 'metrics' && (
        <>
          <MarketingSummaryCards
            instagramData={instagramData}
            linkedinData={linkedinData}
          />

          <ConsolidatedChart
            instagramData={instagramData}
            linkedinData={linkedinData}
          />

          <div className="space-y-6">
            <InstagramCard
              data={instagramData}
              onDataChange={fetchData}
            />

            <LinkedInCard
              data={linkedinData}
              onDataChange={fetchData}
            />
          </div>
        </>
      )}

      {activeTab === 'planning' && <MarketingCalendar />}

      {activeTab === 'requests' && <SolicitacoesTab />}

      {activeTab === 'actions' && (
        <ActionsTab
          responsaveis={responsaveis}
          initialFormOpen={openActionForm}
          onActionCreated={handleActionCreated}
        />
      )}

      {activeTab === 'atas' && (
        <AtasTab
          responsaveis={responsaveis}
          onAddAction={handleAddActionFromAta}
        />
      )}
    </div>
  );
};
