import React from 'react';
import { FileText, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateBR } from '../../utils/dateUtils';
import { ContractWithAddendums } from '../../types/contracts';

export const ContractsSection: React.FC = () => {
  // Buscar contratos e aditivos
  const { data: contracts = [], loading: contractsLoading } = useSupabaseQuery('contracts');
  const { data: addendums = [], loading: addendumsLoading } = useSupabaseQuery('contract_addendums', {
    orderBy: { column: 'created_at', ascending: false }
  });

  if (contractsLoading || addendumsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Processar contratos com aditivos
  const contractsWithAddendums: ContractWithAddendums[] = contracts.map(contract => {
    // Buscar aditivos deste contrato
    const contractAddendums = addendums.filter(a => a.contract_id === contract.id);
    
    // Função para identificar aditivos informativos
    const isInformativeAddendum = (addendum: any) => {
      return addendum.monthly_value === 0 && 
             addendum.observations && 
             addendum.observations.startsWith('[ADITIVO INFORMATIVO]');
    };
    
    const today = new Date();
    
    // Separar aditivos pontuais dos permanentes (ignorando informativos)
    const punctualAddendums = contractAddendums.filter(a => a.is_punctual && !isInformativeAddendum(a));
    const permanentAddendums = contractAddendums.filter(a => !a.is_punctual && !isInformativeAddendum(a));
    
    // 1. DETERMINAR DATA DE TÉRMINO: Sempre do aditivo permanente mais distante
    let currentEndDate = contract.end_date; // Padrão: contrato original
    
    if (permanentAddendums.length > 0) {
      // Buscar aditivo permanente com data de término mais distante
      const furthestPermanentAddendum = permanentAddendums
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
      currentEndDate = furthestPermanentAddendum.end_date;
    }
    
    // 2. DETERMINAR VALOR ATUAL: Considerando aditivos pontuais ativos
    let currentValue = contract.monthly_value;
    let activePunctualAddendum: any = undefined;
    
    // Verificar se há aditivo pontual ativo
    if (punctualAddendums.length > 0) {
      activePunctualAddendum = punctualAddendums.find(addendum => {
        const startDate = new Date(addendum.effective_start_date || addendum.start_date);
        const endDate = new Date(addendum.effective_end_date || addendum.end_date);
        return today >= startDate && today <= endDate;
      });
    }
    
    if (activePunctualAddendum) {
      // Se há aditivo pontual ativo, usar seu valor
      currentValue = activePunctualAddendum.monthly_value;
    } else {
      // Se não há aditivo pontual ativo, usar valor do aditivo permanente mais recente
      if (permanentAddendums.length > 0) {
        const latestPermanentAddendum = permanentAddendums
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        currentValue = latestPermanentAddendum.monthly_value;
      }
    }
    
    // 3. CALCULAR DIAS ATÉ O FIM DO CONTRATO (baseado na data permanente)
    const endDate = new Date(currentEndDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysUntilEnd = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Verificar se contrato está próximo ao fim (90 dias)
    const isEndingSoon = daysUntilEnd <= 90 && daysUntilEnd > 0;
    
    // 4. CALCULAR DIAS ATÉ O FIM DO ADITIVO PONTUAL MAIS RECENTE (se houver)
    let punctualEndingSoon = false;
    let daysUntilPunctualEnd = 0;
    let latestPunctualAddendum: any = undefined;
    
    // Buscar o aditivo pontual mais recente (independente de estar ativo)
    if (punctualAddendums.length > 0) {
      latestPunctualAddendum = punctualAddendums
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      const punctualEndDate = new Date(latestPunctualAddendum.end_date);
      const punctualTimeDiff = punctualEndDate.getTime() - today.getTime();
      daysUntilPunctualEnd = Math.ceil(punctualTimeDiff / (1000 * 3600 * 24));
      
      // Aditivo pontual próximo ao fim (90 dias)
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

  // Calcular faturamento mensal atual
  const monthlyRevenue = contractsWithAddendums.reduce((sum, contract) => {
    return sum + contract.current_value;
  }, 0);

  // Contratos terminando em 90 dias
  const contractsEndingSoon = contractsWithAddendums.filter(c => c.is_ending_soon);
  
  // Aditivos pontuais encerrando
  const punctualAddendumsEndingSoon = contractsWithAddendums.filter(c => c.punctual_ending_soon && c.latest_punctual_addendum);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card de Faturamento Mensal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Faturamento de Contratos</span>
            </h3>
            <p className="text-sm text-gray-600">Receita mensal dos contratos vigentes</p>
          </div>
          <div className="text-right">
            <div className="text-lg md:text-2xl font-bold text-green-600">{formatCurrency(monthlyRevenue)}</div>
            <div className="text-sm text-gray-500">por mês</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-lg md:text-xl font-bold text-blue-600">{contractsWithAddendums.length}</div>
            <div className="text-sm text-gray-600">Contratos Vigentes</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-sm md:text-xl font-bold text-green-600">
              {formatCurrency(monthlyRevenue * 12)}
            </div>
            <div className="text-sm text-gray-600">Receita Anual</div>
          </div>
        </div>
      </div>

      {/* Card de Contratos Encerrando */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Avisos de Encerramento</span>
            </h3>
            <p className="text-sm text-gray-600">Contratos e aditivos com término próximo</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">{contractsEndingSoon.length + punctualAddendumsEndingSoon.length}</div>
            <div className="text-sm text-gray-500">avisos</div>
          </div>
        </div>

        {/* Layout de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Contratos/Aditivos Permanentes */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-red-600" />
              <h4 className="text-lg font-semibold text-red-900">Contratos Encerrando</h4>
              <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                {contractsEndingSoon.length}
              </span>
            </div>
            <p className="text-sm text-red-700 mb-4">Término definitivo em até 90 dias</p>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {contractsEndingSoon.length > 0 ? (
                contractsEndingSoon.map((contract) => (
                  <div key={`permanent-${contract.id}`} className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{contract.client_name}</h4>
                        <p className="text-sm text-gray-600">
                          Contrato termina em {formatDateBR(contract.current_end_date)}
                        </p>
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⚠️ Término definitivo do contrato
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-600">
                          {contract.days_until_end} dia{contract.days_until_end !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-red-500 font-medium">restantes</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Contratos em dia</h3>
                  <p className="text-xs text-gray-500">Nenhum contrato terminando nos próximos 90 dias</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Coluna Direita - Aditivos Pontuais */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-semibold text-orange-900">Aditivos Pontuais</h4>
              <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                {punctualAddendumsEndingSoon.length}
              </span>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {punctualAddendumsEndingSoon.length > 0 ? (
                punctualAddendumsEndingSoon.map((contract) => (
                  <div key={`punctual-${contract.id}`} className="bg-white border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{contract.client_name}</h4>
                        <p className="text-sm text-gray-600">
                          Aditivo pontual termina em {formatDateBR(contract.latest_punctual_addendum!.end_date)}
                        </p>
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                          💡 Valor volta para {formatCurrency(
                            contract.addendums
                              .filter(a => !a.is_punctual)
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                              ?.monthly_value || contract.monthly_value
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-orange-600">
                          {contract.days_until_punctual_end} dia{contract.days_until_punctual_end !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">restantes</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Aditivos em dia</h3>
                  <p className="text-xs text-gray-500">Nenhum aditivo pontual terminando em breve</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};