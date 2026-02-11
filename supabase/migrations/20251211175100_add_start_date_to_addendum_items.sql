/*
  # Add start_date to contract_sheet_addendum_items
  
  1. Changes
    - Add `start_date` column to `contract_sheet_addendum_items`
    - This allows each item in an addendum to have a specific start date
    - If NULL, defaults to the addendum's effective_date
  
  2. Notes
    - start_date is optional (NULL means use addendum's effective_date)
    - Provides flexibility for items with different validity periods
*/

-- Add start_date to contract_sheet_addendum_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_sheet_addendum_items'
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE contract_sheet_addendum_items
    ADD COLUMN start_date date;
  END IF;
END $$;

-- Add comment explaining the field
COMMENT ON COLUMN contract_sheet_addendum_items.start_date IS
  'Start date for budgeted values (inclusive). NULL means use addendum effective_date.';
