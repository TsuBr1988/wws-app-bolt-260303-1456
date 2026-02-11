/*
  # Fix RLS Policies for Permissions Tables

  1. Changes
    - Drop existing restrictive policies on user_permissions and user_indicator_permissions
    - Create proper policies that allow authenticated users (admins) to manage all permissions
    
  2. Security
    - Allow authenticated users full access to manage permissions
    - This assumes admin users are properly authenticated through the app
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow public write access to user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow public read access to user_indicator_permissions" ON user_indicator_permissions;
DROP POLICY IF EXISTS "Allow public write access to user_indicator_permissions" ON user_indicator_permissions;

-- Create new policies for user_permissions
CREATE POLICY "Authenticated users can read all user_permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert user_permissions"
  ON user_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update user_permissions"
  ON user_permissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete user_permissions"
  ON user_permissions
  FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for user_indicator_permissions
CREATE POLICY "Authenticated users can read all user_indicator_permissions"
  ON user_indicator_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert user_indicator_permissions"
  ON user_indicator_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update user_indicator_permissions"
  ON user_indicator_permissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete user_indicator_permissions"
  ON user_indicator_permissions
  FOR DELETE
  TO authenticated
  USING (true);