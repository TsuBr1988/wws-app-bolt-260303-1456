/*
  # Add tipo (Público/Privado) to contracts table

  1. Changes
    - Add `tipo` column to `contracts` table
      - Values: 'Publico' or 'Privado'
      - Default: 'Publico'
    
  2. Notes
    - Adds index for filtering by tipo
    - This field complements the empresa field (WWS/Worldwide)
*/

-- Add tipo column to contracts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE contracts ADD COLUMN tipo text DEFAULT 'Publico';
  END IF;
END $$;

-- Create index for tipo column
CREATE INDEX IF NOT EXISTS idx_contracts_tipo ON contracts(tipo);