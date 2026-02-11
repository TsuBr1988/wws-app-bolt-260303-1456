import { useState, useEffect } from 'react';
import { X, RefreshCw, Save, AlertCircle, CheckCircle, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { GRUPOS_ENCARGOS } from '../constants';
import { budgetEncargosService, EncargoOverride } from '../services/budgetEncargosService';

interface EncargosOverridesModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  budgetName: string;
  onSave?: () => void;
}

interface EncargoItem {
  grupoCode: string;
  grupoNome: string;
  encargoName: string;
  baseRate: number;
  override: EncargoOverride | null;
  isEditing: boolean;
  editRate: number;
  editNotes: string;
}

export const EncargosOverridesModal = ({
  isOpen,
  onClose,
  budgetId,
  budgetName,
  onSave,
}: EncargosOverridesModalProps) => {
  const [encargos, setEncargos] = useState<EncargoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadEncargosAndOverrides();
      const allGroups = new Set(GRUPOS_ENCARGOS.map((g) => g.g));
      setExpandedGroups(allGroups);
    }
  }, [isOpen, budgetId]);

  const loadEncargosAndOverrides = async () => {
    setIsLoading(true);
    try {
      const overrides = await budgetEncargosService.getOverrides(budgetId);
      const overridesMap = new Map(overrides.map((o) => [o.encargo_code, o]));

      const allEncargos: EncargoItem[] = [];

      GRUPOS_ENCARGOS.forEach((grupo) => {
        grupo.i.forEach((item) => {
          const override = overridesMap.get(item.d);
          allEncargos.push({
            grupoCode: grupo.g,
            grupoNome: grupo.g,
            encargoName: item.d,
            baseRate: item.p,
            override: override || null,
            isEditing: false,
            editRate: override?.custom_rate ?? item.p,
            editNotes: override?.notes ?? '',
          });
        });
      });

      setEncargos(allEncargos);
    } catch (error) {
      console.error('Erro ao carregar encargos e overrides:', error);
      alert('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    const allGroups = new Set(GRUPOS_ENCARGOS.map((g) => g.g));
    setExpandedGroups(allGroups);
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const handleStartEdit = (index: number) => {
    setEncargos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, isEditing: true } : item))
    );
  };

  const handleCancelEdit = (index: number) => {
    setEncargos((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            isEditing: false,
            editRate: item.override?.custom_rate ?? item.baseRate,
            editNotes: item.override?.notes ?? '',
          };
        }
        return item;
      })
    );
  };

  const handleSaveOverride = async (index: number) => {
    const item = encargos[index];
    setIsSaving(true);

    try {
      const result = await budgetEncargosService.saveOverride(
        budgetId,
        item.grupoCode,
        item.encargoName,
        item.encargoName,
        item.editRate,
        item.editNotes || undefined
      );

      if (result.success) {
        await loadEncargosAndOverrides();
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
    const item = encargos[index];
    if (!item.override) return;

    if (!confirm(`Deseja remover a customização do encargo "${item.encargoName}"?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await budgetEncargosService.removeOverride(budgetId, item.encargoName);

      if (result.success) {
        await loadEncargosAndOverrides();
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
    const overridesCount = encargos.filter((e) => e.override !== null).length;

    if (overridesCount === 0) {
      alert('Não há customizações para remover.');
      return;
    }

    if (!confirm(`Deseja remover todas as ${overridesCount} customizações deste orçamento?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await budgetEncargosService.removeAllOverrides(budgetId);
      if (result.success) {
        await loadEncargosAndOverrides();
        if (onSave) onSave();
      } else {
        alert(`Erro ao remover: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao remover todas as customizações:', error);
      alert('Erro ao remover customizações.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEncargos = encargos.filter((item) =>
    item.encargoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.grupoNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overridesCount = encargos.filter((e) => e.override !== null).length;

  const groupedEncargos = GRUPOS_ENCARGOS.map((grupo) => ({
    grupo: grupo.g,
    items: filteredEncargos.filter((e) => e.grupoCode === grupo.g),
  })).filter((g) => g.items.length > 0);

  const calculateGroupTotals = (items: EncargoItem[]) => {
    const baseTotal = items.reduce((sum, item) => sum + item.baseRate, 0);
    const customTotal = items.reduce((sum, item) => {
      return sum + (item.override?.custom_rate ?? item.baseRate);
    }, 0);
    const hasCustomizations = items.some((item) => item.override !== null);
    const difference = customTotal - baseTotal;
    const differencePercent = baseTotal !== 0 ? (difference / baseTotal) * 100 : 0;

    return {
      baseTotal,
      customTotal,
      hasCustomizations,
      difference,
      differencePercent,
    };
  };

  const overallTotals = calculateGroupTotals(encargos);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold">Alterar Encargos Sociais</h2>
            </div>
            <p className="text-orange-100 text-sm mt-1">
              Orçamento: <span className="font-semibold">{budgetName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-orange-500 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Percent size={20} className="text-orange-600" />
                    <span className="font-semibold text-slate-700">
                      {encargos.length} encargo(s) disponível(is)
                    </span>
                  </div>
                  <span className="text-slate-500">•</span>
                  <span className="text-sm text-slate-600">
                    {overridesCount} customizado(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAll}
                    className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    Expandir Todos
                  </button>
                  <button
                    onClick={collapseAll}
                    className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  >
                    Recolher Todos
                  </button>
                  <button
                    onClick={handleResetAll}
                    disabled={overridesCount === 0 || isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
                  >
                    <RefreshCw size={16} />
                    Resetar Todos
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar encargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 border-2 border-blue-300 rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Percent size={24} className="text-blue-600" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Resumo Geral de Encargos</h3>
                      <p className="text-xs text-slate-600">Soma de todos os grupos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-600 font-medium mb-0.5">Total Padrão</div>
                      <div className="text-2xl font-bold text-slate-800">
                        {(overallTotals.baseTotal * 100).toFixed(4)}%
                      </div>
                    </div>

                    {overallTotals.hasCustomizations && (
                      <>
                        <div className="text-2xl text-slate-400">→</div>
                        <div className="text-right">
                          <div className="text-xs text-orange-600 font-medium mb-0.5">Total Customizado</div>
                          <div className="text-2xl font-bold text-orange-700">
                            {(overallTotals.customTotal * 100).toFixed(4)}%
                          </div>
                        </div>

                        <div className="text-right bg-white px-4 py-2 rounded-lg shadow">
                          <div className="text-xs text-slate-600 font-medium mb-0.5">Diferença Total</div>
                          <div className={`text-xl font-bold ${
                            overallTotals.difference > 0
                              ? 'text-red-600'
                              : overallTotals.difference < 0
                              ? 'text-green-600'
                              : 'text-slate-600'
                          }`}>
                            {overallTotals.difference > 0 ? '+' : ''}{(overallTotals.difference * 100).toFixed(4)}%
                          </div>
                          <div className="text-xs text-slate-500">
                            ({overallTotals.differencePercent > 0 ? '+' : ''}{overallTotals.differencePercent.toFixed(2)}%)
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Como funcionam as customizações:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Os encargos customizados se aplicam a TODAS as funções deste orçamento</li>
                    <li>Valores customizados sobrescrevem os valores globais apenas para este orçamento</li>
                    <li>Use o botão "Resetar" para voltar ao valor global padrão</li>
                    <li>As alterações afetam todos os cálculos de custo deste orçamento</li>
                    <li>Lembre-se de recalcular a planilha após salvar as alterações</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                {groupedEncargos.map((group) => {
                  const isGroupExpanded = expandedGroups.has(group.grupo);
                  const totals = calculateGroupTotals(group.items);

                  return (
                    <div key={group.grupo} className="border border-slate-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleGroup(group.grupo)}
                        className="w-full bg-blue-100 hover:bg-blue-200 px-4 py-3 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isGroupExpanded ? (
                              <ChevronUp size={18} className="text-blue-700" />
                            ) : (
                              <ChevronDown size={18} className="text-blue-700" />
                            )}
                            <span className="font-bold text-slate-800">{group.grupo}</span>
                            <span className="text-xs text-slate-600">
                              ({group.items.filter((i) => i.override).length}/{group.items.length} customizados)
                            </span>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xs text-slate-600 font-medium">Total Padrão</div>
                                <div className="font-bold text-slate-800">
                                  {(totals.baseTotal * 100).toFixed(4)}%
                                </div>
                              </div>

                              {totals.hasCustomizations && (
                                <>
                                  <div className="text-slate-400">→</div>
                                  <div className="text-right">
                                    <div className="text-xs text-orange-600 font-medium">Total Customizado</div>
                                    <div className="font-bold text-orange-700">
                                      {(totals.customTotal * 100).toFixed(4)}%
                                    </div>
                                  </div>

                                  <div className="text-right bg-white bg-opacity-70 px-3 py-1 rounded">
                                    <div className="text-xs text-slate-600 font-medium">Diferença</div>
                                    <div className={`font-bold ${
                                      totals.difference > 0
                                        ? 'text-red-600'
                                        : totals.difference < 0
                                        ? 'text-green-600'
                                        : 'text-slate-600'
                                    }`}>
                                      {totals.difference > 0 ? '+' : ''}{(totals.difference * 100).toFixed(4)}%
                                      <span className="text-xs ml-1">
                                        ({totals.differencePercent > 0 ? '+' : ''}{totals.differencePercent.toFixed(2)}%)
                                      </span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {isGroupExpanded && (
                        <div className="bg-white">
                          {group.items.map((item, idx) => {
                            const actualIndex = encargos.findIndex((e) => e === item);
                            const isCustomized = item.override !== null;

                            return (
                              <div
                                key={actualIndex}
                                className={`p-4 border-b border-slate-200 last:border-b-0 ${
                                  isCustomized ? 'bg-orange-50' : 'bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-slate-800">
                                        {item.encargoName}
                                      </h4>
                                      {isCustomized && (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                                          <CheckCircle size={12} />
                                          Customizado
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600">
                                      Valor global: {(item.baseRate * 100).toFixed(4)}%
                                      {isCustomized && (
                                        <>
                                          {' • '}
                                          Valor customizado: {(item.override!.custom_rate * 100).toFixed(4)}%
                                        </>
                                      )}
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
                                        className="text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
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
                                        Percentual Customizado (%) *
                                      </label>
                                      <input
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        max="100"
                                        value={(item.editRate * 100).toFixed(4)}
                                        onChange={(e) => {
                                          const percentValue = parseFloat(e.target.value) || 0;
                                          const decimalValue = percentValue / 100;
                                          setEncargos((prev) =>
                                            prev.map((enc, i) =>
                                              i === actualIndex
                                                ? { ...enc, editRate: decimalValue }
                                                : enc
                                            )
                                          );
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                      />
                                      <p className="text-xs text-slate-500 mt-1">
                                        Digite o valor em percentual (ex: 20.0000 para 20%)
                                      </p>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Observações (Opcional)
                                      </label>
                                      <textarea
                                        value={item.editNotes}
                                        onChange={(e) =>
                                          setEncargos((prev) =>
                                            prev.map((enc, i) =>
                                              i === actualIndex
                                                ? { ...enc, editNotes: e.target.value }
                                                : enc
                                            )
                                          )
                                        }
                                        placeholder="Motivo da customização..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredEncargos.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhum encargo encontrado com "{searchTerm}"</p>
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
