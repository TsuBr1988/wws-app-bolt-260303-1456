import React, { useState, useMemo, useEffect } from 'react';
import { FileText, AlertTriangle, Calendar, Clock, Timer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDateBR, Contract, ContractAddendum, ContractWithAddendums } from '../../../../../lib/contractUtils';

export const ContractsExpiringCard: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [addendums, setAddendums] = useState<ContractAddendum[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [addendumsLoading, setAddendumsLoading] = useState(true);

  // Buscar contratos e aditivos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setContractsLoading(true);
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select('*')
          .eq('is_active', true);

        if (contractsError) throw contractsError;
        setContracts(contractsData || []);
      } catch (error) {
        console.error('Erro ao carregar contratos:', error);
      } finally {
        setContractsLoading(false);
      }
    };

    const fetchAddendums = async () => {
      try {
        setAddendumsLoading(true);
        const { data: addendumsData, error: addendumsError } = await supabase
          .from('contract_addendums')
          .select('*')
          .order('created_at', { ascending: false });

        if (addendumsError) throw addendumsError;
        setAddendums(addendumsData || []);
      } catch (error) {
        console.error('Erro ao carregar aditivos:', error);
      } finally {
        setAddendumsLoading(false);
      }
    };

    fetchData();
    fetchAddendums();
  }, []);

  // Processar contratos com aditivos
  const contractsWithAddendums: ContractWithAddendums[] = useMemo(() => {
    return contracts.map(contract => {
      const contractAddendums = addendums.filter(a => a.contract_id === contract.id);
      
      const isInformativeAddendum = (addendum: any) => {
        return addendum.monthly_value === 0 && 
               addendum.observations && 
               addendum.observations.startsWith('[ADITIVO INFORMATIVO]');
      };
      
      const today = new Date();
      const punctualAddendums = contractAddendums.filter(a => a.is_punctual && !isInformativeAddendum(a));
      const permanentAddendums = contractAddendums.filter(a => !a.is_punctual && !isInformativeAddendum(a));
      
      // Determinar data de término: sempre do aditivo permanente mais distante
      let currentEndDate = contract.end_date;
      if (permanentAddendums.length > 0) {
        const furthestPermanentAddendum = permanentAddendums
          .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
        currentEndDate = furthestPermanentAddendum.end_date;
      }
      
      // Determinar valor atual
      let currentValue = contract.monthly_value;
      let activePunctualAddendum: any = undefined;
      
      if (punctualAddendums.length > 0) {
        activePunctualAddendum = punctualAddendums.find(addendum => {
          const startDate = new Date(addendum.effective_start_date || addendum.start_date);
          const endDate = new Date(addendum.effective_end_date || addendum.end_date);
          return today >= startDate && today <= endDate;
        });
      }
      
      if (activePunctualAddendum) {
        currentValue = activePunctualAddendum.monthly_value;
      } else if (permanentAddendums.length > 0) {
        const latestPermanentAddendum = permanentAddendums
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        currentValue = latestPermanentAddendum.monthly_value;
      }
      
      // Calcular dias até o fim do contrato
      const endDate = new Date(currentEndDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysUntilEnd = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const isEndingSoon = daysUntilEnd <= 90 && daysUntilEnd > 0;
      
      // Calcular dias até o fim do aditivo pontual mais recente
      let punctualEndingSoon = false;
      let daysUntilPunctualEnd = 0;
      let latestPunctualAddendum: any = undefined;
      
      if (punctualAddendums.length > 0) {
        latestPunctualAddendum = punctualAddendums
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const punctualEndDate = new Date(latestPunctualAddendum.end_date);
        const punctualTimeDiff = punctualEndDate.getTime() - today.getTime();
        daysUntilPunctualEnd = Math.ceil(punctualTimeDiff / (1000 * 3600 * 24));
        punctualEndingSoon = daysUntilPunctualEnd <= 90 && daysUntilPunctualEnd > 0;
      }
      
      return {
        ...contract,
        addendums: contractAddendums,
        current_value: currentValue,
        current_end_date: currentEndDate,
        days_until_end: daysUntilEnd,
        is_ending_soon: isEndingSoon,
        active_punctual_addendum: activePunctualAddendum,
        latest_punctual_addendum: latestPunctualAddendum,
        punctual_ending_soon: punctualEndingSoon,
        days_until_punctual_end: daysUntilPunctualEnd
      };
    });
  }, [contracts, addendums]);

  if (contractsLoading || addendumsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  // Filtrar contratos que estão encerrando
  const contractsEndingSoon = contractsWithAddendums.filter(c => c.is_ending_soon);
  const punctualAddendumsEndingSoon = contractsWithAddendums.filter(c => c.punctual_ending_soon);
  
  const totalExpiring = contractsEndingSoon.length + punctualAddendumsEndingSoon.length;
  
  // Combinar todos os vencimentos e ordenar por urgência
  const allExpiringItems = [
    ...contractsEndingSoon.map(contract => ({
      id: `contract-${contract.id}`,
      type: 'contract' as const,
      name: contract.client_name,
      endDate: contract.current_end_date,
      daysUntil: contract.days_until_end,
      value: contract.current_value,
      description: 'Contrato'
    })),
    ...punctualAddendumsEndingSoon.map(contract => ({
      id: `punctual-${contract.id}`,
      type: 'punctual' as const,
      name: contract.client_name,
      endDate: contract.latest_punctual_addendum!.end_date,
      daysUntil: contract.days_until_punctual_end,
      value: contract.current_value,
      description: 'Aditivo Pontual'
    }))
  ].sort((a, b) => a.daysUntil - b.daysUntil);

  // Determinar cor baseada na urgência
  const getUrgencyClass = (daysUntil: number) => {
    if (daysUntil <= 0) {
      return 'bg-red-100 border-red-300 border-l-4 border-l-red-600';
    } else if (daysUntil <= 15) {
      return 'bg-red-50 border-red-200 border-l-4 border-l-red-500';
    } else if (daysUntil <= 30) {
      return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
    } else if (daysUntil <= 60) {
      return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
    }
    return 'bg-gray-50 border-gray-200 border-l-4 border-l-gray-500';
  };

  const getUrgencyIcon = (daysUntil: number, type: 'contract' | 'punctual') => {
    if (daysUntil <= 0) {
      return <AlertTriangle className="w-4 h-4 text-red-700" />;
    } else if (daysUntil <= 15) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (daysUntil <= 30) {
      return type === 'punctual' ? <Clock className="w-4 h-4 text-orange-600" /> : <Timer className="w-4 h-4 text-yellow-600" />;
    }
    return <Calendar className="w-4 h-4 text-blue-600" />;
  };

  const formatDaysUntil = (daysUntil: number) => {
    if (daysUntil <= 0) return 'Vencido';
    if (daysUntil === 1) return 'Amanhã';
    return `${daysUntil} dias`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Contratos Encerrando</span>
          </h3>
          <p className="text-sm text-gray-600">Contratos e aditivos próximos ao vencimento</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-600">{totalExpiring}</div>
          <div className="hidden md:block text-sm text-gray-500">
            {totalExpiring === 1 ? 'Vencimento' : 'Vencimentos'}
          </div>
        </div>
      </div>

      {/* Lista de Contratos/Aditivos Encerrando */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {allExpiringItems.length > 0 ? (
          allExpiringItems.map((item) => (
            <div 
              key={item.id} 
              className={`rounded-lg p-4 border transition-all ${getUrgencyClass(item.daysUntil)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getUrgencyIcon(item.daysUntil, item.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 break-words md:truncate">{item.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{item.description} termina em {formatDateBR(item.endDate)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium text-green-600">
                        Faturamento: {formatCurrency(item.value)}/mês
                      </span>
                    </div>
                    {item.type === 'contract' && (
                      <div className="text-xs text-red-600 mt-1 font-medium">
                        ⚠️ Término definitivo do contrato
                      </div>
                    )}
                    {item.type === 'punctual' && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        💡 Aditivo pontual - valor retorna após término
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    item.daysUntil <= 0 ? 'text-red-700' :
                    item.daysUntil <= 15 ? 'text-red-600' :
                    item.daysUntil <= 30 ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {formatDaysUntil(item.daysUntil)}
                  </div>
                  <div className="text-xs text-gray-500">restantes</div>
                </div>
              </div>
              
              {item.daysUntil <= 15 && item.type === 'contract' && (
                <div className="mt-2 text-xs text-red-800 bg-red-200 rounded px-2 py-1 text-center">
                  🚨 RENOVAÇÃO URGENTE: Contrato encerra em breve!
                </div>
              )}
              
              {item.daysUntil <= 15 && item.type === 'punctual' && (
                <div className="mt-2 text-xs text-orange-800 bg-orange-200 rounded px-2 py-1 text-center">
                  ⚠️ ATENÇÃO: Aditivo pontual expira em breve!
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Todos os contratos em dia!</h3>
            <p className="text-gray-500">Não há contratos ou aditivos encerrando nos próximos 90 dias</p>
          </div>
        )}
      </div>

      {/* Summary por urgência */}
      {totalExpiring > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-red-600">
                {allExpiringItems.filter(item => item.daysUntil <= 15).length}
              </div>
              <div className="text-gray-600">&le; 15 dias</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {allExpiringItems.filter(item => item.daysUntil > 15 && item.daysUntil <= 30).length}
              </div>
              <div className="text-gray-600">16-30 dias</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {allExpiringItems.filter(item => item.daysUntil > 30 && item.daysUntil <= 60).length}
              </div>
              <div className="text-gray-600">31-60 dias</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-600">
                {allExpiringItems.filter(item => item.daysUntil > 60).length}
              </div>
              <div className="text-gray-600">61-90 dias</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};