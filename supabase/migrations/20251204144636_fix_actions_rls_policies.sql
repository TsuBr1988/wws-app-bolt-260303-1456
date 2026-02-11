/*
  # Fix Actions RLS Policies

  1. Changes
    - Drop existing policy "Allow public write access to actions"
    - Create separate policies for INSERT, UPDATE, and DELETE operations
    - This ensures all operations work correctly
  
  2. Security
    - Allow public to SELECT all actions
    - Allow public to INSERT new actions
    - Allow public to UPDATE existing actions
    - Allow public to DELETE actions
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow public write access to actions" ON actions;

-- Create specific policies for each operation
CREATE POLICY "Allow public insert on actions"
  ON actions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on actions"
  ON actions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on actions"
  ON actions FOR DELETE
  TO public
  USING (true);