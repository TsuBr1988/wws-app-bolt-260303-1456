/*
  # Atualizar constraint de company na tabela hr_severance

  1. Mudanças
    - Remover constraint antigo que permitia 'EES' ou 'Worldwide'
    - Adicionar novo constraint que permite 'WWS' ou 'Worldwide'
    - Atualizar registros existentes de 'EES' para 'WWS'

  2. Notas Importantes
    - Esta migração garante que todos os registros existentes sejam atualizados
    - O novo constraint reflete a nomenclatura correta (WWS ao invés de EES)
*/

-- Update existing records from EES to WWS
UPDATE hr_severance
SET company = 'WWS'
WHERE company = 'EES';

-- Drop old constraint
ALTER TABLE hr_severance
DROP CONSTRAINT IF EXISTS hr_severance_company_check;

-- Add new constraint
ALTER TABLE hr_severance
ADD CONSTRAINT hr_severance_company_check CHECK (company IN ('WWS', 'Worldwide'));
