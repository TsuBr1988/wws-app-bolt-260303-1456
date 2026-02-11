/*
  # Fix system_config RLS policies
  
  1. Changes
    - Drop existing restrictive policies
    - Add more permissive policies for anonymous access
    - Allow anyone to read and update system config
  
  This is necessary because the budget system doesn't require authentication.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read system config" ON system_config;
DROP POLICY IF EXISTS "Authenticated users can update system config" ON system_config;

-- Create new permissive policies
CREATE POLICY "Enable read access for all users"
  ON system_config
  FOR SELECT
  USING (true);

CREATE POLICY "Enable update access for all users"
  ON system_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert access for all users"
  ON system_config
  FOR INSERT
  WITH CHECK (true);