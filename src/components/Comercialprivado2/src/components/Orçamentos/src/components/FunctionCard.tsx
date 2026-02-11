import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, Settings } from 'lucide-react';
import { FunctionConfig } from '../types';
import { ESCALAS } from '../constants';
import { supabase } from '../lib/supabase';
import { BenefitOverridesModal } from './BenefitOverridesModal';
import { budgetBenefitsService } from '../services/budgetBenefitsService';

interface FunctionCardProps {
  funcao: FunctionConfig;
  onUpdate: (funcao: FunctionConfig) => void;
  onDelete: (id: string) => void;
  serviceType?: 'facilities' | 'vigilancia';
  budgetId?: string;
}

export const FunctionCard = ({
  funcao,
  onUpdate,
  onDelete,
  serviceType = 'facilities',
  budgetId,
}: FunctionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cities, setCities] = useState<{ id: string; name: string; iss_rate: number }[]>([]);
  const [localFuncao, setLocalFuncao] = useState<FunctionConfig>(funcao);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [overridesCount, setOverridesCount] = useState(0);

  useEffect(() => {
    setLocalFuncao(funcao);
  }, [funcao.id]);

  useEffect(() => {
    if (!pendingUpdate) return;

    const timer = setTimeout(() => {
      console.log('💾 Aplicando alterações com debounce:', localFuncao.nome);
      onUpdate(localFuncao);
      setPendingUpdate(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [localFuncao, pendingUpdate]);

  useEffect(() => {
    if (serviceType === 'vigilancia' && funcao.peric !== 30) {
      onUpdate({ ...funcao, peric: 30 });
    }
  }, [serviceType]);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (budgetId) {
      loadOverridesCount();
    }
  }, [budgetId, funcao.id]);

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (!error && data) {
      setCities(data);
    }
  };

  const loadOverridesCount = async () => {
    if (!budgetId) return;
    const count = await budgetBenefitsService.countOverrides(budgetId, funcao.id);
    setOverridesCount(count);
  };

  const handleBenefitModalSave = () => {
    loadOverridesCount();
  };

  const handleChange = (field: keyof FunctionConfig, value: any) => {
    console.log(`🔧 FunctionCard - Alterando campo "${field}" para:`, {
      field,
      value,
      value_type: typeof value,
      funcao_nome: funcao.nome,
    });
    setLocalFuncao(prev => ({ ...prev, [field]: value }));
    setPendingUpdate(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 text-left font-bold text-slate-800 hover:text-blue-600 transition-colors"
        >
          {funcao.nome}
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(funcao.id);
            }}
            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
            type="button"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-600 hover:text-blue-600 transition-colors"
            type="button"
          >
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 space-y-4">
          {budgetId && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowBenefitModal(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors text-sm shadow-md"
                type="button"
                title="Customizar Benefícios"
              >
                <Settings size={16} />
                <span>Benefícios</span>
                {overridesCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {overridesCount}
                  </span>
                )}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                value={localFuncao.qtd}
                onChange={(e) => handleChange('qtd', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Salário Base
              </label>
              <input
                type="number"
                value={localFuncao.salario}
                onChange={(e) =>
                  handleChange('salario', parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Valor VT (Unitário)
              </label>
              <input
                type="number"
                step="0.01"
                value={localFuncao.vtValue}
                onChange={(e) =>
                  handleChange('vtValue', parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cidade (ISSQN) <span className="text-red-600">*</span>
              </label>
              <select
                value={localFuncao.city || ""}
                onChange={(e) => {
                  const cityName = e.target.value;
                  const selectedCity = cities.find(c => c.name === cityName);

                  setLocalFuncao(prev => ({
                    ...prev,
                    city: cityName,
                    issRate: selectedCity ? selectedCity.iss_rate : prev.issRate
                  }));
                  setPendingUpdate(true);
                }}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !localFuncao.city ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
                required
              >
                <option value="">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name} - {city.iss_rate}%
                  </option>
                ))}
              </select>
              {!localFuncao.city && (
                <p className="text-xs text-red-600 mt-1">
                  Campo obrigatório
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Escala
              </label>
              <select
                value={localFuncao.escala}
                onChange={(e) => handleChange('escala', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(ESCALAS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Horário
              </label>
              <select
                value={localFuncao.horarioTipo}
                onChange={(e) =>
                  handleChange('horarioTipo', e.target.value as 'diurno' | 'noturno')
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="diurno">DIURNO</option>
                <option value="noturno">NOTURNO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                % Periculosidade
                {serviceType === 'vigilancia' && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    (Automático: 30%)
                  </span>
                )}
              </label>
              <input
                type="number"
                value={localFuncao.peric}
                onChange={(e) =>
                  handleChange('peric', parseFloat(e.target.value))
                }
                disabled={serviceType === 'vigilancia'}
                className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  serviceType === 'vigilancia' ? 'bg-green-50 cursor-not-allowed' : ''
                }`}
                title={serviceType === 'vigilancia' ? 'Periculosidade de 30% é obrigatória para Vigilância' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                % Insalubridade
              </label>
              <input
                type="number"
                value={localFuncao.insal}
                onChange={(e) =>
                  handleChange('insal', parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                % Gratificação
              </label>
              <input
                type="number"
                value={localFuncao.grat}
                onChange={(e) => handleChange('grat', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tem Intrajornada?
              </label>
              <select
                value={localFuncao.hasIntra}
                onChange={(e) =>
                  handleChange('hasIntra', e.target.value as 'sim' | 'nao')
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="nao">NÃO</option>
                <option value="sim">SIM</option>
              </select>
            </div>
          </div>

          {localFuncao.horarioTipo === 'noturno' && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="font-semibold text-slate-800 mb-3">
                Configurações Noturnas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    % Adicional Noturno
                  </label>
                  <input
                    type="number"
                    value={localFuncao.notPerc}
                    onChange={(e) =>
                      handleChange('notPerc', parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Horas/Dia
                  </label>
                  <input
                    type="number"
                    value={localFuncao.horas}
                    onChange={(e) =>
                      handleChange('horas', parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    % Hora Reduzida
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={localFuncao.horaNotAd}
                    onChange={(e) =>
                      handleChange('horaNotAd', parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {localFuncao.hasIntra === 'sim' && (
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <h4 className="font-semibold text-slate-800 mb-3">
                Intrajornada
              </h4>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  % Custo de Reposição Intrajornada
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localFuncao.intraPerc}
                  onChange={(e) =>
                    handleChange('intraPerc', parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {budgetId && (
        <BenefitOverridesModal
          isOpen={showBenefitModal}
          onClose={() => setShowBenefitModal(false)}
          budgetId={budgetId}
          functionId={funcao.id}
          functionName={funcao.nome}
          serviceType={serviceType}
          onSave={handleBenefitModalSave}
        />
      )}
    </div>
  );
};
