/*
  # Corrige fórmula do NR-07 para usar variável dinâmica
  
  1. Alterações
    - Atualiza a fórmula do benefício NR-07 (INSUMOS_NR07) de `(78/12) * q` para `v * q`
    - Isso permite que o valor seja controlado pelo campo `base_value` em vez de estar hardcoded
    
  2. Detalhes
    - A variável `v` representa o `base_value` do benefício
    - A variável `q` representa a quantidade de funcionários
    - Com essa mudança, ao alterar o base_value na tabela de configuração, o cálculo refletirá automaticamente
*/

-- Atualizar a fórmula do NR-07 para usar a variável dinâmica
UPDATE config_benefits
SET 
  formula = 'v * q',
  updated_at = now()
WHERE code = 'INSUMOS_NR07';
