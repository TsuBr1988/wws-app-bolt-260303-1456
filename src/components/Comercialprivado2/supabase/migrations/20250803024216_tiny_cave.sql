/*
  # Add turn column to budget_posts table

  1. Database Changes
    - Add `turn` column to `budget_posts` table
    - Set default value and constraint for valid turn values
    - Update existing records to have default turn value

  2. Security
    - Maintain existing RLS policies
    - No additional security changes needed
*/

-- Add turn column to budget_posts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budget_posts' AND column_name = 'turn'
  ) THEN
    ALTER TABLE public.budget_posts 
    ADD COLUMN turn text NOT NULL DEFAULT 'Diurno';
    
    -- Add constraint to ensure only valid turn values
    ALTER TABLE public.budget_posts 
    ADD CONSTRAINT budget_posts_turn_check 
    CHECK (turn IN ('Diurno', 'Noturno'));
  END IF;
END $$;

-- Update any existing records to have a valid turn value
UPDATE public.budget_posts 
SET turn = 'Diurno' 
WHERE turn IS NULL OR turn = '';