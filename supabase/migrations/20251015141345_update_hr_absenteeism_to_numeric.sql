/*
  # Update HR Absenteeism Table to Support Decimal Values

  1. Changes
    - Alter `justified_absence` column from integer to numeric
    - Alter `unjustified_absence` column from integer to numeric
    - Alter `expected_workload` column from integer to numeric

  2. Notes
    - This allows storing decimal values for hours (e.g., 471541.04)
    - Existing integer data will be automatically converted to numeric
*/

-- Alter columns to support decimal values
ALTER TABLE hr_absenteeism 
  ALTER COLUMN justified_absence TYPE numeric USING justified_absence::numeric,
  ALTER COLUMN unjustified_absence TYPE numeric USING unjustified_absence::numeric,
  ALTER COLUMN expected_workload TYPE numeric USING expected_workload::numeric;