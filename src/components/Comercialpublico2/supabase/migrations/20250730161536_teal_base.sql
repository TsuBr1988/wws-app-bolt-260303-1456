/*
  # Fix RLS policies for certidoes table

  1. Security Changes
    - Drop existing restrictive policies
    - Add policy for authenticated users to read all certidoes
    - Add policy for authenticated users to manage all certidoes (INSERT/UPDATE/DELETE)
    
  2. Notes
    - Certidoes are system-wide configuration data, not user-specific
    - All authenticated users should be able to read and manage certidoes
    - This resolves the RLS policy violation error when updating certidoes
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow public read access to certidoes" ON certidoes;
DROP POLICY IF EXISTS "Allow public write access to certidoes" ON certidoes;

-- Create new policies for authenticated users
CREATE POLICY "Allow authenticated users to read certidoes"
  ON certidoes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage certidoes"
  ON certidoes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);