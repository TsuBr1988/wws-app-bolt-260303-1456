/*
  # Add empresa field to contracts table

  1. Changes
    - Add `empresa` column to `contracts` table (WWS or Worldwide)
    - Set default value as 'WWS'
    
  2. Purpose
    - Distinguish between WWS and Worldwide contracts
    - Enable filtering by company
    - Support stacked chart visualization by company
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'empresa'
  ) THEN
    ALTER TABLE contracts ADD COLUMN empresa text DEFAULT 'WWS';
  END IF;
END $$;