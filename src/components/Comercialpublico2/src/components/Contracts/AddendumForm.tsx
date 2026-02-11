import React, { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { useSupabaseInsert } from '../../hooks/useSupabase';

interface AddendumFormProps {
  contractId: string;
  contractName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddendumForm: React.FC<AddendumFormProps> = ({ 
  contractId, 
  contractName, 
  onClose, 
  onSuccess 
}) => {
  const { insert: insertAddendum, loading } = useSupabaseInsert('contract_addendums');
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    monthly_value: 0,
    observations: '',
    is_punctual: false,
    is_informative: false,
    informative_date: new Date().toISOString().split('T')[0] // Data padrão: hoje
  });
  const [showPunctualConfirmation, setShowPunctualConfirmation] = useState(false);
  const [showInformativeConfirmation, setShowInformativeConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações diferentes para aditivos informativos
    if (formData.is_informative) {
      if (!formData.observations.trim()) {
        alert('Observações são obrigatórias para aditivos informativos');
        return;
      }
      
      if (!showInformativeConfirmation) {
        setShowInformativeConfirmation(true);
        return;
      }
    } else {
      // Validações normais para aditivos que alteram valor/data
      if (!formData.start_date || !formData.end_date) {
        alert('Datas de início e fim do aditivo são obrigatórias');
        return;
      }

      if (formData.monthly_value <= 0) {
        alert('Valor do aditivo deve ser maior que zero');
        return;
      }

      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        alert('Data de término deve ser posterior à data de início');
        return;
      }

      // Se for aditivo pontual, mostrar confirmação
      if (formData.is_punctual && !showPunctualConfirmation) {
        setShowPunctualConfirmation(true);
        return;
      }
    }

    try {
      if (formData.is_informative) {
        // Aditivo informativo - usar data atual e valor 0
        await insertAddendum({
          contract_id: contractId,
          start_date: formData.informative_date,
          end_date: formData.informative_date,
          effective_start_date: formData.informative_date,
          effective_end_date: null,
          is_punctual: false,
          monthly_value: 0,
          observations: `[ADITIVO INFORMATIVO] ${formData.observations}`
        });
      } else {
        // Aditivo normal
        await insertAddendum({
          contract_id: contractId,
          start_date: formData.start_date,
          end_date: formData.end_date,
          effective_start_date: formData.start_date,
          effective_end_date: formData.is_punctual ? formData.end_date : null,
          is_punctual: formData.is_punctual,
          monthly_value: formData.monthly_value,
          observations: formData.observations
        });
      }

      const message = formData.is_informative
        ? '✅ Aditivo informativo criado com sucesso!\n\n📝 Registrado apenas como alteração de dados contratuais.'
        : formData.is_punctual 
        ? '✅ Aditivo pontual criado com sucesso!\n\n📅 O contrato retornará às condições anteriores após o término do período definido.'
        : '✅ Aditivo permanente criado com sucesso!';
      
      alert(message);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar aditivo:', error);
      alert(`❌ Erro ao criar aditivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handlePunctualChange = (checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, is_punctual: checked, is_informative: false });
    } else {
      setFormData({ ...formData, is_punctual: checked });
    }
    if (!checked) {
      setShowPunctualConfirmation(false);
    }
  };

  const handleInformativeChange = (checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, is_informative: checked, is_punctual: false });
    } else {
      setFormData({ ...formData, is_informative: checked });
    }
    if (!checked) {
      setShowInformativeConfirmation(false);
    }
  };

  // Modal de confirmação para aditivo informativo
  const InformativeConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Confirmar Aditivo Informativo</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-3">
              <strong>Você está criando um aditivo INFORMATIVO:</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1 mb-3">
              <li>• <strong>Não altera:</strong> Valor mensal nem data de término</li>
              <li>• <strong>Finalidade:</strong> Registrar alterações de dados contratuais</li>
              <li>• <strong>Exemplos:</strong> Mudança de endereço, dados bancários, responsáveis</li>
              <li>• <strong>Observações:</strong> {formData.observations}</li>
            </ul>
            <p className="text-sm text-blue-800 font-medium">
              Este aditivo será apenas informativo e não afetará o faturamento.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Confirmar Aditivo Informativo
            </button>
            <button
              onClick={() => setShowInformativeConfirmation(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal de confirmação para aditivo pontual
  const PunctualConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Confirmar Aditivo Pontual</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 mb-3">
              <strong>Você está criando um aditivo PONTUAL:</strong>
            </p>
            <ul className="text-sm text-yellow-700 space-y-1 mb-3">
              <li>• <strong>Período:</strong> {new Date(formData.start_date).toLocaleDateString('pt-BR')} até {new Date(formData.end_date).toLocaleDateString('pt-BR')}</li>
              <li>• <strong>Novo valor:</strong> {formData.monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</li>
              <li>• <strong>Após {new Date(formData.end_date).toLocaleDateString('pt-BR')}:</strong> O contrato retornará automaticamente às condições do aditivo anterior ou contrato original</li>
            </ul>
            <p className="text-sm text-yellow-800 font-medium">
              Esta alteração é temporária e o sistema calculará automaticamente o faturamento correto para cada período.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              Confirmar Aditivo Pontual
            </button>
            <button
              onClick={() => setShowPunctualConfirmation(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Novo Aditivo</h2>
              <p className="text-sm text-gray-600">{contractName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Aditivo */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Tipo de Aditivo</h3>
            
            {/* Aditivo Informativo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_informative}
                  onChange={(e) => handleInformativeChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-blue-900">
                    📝 Aditivo Informativo (Sem alteração de valor/data)
                  </span>
                  <p className="text-xs text-blue-700 mt-1">
                    Para registrar alterações que não afetam valor ou prazo (ex: endereço, dados bancários, responsáveis).
                  </p>
                </div>
              </label>
            </div>
            
            {/* Aditivo Pontual */}
            {!formData.is_informative && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_punctual}
                    onChange={(e) => handlePunctualChange(e.target.checked)}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-yellow-900">
                      📅 Aditivo Pontual (Temporário)
                    </span>
                    <p className="text-xs text-yellow-700 mt-1">
                      Marque esta opção se o aditivo deve vigorar apenas por um período específico, 
                      retornando às condições anteriores após o término.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Campo de data específico para aditivos informativos */}
          {formData.is_informative && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Aditivo *
              </label>
              <input
                type="date"
                value={formData.informative_date}
                onChange={(e) => setFormData({ ...formData, informative_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={formData.is_informative}
              />
              <p className="text-xs text-blue-600 mt-1">
                📅 Data em que o aditivo foi formalizado (apenas informativo)
              </p>
            </div>
          )}

          {/* Campos de data - apenas para aditivos não informativos */}
          {!formData.is_informative && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início do Aditivo *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!formData.is_informative}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.is_punctual ? 'Data de Término do Período Pontual *' : 'Data de Término do Aditivo *'}
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={formData.start_date}
                  required={!formData.is_informative}
                />
                {formData.is_punctual && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Após esta data, o contrato retornará às condições do aditivo anterior ou contrato original
                  </p>
                )}
              </div>
            </>
          )}

          {/* Campo de valor - apenas para aditivos não informativos */}
          {!formData.is_informative && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.is_punctual ? 'Valor Mensal Durante o Período Pontual *' : 'Novo Valor Mensal *'}
              </label>
              <input
                type="number"
                value={formData.monthly_value || ''}
                onChange={(e) => setFormData({ ...formData, monthly_value: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                placeholder="0,00"
                required={!formData.is_informative}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.is_punctual 
                  ? 'Este valor vigorará apenas durante o período definido acima'
                  : 'Este valor será considerado como o valor atual do contrato'
                }
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.is_informative ? 'Observações *' : 'Observações'}
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={formData.is_informative 
                ? "Ex: Alteração de endereço, mudança de dados bancários, novo responsável..."
                : "Detalhes sobre este aditivo..."
              }
              required={formData.is_informative}
            />
            {formData.is_informative && (
              <p className="text-xs text-blue-600 mt-1">
                ⚠️ Observações são obrigatórias para aditivos informativos
              </p>
            )}
          </div>

          {/* Preview do aditivo */}
          {(formData.is_informative || (formData.start_date && formData.end_date)) && (
            <div className={`border rounded-lg p-4 ${
              formData.is_informative 
                ? 'bg-blue-50 border-blue-200' :
              formData.is_punctual 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`text-sm font-medium mb-2 ${
                formData.is_informative ? 'text-blue-800' :
                formData.is_punctual ? 'text-yellow-800' : 'text-blue-800'
              }`}>
                {formData.is_informative ? 'Resumo do Aditivo Informativo' :
                 formData.is_punctual ? 'Resumo do Aditivo Pontual' : 'Resumo do Aditivo'}
              </h3>
              <div className="text-sm text-blue-600 space-y-1">
                <p><strong>Tipo:</strong> {
                  formData.is_informative ? 'Informativo (Sem alteração)' :
                  formData.is_punctual ? 'Pontual (Temporário)' : 'Permanente'
                }</p>
                {!formData.is_informative && (
                  <>
                    <p><strong>Período:</strong> {new Date(formData.start_date).toLocaleDateString('pt-BR')} até {new Date(formData.end_date).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Novo Valor:</strong> {formData.monthly_value > 0 ? `R$ ${formData.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}</p>
                    <p><strong>Duração:</strong> {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} meses aproximadamente</p>
                  </>
                )}
                {formData.is_informative && (
                  <>
                    <p><strong>Data do Aditivo:</strong> {new Date(formData.informative_date).toLocaleDateString('pt-BR')}</p>
                    <p className="text-blue-700 font-medium">
                      📝 <strong>Sem alteração:</strong> Não afeta valor nem data de término
                    </p>
                  </>
                )}
                {formData.is_punctual && !formData.is_informative && (
                  <p className="text-yellow-700 font-medium">
                    ⚠️ <strong>Após {new Date(formData.end_date).toLocaleDateString('pt-BR')}:</strong> Retorna às condições anteriores
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 ${
                formData.is_informative
                  ? 'bg-blue-600 hover:bg-blue-700' :
                formData.is_punctual 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : (
                formData.is_informative ? 'Criar Aditivo Informativo' :
                formData.is_punctual ? 'Criar Aditivo Pontual' : 'Criar Aditivo'
              )}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
      </div>

      {/* Modal de Confirmação de Aditivo Pontual */}
      {showPunctualConfirmation && <PunctualConfirmationModal />}
      
      {/* Modal de Confirmação de Aditivo Informativo */}
      {showInformativeConfirmation && <InformativeConfirmationModal />}
    </>
  );
};