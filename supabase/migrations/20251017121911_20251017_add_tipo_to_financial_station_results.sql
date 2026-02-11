/*
  # Add Tipo Column to Financial Station Results

  1. Changes
    - Add 'tipo' column to financial_station_results table
    - Column accepts 'Público' or 'Privado' values
    - Default value is 'Público'
    - Column is required (NOT NULL)

  2. Migration Strategy
    - Add column with default value to handle existing rows
    - Update unique index to include tipo in the key
    - Drop old unique index and create new one with tipo

  3. Impact
    - Existing rows will get default value 'Público'
    - New records must specify tipo
    - Unique constraint now includes tipo for more granular control
*/

-- Add tipo column with default value
ALTER TABLE financial_station_results 
ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'Público' 
CHECK (tipo IN ('Público', 'Privado'));

-- Drop the old unique index
DROP INDEX IF EXISTS idx_financial_station_results_unique_key;

-- Create new unique index including tipo
CREATE UNIQUE INDEX idx_financial_station_results_unique_key
  ON financial_station_results (company, tipo, contract_name, month_ym);
