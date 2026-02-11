/*
  # Fix RLS policies for certidoes table with admin role check

  1. Security Changes
    - Drop existing problematic policies for certidoes table
    - Add policy for admins to manage all certidoes operations (INSERT, UPDATE, DELETE)
    - Add policy for authenticated users to read certidoes
    - Policies follow the same pattern as other tables in the system

  2. Admin Access
    - Admins (users with role='admin' in user_profiles) can perform all operations
    - All authenticated users can read certidoes data
    - Follows the established pattern from other tables like challenges, badges, etc.
*/

-- Drop existing policies that may be causing conflicts
DROP POLICY IF EXISTS "Allow public read access to certidoes" ON certidoes;
DROP POLICY IF EXISTS "Allow public write access to certidoes" ON certidoes;
DROP POLICY IF EXISTS "Allow authenticated users to manage certidoes" ON certidoes;
DROP POLICY IF EXISTS "Allow authenticated users to read certidoes" ON certidoes;

-- Create new policies following the same pattern as other tables
CREATE POLICY "Allow admins to manage certidoes"
  ON certidoes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Allow authenticated users to read certidoes"
  ON certidoes
  FOR SELECT
  TO authenticated
  USING (true);