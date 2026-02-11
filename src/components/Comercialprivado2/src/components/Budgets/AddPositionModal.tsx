/**
 * Componente: AddPositionModal
 *
 * Propósito: Modal para adicionar novo posto ao orçamento
 * - Formulário de configuração do posto
 * - Seleção de cargo, escala e turno
 * - Criação automática dos 8 blocos de cálculo
 * - Integração com configurações de cargos e escalas
 */

import React, { useState } from 'react';
import { X, Plus, Users, Clock, Briefcase } from 'lucide-react';
import { useBudgetsSupabaseQuery, useBudgetsSupabaseInsert } from './useBudgetsSupabase';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  onPositionAdded: (totalCost: number) => void;
}

export interface PositionFormData {
  nome_posto: string;
  cargo_id: string;
  escala_id: string;
  turno: 'Diurno' | 'Noturno'; // Alterado para tipo fixo
  city_id: string;
  salary_additions: { 
    addition_id: string;
    name: string;
    value: number;
    percentage: number;
    calculationBase: 'salario_minimo' | 'salario_base' | 'valor_fixo';
    fixedValue?: number;
  }[];
}

// Importação do PositionCalculationBlocks movida para dentro do componente
// para evitar erro de referência circular com a interface PositionFormData
import { PositionCalculationBlocks } from './PositionCalculationBlocks';

