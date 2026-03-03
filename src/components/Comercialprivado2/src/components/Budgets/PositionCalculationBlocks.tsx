/**
 * Componente: PositionCalculationBlocks
 *
 * Propósito: Interface para configurar os 8 blocos de cálculo de um posto
 * - Bloco 1: Composição de salário (automático + adicionais)
 * - Bloco 2: Encargos sociais (percentuais fixos)
 * - Bloco 3: Benefícios mensais e diários (VT, VR, VA)
 * - Bloco 4: Materiais (lista customizável)
 * - Bloco 5: Uniformes (com vida útil)
 * - Bloco 6: Custos de intrajornada (opcional)
 * - Bloco 7: BDI - Base de despesas indiretas
 * - Bloco 8: Total do posto (soma final)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Save, Calculator, DollarSign, ShoppingCart } from 'lucide-react';
import { useBudgetsSupabaseQuery } from './useBudgetsSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { PositionFormData } from './AddPositionModal';

interface PositionCalculationBlocksProps {
  formData: PositionFormData;
  jobRoles: any[];
  workScales: any[];
  cities: any[];
  salaryAdditions: any[];
  onSave: (finalTotal: number) => void;
  onBack: () => void;
  loading: boolean;
}

interface CalculationState {
  // Bloco 1: Composição de salário
  salaryBase: number;
  nightShift: boolean;
  nightAdditionalPercent: number; // % Adicional Noturno (padrão 20%)
  hoursPerDay: number; // Horas por dia
  reducedHourPercent: number; // % Hora Reduzida (padrão 14.2857%)
  additionalNight: number;
  extraNightHour: number;
  salaryAdditionsTotal: number;
  block1Total: number;

  // Bloco 2: Encargos sociais
  socialCharges: number;
  block2Total: number;

  // Bloco 3: Benefícios
  vtValue: number;
  vrValue: number;
  vaValue: number;
  benefitsTotal: number;
  block3Total: number;

  // Bloco 4: Materiais
  materials: { name: string; unitValue: number; quantity: number; total: number }[];
  block4Total: number;

  // Bloco 5: Uniformes
  uniforms: { name: string; unitValue: number; qtyPerEmployee: number; usefulLife: number; total: number }[];
  block5Total: number;

  // Bloco 6: Intrajornada
  hasIntrajornada: boolean;
  intrajornadaPercent: number;
  intrajornadaValue: number;
  block6Total: number;

  // Bloco 7: BDI
  profitMargin: number;
  adminMargin: number;
  pis: number;
  cofins: number;
  iss: number;
  bdiTotal: number;
  block7Total: number;

  // Bloco 8: Total final
  subtotalWithoutBdi: number;
  finalTotal: number;
}

export const PositionCalculationBlocks: React.FC<PositionCalculationBlocksProps> = ({
  formData,
  jobRoles,
  workScales,
  cities,
  onSave,
  onBack,
  loading
}) => {
  // Buscar dados base para cálculos
  const { data: socialCharges = [] } = useBudgetsSupabaseQuery('budget_social_charges' as any, {
    filter: { is_active: true },
    orderBy: { column: 'charge_name', ascending: true }
  });

  const { data: baseMaterials = [] } = useBudgetsSupabaseQuery('budget_materials' as any, {
    filter: { is_active: true },
    orderBy: { column: 'name', ascending: true }
  });

  const { data: baseUniforms = [] } = useBudgetsSupabaseQuery('budget_uniforms', {
    filter: { is_active: true },
    orderBy: { column: 'item_name', ascending: true }
  });

  const [calculations, setCalculations] = useState<CalculationState>({
    // Bloco 1
    salaryBase: 0,
    nightShift: false,
    nightAdditionalPercent: 20.0, // 20% padrão
    hoursPerDay: 8.0, // 8 horas padrão
    reducedHourPercent: 14.2857, // ~14.29% padrão
    additionalNight: 0,
    extraNightHour: 0,
    salaryAdditionsTotal: 0,
    block1Total: 0,

    // Bloco 2
    socialCharges: 0,
    block2Total: 0,

    // Bloco 3
    vtValue: 6.80, // Valor padrão VT
    vrValue: 25.00, // Valor padrão VR
    vaValue: 35.00, // Valor padrão VA
    benefitsTotal: 0,
    block3Total: 0,

    // Bloco 4
    materials: [],
    block4Total: 0,

    // Bloco 5
    uniforms: [],
    block5Total: 0,

    // Bloco 6
    hasIntrajornada: false,
    intrajornadaPercent: 50.0, // 50% padrão
    intrajornadaValue: 0,
    block6Total: 0,

    // Bloco 7
    profitMargin: 15.0, // 15% padrão
    adminMargin: 4.25, // Fixo
    pis: 0.65, // Fixo
    cofins: 3.00, // Fixo
    iss: 0,
    bdiTotal: 0,
    block7Total: 0,

    // Bloco 8
    subtotalWithoutBdi: 0,
    finalTotal: 0
  });

  // Dados selecionados para cálculos
  const selectedJobRole = jobRoles.find((role: any) => role.id === formData.cargo_id);
  const selectedScale = workScales.find(scale => scale.id === formData.escala_id);
  const selectedCity = cities.find(city => city.id === formData.city_id);

  // Recalcular automaticamente quando dados básicos mudarem
  useEffect(() => {
    if (selectedJobRole && selectedScale && selectedCity) {
      calculateAllBlocks();
    }
  }, [selectedJobRole, selectedScale, formData.turno, selectedCity, formData.salary_additions]);

  // Inicializar materiais e uniformes base
  useEffect(() => {
    if (baseMaterials.length > 0 && calculations.materials.length === 0) {
      const initialMaterials = baseMaterials.slice(0, 5).map(material => ({
        name: material.name,
        unitValue: material.unit_value || 0,
        quantity: 1,
        total: material.unit_value || 0
      }));
      setCalculations(prev => ({ ...prev, materials: initialMaterials }));
    }

    if (baseUniforms.length > 0 && calculations.uniforms.length === 0) {
      const initialUniforms = baseUniforms.map(uniform => ({
        name: uniform.item_name,
        unitValue: uniform.unit_value || 0,
        qtyPerEmployee: uniform.qty_per_collaborator || 1,
        usefulLife: uniform.life_time_months || 12,
        total: 0 // Será calculado
      }));
      setCalculations(prev => ({ ...prev, uniforms: initialUniforms }));
    }
  }, [baseMaterials, baseUniforms]);

  const calculateAllBlocks = () => {
    if (!selectedJobRole || !selectedScale || !selectedCity) return;

    const salaryBase = selectedJobRole.salary_base || 0;
    const baseQuantity = selectedScale.people_quantity || 1;
    const scaleMultiplier = selectedScale.scale_multiplier || 1.0;
    const quantity = baseQuantity * scaleMultiplier;
    const workingDays = selectedScale.working_days || 21;
    const vrDays = selectedScale.vr_days || 22;
    const vtDays = selectedScale.vt_days || 62;
    const isNightShift = formData.turno === 'Noturno'; // Usa o campo 'turno' diretamente

    // Bloco 1: Composição de salário
    const block1 = calculateBlock1(salaryBase, quantity, workingDays, vrDays, isNightShift);

    // Bloco 2: Encargos sociais
    const block2 = calculateBlock2(block1.total);

    // Bloco 3: Benefícios
    const block3 = calculateBlock3(quantity, vrDays, vtDays, salaryBase, baseQuantity);
    
    // Bloco 4: Materiais (usar valores atuais)
    const block4 = calculateBlock4();
    
    // Bloco 5: Uniformes
    const block5 = calculateBlock5(quantity);
    
    // Bloco 6: Intrajornada
    const block6 = calculateBlock6(salaryBase, quantity);
    
    // Bloco 7: BDI
    const subtotalWithoutBdi = block1.total + block2.total + block3.total + block4.total + block5.total + block6.total;
    const block7 = calculateBlock7(subtotalWithoutBdi, (selectedCity?.iss_percent || 0) / 100);
    
    // Bloco 8: Total final
    const finalTotal = subtotalWithoutBdi + block7.total;

    setCalculations(prev => ({
      ...prev,
      salaryBase,
      nightShift: isNightShift,
      additionalNight: block1.additionalNight,
      extraNightHour: block1.extraNightHour,
      salaryAdditionsTotal: block1.salaryAdditionsTotal,
      block1Total: block1.total,
      
      socialCharges: block2.socialCharges,
      block2Total: block2.total,
      
      benefitsTotal: block3.benefitsTotal,
      block3Total: block3.total,
      
      block4Total: block4.total,
      
      block5Total: block5.total,
      
      hasIntrajornada: calculations.hasIntrajornada,
      intrajornadaPercent: calculations.intrajornadaPercent,
      intrajornadaValue: block6.intrajornadaValue,
      block6Total: block6.total,
      
      iss: selectedCity.iss_percent, // Já vem em %
      bdiTotal: block7.bdiTotal,
      block7Total: block7.total,
      
      subtotalWithoutBdi,
      finalTotal
    }));
  };

  const calculateBlock1 = (salaryBase: number, quantity: number, workingDays: number, vrDays: number, isNightShift: boolean) => {
    // Salário base
    const baseSalaryTotal = salaryBase * quantity;
    
    // Adicional noturno (se turno noturno)
    let additionalNight = 0;
    let extraNightHour = 0;
    
    if (isNightShift) {
      // Adicional noturno: (Salário Base/220) * % Adicional Noturno * q * Horas/Dia
      additionalNight = (salaryBase / 220) * (calculations.nightAdditionalPercent / 100) * quantity * calculations.hoursPerDay;
      
      // Hora noturna adicional: (Salário Base/220) * (% Hora Reduzida * q)
      extraNightHour = (salaryBase / 220) * (calculations.reducedHourPercent / 100 * quantity);
    }
    
    // Adicionais salariais opcionais
    const salarioMinimo = 1518.00; // Valor atual do salário mínimo
    let salaryAdditionsTotal = 0;
    
    formData.salary_additions.forEach(addition => {
      if (addition.calculationBase === 'salario_minimo') {
        // Percentual sobre salário mínimo
        salaryAdditionsTotal += salarioMinimo * (addition.percentage / 100) * quantity;
      } else if (addition.calculationBase === 'salario_base') {
        // Percentual sobre salário base
        salaryAdditionsTotal += salaryBase * (addition.percentage / 100) * quantity;
      } else if (addition.calculationBase === 'valor_fixo') {
        // Valor fixo
        salaryAdditionsTotal += (addition.fixedValue || 0) * quantity;
      }
    });
    
    const total = baseSalaryTotal + additionalNight + extraNightHour + salaryAdditionsTotal;
    
    return {
      baseSalaryTotal,
      additionalNight,
      extraNightHour,
      salaryAdditionsTotal,
      total
    };
  };

  const calculateBlock2 = (salaryTotal: number) => {
    // Aplicar percentuais dos encargos sociais
    const socialChargesTotal = socialCharges.reduce((sum, charge) => {
      return sum + (salaryTotal * charge.percentage);
    }, 0);
    
    return {
      socialCharges: socialChargesTotal,
      total: socialChargesTotal
    };
  };

  const calculateBlock3 = (
    quantity: number,
    vrDays: number,
    vtDays: number,
    salaryBase: number,
    baseQuantity: number
  ) => {
    // VR: Valor × quantidade × dias_por_colaborador
    const vrTotal = calculations.vrValue * quantity * vrDays;

    // VA: Mesmo cálculo do VR (sem desconto)
    const vaTotal = calculations.vaValue * quantity * vrDays;

    // VT: [(Valor × dias × 2) - (6% × salário)] × quantidade
    // vtDays = dias de transporte, multiplica por 2 para ida e volta
    const vtPorFuncionario = (calculations.vtValue * vtDays * 2) - (0.06 * salaryBase);
    const vtTotal = Math.max(0, vtPorFuncionario * quantity);

    const benefitsTotal = vtTotal + vrTotal + vaTotal;

    return {
      vtTotal,
      vrTotal,
      vaTotal,
      benefitsTotal,
      total: benefitsTotal
    };
  };

  const calculateBlock4 = () => {
    const total = calculations.materials.reduce((sum, material) => sum + material.total, 0);
    return { total };
  };

  const calculateBlock5 = (quantity: number) => {
    const uniformsWithTotals = calculations.uniforms.map(uniform => {
      const total = (uniform.unitValue * uniform.qtyPerEmployee / uniform.usefulLife) * quantity;
      return { ...uniform, total };
    });
    
    const total = uniformsWithTotals.reduce((sum, uniform) => sum + uniform.total, 0);
    
    // Atualizar o state dos uniformes com os totais calculados
    setCalculations(prev => ({ ...prev, uniforms: uniformsWithTotals }));
    
    return { total };
  };

  const calculateBlock6 = (salaryBase: number, quantity: number) => {
    let intrajornadaValue = 0;
    
    if (calculations.hasIntrajornada) {
      // Fórmula: (salário_base / 220) * (1 + (% reposição / 100)) * quantidade
      const percentMultiplier = 1 + (calculations.intrajornadaPercent / 100);
      intrajornadaValue = (salaryBase / 220) * percentMultiplier * quantity;
    }
    
    return {
      intrajornadaValue,
      total: intrajornadaValue
    };
  };

  const calculateBlock7 = (subtotal: number, issRate: number) => {
    // Percentuais BDI
    const profitMarginValue = subtotal * (calculations.profitMargin / 100);
    const adminMarginValue = subtotal * (calculations.adminMargin / 100);
    const pisValue = subtotal * (calculations.pis / 100);
    const cofinsValue = subtotal * (calculations.cofins / 100);
    const issValue = subtotal * issRate; // ISS já vem em decimal
    
    const bdiTotal = profitMarginValue + adminMarginValue + pisValue + cofinsValue + issValue;
    
    return {
      profitMarginValue,
      adminMarginValue,
      pisValue,
      cofinsValue,
      issValue,
      bdiTotal,
      total: bdiTotal
    };
  };

  const handleMaterialChange = (index: number, field: 'unitValue' | 'quantity', value: number) => {
    setCalculations(prev => {
      const newMaterials = [...prev.materials];
      newMaterials[index] = {
        ...newMaterials[index],
        [field]: value,
        total: field === 'unitValue' ? value * newMaterials[index].quantity : newMaterials[index].unitValue * value
      };
      return { ...prev, materials: newMaterials };
    });
  };

  const addMaterial = () => {
    setCalculations(prev => ({
      ...prev,
      materials: [...prev.materials, { name: 'Novo material', unitValue: 0, quantity: 1, total: 0 }]
    }));
  };

  const removeMaterial = (index: number) => {
    setCalculations(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Posto: {formData.nome_posto}</h3>
            <p className="text-sm text-gray-600">
              {selectedJobRole?.role_name} • {selectedScale?.scale_name} • {formData.turno}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(calculations.finalTotal)}
            </div>
            <div className="text-sm text-gray-500">Valor total do posto</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-blue-600">{formatCurrency(calculations.block1Total)}</div>
            <div className="text-gray-600">Salários</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-purple-600">{formatCurrency(calculations.block2Total + calculations.block3Total)}</div>
            <div className="text-gray-600">Encargos + Benefícios</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-orange-600">{formatCurrency(calculations.block4Total + calculations.block5Total)}</div>
            <div className="text-gray-600">Materiais + Uniformes</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-red-600">{formatCurrency(calculations.block7Total)}</div>
            <div className="text-gray-600">BDI</div>
          </div>
        </div>
      </div>

      {/* Blocos de Cálculo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bloco 1: Composição de Salário */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">1</span>
            Composição de Salário
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Salário base ({selectedScale?.people_quantity} pessoas):</span>
              <span className="font-medium">{formatCurrency(calculations.salaryBase * (selectedScale?.people_quantity || 1))}</span>
            </div>
            
            {calculations.nightShift && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">% Adicional Noturno:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={calculations.nightAdditionalPercent}
                        onChange={(e) => setCalculations(prev => ({ ...prev, nightAdditionalPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                        step="0.1"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Horas/Dia:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={calculations.hoursPerDay}
                        onChange={(e) => setCalculations(prev => ({ ...prev, hoursPerDay: parseFloat(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                        step="0.5"
                      />
                      <span className="text-xs">h</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">% Hora Reduzida:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={calculations.reducedHourPercent}
                        onChange={(e) => setCalculations(prev => ({ ...prev, reducedHourPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                        step="0.0001"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span>Adicional noturno ({calculations.nightAdditionalPercent}%):</span>
                  <span className="font-medium">{formatCurrency(calculations.additionalNight)}</span>
                </div>
                <div className="text-xs text-gray-600 bg-amber-50 p-2 rounded">
                  <strong>Fórmula:</strong> ({selectedJobRole?.salary_base} ÷ 220) × {calculations.nightAdditionalPercent}% × {selectedScale?.people_quantity} × {calculations.hoursPerDay}h
                </div>
                
                <div className="flex justify-between">
                  <span>Hora noturna adicional:</span>
                  <span className="font-medium">{formatCurrency(calculations.extraNightHour)}</span>
                </div>
                <div className="text-xs text-gray-600 bg-amber-50 p-2 rounded">
                  <strong>Fórmula:</strong> ({selectedJobRole?.salary_base} ÷ 220) × ({calculations.reducedHourPercent}% × {selectedScale?.people_quantity})
                </div>
              </>
            )}
            
            {formData.salary_additions.length > 0 && (
              <div className="flex justify-between">
                <span>Adicionais salariais:</span>
                <span className="font-medium">{formatCurrency(calculations.salaryAdditionsTotal)}</span>
              </div>
            )}
            
            <div className="border-t pt-2 flex justify-between font-bold text-blue-600">
              <span>Total Bloco 1:</span>
              <span>{formatCurrency(calculations.block1Total)}</span>
            </div>
          </div>
          
          {/* Detalhamento dos adicionais */}
          {formData.salary_additions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-800 mb-2">Adicionais Aplicados:</h5>
              <div className="space-y-1 text-xs text-blue-700">
                {formData.salary_additions.map((addition, index) => {
                  const salarioMinimo = 1412.00;
                  const salaryBase = selectedJobRole?.salary_base || 0;
                  const quantity = selectedScale?.people_quantity || 1;
                  
                  let calculatedValue = 0;
                  let baseText = '';
                  
                  if (addition.calculationBase === 'salario_minimo') {
                    calculatedValue = salarioMinimo * (addition.percentage / 100) * quantity;
                    baseText = `${addition.percentage}% × R$ ${salarioMinimo.toFixed(2)} × ${quantity}`;
                  } else if (addition.calculationBase === 'salario_base') {
                    calculatedValue = salaryBase * (addition.percentage / 100) * quantity;
                    baseText = `${addition.percentage}% × R$ ${salaryBase.toFixed(2)} × ${quantity}`;
                  } else if (addition.calculationBase === 'valor_fixo') {
                    calculatedValue = (addition.fixedValue || 0) * quantity;
                    baseText = `R$ ${(addition.fixedValue || 0).toFixed(2)} × ${quantity}`;
                  } else {
                    calculatedValue = 0;
                    baseText = 'Base inválida';
                  }
                  
                  return (
                    <div key={index} className="flex justify-between">
                      <span>{addition.name}:</span>
                      <span className="font-medium">
                        {formatCurrency(calculatedValue)} ({baseText})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bloco 2: Encargos Sociais */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">2</span>
            Encargos Sociais
          </h4>
          
          <div className="space-y-2 text-sm">
            {socialCharges.map(charge => {
              const value = calculations.block1Total * charge.percentage;
              return (
                <div key={charge.id} className="flex justify-between">
                  <span>{charge.charge_name} ({(charge.percentage * 100).toFixed(2)}%):</span>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              );
            })}
            
            <div className="border-t pt-2 flex justify-between font-bold text-purple-600">
              <span>Total Bloco 2:</span>
              <span>{formatCurrency(calculations.block2Total)}</span>
            </div>
          </div>
        </div>

        {/* Bloco 3: Benefícios */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">3</span>
            Benefícios Mensais
          </h4>
          
          <div className="space-y-3">
            {/* VT */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">VT (por dia):</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">R$</span>
                <input
                  type="number"
                  value={calculations.vtValue}
                  onChange={(e) => setCalculations(prev => ({ ...prev, vtValue: parseFloat(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            
            {/* VR */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">VR (por dia):</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">R$</span>
                <input
                  type="number"
                  value={calculations.vrValue}
                  onChange={(e) => setCalculations(prev => ({ ...prev, vrValue: parseFloat(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            
            <div className="border-t pt-2 flex justify-between font-bold text-green-600">
              <span>Total Bloco 3:</span>
              <span>{formatCurrency(calculations.block3Total)}</span>
            </div>
          </div>
        </div>

        {/* Bloco 4: Materiais */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">4</span>
            Materiais
          </h4>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {calculations.materials.map((material, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 items-center text-sm">
                <input
                  type="text"
                  value={material.name}
                  onChange={(e) => {
                    setCalculations(prev => {
                      const newMaterials = [...prev.materials];
                      newMaterials[index].name = e.target.value;
                      return { ...prev, materials: newMaterials };
                    });
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="Nome do material"
                />
                <input
                  type="number"
                  value={material.unitValue}
                  onChange={(e) => handleMaterialChange(index, 'unitValue', parseFloat(e.target.value) || 0)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs text-right"
                  placeholder="Valor"
                  step="0.01"
                  min="0"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={material.quantity}
                    onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-12 px-1 py-1 border border-gray-300 rounded text-xs text-center"
                    placeholder="Qtd"
                    min="0"
                  />
                  <button
                    onClick={() => removeMaterial(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={addMaterial}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Adicionar material
            </button>
            <div className="font-bold text-orange-600">
              {formatCurrency(calculations.block4Total)}
            </div>
          </div>
        </div>

        {/* Bloco 6: Intrajornada */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">6</span>
            Custos de Intrajornada
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="intrajornada"
                  checked={!calculations.hasIntrajornada}
                  onChange={() => setCalculations(prev => ({ ...prev, hasIntrajornada: false }))}
                  className="text-red-600"
                />
                <span className="text-sm">Sem intrajornada</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="intrajornada"
                  checked={calculations.hasIntrajornada}
                  onChange={() => setCalculations(prev => ({ ...prev, hasIntrajornada: true }))}
                  className="text-green-600"
                />
                <span className="text-sm">Com intrajornada remunerada</span>
              </label>
            </div>
            
            {calculations.hasIntrajornada && (
              <>
                <div className="flex justify-between items-center">
                  <span>% Custo de Reposição:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={calculations.intrajornadaPercent}
                      onChange={(e) => setCalculations(prev => ({ ...prev, intrajornadaPercent: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      step="0.1"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <strong>Fórmula:</strong> ({selectedJobRole?.salary_base} ÷ 220) × (1 + {calculations.intrajornadaPercent}%) × {selectedScale?.people_quantity} pessoas
                </div>
              </>
            )}
            
            <div className="border-t pt-2 flex justify-between font-bold text-indigo-600">
              <span>Total Bloco 6:</span>
              <span>{formatCurrency(calculations.block6Total)}</span>
            </div>
          </div>
        </div>

        {/* Bloco 7: BDI */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">7</span>
            BDI - Base de Despesas Indiretas
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span>Margem de Lucro:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={calculations.profitMargin}
                  onChange={(e) => setCalculations(prev => ({ ...prev, profitMargin: parseFloat(e.target.value) || 0 }))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-right"
                  step="0.01"
                  min="0"
                />
                <span>%</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span>Margem Administrativa (fixo):</span>
              <span>{calculations.adminMargin}%</span>
            </div>
            
            <div className="flex justify-between">
              <span>PIS (fixo):</span>
              <span>{calculations.pis}%</span>
            </div>
            
            <div className="flex justify-between">
              <span>Cofins (fixo):</span>
              <span>{calculations.cofins}%</span>
            </div>
            
            <div className="flex justify-between">
              <span>ISS {selectedCity?.city_name}:</span>
              <span>{selectedCity?.iss_percent}%</span>
            </div>
            
            <div className="border-t pt-2 flex justify-between font-bold text-red-600">
              <span>Total BDI:</span>
              <span>{formatCurrency(calculations.block7Total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Final */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-6">
        <h4 className="text-xl font-bold mb-4 flex items-center">
          <Calculator className="w-6 h-6 mr-2" />
          Resumo Financeiro do Posto
        </h4>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-lg font-bold mb-2">Subtotal (sem BDI)</div>
            <div className="text-2xl font-bold">{formatCurrency(calculations.subtotalWithoutBdi)}</div>
          </div>
          <div>
            <div className="text-lg font-bold mb-2">Total Final (com BDI)</div>
            <div className="text-3xl font-bold">{formatCurrency(calculations.finalTotal)}</div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex space-x-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        
        <button
          onClick={() => onSave(calculations.finalTotal)}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Salvando Posto...' : 'Salvar Posto Completo'}</span>
        </button>
      </div>
    </div>
  );
};