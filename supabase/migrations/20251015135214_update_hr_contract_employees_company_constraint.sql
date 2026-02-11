/*
  # Atualizar constraint de company na tabela hr_contract_employees

  1. Alterações
    - Remover constraint antiga que permite 'EES'
    - Adicionar nova constraint que permite 'WWS' e 'Worldwide'
    - Atualizar registros existentes de 'EES' para 'WWS' se houver

  2. Segurança
    - Nenhuma mudança nas políticas RLS
*/

-- Atualizar registros existentes de EES para WWS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM hr_contract_employees WHERE company = 'EES'
  ) THEN
    UPDATE hr_contract_employees SET company = 'WWS' WHERE company = 'EES';
  END IF;
END $$;

-- Remover constraint antiga e adicionar nova
ALTER TABLE hr_contract_employees 
  DROP CONSTRAINT IF EXISTS hr_contract_employees_company_check;

ALTER TABLE hr_contract_employees
  ADD CONSTRAINT hr_contract_employees_company_check 
  CHECK (company IN ('WWS', 'Worldwide'));
