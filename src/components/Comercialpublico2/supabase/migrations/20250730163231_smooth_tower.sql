/*
  # Allow anonymous users to read certidoes

  1. Security Changes
    - Add policy for anonymous users to read certidoes table
    - Maintain existing admin policies for write operations
    
  This migration allows the frontend to display certidoes data without requiring user authentication,
  while keeping write operations restricted to admin users only.
*/

-- Add policy to allow anonymous users to read certidoes
CREATE POLICY "Allow anon users to read certidoes"
  ON certidoes
  FOR SELECT
  TO anon
  USING (true);