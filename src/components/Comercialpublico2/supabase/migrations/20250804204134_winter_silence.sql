/*
  # Adicionar controle de participação no Fundo de Bonificação

  1. Nova Coluna
    - `participa_fundo` (boolean, padrão false) na tabela `employees`
  
  2. Funcionalidade
    - Checkbox no cadastro de funcionários
    - Filtro automático no cálculo do fundo
    - Controle individual por funcionário
*/

-- Adicionar coluna para controlar participação no fundo
ALTER TABLE employees 
ADD COLUMN participa_fundo boolean DEFAULT false;

-- Atualizar funcionários existentes para participar por padrão (exceto Admin)
UPDATE employees 
SET participa_fundo = true 
WHERE role != 'Admin' AND name != 'Rubens Neto';

-- Adicionar comentário na coluna
COMMENT ON COLUMN employees.participa_fundo IS 'Indica se o funcionário participa do fundo de bonificação';