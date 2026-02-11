/*
  # Corrigir Fórmula do Vale Transporte

  1. Atualização
    - Atualiza a fórmula do Vale Transporte para incluir:
      - Uso de vrDays (dias úteis) ao invés de diasU
      - Desconto de 6% do salário
      - Garantia de valor mínimo 0 usando Math.max

  A fórmula correta é:
  (vtU * 2 * vrDays * q) - (0.06 * s * q)
  
  Se o resultado for negativo, o valor deve ser 0.
  
  Onde:
  - vtU = valor unitário do vale transporte
  - vrDays = dias úteis trabalhados na escala
  - q = quantidade de colaboradores
  - s = salário base
*/

-- Atualizar fórmula do Vale Transporte
UPDATE config_benefits
SET formula = 'Math.max(0, (vtU * 2 * vrDays * q) - (0.06 * s * q))'
WHERE code = 'VT' AND calculation_type = 'formula';