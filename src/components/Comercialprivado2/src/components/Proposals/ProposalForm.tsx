import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Proposal } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatTimestampForDb, getCurrentDateForInput } from '../../utils/dateUtils';

interface ProposalFormProps {
  onSubmit: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: {
    client?: string;
    monthlyValue?: number;
    months?: number;
    budgetId?: string;
  };
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { data: employees = [] } = useSupabaseQuery('employees');

  const EMPRESA_OPTIONS = ['WWS', 'Worldwide', '2WS'] as const;

  const FAMILY_OPTIONS = [
    'Shopping',
    'Saúde',
    'Múltiplos pontos (Varejo)',
    'Indústria',
    'Condomínio',
    'Aeroportos',
  ];

  const [formData, setFormData] = useState({
    empresa: '' as string,
    client: initialData?.client || '',
    monthlyValue: initialData?.monthlyValue || 0,
    months: initialData?.months || 12,
    status: 'Proposta' as const,
    closerId: '',
    sdrId: '',
    proposalDate: getCurrentDateForInput(), // Data atual como padrão
    familia: '',
    closingDate: '',
    lostDate: '',
    lostReason: 'Fechou com concorrente' as const,
    budgetId: initialData?.budgetId || ''
  });

  const calculateCommission = (monthlyValue: number, months: number) => {
    const rate = 0.4; // Taxa base fixa de 0.4%
    
    return {
      commission: (monthlyValue * months * rate) / 100,
      rate: rate
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-set closing_date if status is 'Fechado' but no closing_date is provided
    if (formData.status === 'Fechado' && !formData.closingDate) {
      formData.closingDate = getCurrentDateForInput(); // Current date in YYYY-MM-DD format
      console.log('Auto-setting closing_date to current date for new proposal:', formData.closingDate);
    }
    
    const totalValue = formData.monthlyValue * formData.months;
    const { commission, rate } = calculateCommission(formData.monthlyValue, formData.months);
    
    const proposalData = {
      ...formData,
      totalValue,
      commission,
      commissionRate: rate,
      sdrId: formData.sdrId || undefined,
      budgetId: formData.budgetId || undefined,
      empresa: formData.empresa || undefined,
      familia: formData.familia || undefined,
      closingDate: formData.status === 'Fechado' ? formatTimestampForDb(formData.closingDate) : null,
      lostDate: formData.status === 'Perdido' ? formatTimestampForDb(formData.lostDate) : null,
      lostReason: formData.status === 'Perdido' ? formData.lostReason : null,
      proposalDate: formatTimestampForDb(formData.proposalDate)
    };
    
    console.log('Enviando dados da proposta:', proposalData);
    onSubmit(proposalData);
  };

  const closers = employees.filter(emp => emp.is_closer === true);
  const sdrs = employees.filter(emp => emp.is_sdr === true);
  const { commission, rate } = calculateCommission(formData.monthlyValue, formData.months);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nova Proposta</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <select
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Selecione uma empresa</option>
                {EMPRESA_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                max={getCurrentDateForInput()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Data em que a proposta foi criada (pode ser retroativa)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Família
              </label>
              <select
                value={formData.familia}
                onChange={(e) => setFormData({ ...formData, familia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecione uma família</option>
                {FAMILY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                value={formData.monthlyValue}
                onChange={(e) => setFormData({ ...formData, monthlyValue: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">Prévia da Comissão</h3>
            <div className="text-xs text-green-700 mb-2">
              * Taxa final será definida pelo volume total fechado no mês
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Valor Total:</span>
                <span className="font-bold ml-2">{formatCurrency(formData.monthlyValue * formData.months)}</span>
              </div>
              <div>
                <span className="text-green-600">Taxa Base:</span>
                <span className="font-bold ml-2">{rate}%</span>
              </div>
              <div className="col-span-2">
                <span className="text-green-600">Comissão Base:</span>
                <span className="font-bold ml-2 text-lg">{formatCurrency(commission)}</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
              <strong>Escala Real:</strong> 0,4% (até R$ 600k) • 0,8% (R$ 600k-1,2mi) • 1,2% (acima R$ 1,2mi)
            </div>
          </div>

          {/* Note about probability */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Avaliação de Probabilidade</h3>
            <p className="text-sm text-blue-600">
              Após criar a proposta, você poderá avaliar a probabilidade de fechamento 
              clicando no indicador de probabilidade no card da proposta.
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Criar Proposta
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};