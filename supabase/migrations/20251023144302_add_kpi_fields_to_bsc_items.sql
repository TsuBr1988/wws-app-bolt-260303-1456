/*
  # Add KPI fields to BSC Items

  1. Changes
    - Add `is_kpi` (boolean) - Indica se o item é um KPI
    - Add `meta` (text) - Meta do KPI
    - Add `iniciativas` (text) - Iniciativas do KPI

  2. Notes
    - Campos são opcionais e só são preenchidos quando is_kpi = true
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bsc_items' AND column_name = 'is_kpi'
  ) THEN
    ALTER TABLE bsc_items ADD COLUMN is_kpi boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bsc_items' AND column_name = 'meta'
  ) THEN
    ALTER TABLE bsc_items ADD COLUMN meta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bsc_items' AND column_name = 'iniciativas'
  ) THEN
    ALTER TABLE bsc_items ADD COLUMN iniciativas text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bsc_items_is_kpi ON bsc_items(is_kpi);