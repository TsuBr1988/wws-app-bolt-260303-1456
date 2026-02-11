/*
  # System Configurations Table

  1. New Tables
    - `system_configurations`
      - `id` (uuid, primary key)
      - `config_type` (text, unique)
      - `config_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `system_configurations` table
    - Add policy for authenticated users to manage all configurations
    - Add trigger for updated_at timestamp

  3. Indexes
    - Unique index on config_type for fast lookups
    - Regular index on config_type for queries
*/

-- Create system_configurations table
CREATE TABLE IF NOT EXISTS system_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text UNIQUE NOT NULL,
  config_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS system_configurations_config_type_key 
ON system_configurations (config_type);

CREATE INDEX IF NOT EXISTS idx_system_configurations_config_type 
ON system_configurations (config_type);

-- Enable RLS
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can access system_configurations" ON system_configurations;
DROP POLICY IF EXISTS "Authenticated users can manage system configurations" ON system_configurations;

-- Create a single comprehensive policy for authenticated users
CREATE POLICY "authenticated_users_full_access" 
ON system_configurations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_system_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_system_configurations_updated_at ON system_configurations;
CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_system_configurations_updated_at();