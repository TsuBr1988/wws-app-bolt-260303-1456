import { X, Check, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BudgetFunction {
  id: string;
  function_name: string;
  quantity: number;
  scale: string;
  shift_type: string;
  [key: string]: any;
}

interface AllocateFunctionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (functionIds: string[]) => void;
  budgetFunctions: BudgetFunction[];
  selectedFunctions: string[];
  materialName: string;
  onFunctionDeleted?: () => void;
}

export const AllocateFunctionsModal = ({
  isOpen,
  onClose,
  onSave,
  budgetFunctions,
  selectedFunctions,
  materialName,
  onFunctionDeleted,
}: AllocateFunctionsModalProps) => {
  const [selected, setSelected] = useState<string[]>(selectedFunctions);

  useEffect(() => {
    setSelected(selectedFunctions);
  }, [selectedFunctions, isOpen]);

  const toggleFunction = (functionId: string) => {
    setSelected(prev => {
      const isSelected = prev.includes(functionId);
      if (isSelected) {
        return prev.filter(id => id !== functionId);
      } else {
        return [...prev, functionId];
      }
    });
  };

  const isFunctionSelected = (functionId: string) => {
    return selected.includes(functionId);
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const handleDeleteFunction = async (functionId: string, functionName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a função "${functionName}"?\n\nEsta ação é permanente e não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('budget_functions')
        .delete()
        .eq('id', functionId);

      if (error) {
        console.error('Erro ao deletar função:', error);
        alert('Erro ao deletar a função. Tente novamente.');
        return;
      }

      alert('Função deletada com sucesso!');

      if (selected.includes(functionId)) {
        setSelected(selected.filter(id => id !== functionId));
      }

      if (onFunctionDeleted) {
        onFunctionDeleted();
      }
    } catch (error) {
      console.error('Erro ao deletar função:', error);
      alert('Erro ao deletar a função. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Alocar Funções
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Material: <span className="font-semibold">{materialName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-700">
              Selecione as funções que receberão o rateio deste material. Se nenhuma for selecionada, o material será rateado entre todas as funções do orçamento.
            </p>
            <details className="mt-2">
              <summary className="text-xs text-slate-500 cursor-pointer">Debug Info</summary>
              <pre className="text-xs mt-1 p-2 bg-white rounded overflow-auto">
                {JSON.stringify(budgetFunctions.map(f => ({ id: f.id.substring(0, 8), name: f.function_name, qty: f.quantity })), null, 2)}
              </pre>
            </details>
          </div>

          <div className="space-y-2">
            {budgetFunctions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Nenhuma função cadastrada no orçamento.</p>
                <p className="text-xs mt-2">Adicione funções na aba "Orçamento Geral" primeiro.</p>
              </div>
            ) : (
              budgetFunctions.map((func) => {
                const isSelected = isFunctionSelected(func.id);
                return (
                  <div
                    key={func.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <div
                      onClick={() => toggleFunction(func.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <div
                        className={`
                          w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-slate-300 bg-white'
                          }
                        `}
                      >
                        {isSelected && <Check size={16} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-slate-800 truncate">
                          {func.function_name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {func.quantity}x • {func.scale} • {func.shift_type === 'noturno' ? 'Noturno' : 'Diurno'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFunction(func.id, func.function_name);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Deletar esta função"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {selected.length > 0 ? (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selected.length}</strong> função(ões) selecionada(s) receberá(ão) o rateio deste material
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-slate-100 border border-slate-300 rounded-lg">
              <p className="text-sm text-slate-700">
                <strong>Nenhuma função selecionada:</strong> O material será rateado entre todas as {budgetFunctions.length} funções
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            Salvar Alocação
          </button>
        </div>
      </div>
    </div>
  );
};
