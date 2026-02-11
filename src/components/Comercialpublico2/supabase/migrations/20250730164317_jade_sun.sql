/*
  # Allow anonymous users to manage certidoes

  1. Security Changes
    - Add policy for anonymous users to INSERT into certidoes table
    - Add policy for anonymous users to UPDATE certidoes table  
    - Add policy for anonymous users to DELETE from certidoes table
  
  2. Notes
    - This allows full CRUD operations without authentication
    - All operations (read, write, update, delete) are now publicly accessible
    - Remove authentication requirements for certidoes management
*/

-- Allow anonymous users to insert new certidoes
CREATE POLICY "Allow anon users to insert certidoes"
  ON certidoes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update existing certidoes
CREATE POLICY "Allow anon users to update certidoes"
  ON certidoes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete certidoes
CREATE POLICY "Allow anon users to delete certidoes"
  ON certidoes
  FOR DELETE
  TO anon
  USING (true);