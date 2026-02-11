/*
  # Create system_config table for application-wide settings
  
  1. New Tables
    - `system_config`
      - `id` (integer, primary key) - Always 1 to ensure single row
      - `minimum_wage` (numeric) - Current national minimum wage value
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `system_config` table
    - Add policy for public read access (no authentication required)
    - Add policy for authenticated users to update
  
  3. Initial Data
    - Insert default minimum wage value of 1621.00 (2024 Brazilian minimum wage)
*/

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  id integer PRIMARY KEY DEFAULT 1,
  minimum_wage numeric NOT NULL DEFAULT 1621.00,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial configuration
INSERT INTO system_config (id, minimum_wage, updated_at)
VALUES (1, 1621.00, now())
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Anyone can read system config"
  ON system_config
  FOR SELECT
  USING (true);

-- Policy for authenticated users to update
CREATE POLICY "Authenticated users can update system config"
  ON system_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_system_config_id ON system_config(id);