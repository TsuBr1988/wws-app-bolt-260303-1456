/*
  # Adicionar Campos de Margem aos Orçamentos

  1. Alterações
    - Adiciona `margem_lucro` (numeric) - Margem de lucro em porcentagem (padrão 10%)
    - Adiciona `margem_adm` (numeric) - Margem administrativa em porcentagem (padrão 5%)

  2. Notas
    - Os valores padrão são 10% para lucro e 5% para administrativa
    - Campos permitem valores decimais para precisão
*/

-- Adicionar campos de margem à tabela budgets
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS margem_lucro numeric(5,2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS margem_adm numeric(5,2) DEFAULT 5.0;

-- Atualizar orçamentos existentes com os valores padrão
UPDATE budgets
SET margem_lucro = 10.0, margem_adm = 5.0
WHERE margem_lucro IS NULL OR margem_adm IS NULL;
