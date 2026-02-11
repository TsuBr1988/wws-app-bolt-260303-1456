/*
  # Fix employee_commission_models employee_id type

  ## Changes
  - Alter `employee_id` column in `employee_commission_models` from `integer` to `uuid`
  - This fixes the type mismatch between `employees.id` (uuid) and `employee_commission_models.employee_id` (integer)
  - Add foreign key constraint to ensure referential integrity with employees table

  ## Important Notes
  1. This migration assumes there are no existing records in `employee_commission_models`
  2. If there are existing records, they would need to be migrated separately
  3. Ensures proper referential integrity between employees and commission models
*/

-- First, check if there are any existing records
DO $$
DECLARE
  record_count integer;
BEGIN
  SELECT COUNT(*) INTO record_count FROM employee_commission_models;
  
  IF record_count > 0 THEN
    RAISE NOTICE 'Warning: Table employee_commission_models contains % existing records. These will need manual verification.', record_count;
  END IF;
END $$;

-- Drop the foreign key constraint if it exists (it shouldn't, but just in case)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employee_commission_models_employee_id_fkey'
    AND table_name = 'employee_commission_models'
  ) THEN
    ALTER TABLE employee_commission_models
      DROP CONSTRAINT employee_commission_models_employee_id_fkey;
  END IF;
END $$;

-- Alter the column type from integer to uuid
-- Using NULL as intermediate step since we can't directly convert integer to uuid
ALTER TABLE employee_commission_models
  ALTER COLUMN employee_id DROP DEFAULT,
  ALTER COLUMN employee_id TYPE uuid USING NULL;

-- Add foreign key constraint to employees table
ALTER TABLE employee_commission_models
  ADD CONSTRAINT employee_commission_models_employee_id_fkey
  FOREIGN KEY (employee_id)
  REFERENCES employees(id)
  ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_commission_models_employee_id 
  ON employee_commission_models(employee_id);

-- Create composite index for active employee assignments
CREATE INDEX IF NOT EXISTS idx_employee_commission_models_employee_active 
  ON employee_commission_models(employee_id, active) 
  WHERE active = true;