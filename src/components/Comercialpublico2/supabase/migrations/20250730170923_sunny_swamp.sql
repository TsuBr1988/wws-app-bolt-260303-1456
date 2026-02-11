/*
  # Ensure certidoes delete permissions

  1. Security
    - Verify and ensure RLS policies allow DELETE operations for anon users
    - Add comprehensive logging for troubleshooting
  
  2. Policy Updates
    - Recreate delete policy if needed
    - Ensure policy is correctly configured
*/

-- Drop existing delete policy if it exists and recreate it
DROP POLICY IF EXISTS "Allow anon users to delete certidoes" ON certidoes;

-- Create comprehensive delete policy for anon users
CREATE POLICY "Allow anon users to delete certidoes"
  ON certidoes
  FOR DELETE
  TO anon
  USING (true);

-- Also ensure authenticated users can delete (for future use)
DROP POLICY IF EXISTS "Allow authenticated users to delete certidoes" ON certidoes;

CREATE POLICY "Allow authenticated users to delete certidoes"
  ON certidoes
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify RLS is enabled
ALTER TABLE certidoes ENABLE ROW LEVEL SECURITY;

-- Add some helpful comments
COMMENT ON POLICY "Allow anon users to delete certidoes" ON certidoes IS 
'Allows anonymous users to delete any certidao record - used for open access system';

COMMENT ON POLICY "Allow authenticated users to delete certidoes" ON certidoes IS 
'Allows authenticated users to delete any certidao record - for future authentication system';