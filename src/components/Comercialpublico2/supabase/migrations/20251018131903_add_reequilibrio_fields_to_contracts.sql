/*
  # Add Reequilíbrio Fields to Contracts

  1. New Columns
    - `reequilibrio_dissidio` (boolean, default false)
      - Indica se o contrato precisa de lembretes de reequilíbrio de dissídio
      - Lembrete anual em 10/01
    
    - `reequilibrio_ipca` (boolean, default false)
      - Indica se o contrato precisa de lembretes de reequilíbrio IPCA
      - Lembrete 10 meses após data de início, depois anualmente
    
    - `ultimo_lembrete_dissidio` (date, nullable)
      - Data do último lembrete de dissídio enviado
      - Usado para controlar avisos anuais
    
    - `ultimo_lembrete_ipca` (date, nullable)
      - Data do último lembrete de IPCA enviado
      - Usado para controlar avisos anuais após o primeiro

  2. Changes
    - Adiciona campos booleanos para controle de lembretes
    - Adiciona campos de data para rastreamento dos últimos avisos
    - Campos default como false e null para não afetar contratos existentes
*/

DO $$
BEGIN
  -- Add reequilibrio_dissidio field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'reequilibrio_dissidio'
  ) THEN
    ALTER TABLE contracts ADD COLUMN reequilibrio_dissidio boolean DEFAULT false;
  END IF;

  -- Add reequilibrio_ipca field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'reequilibrio_ipca'
  ) THEN
    ALTER TABLE contracts ADD COLUMN reequilibrio_ipca boolean DEFAULT false;
  END IF;

  -- Add ultimo_lembrete_dissidio field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'ultimo_lembrete_dissidio'
  ) THEN
    ALTER TABLE contracts ADD COLUMN ultimo_lembrete_dissidio date;
  END IF;

  -- Add ultimo_lembrete_ipca field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'ultimo_lembrete_ipca'
  ) THEN
    ALTER TABLE contracts ADD COLUMN ultimo_lembrete_ipca date;
  END IF;
END $$;