import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Proposal } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatTimestampForDb, formatDateForInput, getCurrentDateForInput } from '../../utils/dateUtils';

interface ProposalEditModalProps {
  proposal: Proposal;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProposal: Proposal) => void;
  onDelete?: () => void;
}

export const ProposalEditModal: React.FC<ProposalEditModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const { data: employees = [] } = useSupabaseQuery('employees');
  const { isAdministrative } = useSystemVersion();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    client: proposal.client,
    monthlyValue: proposal.monthlyValue,
    months: proposal.months,
    status: proposal.status,
    closerId: proposal.closerId,
    sdrId: proposal.sdrId || '',
    proposalDate: formatDateForInput(proposal.createdAt), // Usar a data atual da proposta
    closingDate: formatDateForInput(proposal.closingDate),
    lostDate: formatDateForInput(proposal.lostDate),
    lostReason: proposal.lostReason || 'Fechou com concorrente'
  });

  if (!isOpen) return null;

  const calculateCommission = (monthlyValue: number, months: number) => {
    const rate = 0.4; // Taxa base fixa de 0.4%
    
    return {
      commission: (monthlyValue * months * rate) / 100,
      rate: rate
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting proposal update:', formData);
    
    // Auto-set closing_date if status is 'Fechado' but no closing_date is provided
    if (formData.status === 'Fechado' && !formData.closingDate) {
      formData.closingDate = getCurrentDateForInput(); // Current date in YYYY-MM-DD format
      console.log('Auto-setting closing_date to current date:', formData.closingDate);
    }
    
    const totalValue = formData.monthlyValue * formData.months;
    const { commission, rate } = calculateCommission(formData.monthlyValue, formData.months);
    
    const updatedProposal: Proposal = {
      ...proposal,
      client: formData.client,
      monthlyValue: formData.monthlyValue,
      months: formData.months,
      totalValue,
      status: formData.status,
      commission,
      commissionRate: rate,
      closerId: formData.closerId,
      sdrId: formData.sdrId || undefined,
      proposalDate: formData.proposalDate,
      closingDate: formData.status === 'Fechado' ? formatTimestampForDb(formData.closingDate) : null,
      lostDate: formData.status === 'Perdido' ? formatTimestampForDb(formData.lostDate) : null,
      lostReason: formData.status === 'Perdido' ? formData.lostReason : null,
      updatedAt: formatTimestampForDb(getCurrentDateForInput())
    };
    
    console.log('Updated proposal object:', updatedProposal);
    
    onSave(updatedProposal);
    onClose();
  };

  const handleDelete = async () => {
    const confirmMessage = `⚠️ ATENÇÃO: EXCLUSÃO IRREVERSÍVEL

Tem certeza que deseja EXCLUIR PERMANENTEMENTE a proposta "${proposal.client}"?

Esta ação irá:
• Remover a proposta do sistema
• Excluir dados de probabilidade associados
• Atualizar todas as estatísticas
• Impactar cálculos de comissões

⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!

Digite "EXCLUIR" para confirmar:`;

    const confirmation = prompt(confirmMessage);

    console.log('🔍 Valor digitado:', confirmation);
    console.log('🔍 Valor após trim:', confirmation?.trim());

    if (confirmation?.trim() === 'EXCLUIR') {
      setIsDeleting(true);

      try {
        console.log('🗑️ Iniciando exclusão da proposta:', proposal.id);
        console.log('🗑️ Cliente:', proposal.client);

        const { data, error } = await supabase
          .from('proposals')
          .delete()
          .eq('id', proposal.id)
          .select();

        console.log('📊 Resultado da exclusão:', { data, error });

        if (error) {
          console.error('❌ Erro ao excluir proposta:', error);
          alert(`Erro ao excluir proposta: ${error.message}\n\nDetalhes: ${JSON.stringify(error)}`);
          setIsDeleting(false);
          return;
        }

        console.log('✅ Proposta excluída com sucesso do banco');

        if (onDelete) {
          console.log('📞 Chamando callback onDelete');
          onDelete();
        } else {
          console.warn('⚠️ Callback onDelete não foi fornecido');
        }

        onClose();

        alert('✅ Proposta excluída com sucesso!\n\n🔄 A página será recarregada.');

        window.location.reload();

      } catch (error) {
        console.error('💥 Erro inesperado ao excluir proposta:', error);
        alert(`Erro inesperado ao excluir proposta: ${error}\n\nTente novamente.`);
        setIsDeleting(false);
      }
    } else if (confirmation !== null) {
      console.log('❌ Confirmação não correspondeu. Esperado: "EXCLUIR", Recebido:', confirmation);
      alert(`Exclusão cancelada.\n\nVocê digitou: "${confirmation}"\nEsperado: "EXCLUIR"\n\nDigite exatamente "EXCLUIR" (em maiúsculas) para confirmar.`);
    } else {
      console.log('🚫 Usuário cancelou a exclusão');
    }
  };
  const closers = employees.filter(emp => emp.is_closer === true);
  const sdrs = employees.filter(emp => emp.is_sdr === true);
  const { commission, rate } = calculateCommission(formData.monthlyValue, formData.months);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Proposta</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Proposta
              </label>
              <input
                type="date"
                value={formData.proposalDate}
                onChange={(e) => setFormData({ ...formData, proposalDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                max={getCurrentDateForInput()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                value={formData.monthlyValue}
                onChange={(e) => setFormData({ ...formData, monthlyValue: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meses
              </label>
              <input
                type="number"
                value={formData.months}
                onChange={(e) => setFormData({ ...formData, months: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SQL">SQL</option>
                <option value="Proposta">Proposta</option>
                <option value="Negociação">Negociação</option>
                <option value="Análise de contrato">Análise de contrato</option>
                <option value="Fechado">Fechado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            {/* Campo de Data de Fechamento - só aparece quando status é "Fechado" */}
            {formData.status === 'Fechado' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fechamento
                </label>
                <input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.status === 'Fechado'}
                  max={getCurrentDateForInput()}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Data em que o contrato foi efetivamente fechado
                </p>
              </div>
            )}

            {/* Campo de Data de Perda - só aparece quando status é "Perdido" */}
            {formData.status === 'Perdido' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Perda
                  </label>
                  <input
                    type="date"
                    value={formData.lostDate}
                    onChange={(e) => setFormData({ ...formData, lostDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={formData.status === 'Perdido'}
                    max={getCurrentDateForInput()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Data em que perdemos a proposta
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Perda
                  </label>
                  <select
                    value={formData.lostReason}
                    onChange={(e) => setFormData({ ...formData, lostReason: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={formData.status === 'Perdido'}
                  >
                    <option value="Fechou com concorrente">Fechou com concorrente</option>
                    <option value="Fechou com o atual">Fechou com o atual</option>
                    <option value="Desistiu da contratação">Desistiu da contratação</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione o motivo pelo qual perdemos a proposta
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closer
              </label>
              <select
                value={formData.closerId}
                onChange={(e) => setFormData({ ...formData, closerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um closer</option>
                {closers.map(closer => (
                  <option key={closer.id} value={closer.id}>
                    {closer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SDR (Opcional)
              </label>
              <select
                value={formData.sdrId}
                onChange={(e) => setFormData({ ...formData, sdrId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um SDR</option>
                {sdrs.map(sdr => (
                  <option key={sdr.id} value={sdr.id}>
                    {sdr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Commission Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Prévia da Comissão Atualizada</h3>
            <div className="text-xs text-blue-700 mb-2">
              * Taxa final será definida pelo volume total fechado no mês
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Valor Total:</span>
                <span className="font-bold ml-2">{formatCurrency(formData.monthlyValue * formData.months)}</span>
              </div>
              <div>
                <span className="text-blue-600">Taxa Base:</span>
                <span className="font-bold ml-2">{rate}%</span>
              </div>
              <div className="col-span-2">
                <span className="text-blue-600">Comissão Base:</span>
                <span className="font-bold ml-2 text-lg">{formatCurrency(commission)}</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
              <strong>Escala Real:</strong> 0,4% (até R$ 600k) • 0,8% (R$ 600k-1,2mi) • 1,2% (acima R$ 1,2mi)
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            {isAdministrative && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Excluindo...' : 'Excluir Proposta'}</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Processando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};