/*
  # Add PPR Benefits

  1. Description
    - Adds PPR (Participação nos Lucros e Resultados) benefits for both Facilities and Vigilancia service types
    - PPR is calculated monthly as: (annual_value / 12) * quantity

  2. New Benefits
    - PPR for Facilities: R$ 356.39 annually (R$ 29.70 monthly per person)
    - PPR for Vigilancia: R$ 47.33 monthly per person

  3. Calculation Formula
    - Uses formula: (v / 12) * q
    - Where v = base_value (annual value) and q = effective quantity of employees
*/

-- Add PPR for Facilities (order_index 7, after Cesta Básica)
INSERT INTO config_benefits (code, name, calculation_type, base_value, service_type, formula, order_index, is_active)
VALUES (
  'PPR',
  'PPR',
  'formula',
  356.39,
  'facilities',
  '(v / 12) * q',
  7,
  true
)
ON CONFLICT (code, service_type) 
DO UPDATE SET
  name = EXCLUDED.name,
  calculation_type = EXCLUDED.calculation_type,
  base_value = EXCLUDED.base_value,
  formula = EXCLUDED.formula,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;

-- Add PPR for Vigilancia (order_index 10, after Periculosidade)
INSERT INTO config_benefits (code, name, calculation_type, base_value, service_type, formula, order_index, is_active)
VALUES (
  'PPR_VIGILANCIA',
  'PPR',
  'per_month',
  47.33,
  'vigilancia',
  '',
  10,
  true
)
ON CONFLICT (code, service_type) 
DO UPDATE SET
  name = EXCLUDED.name,
  calculation_type = EXCLUDED.calculation_type,
  base_value = EXCLUDED.base_value,
  formula = EXCLUDED.formula,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;
