/*
  # Add Financas Module Tables
  
  1. New Tables
    - `transactions` - Financial transactions with dates and amounts
    - `client_metadata` - Client metadata with categories and types
    - `app_settings` - Application settings storage
    - `daily_balances` - Daily balance tracking per company
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  company text NOT NULL,
  type text NOT NULL CHECK (type IN ('pay', 'receive')),
  status text NOT NULL CHECK (status IN ('pending', 'completed')),
  due_date timestamptz NOT NULL,
  payment_date timestamptz,
  competency_date timestamptz,
  amount numeric NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  cost_center text NOT NULL,
  original_file text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create client_metadata table
CREATE TABLE IF NOT EXISTS client_metadata (
  cost_center text PRIMARY KEY,
  category text NOT NULL,
  type text NOT NULL,
  city text DEFAULT '',
  company text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all client metadata"
  ON client_metadata FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert client metadata"
  ON client_metadata FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update client metadata"
  ON client_metadata FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert app settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create daily_balances table
CREATE TABLE IF NOT EXISTS daily_balances (
  company text PRIMARY KEY,
  balance numeric NOT NULL DEFAULT 0,
  date timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all daily balances"
  ON daily_balances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert daily balances"
  ON daily_balances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update daily balances"
  ON daily_balances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add cost_center to contracts if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contracts' AND column_name = 'cost_center'
    ) THEN
      ALTER TABLE contracts ADD COLUMN cost_center text;
    END IF;
  END IF;
END $$;