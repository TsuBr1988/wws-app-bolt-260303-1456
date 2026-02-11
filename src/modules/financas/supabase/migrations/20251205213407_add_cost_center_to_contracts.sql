/*
  # Add cost_center field to contracts table

  1. Changes
    - Add `cost_center` column to contracts table (nullable, optional)
    - This column will link contracts to client_metadata for enriched information
    - Allows optional relationship between contracts and client metadata
  
  2. Notes
    - Column is nullable to allow contracts without metadata linkage
    - No foreign key constraint to maintain flexibility
*/

-- Add cost_center column to contracts table if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contracts' AND column_name = 'cost_center'
    ) THEN
      ALTER TABLE contracts ADD COLUMN cost_center text;
    END IF;
  END IF;
END $$;