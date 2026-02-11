/*
  # Adiciona Taxa de ISSQN às Funções do Orçamento

  1. Alterações
    - Adiciona coluna `iss_rate` (numeric) à tabela `budget_functions`
    - Define valor padrão como 0 para registros existentes

  2. Notas
    - Cada função agora pode ter sua própria taxa de ISSQN
    - A taxa é determinada pela cidade selecionada
    - O valor é armazenado como percentual (ex: 5.00 para 5%)
*/

-- Adiciona coluna iss_rate à tabela budget_functions
ALTER TABLE budget_functions 
ADD COLUMN IF NOT EXISTS iss_rate numeric DEFAULT 0;
