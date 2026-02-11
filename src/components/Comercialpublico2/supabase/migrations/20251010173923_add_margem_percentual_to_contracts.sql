/*
  # Add margin percentage field to contracts

  1. Changes
    - Add `margem_percentual` column to `contracts` table
      - Type: numeric (decimal percentage)
      - Default: 10.0 (10% default margin)
      - Allows tracking individual margin percentage for each contract
  
  2. Purpose
    - Enable ROI calculation based on individual contract margins
    - Support editable margin percentages per contract
    - Improve financial reporting accuracy
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'margem_percentual'
  ) THEN
    ALTER TABLE contracts ADD COLUMN margem_percentual numeric DEFAULT 10.0;
    COMMENT ON COLUMN contracts.margem_percentual IS 'Margin percentage for this contract (e.g., 10.0 for 10%)';
  END IF;
END $$;