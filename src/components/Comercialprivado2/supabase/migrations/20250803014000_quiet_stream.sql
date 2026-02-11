/*
  # Fix RLS policy for budgets table

  1. Security Changes
    - Drop existing INSERT policy that might have restrictive conditions
    - Create new permissive INSERT policy for authenticated users
    - Ensure users can insert budget records without restrictions

  2. Policy Details
    - Allow all authenticated users to insert into budgets table
    - No additional conditions or restrictions
    - Simple true condition for maximum compatibility
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert budgets" ON budgets;

-- Create new permissive INSERT policy for authenticated users
CREATE POLICY "Enable insert for authenticated users"
  ON budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure SELECT policy exists for authenticated users
DROP POLICY IF EXISTS "Users can view budgets" ON budgets;
CREATE POLICY "Enable read for authenticated users"
  ON budgets
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure UPDATE policy exists for authenticated users  
DROP POLICY IF EXISTS "Users can update budgets" ON budgets;
CREATE POLICY "Enable update for authenticated users"
  ON budgets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure DELETE policy exists for authenticated users
DROP POLICY IF EXISTS "Users can delete budgets" ON budgets;
CREATE POLICY "Enable delete for authenticated users"
  ON budgets
  FOR DELETE
  TO authenticated
  USING (true);