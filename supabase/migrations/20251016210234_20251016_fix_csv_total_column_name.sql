/*
  # Fix csv_total Column Name

  1. Problem
    - The column was created as 'csv_tota' instead of 'csv_total'
    - This causes upsert operations to fail with "column not found" error
    - Frontend code references 'csv_total' but database has 'csv_tota'

  2. Changes
    - Rename column from 'csv_tota' to 'csv_total'

  3. Impact
    - Fixes save operations on Station Results KPI
    - No data loss - column is just renamed
    - All existing data is preserved
*/

-- Rename the column to correct name
ALTER TABLE financial_station_results 
RENAME COLUMN csv_tota TO csv_total;
