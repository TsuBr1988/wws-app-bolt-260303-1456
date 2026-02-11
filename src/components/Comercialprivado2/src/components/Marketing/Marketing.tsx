import React, { useState, useEffect } from 'react';
import { MarketingSummaryCards } from './MarketingSummaryCards';
import { ConsolidatedChart } from './ConsolidatedChart';
import { InstagramCard } from './InstagramCard';
import { LinkedInCard } from './LinkedInCard';
import { MarketingCalendar } from './MarketingCalendar';
import { ActionsTab } from '../Actions/ActionsTab';
import { AtasTab } from '../Atas/AtasTab';
import { marketingService, InstagramMetrics, LinkedInMetrics } from '../../services/marketingService';
import { supabase } from '../../lib/supabase';
import { BarChart3, Calendar, ListTodo, FileText } from 'lucide-react';

type TabType = 'metrics' | 'planning' | 'actions' | 'atas';

export const Marketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [instagramData, setInstagramData] = useState<InstagramMetrics[]>([]);
  const [linkedinData, setLinkedinData] = useState<LinkedInMetrics[]>([]);
  const [responsaveis, setResponsaveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openActionForm, setOpenActionForm] = useState(false);

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

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing</h1>
        <p className="text-gray-600">Acompanhe as métricas, planeje postagens e gerencie tarefas</p>
      </div>

      <MarketingSummaryCards
        instagramData={instagramData}
        linkedinData={linkedinData}
      />

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'metrics'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Comparativo de Plataformas
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'planning'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Planejamento
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'actions'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <ListTodo className="w-5 h-5" />
              Tarefas
            </button>
            <button
              onClick={() => setActiveTab('atas')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'atas'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              Atas
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'metrics' && (
        <>
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
