/*
  # Adicionar campos específicos por função

  1. Modificações
    - Adiciona `vt_value` em `budget_functions` - Valor de VT específico por função
    - Adiciona `city` em `budget_functions` - Cidade específica por função
    - Adiciona `iss_rate` em `budget_functions` - Taxa de ISS específica por função

  2. Notas
    - Esses campos permitem que cada função tenha configurações individuais
    - Se não especificado, usa os valores padrão do orçamento
*/

-- Adicionar campos específicos à tabela budget_functions
ALTER TABLE budget_functions
ADD COLUMN IF NOT EXISTS vt_value numeric(10,2) DEFAULT 5.50,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS iss_rate numeric(5,2);
