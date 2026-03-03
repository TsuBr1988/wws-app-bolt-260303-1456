import { useState, useEffect } from 'react';
import { X, RefreshCw, Save, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfigBenefit } from '../types';
import { budgetBenefitsService, BenefitOverride } from '../services/budgetBenefitsService';

interface BenefitOverridesModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  functionId: string;
  functionName: string;
  serviceType: 'facilities' | 'vigilancia';
  onSave?: () => void;
}

interface BenefitWithOverride {
  benefit: ConfigBenefit;
  override: BenefitOverride | null;
  isEditing: boolean;
  editValue: number;
  editFormula: string;
  editNotes: string;
}

export const BenefitOverridesModal = ({
  isOpen,
  onClose,
  budgetId,
  functionId,
  functionName,
  serviceType,
  onSave,
}: BenefitOverridesModalProps) => {
  const [benefits, setBenefits] = useState<BenefitWithOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBenefitsAndOverrides();
    }
  }, [isOpen, budgetId, functionId]);

  const loadBenefitsAndOverrides = async () => {
    setIsLoading(true);
    try {
      const { data: benefitsData, error: benefitsError } = await supabase
        .from('config_benefits')
        .select('*')
        .eq('is_active', true)
        .eq('service_type', serviceType)
        .order('order_index');

      if (benefitsError) throw benefitsError;

      const overrides = await budgetBenefitsService.getOverrides(budgetId, functionId);

      // FILTRAR: NÃO permitir customização do Vale Transporte (VT)
      // O VT já é customizado por função (campo vtU em cada função)
      const filteredBenefits = (benefitsData || []).filter((benefit) => {
        const isVT = benefit.code === 'VT' ||
                     benefit.code === 'VALE_TRANSPORTE' ||
                     benefit.name.toLowerCase().includes('vale transporte');
        return !isVT; // Excluir VT da lista de customização
      });

      const benefitsWithOverrides: BenefitWithOverride[] = filteredBenefits.map((benefit) => {
        const override = overrides.find((o) => o.benefit_code === benefit.code);
        return {
          benefit,
          override: override || null,
          isEditing: false,
          editValue: override?.custom_value ?? benefit.base_value ?? 0,
          editFormula: override?.custom_formula ?? benefit.formula ?? '',
          editNotes: override?.notes ?? '',
        };
      });

      setBenefits(benefitsWithOverrides);
    } catch (error) {
      console.error('Erro ao carregar benefícios e overrides:', error);
      alert('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (index: number) => {
    setBenefits((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isEditing: true } : item
      )
    );
  };

  const handleCancelEdit = (index: number) => {
    setBenefits((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            isEditing: false,
            editValue: item.override?.custom_value ?? item.benefit.base_value ?? 0,
            editFormula: item.override?.custom_formula ?? item.benefit.formula ?? '',
            editNotes: item.override?.notes ?? '',
          };
        }
        return item;
      })
    );
  };

  const handleSaveOverride = async (index: number) => {
    const item = benefits[index];
    setIsSaving(true);

    try {
      const result = await budgetBenefitsService.saveOverride(
        budgetId,
        functionId,
        item.benefit.code,
        item.editValue,
        item.editFormula || undefined,
        item.editNotes || undefined
      );

      if (result.success) {
        await loadBenefitsAndOverrides();
        if (onSave) onSave();
      } else {
        alert(`Erro ao salvar: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar override:', error);
      alert('Erro ao salvar customização.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveOverride = async (index: number) => {
    const item = benefits[index];
    if (!item.override) return;

    if (!confirm(`Deseja remover a customização do benefício "${item.benefit.name}"?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await budgetBenefitsService.removeOverride(
        budgetId,
        functionId,
        item.benefit.code
      );

      if (result.success) {
        await loadBenefitsAndOverrides();
        if (onSave) onSave();
      } else {
        alert(`Erro ao remover: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao remover override:', error);
      alert('Erro ao remover customização.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    const overridesCount = benefits.filter((b) => b.override !== null).length;

    if (overridesCount === 0) {
      alert('Não há customizações para remover.');
      return;
    }

    if (!confirm(`Deseja remover todas as ${overridesCount} customizações desta função?`)) {
      return;
    }

    setIsSaving(true);
    try {
      for (const item of benefits) {
        if (item.override) {
          await budgetBenefitsService.removeOverride(
            budgetId,
            functionId,
            item.benefit.code
          );
        }
      }
      await loadBenefitsAndOverrides();
      if (onSave) onSave();
    } catch (error) {
      console.error('Erro ao remover todas as customizações:', error);
      alert('Erro ao remover customizações.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBenefits = benefits.filter(
    (item) =>
      item.benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.benefit.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overridesCount = benefits.filter((b) => b.override !== null).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold">Customizar Benefícios</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                serviceType === 'facilities'
                  ? 'bg-blue-500 text-white'
                  : 'bg-green-500 text-white'
              }`}>
                {serviceType === 'facilities' ? '🏢 Facilities' : '🛡️ Vigilância'}
              </span>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Função: <span className="font-semibold">{functionName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Settings size={20} className="text-blue-600" />
                    <span className="font-semibold text-slate-700">
                      {benefits.length} benefício(s) disponível(is)
                    </span>
                  </div>
                  <span className="text-slate-500">•</span>
                  <span className="text-sm text-slate-600">
                    {overridesCount} customizado(s)
                  </span>
                </div>
                <button
                  onClick={handleResetAll}
                  disabled={overridesCount === 0 || isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
                >
                  <RefreshCw size={16} />
                  Resetar Todos
                </button>
              </div>
              <input
                type="text"
                placeholder="Buscar benefício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Como funcionam as customizações:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Exibindo apenas benefícios de {serviceType === 'facilities' ? 'Facilities' : 'Vigilância'}</li>
                    <li>Valores customizados sobrescrevem os valores globais apenas para esta função</li>
                    <li>Para benefícios com fórmula padrão (ex: Auxílio Creche), apenas o valor pode ser customizado</li>
                    <li>Para benefícios sem fórmula padrão, você pode personalizar o valor e/ou a fórmula</li>
                    <li>Use o botão "Resetar" para voltar ao valor global padrão</li>
                    <li>As alterações afetam todos os cálculos de custo desta função</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                {filteredBenefits.map((item, index) => {
                  const actualIndex = benefits.findIndex((b) => b === item);
                  const isCustomized = item.override !== null;
                  const hasFormulaType = item.benefit.calculation_type === 'formula';
                  
                  // Não permitir customização de fórmula se o benefício já tem uma fórmula padrão definida
                  // Nesse caso, apenas o valor pode ser customizado
                  const allowFormulaCustomization = hasFormulaType && !item.benefit.formula?.trim();

                  return (
                    <div
                      key={item.benefit.id}
                      className={`border rounded-lg p-4 ${
                        isCustomized
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-800">
                              {item.benefit.name}
                            </h3>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {item.benefit.code}
                            </span>
                            {isCustomized && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                <CheckCircle size={12} />
                                Customizado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">
                            Tipo: {item.benefit.calculation_type === 'fixed' && 'Fixo'}
                            {item.benefit.calculation_type === 'per_day' && 'Por Dia'}
                            {item.benefit.calculation_type === 'per_month' && 'Por Mês'}
                            {item.benefit.calculation_type === 'formula' && 'Fórmula'}
                            {' • '}
                            Valor global: {item.benefit.base_value != null ? item.benefit.base_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!item.isEditing && isCustomized && (
                            <button
                              onClick={() => handleRemoveOverride(actualIndex)}
                              disabled={isSaving}
                              className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-100 border border-red-300 rounded-md transition-colors disabled:opacity-50"
                            >
                              Resetar
                            </button>
                          )}
                          {!item.isEditing ? (
                            <button
                              onClick={() => handleStartEdit(actualIndex)}
                              disabled={isSaving}
                              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
                            >
                              {isCustomized ? 'Editar' : 'Customizar'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCancelEdit(actualIndex)}
                                disabled={isSaving}
                                className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors disabled:opacity-50"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveOverride(actualIndex)}
                                disabled={isSaving}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
                              >
                                <Save size={14} />
                                Salvar
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {item.isEditing && (
                        <div className="space-y-3 pt-3 border-t border-slate-200">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                              Valor Customizado *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.editValue}
                              onChange={(e) =>
                                setBenefits((prev) =>
                                  prev.map((b, i) =>
                                    i === actualIndex
                                      ? { ...b, editValue: parseFloat(e.target.value) || 0 }
                                      : b
                                  )
                                )
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {allowFormulaCustomization && (
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Fórmula Customizada (Opcional)
                              </label>
                              <input
                                type="text"
                                value={item.editFormula}
                                onChange={(e) =>
                                  setBenefits((prev) =>
                                    prev.map((b, i) =>
                                      i === actualIndex
                                        ? { ...b, editFormula: e.target.value }
                                        : b
                                    )
                                  )
                                }
                                placeholder="Ex: v * q * 1.1 ou vtU * 2 * diasU * q"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                Variáveis disponíveis: v (valor), vtU, diasU, q, vtDays, vrDays, s (salário)
                              </p>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                              Observações (Opcional)
                            </label>
                            <textarea
                              value={item.editNotes}
                              onChange={(e) =>
                                setBenefits((prev) =>
                                  prev.map((b, i) =>
                                    i === actualIndex
                                      ? { ...b, editNotes: e.target.value }
                                      : b
                                  )
                                )
                              }
                              placeholder="Motivo da customização..."
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {!item.isEditing && isCustomized && item.override?.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold">Obs:</span> {item.override.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredBenefits.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhum benefício encontrado com "{searchTerm}"</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-md transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
