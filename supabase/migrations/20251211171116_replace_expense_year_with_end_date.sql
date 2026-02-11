/*
  # Replace expense_year with end_date in contract_sheets

  1. Changes to `contract_sheets`
    - Remove `expense_year` column (integer)
    - Add `end_date` column (date) - end date for budget calculations
    - Budgeted values will be calculated from start_date to end_date

  2. Data Migration
    - For existing sheets, calculate end_date as December 31 of expense_year
    - Preserve data during migration

  3. Notes
    - end_date is required (NOT NULL)
    - Budget calculations will use date range (start_date to end_date)
    - This provides more flexibility than year-based budgets
*/

-- Add end_date column (nullable initially for migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheets'
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE contract_sheets
    ADD COLUMN end_date date;
  END IF;
END $$;

-- Migrate existing data: set end_date to December 31 of expense_year
UPDATE contract_sheets
SET end_date = (expense_year || '-12-31')::date
WHERE end_date IS NULL AND expense_year IS NOT NULL;

-- Make end_date NOT NULL
ALTER TABLE contract_sheets
ALTER COLUMN end_date SET NOT NULL;

-- Drop expense_year column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheets'
    AND column_name = 'expense_year'
  ) THEN
    ALTER TABLE contract_sheets
    DROP COLUMN expense_year;
  END IF;
END $$;

-- Add comment explaining the field
COMMENT ON COLUMN contract_sheets.end_date IS
  'End date for budget calculations. Budgeted values are calculated from start_date to end_date.';
