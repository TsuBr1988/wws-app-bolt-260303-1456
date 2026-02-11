/*
  # Adicionar Data aos Aditivos de Colaboradores
  
  1. Alterações na Tabela `contract_employee_quantities`
    - Adiciona coluna `effective_date` (date) - Data efetiva do aditivo
  
  2. Notas
    - Para base (addendum_number = 0), a data será a data de início do contrato
    - Para aditivos (addendum_number > 0), será a data informada pelo usuário
*/

-- Add effective_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_employee_quantities' AND column_name = 'effective_date'
  ) THEN
    ALTER TABLE contract_employee_quantities ADD COLUMN effective_date date;
  END IF;
END $$;