import { useState } from 'react';
import { X, Clock, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { calculateDurationInMonths, formatCurrency, formatDateBR, ContractWithAddendums } from '../../lib/contractUtils';

interface AddendumFormProps {
  contract: ContractWithAddendums;
  onClose: () => void;
  onSubmit: (addendumData: any) => Promise<void>;
}

export function AddendumForm({ contract, onClose, onSubmit }: AddendumFormProps) {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    monthly_value: '',
    observations: '',
    is_punctual: false,
    is_informative: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPunctualConfirm, setShowPunctualConfirm] = useState(false);
  const [showInformativeConfirm, setShowInformativeConfirm] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.is_informative) {
      if (!formData.start_date) {
        newErrors.start_date = 'Data do aditivo é obrigatória';
      }
      if (!formData.observations.trim()) {
        newErrors.observations = 'Observações são obrigatórias para aditivos informativos';
      }
    } else {
      if (!formData.start_date) {
        newErrors.start_date = 'Data de início é obrigatória';
      }
      if (!formData.end_date) {
        newErrors.end_date = 'Data de término é obrigatória';
      }

      const value = parseFloat(formData.monthly_value);
      if (!formData.monthly_value || isNaN(value) || value <= 0) {
        newErrors.monthly_value = 'Valor mensal deve ser maior que zero';
      }

      if (formData.start_date && formData.end_date) {
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
          newErrors.end_date = 'Data de término deve ser posterior à data de início';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (formData.is_punctual && !showPunctualConfirm) {
      setShowPunctualConfirm(true);
      return;
    }

    if (formData.is_informative && !showInformativeConfirm) {
      setShowInformativeConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const addendumData: any = {
        contract_id: contract.id,
        start_date: formData.start_date,
        is_punctual: formData.is_punctual,
        is_active: true,
      };

      if (formData.is_informative) {
        addendumData.end_date = formData.start_date;
        addendumData.effective_start_date = formData.start_date;
        addendumData.monthly_value = 0;
        addendumData.observations = `[ADITIVO INFORMATIVO] ${formData.observations}`;
      } else {
        addendumData.end_date = formData.end_date;
        addendumData.effective_start_date = formData.start_date;
        addendumData.effective_end_date = formData.is_punctual ? formData.end_date : null;
        addendumData.monthly_value = parseFloat(formData.monthly_value);
        addendumData.observations = formData.observations || '';
      }

      await onSubmit(addendumData);
    } catch (error) {
      console.error('❌ Error creating addendum:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationMonths =
    formData.start_date && formData.end_date && !formData.is_informative
      ? calculateDurationInMonths(formData.start_date, formData.end_date)
      : 0;

  if (showPunctualConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-yellow-50 rounded-xl shadow-xl max-w-md w-full border-2 border-yellow-300">
          <div className="bg-yellow-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-bold">Confirmar Aditivo Pontual</h2>
            <button onClick={() => setShowPunctualConfirm(false)} className="hover:bg-yellow-600 rounded-full p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-900 font-medium mb-2">
                  Este aditivo terá vigência temporária
                </p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Período:</strong> {formatDateBR(formData.start_date)} até {formatDateBR(formData.end_date)}</p>
                  <p><strong>Valor durante o período:</strong> {formatCurrency(parseFloat(formData.monthly_value))}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Após {formatDateBR(formData.end_date)}, o contrato retornará automaticamente às condições do aditivo anterior ou contrato original.
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                {isSubmitting ? 'Criando...' : 'Confirmar Aditivo Pontual'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPunctualConfirm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showInformativeConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-blue-50 rounded-xl shadow-xl max-w-md w-full border-2 border-blue-300">
          <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-bold">Confirmar Aditivo Informativo</h2>
            <button onClick={() => setShowInformativeConfirm(false)} className="hover:bg-blue-700 rounded-full p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <MessageCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-900 font-medium mb-2">
                  Este aditivo é apenas informativo
                </p>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  <li>Não altera valor do contrato</li>
                  <li>Não altera prazo do contrato</li>
                  <li>Registra apenas alterações de dados contratuais</li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-blue-900 font-medium mb-1">Observações:</p>
              <p className="text-sm text-blue-800">{formData.observations}</p>
            </div>
            <div className="flex space-x-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Criando...' : 'Confirmar Aditivo Informativo'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowInformativeConfirm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Novo Aditivo</h2>
            <p className="text-sm text-blue-100">{contract.client_name}</p>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 rounded-full p-1">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-start space-x-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.is_informative}
                onChange={(e) => {
                  handleChange('is_informative', e.target.checked);
                  if (e.target.checked) {
                    handleChange('is_punctual', false);
                  }
                }}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-blue-900">Aditivo Informativo</span>
                <p className="text-xs text-blue-700">
                  Sem alteração de valor/data (ex: mudança de endereço, atualização cadastral)
                </p>
              </div>
            </label>

            {!formData.is_informative && (
              <label className="flex items-start space-x-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_punctual}
                  onChange={(e) => handleChange('is_punctual', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-yellow-900">Aditivo Pontual (Temporário)</span>
                  <p className="text-xs text-yellow-700">
                    Altera valor apenas durante um período específico
                  </p>
                </div>
              </label>
            )}
          </div>

          {formData.is_informative ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Aditivo *
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className={errors.start_date ? 'border-red-500' : ''}
                />
                {errors.start_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações *
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  rows={4}
                  placeholder="Descreva as alterações informativas (ex: mudança de endereço, atualização de dados)"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.observations ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.observations && (
                  <p className="text-red-500 text-xs mt-1">{errors.observations}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início {formData.is_punctual ? 'do Período Pontual' : 'do Aditivo'} *
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    className={errors.start_date ? 'border-red-500' : ''}
                  />
                  {errors.start_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Término {formData.is_punctual ? 'do Período Pontual' : 'do Aditivo'} *
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    className={errors.end_date ? 'border-red-500' : ''}
                  />
                  {errors.end_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.is_punctual ? 'Valor Mensal Durante o Período Pontual' : 'Novo Valor Mensal'} *
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formData.monthly_value}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,.-]/g, '').replace(',', '.');
                    handleChange('monthly_value', value);
                  }}
                  placeholder="0.00"
                  className={errors.monthly_value ? 'border-red-500' : ''}
                />
                {errors.monthly_value && (
                  <p className="text-red-500 text-xs mt-1">{errors.monthly_value}</p>
                )}
              </div>

              {formData.is_punctual && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800">
                    Após {formData.end_date ? formatDateBR(formData.end_date) : 'o término do período'}, o contrato retornará às condições do aditivo anterior ou contrato original.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  rows={3}
                  placeholder="Observações adicionais (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {formData.start_date && (formData.is_informative || (formData.end_date && formData.monthly_value)) && (
            <div className={`border-2 rounded-lg p-4 ${
              formData.is_informative ? 'bg-blue-50 border-blue-200' :
              formData.is_punctual ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <h4 className="font-semibold text-gray-900 mb-3">Preview do Aditivo</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">
                    {formData.is_informative ? 'Informativo' : formData.is_punctual ? 'Pontual (Temporário)' : 'Permanente'}
                  </span>
                </div>
                {formData.is_informative ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{formatDateBR(formData.start_date)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Período:</span>
                      <span className="font-medium">
                        {formatDateBR(formData.start_date)} até {formatDateBR(formData.end_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duração:</span>
                      <span className="font-medium">{durationMonths} meses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(parseFloat(formData.monthly_value))}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {formData.is_punctual && (
                <p className="text-xs text-yellow-700 mt-3 font-medium">
                  ⚠ Aditivo pontual: Valores retornam ao original após o período
                </p>
              )}
              {formData.is_informative && (
                <p className="text-xs text-blue-700 mt-3 font-medium">
                  ℹ Aditivo informativo: Não altera valores ou prazos
                </p>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Salvando...' : 'Criar Aditivo'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
