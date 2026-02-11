/*
  # Adicionar function_id à tabela equipments

  1. Alterações
    - Adicionar coluna `function_id` na tabela `equipments`
    - Adicionar foreign key para `budget_functions`
    - Equipamentos agora funcionam por função (similar a uniformes)
    - Valores são para 1 funcionário e serão multiplicados pela quantidade da função

  2. Nota
    - Equipamentos antigos ficarão sem function_id (serão ignorados ou precisam ser revinculados)
*/

-- Adicionar coluna function_id
ALTER TABLE equipments
ADD COLUMN IF NOT EXISTS function_id uuid REFERENCES budget_functions(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_equipments_function_id ON equipments(function_id);
CREATE INDEX IF NOT EXISTS idx_equipments_budget_function ON equipments(budget_id, function_id);
