/*
  # Add type field to fin_revenue table

  1. Changes
    - Add `type` column (text) with values 'publico' or 'privado'
    - Drop old unique constraint
    - Add new unique constraint including type

  2. Notes
    - This migration adds a type field to categorize contracts as public or private
*/

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fin_revenue' AND column_name = 'type'
  ) THEN
    ALTER TABLE fin_revenue ADD COLUMN type text NOT NULL DEFAULT 'publico' CHECK (type IN ('publico', 'privado'));
  END IF;
END $$;

-- Drop old unique constraint
DROP INDEX IF EXISTS idx_fin_revenue_unique;

-- Create new unique constraint including type
CREATE UNIQUE INDEX IF NOT EXISTS idx_fin_revenue_unique 
  ON fin_revenue(company, contract_name, type, month_ym);