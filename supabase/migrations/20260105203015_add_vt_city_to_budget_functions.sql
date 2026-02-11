/*
  # Adiciona VT e Cidade às Funções do Orçamento

  1. Alterações
    - Adiciona coluna `vt_value` (numeric) à tabela `budget_functions`
    - Adiciona coluna `city` (text) à tabela `budget_functions`
    - Define valores padrão para registros existentes

  2. Notas
    - VT e Cidade agora são configuráveis por função individual
    - Cada função pode ter um valor de VT diferente
    - Cada função pode estar em uma cidade diferente
*/

-- Adiciona coluna vt_value à tabela budget_functions
ALTER TABLE budget_functions 
ADD COLUMN IF NOT EXISTS vt_value numeric DEFAULT 5.5;

-- Adiciona coluna city à tabela budget_functions
ALTER TABLE budget_functions 
ADD COLUMN IF NOT EXISTS city text DEFAULT '';