export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  budgetId,
  onPositionAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'basic' | 'calculations'>('basic');
  const [newJobRole, setNewJobRole] = useState({ name: '', salary: '' });
  const [newScale, setNewScale] = useState({ name: '', people: '', days: '' });
  const [newTurn, setNewTurn] = useState({ name: '', description: '' });
  const [showAddScaleModal, setShowAddScaleModal] = useState(false);
  const [showAddJobRoleModal, setShowAddJobRoleModal] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [formData, setFormData] = useState<PositionFormData>({
    nome_posto: '',
    cargo_id: '',
    escala_id: '',
    turno: 'Diurno', // Valor padrão para o turno
    city_id: '',
    salary_additions: [] as { addition_id: string; value: number }[]
  });

  // Buscar cargos e escalas disponíveis
  const { data: jobRoles = [], refetch: refetchJobRoles } = useBudgetsSupabaseQuery('budget_job_roles' as any, {
    filter: { is_active: true },
    orderBy: { column: 'role_name', ascending: true }
  });

  const { data: workScales = [], refetch: refetchWorkScales } = useBudgetsSupabaseQuery('budget_work_scales' as any, {
    filter: { is_active: true },
    orderBy: { column: 'scale_name', ascending: true }
  });

  // Buscar adicionais salariais disponíveis
  const { data: salaryAdditions = [] } = useBudgetsSupabaseQuery('budget_salary_additions' as any, {
    filter: { is_active: true },
    orderBy: { column: 'name', ascending: true }
  });

  // Buscar TODAS as cidades da tabela budget_iss_rates
  const { data: cities = [], loading: citiesLoading } = useBudgetsSupabaseQuery('budget_cities' as any, {
    select: 'id, name, iss_rate',
    filter: { is_active: true },
    orderBy: { column: 'name', ascending: true }
  });

  // Filtrar cidades baseado no termo de busca
  const filteredCities = React.useMemo(() => {
    if (!citySearchTerm.trim()) return cities;
    const searchLower = citySearchTerm.toLowerCase().trim();
    return cities.filter(city =>
      city.name.toLowerCase().includes(searchLower)
    );
  }, [cities, citySearchTerm]);

  // Encontrar cidade selecionada
  const selectedCity = React.useMemo(() => {
    return cities.find(c => c.id === formData.city_id);
  }, [cities, formData.city_id]);

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowCityDropdown(false);
      }
    };

    if (showCityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCityDropdown]);

  // Log para debug - ver quantas cidades foram carregadas
  React.useEffect(() => {
    console.log('🏙️ Debug - Cidades carregadas:', {
      total: cities.length,
      citiesLoading,
      cities: cities.map(c => ({
        id: c.id,
        nome: c.name,
        iss: `${c.iss_rate}%`,
        ativa: true
      })),
      queryStatus: citiesLoading ? 'Carregando...' : 'Concluído',
      errorInfo: cities.length === 0 ? 'Nenhuma cidade encontrada - verificar migração' : 'OK'
    });
  }, [cities, citiesLoading]);

  // Hook para inserir novo cargo
  const { insert: insertJobRole } = useBudgetsSupabaseInsert('budget_job_roles' as any);
  const { insert: insertScale } = useBudgetsSupabaseInsert('budget_work_scales' as any);
  const { insert: insertBudgetPost } = useBudgetsSupabaseInsert('budget_posts' as any);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_posto.trim()) {
      alert('O nome do posto é obrigatório');
      return;
    }
    
    if (!formData.cargo_id) {
      alert('Selecione um cargo');
      return;
    }
    
    if (!formData.escala_id) {
      alert('Selecione uma escala');
      return;
    }

    if (!formData.turno) {
      alert('Selecione um turno');
      return;
    }

    if (!formData.city_id) {
      alert('Selecione uma cidade para o ISS');
      return;
    }

    // Ir para o próximo step (cálculos)
    setStep('calculations');
  };

  const handleSavePosition = async (finalTotal: number) => {
    setLoading(true);

    try {
      console.log('🚀 Salvando posto no banco de dados:', {
        budgetId,
        formData,
        finalTotal
      });
      
      const positionData = {
        budget_id: budgetId,
        post_name: formData.nome_posto,
        role_id: formData.cargo_id,
        scale_id: formData.escala_id,
        turn: formData.turno,
        city_id: formData.city_id,
        salary_additions: formData.salary_additions,
        total_cost: finalTotal
      };
      
      const result = await insertBudgetPost(positionData);
      
      console.log('✅ Posto salvo no banco:', result);
      
      alert(`✅ Posto "${formData.nome_posto}" salvo com sucesso!\n\n💰 Custo total: ${finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n🔄 Total do orçamento será atualizado automaticamente.`);
      onPositionAdded(finalTotal);
      onClose();
      
    } catch (error) {
      console.error('Erro ao salvar posto:', error);
      alert(`❌ Erro ao salvar posto: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique se todas as tabelas auxiliares estão criadas no Supabase.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJobRole = async () => {
    if (!newJobRole.name.trim() || !newJobRole.salary) {
      alert('⚠️ Preencha o nome do cargo e o salário base.');
      return;
    }

    try {
      await insertJobRole({
        role_name: newJobRole.name,
        salary_base: parseFloat(newJobRole.salary),
        is_active: true
      });

      setNewJobRole({ name: '', salary: '' });
      setShowAddJobRoleModal(false);
      refetchJobRoles();
      alert('✅ Cargo adicionado com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao adicionar cargo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleAddScale = async () => {
    if (!newScale.name.trim() || !newScale.people || !newScale.days) {
      alert('⚠️ Preencha todos os campos da escala.');
      return;
    }

    try {
      await insertScale({
        scale_name: newScale.name,
        people_quantity: parseFloat(newScale.people),
        working_days: parseFloat(newScale.days),
        is_active: true
      });

      setNewScale({ name: '', people: '', days: '' });
      setShowAddScaleModal(false);
      refetchWorkScales();
      alert('✅ Escala adicionada com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao adicionar escala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleAddSalaryAddition = (additionId: string) => {
    setFormData(prev => ({
      ...prev,
      salary_additions: [...prev.salary_additions, { addition_id: additionId, value: 0 }]
    }));
  };
  const handleRemoveSalaryAddition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      salary_additions: prev.salary_additions.filter((_, i) => i !== index)
    }));
  };
  const handleSalaryAdditionValueChange = (index: number, value: number) => {
    setFormData(prev => ({
      ...prev,
      salary_additions: prev.salary_additions.map((addition, i) => 
        i === index ? { ...addition, value } : addition
      )
    }));
  };
  const resetForm = () => {
    setFormData({
      nome_posto: '',
      cargo_id: '',
      escala_id: '',
      turno: 'Diurno',
      city_id: '',
      salary_additions: []
    });
    setCitySearchTerm('');
    setShowCityDropdown(false);
    setStep('basic');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {step === 'basic' ? 'Novo Posto - Configurações Básicas' : 'Novo Posto - Blocos de Cálculo'}
                </h2>
                <p className="text-sm text-gray-600">
                  {step === 'basic' ? 'Configure cargo, escala, turno e cidade' : 'Configure os 8 blocos de cálculo do posto'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {step === 'basic' ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Posto
              </label>
              <input
                type="text"
                value={formData.nome_posto}
                onChange={(e) => setFormData({ ...formData, nome_posto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                placeholder="Ex: Portaria Principal, Limpeza Geral..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={formData.cargo_id}
                  onChange={(e) => setFormData({ ...formData, cargo_id: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione um cargo</option>
                  {jobRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.role_name} - R$ {role.salary_base ? role.salary_base.toFixed(2) : '0.00'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddJobRoleModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Adicionar novo cargo"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escala de Trabalho
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={formData.escala_id}
                  onChange={(e) => setFormData({ ...formData, escala_id: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione uma escala</option>
                  {workScales.map(scale => (
                    <option key={scale.id} value={scale.id}>
                      {scale.scale_name} - {scale.people_quantity} pessoas - {scale.working_days} dias
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddScaleModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Adicionar nova escala"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turno
              </label>              
                <select
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value as 'Diurno' | 'Noturno' })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione um turno</option>
                  <option value="Diurno">Diurno</option>
                  <option value="Noturno">Noturno</option>
                </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade (para cálculo do ISS)
              </label>
              {citiesLoading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Carregando cidades...
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={selectedCity ? `${selectedCity.name} (${selectedCity.iss_rate}% ISS)` : citySearchTerm}
                    onChange={(e) => {
                      setCitySearchTerm(e.target.value);
                      setShowCityDropdown(true);
                      // Limpar seleção se estiver digitando
                      if (formData.city_id) {
                        setFormData({ ...formData, city_id: '' });
                      }
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Digite para buscar uma cidade..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required={!formData.city_id}
                    autoComplete="off"
                  />

                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCities.slice(0, 50).map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, city_id: city.id });
                            setCitySearchTerm('');
                            setShowCityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                        >
                          {city.name} <span className="text-gray-500">({city.iss_rate}% ISS)</span>
                        </button>
                      ))}
                      {filteredCities.length > 50 && (
                        <div className="px-4 py-2 text-xs text-gray-500 border-t">
                          Mostrando 50 de {filteredCities.length} resultados. Continue digitando para refinar.
                        </div>
                      )}
                    </div>
                  )}

                  {showCityDropdown && citySearchTerm && filteredCities.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <p className="text-sm text-gray-500">Nenhuma cidade encontrada com "{citySearchTerm}"</p>
                    </div>
                  )}
                </>
              )}

              {/* Debug info - status da query de cidades */}
              {!citiesLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  {cities.length > 0
                    ? `✅ ${cities.length} cidade${cities.length > 1 ? 's' : ''} disponíveis`
                    : '❌ Nenhuma cidade encontrada - execute a migration'
                  }
                </p>
              )}
            </div>

            {/* Adicionais Salariais */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicionais Salariais (Opcional)
              </label>
              
              {formData.salary_additions.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.salary_additions.map((addition, index) => {
                    const additionData = salaryAdditions.find(sa => sa.id === addition.addition_id);
                    return (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                        <span className="flex-1 text-sm">{additionData?.name}</span>
                        <input
                          type="number"
                          value={addition.value}
                          onChange={(e) => handleSalaryAdditionValueChange(index, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                        <span className="text-sm text-gray-500">%</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSalaryAddition(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSalaryAddition(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Adicionar adicional salarial...</option>
                {salaryAdditions
                  .filter(sa => !formData.salary_additions.some(fsa => fsa.addition_id === sa.id))
                  .map(addition => (
                    <option key={addition.id} value={addition.id}>
                      {addition.name} ({addition.default_percentage}% padrão)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Próximo: Configurar Blocos →
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
            </form>
          ) : (
            <div className="p-6">
              {/* Componente dos blocos de cálculo */}
              <PositionCalculationBlocks
                formData={formData}
                jobRoles={jobRoles}
                workScales={workScales}
                cities={cities}
                salaryAdditions={salaryAdditions}
                onSave={handleSavePosition}
                onBack={() => setStep('basic')}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal para Adicionar Nova Escala */}
      {showAddScaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Adicionar Nova Escala</h3>
              </div>
              <button
                onClick={() => setShowAddScaleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Escala
                </label>
                <input
                  type="text"
                  value={newScale.name}
                  onChange={(e) => setNewScale({ ...newScale, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 12h segunda a sexta"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Pessoas
                </label>
                <input
                  type="number"
                  value={newScale.people}
                  onChange={(e) => setNewScale({ ...newScale, people: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.37"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias Trabalhados no Mês
                </label>
                <input
                  type="number"
                  value={newScale.days}
                  onChange={(e) => setNewScale({ ...newScale, days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="21.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddScale}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Adicionar Escala
                </button>
                <button
                  onClick={() => setShowAddScaleModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Novo Cargo */}
      {showAddJobRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Adicionar Novo Cargo</h3>
              </div>
              <button
                onClick={() => setShowAddJobRoleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cargo
                </label>
                <input
                  type="text"
                  value={newJobRole.name}
                  onChange={(e) => setNewJobRole({ ...newJobRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Técnico de Segurança"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salário Base (R$)
                </label>
                <input
                  type="number"
                  value={newJobRole.salary}
                  onChange={(e) => setNewJobRole({ ...newJobRole, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1412.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddJobRole}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Adicionar Cargo
                </button>
                <button
                  onClick={() => setShowAddJobRoleModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};