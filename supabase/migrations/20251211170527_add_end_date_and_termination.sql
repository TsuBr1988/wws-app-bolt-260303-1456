/*
  # Add end date and termination date fields

  1. Changes to `contract_sheet_addendum_items`
    - Add `end_date` column to specify when budgeted values end
    - Values are now valid from start_date to end_date (inclusive)

  2. Changes to `contract_sheets`
    - Add `termination_date` column to mark contract termination
    - When set, no budgeted values should exist after this date
    - This allows contracts to end earlier than planned

  3. Notes
    - end_date is optional (NULL means indefinite)
    - termination_date is optional (NULL means contract is active)
    - termination_date takes precedence over addendum end_dates
*/

-- Add end_date to contract_sheet_addendum_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheet_addendum_items'
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE contract_sheet_addendum_items
    ADD COLUMN end_date date;
  END IF;
END $$;

-- Add termination_date to contract_sheets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheets'
    AND column_name = 'termination_date'
  ) THEN
    ALTER TABLE contract_sheets
    ADD COLUMN termination_date date;
  END IF;
END $$;

-- Add comment explaining the fields
COMMENT ON COLUMN contract_sheet_addendum_items.end_date IS
  'End date for budgeted values (inclusive). NULL means indefinite.';

COMMENT ON COLUMN contract_sheets.termination_date IS
  'Date when contract was terminated. No budgeted values after this date.';
