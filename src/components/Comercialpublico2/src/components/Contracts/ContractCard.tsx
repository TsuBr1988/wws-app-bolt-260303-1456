import React, { useState } from 'react';
import { Calendar, DollarSign, AlertTriangle, Clock, CreditCard as Edit, Plus, FileText, Power, Save, X, Timer } from 'lucide-react';
import { ContractWithAddendums } from '../../types/contracts';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateBR } from '../../utils/dateUtils';
import { AddendumForm } from './AddendumForm';
import { EditContractForm } from './EditContractForm';
import { AddendumViewModal } from './AddendumViewModal';
import { useSupabaseUpdate } from '../../hooks/useSupabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';

interface ContractCardProps {
  contract: ContractWithAddendums;
  onUpdate: () => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({ 
  contract, 
  onUpdate
}) => {
  const { canEdit } = useSystemVersion();
  const { update: updateContract } = useSupabaseUpdate('contracts');
  
  // Unificar contratos vencidos como inativos
  const isExpiredByDate = contract.days_until_end <= 0;
  const isInactive = !contract.is_active || isExpiredByDate; // Vencido OU marcado como inativo
  const isEffectivelyActive = !isInactive; // Ativo apenas se não for inativo nem vencido
  
  const [editingStatus, setEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState(contract.is_active);
  const [showAddendumForm, setShowAddendumForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddendumsModal, setShowAddendumsModal] = useState(false);

  // Função para calcular e determinar qual término está mais próximo
  const getClosestTermination = () => {
    const today = new Date();
    const terminations = [];

    // 1. Término do contrato (aditivo permanente mais distante)
    const contractEndDate = new Date(contract.current_end_date);
    const daysUntilContract = Math.ceil((contractEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilContract <= 90 && daysUntilContract > 0) {
      terminations.push({
        type: 'contract',
        days: daysUntilContract,
        date: contract.current_end_date,
        description: 'Contrato',
        color: 'text-red-600 bg-red-100 border-red-200',
        icon: <FileText className="w-4 h-4" />
      });
    }

    // 2. Término do aditivo pontual mais recente
    if (contract.latest_punctual_addendum) {
      const punctualEndDate = new Date(contract.latest_punctual_addendum.end_date);
      const daysUntilPunctual = Math.ceil((punctualEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (daysUntilPunctual <= 90 && daysUntilPunctual > 0) {
        terminations.push({
          type: 'punctual',
          days: daysUntilPunctual,
          date: contract.latest_punctual_addendum.end_date,
          description: 'Aditivo Pontual',
          color: 'text-orange-600 bg-orange-100 border-orange-200',
          icon: <Clock className="w-4 h-4" />
        });
      }
    }

    // Retornar o término mais próximo
    if (terminations.length === 0) return null;
    
    return terminations.sort((a, b) => a.days - b.days)[0];
  };
  const getUrgencyDisplay = () => {
    if (contract.days_until_end <= 0) {
      return {
        color: 'text-red-600 bg-red-100',
        message: 'VENCIDO',
        icon: <AlertTriangle className="w-4 h-4" />
      };
    } else if (contract.is_ending_soon) {
      return {
        color: 'text-red-600 bg-red-100',
        message: `${contract.days_until_end} dias restantes`,
        icon: <Clock className="w-4 h-4" />
      };
    }
    return null;
  };

  const getPunctualUrgencyDisplay = () => {
    if (contract.punctual_ending_soon && contract.latest_punctual_addendum) {
      return {
        color: 'text-orange-600 bg-orange-100',
        message: `Aditivo pontual encerra em ${contract.days_until_punctual_end} dias`,
        icon: <Clock className="w-4 h-4" />
      };
    }
    return null;
  };

  const handleStatusSave = async () => {
    try {
      console.log('🔄 Atualizando status do contrato:', {
        contractId: contract.id,
        currentStatus: contract.is_active,
        newStatus: tempStatus
      });
      
      await updateContract(contract.id, { is_active: tempStatus });
      
      console.log('✅ Status do contrato atualizado com sucesso');
      
      onUpdate(); // Refresh the contracts list
      setEditingStatus(false);
      alert(`✅ Contrato marcado como ${tempStatus ? 'ativo' : 'inativo'} com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status do contrato:', {
        error,
        contractId: contract.id,
        attemptedStatus: tempStatus
      });
      alert('❌ Erro ao atualizar status do contrato');
      setTempStatus(contract.is_active); // Reset to original value
    }
  };

  const handleStatusCancel = () => {
    setTempStatus(contract.is_active);
    setEditingStatus(false);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300';
  };

  const getStatusBanner = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500 text-white' 
      : 'bg-red-500 text-white';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'CONTRATO ATIVO' : 'CONTRATO INATIVO';
  };

  const urgency = getUrgencyDisplay();
  const punctualUrgency = getPunctualUrgencyDisplay();
  const closestTermination = getClosestTermination();

  const empresa = (contract as any).empresa || 'WWS';
  const cardBgColor = empresa === 'WWS' ? 'bg-yellow-50' : 'bg-gray-100';

  return (
    <>
      <div className={`${cardBgColor} rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all w-full ${
        isInactive ? 'border-red-300 opacity-75' :
        contract.is_ending_soon ? 'border-red-200' : 'border-gray-200'
      }`}>
        {/* Banner de Status do Contrato - Verde se ativo, Vermelho se inativo (incluindo vencidos) */}
        <div className={`${getStatusBanner(isEffectivelyActive)} px-4 py-2 -mx-6 -mt-6 mb-4 flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <Power className="w-4 h-4" />
            <span className="font-bold text-sm">
              {isInactive ? 'CONTRATO INATIVO' : 'CONTRATO ATIVO'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              empresa === 'WWS' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-300 text-gray-800'
            }`}>
              {empresa}
            </span>
            {isExpiredByDate && (
              <span className="text-xs opacity-90">
                • Vencido há {Math.abs(contract.days_until_end)} dias
              </span>
            )}
          </div>
          <div className="text-xs opacity-90">
            {isEffectivelyActive ? '✓ Gerando faturamento' :
             '⚠️ Sem faturamento'}
          </div>
        </div>

        {/* Contagem Regressiva - Aparece quando faltam 90 dias ou menos */}
        {closestTermination && (
          <div className={`${closestTermination.color} border rounded-lg px-4 py-2 mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5" />
                <span className="font-bold text-sm">
                  ⏰ {closestTermination.days} dia{closestTermination.days !== 1 ? 's' : ''} restante{closestTermination.days !== 1 ? 's' : ''}
                </span>
                <span className="text-sm opacity-75">•</span>
                <span className="text-sm opacity-90">
                  {closestTermination.description} encerra em {formatDateBR(closestTermination.date)}
                </span>
              </div>
              {closestTermination.type === 'punctual' && (
                <div className="text-xs opacity-75">
                  💡 Valor volta para aditivo anterior após término
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aviso específico para aditivo pontual */}
        {punctualUrgency && (
          <div className={`${punctualUrgency.color} rounded-lg p-3 mb-4 flex items-center justify-between`}>
            <div className="flex items-center space-x-2">
              {punctualUrgency.icon}
              <span className="font-bold text-sm">{punctualUrgency.message}</span>
            </div>
            <div className="text-xs text-orange-700">
              Valor volta para {formatCurrency(
                contract.addendums
                  .filter(a => !a.is_punctual)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                  ?.monthly_value || contract.monthly_value
              )} após o término
            </div>
          </div>
        )}

        {/* Status do Contrato - Apenas para Admin */}
        {canEdit('contracts') && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Power className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Status do Contrato:</span>
              </div>
              
              {editingStatus ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={tempStatus ? 'active' : 'inactive'}
                    onChange={(e) => setTempStatus(e.target.value === 'active')}
                    className={`px-3 py-1 rounded-full text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(tempStatus)}`}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                  <button
                    onClick={handleStatusSave}
                    className="p-1 text-green-600 hover:text-green-800 rounded"
                    title="Salvar"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStatusCancel}
                    className="p-1 text-red-600 hover:text-red-800 rounded"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingStatus(true)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border hover:opacity-80 transition-opacity ${getStatusColor(isEffectivelyActive)}`}
                >
                  {isExpiredByDate ? 'Vencido' : contract.is_active ? 'Ativo' : 'Inativo'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Layout Horizontal para Lista */}
        <div className="flex items-center justify-between">
          {/* Informações do Cliente */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{contract.client_name}</h3>
            {contract.city && (
              <p className="text-sm text-gray-500 mb-2">📍 {contract.city}</p>
            )}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{contract.contract_object}</p>
            
            {/* Números do Pregão e Contrato */}
            {(contract.numero_pregao || contract.numero_contrato) && (
              <div className="flex items-center space-x-4 text-sm mb-3">
                {contract.numero_pregao && (
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Pregão:</span>
                    <span className="font-medium text-blue-600">{contract.numero_pregao}</span>
                  </div>
                )}
                {contract.numero_contrato && (
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Contrato:</span>
                    <span className="font-medium text-green-600">{contract.numero_contrato}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Datas em linha */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Início:</span>
                <span className="font-medium text-gray-900">{formatDateBR(contract.start_date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Término:</span>
                <span className={`font-medium ${
                  contract.is_ending_soon ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatDateBR(contract.current_end_date)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Valor Atual */}
          <div className="text-center mx-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Faturamento Atual</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(contract.current_value)}
            </div>
            <div className="text-xs text-gray-500">por mês</div>
          </div>
          
          {/* Aditivos */}
          <div className="text-center mx-8">
            <button
              onClick={() => setShowAddendumsModal(true)}
              className="flex items-center justify-center space-x-2 mb-2 hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer"
              title="Clique para ver detalhes dos aditivos"
            >
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Aditivos</span>
            </button>
            <button
              onClick={() => setShowAddendumsModal(true)}
              className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
              title="Clique para ver detalhes dos aditivos"
            >
              {contract.addendums.length}
            </button>
            {contract.addendums.length > 0 ? (
              <div className="text-xs text-green-600">
                Último: {formatDateBR(contract.addendums[0].end_date)}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Nenhum aditivo</div>
            )}
          </div>
          
          {/* Ações */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowAddendumForm(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Aditivo</span>
            </button>
            <button
              onClick={() => setShowEditForm(true)}
              className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Aditivo */}
      {showAddendumForm && (
        <AddendumForm
          contractId={contract.id}
          contractName={contract.client_name}
          onClose={() => setShowAddendumForm(false)}
          onSuccess={() => {
            onUpdate();
            setShowAddendumForm(false);
          }}
        />
      )}

      {/* Modal de Edição */}
      {showEditForm && (
        <EditContractForm
          contract={contract}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            onUpdate();
            setShowEditForm(false);
          }}
        />
      )}

      {/* Modal de Visualização de Aditivos */}
      {showAddendumsModal && (
        <AddendumViewModal
          contract={contract}
          onClose={() => setShowAddendumsModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};