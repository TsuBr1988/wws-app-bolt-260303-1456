/*
  # Fix UNIQUE Index for Financial Station Results

  1. Problem
    - The UNIQUE index on (company, contract_name, month_ym) was not properly created
    - This prevented upsert operations from working correctly with onConflict
    - Without the constraint, upserts would fail or insert duplicates

  2. Changes
    - Drop old incomplete index if exists
    - Create proper UNIQUE index on (company, contract_name, month_ym)
    - Add updated_at trigger for automatic timestamp updates
    - Ensure RLS policies are properly configured

  3. Impact
    - Upsert operations will now work correctly
    - Sync operations (delete + upsert) will persist properly
    - No data loss - existing records are preserved
*/

-- 1) Ensure table exists with correct structure
CREATE TABLE IF NOT EXISTS financial_station_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  contract_name text NOT NULL,
  month_ym text NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  payroll_ft numeric NOT NULL DEFAULT 0,
  csv_total numeric NOT NULL DEFAULT 0,
  contribution_margin numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Create auxiliary indexes for filtering
CREATE INDEX IF NOT EXISTS idx_fs_results_company ON financial_station_results(company);
CREATE INDEX IF NOT EXISTS idx_fs_results_contract ON financial_station_results(contract_name);
CREATE INDEX IF NOT EXISTS idx_fs_results_month ON financial_station_results(month_ym);

-- 3) Drop old incomplete unique index and create proper one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
     WHERE schemaname = 'public' 
       AND indexname = 'idx_financial_station_results_unique'
  ) THEN
    DROP INDEX idx_financial_station_results_unique;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_station_results_unique_key
  ON financial_station_results (company, contract_name, month_ym);

-- 4) Create updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fs_results_updated_at ON financial_station_results;

CREATE TRIGGER trg_fs_results_updated_at
BEFORE UPDATE ON financial_station_results
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5) Enable RLS and create policies
ALTER TABLE financial_station_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
     WHERE schemaname = 'public' 
       AND tablename = 'financial_station_results' 
       AND policyname = 'fsr_select_auth'
  ) THEN
    CREATE POLICY fsr_select_auth
      ON financial_station_results FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
     WHERE schemaname = 'public' 
       AND tablename = 'financial_station_results' 
       AND policyname = 'fsr_insert_auth'
  ) THEN
    CREATE POLICY fsr_insert_auth
      ON financial_station_results FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
     WHERE schemaname = 'public' 
       AND tablename = 'financial_station_results' 
       AND policyname = 'fsr_update_auth'
  ) THEN
    CREATE POLICY fsr_update_auth
      ON financial_station_results FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
     WHERE schemaname = 'public' 
       AND tablename = 'financial_station_results' 
       AND policyname = 'fsr_delete_auth'
  ) THEN
    CREATE POLICY fsr_delete_auth
      ON financial_station_results FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END$$;
