/*
  # Allow Anonymous Access to Permissions Tables

  1. Changes
    - Update RLS policies to allow anon role access
    - This is needed because the app uses custom auth with localStorage
    - The Supabase client uses the anon key for all requests
    
  2. Security
    - Note: This assumes frontend validation is in place
    - Consider implementing service role access for admin operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read all user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Authenticated users can insert user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Authenticated users can update user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Authenticated users can delete user_permissions" ON user_permissions;

DROP POLICY IF EXISTS "Authenticated users can read all user_indicator_permissions" ON user_indicator_permissions;
DROP POLICY IF EXISTS "Authenticated users can insert user_indicator_permissions" ON user_indicator_permissions;
DROP POLICY IF EXISTS "Authenticated users can update user_indicator_permissions" ON user_indicator_permissions;
DROP POLICY IF EXISTS "Authenticated users can delete user_indicator_permissions" ON user_indicator_permissions;

-- Create new policies for user_permissions with anon access
CREATE POLICY "Allow anon read access to user_permissions"
  ON user_permissions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert to user_permissions"
  ON user_permissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to user_permissions"
  ON user_permissions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete from user_permissions"
  ON user_permissions
  FOR DELETE
  TO anon
  USING (true);

-- Create new policies for user_indicator_permissions with anon access
CREATE POLICY "Allow anon read access to user_indicator_permissions"
  ON user_indicator_permissions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert to user_indicator_permissions"
  ON user_indicator_permissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to user_indicator_permissions"
  ON user_indicator_permissions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete from user_indicator_permissions"
  ON user_indicator_permissions
  FOR DELETE
  TO anon
  USING (true);