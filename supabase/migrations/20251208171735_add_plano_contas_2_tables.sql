/*
  # Add Plano de Contas 2 Tables
  
  1. New Tables
    - `transactions_coa2` - Financial transactions for Plano de Contas 2
    - `client_metadata_coa2` - Client metadata for Plano de Contas 2
    - `app_settings_coa2` - Application settings for Plano de Contas 2
    - `daily_balances_coa2` - Daily balance tracking for Plano de Contas 2
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Important Notes
    - These tables are completely independent from the original Plano de Contas
    - Each table has its own data set with no relation to the original tables
*/

-- Create transactions_coa2 table
CREATE TABLE IF NOT EXISTS transactions_coa2 (
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

ALTER TABLE transactions_coa2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all transactions in COA2"
  ON transactions_coa2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert transactions in COA2"
  ON transactions_coa2 FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update transactions in COA2"
  ON transactions_coa2 FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete transactions in COA2"
  ON transactions_coa2 FOR DELETE
  TO authenticated
  USING (true);

-- Create client_metadata_coa2 table
CREATE TABLE IF NOT EXISTS client_metadata_coa2 (
  cost_center text PRIMARY KEY,
  category text NOT NULL,
  type text NOT NULL,
  city text DEFAULT '',
  company text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_metadata_coa2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all client metadata in COA2"
  ON client_metadata_coa2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert client metadata in COA2"
  ON client_metadata_coa2 FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update client metadata in COA2"
  ON client_metadata_coa2 FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete client metadata in COA2"
  ON client_metadata_coa2 FOR DELETE
  TO authenticated
  USING (true);

-- Create app_settings_coa2 table
CREATE TABLE IF NOT EXISTS app_settings_coa2 (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings_coa2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all app settings in COA2"
  ON app_settings_coa2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert app settings in COA2"
  ON app_settings_coa2 FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update app settings in COA2"
  ON app_settings_coa2 FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete app settings in COA2"
  ON app_settings_coa2 FOR DELETE
  TO authenticated
  USING (true);

-- Create daily_balances_coa2 table
CREATE TABLE IF NOT EXISTS daily_balances_coa2 (
  company text PRIMARY KEY,
  balance numeric NOT NULL DEFAULT 0,
  date timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_balances_coa2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all daily balances in COA2"
  ON daily_balances_coa2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert daily balances in COA2"
  ON daily_balances_coa2 FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update daily balances in COA2"
  ON daily_balances_coa2 FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete daily balances in COA2"
  ON daily_balances_coa2 FOR DELETE
  TO authenticated
  USING (true);