/*
  # Add city field to proposals table

  1. New Column
    - `city` (text, optional) - City where the proposal/contract will be executed
  
  2. Index
    - Add index on city column for better filter performance
  
  3. Compatibility
    - Column is nullable to maintain compatibility with existing data
*/

-- Add city column to proposals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'city'
  ) THEN
    ALTER TABLE proposals ADD COLUMN city text;
  END IF;
END $$;

-- Add index for better performance when filtering by city
CREATE INDEX IF NOT EXISTS idx_proposals_city ON proposals(city);