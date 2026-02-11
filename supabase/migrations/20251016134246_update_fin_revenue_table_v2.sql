/*
  # Update fin_revenue Table

  1. Changes
    - Add `contract_name` column (text)
    - Add `budget_2025` column (numeric)
    - Drop old unique constraint
    - Add new unique constraint including contract_name

  2. Notes
    - This migration updates the fin_revenue table to match the structure needed for the new Faturamento KPI
    - Existing data is preserved
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fin_revenue' AND column_name = 'contract_name'
  ) THEN
    ALTER TABLE fin_revenue ADD COLUMN contract_name text NOT NULL DEFAULT 'Default';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fin_revenue' AND column_name = 'budget_2025'
  ) THEN
    ALTER TABLE fin_revenue ADD COLUMN budget_2025 numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Drop old unique constraint if it exists
ALTER TABLE fin_revenue DROP CONSTRAINT IF EXISTS fin_revenue_month_ym_company_key;

-- Create new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_fin_revenue_unique 
  ON fin_revenue(company, contract_name, month_ym);