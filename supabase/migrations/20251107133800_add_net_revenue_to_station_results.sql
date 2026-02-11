/*
  # Add net_revenue column to financial_station_results

  ## Changes
  1. Adds `net_revenue` column to `financial_station_results` table
    - Type: numeric with precision 15,2
    - Default: 0
    - Not null constraint
  
  ## Notes
  - The `revenue` column will now represent "Faturamento Bruto" (Gross Revenue)
  - The new `net_revenue` column will represent "Faturamento Líquido" (Net Revenue)
  - Default value is set to 0 for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'net_revenue'
  ) THEN
    ALTER TABLE financial_station_results 
    ADD COLUMN net_revenue numeric(15,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;