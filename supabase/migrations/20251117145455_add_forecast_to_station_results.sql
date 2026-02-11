/*
  # Add Forecast Columns to Financial Station Results

  1. Changes
    - Add `forecast_revenue` (numeric) - Faturamento Bruto Previsto
    - Add `forecast_net_revenue` (numeric) - Faturamento Líquido Previsto
    - Add `forecast_payroll_ft` (numeric) - Folha + FT Previsto
    - Add `forecast_csv_total` (numeric) - CSV + Reversão Impostos Previsto
    - Add `forecast_contribution_margin` (numeric) - Margem de Contribuição Prevista

  2. Notes
    - All forecast columns default to 0
    - Existing columns (revenue, net_revenue, payroll_ft, csv_total, contribution_margin) now represent realized values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'forecast_revenue'
  ) THEN
    ALTER TABLE financial_station_results 
    ADD COLUMN forecast_revenue numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'forecast_net_revenue'
  ) THEN
    ALTER TABLE financial_station_results 
    ADD COLUMN forecast_net_revenue numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'forecast_payroll_ft'
  ) THEN
    ALTER TABLE financial_station_results 
    ADD COLUMN forecast_payroll_ft numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'forecast_csv_total'
  ) THEN
    ALTER TABLE financial_station_results 
    ADD COLUMN forecast_csv_total numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'forecast_contribution_margin'
  ) THEN
    ALTER TABLE financial_station_results 
    ADD COLUMN forecast_contribution_margin numeric NOT NULL DEFAULT 0;
  END IF;
END $$;