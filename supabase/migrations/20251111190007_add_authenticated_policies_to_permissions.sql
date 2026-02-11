/*
  # Add Authenticated Role Policies to Permissions Tables

  1. Changes
    - Add policies for authenticated role in addition to anon
    - This provides redundancy in case the client switches between roles
    
  2. Security
    - Allows both anon and authenticated users to manage permissions
    - Frontend validation still controls admin access
*/

-- Add authenticated policies for user_permissions
CREATE POLICY "Authenticated users can read user_permissions"
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

-- Add authenticated policies for user_indicator_permissions
CREATE POLICY "Authenticated users can read user_indicator_permissions"
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