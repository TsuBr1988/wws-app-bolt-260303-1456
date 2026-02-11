/*
  # Add description field to contract sheet addendums
  
  1. Changes
    - Add `description` column to `contract_sheet_addendums`
    - This allows users to add notes or comments about each addendum
  
  2. Notes
    - description is optional (can be NULL)
    - Text field for flexibility in content length
*/

-- Add description to contract_sheet_addendums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheet_addendums'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE contract_sheet_addendums
    ADD COLUMN description text;
  END IF;
END $$;

-- Add comment explaining the field
COMMENT ON COLUMN contract_sheet_addendums.description IS
  'Optional description or notes about the addendum.';
