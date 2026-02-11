/*
  # Fix bonus_contributions total_contribution as computed field

  1. Schema Updates
    - Remove total_contribution from inserts (computed field)
    - Ensure trigger function doesn't try to insert total_contribution
    - Fix column definition as GENERATED ALWAYS AS
  
  2. Trigger Function Updates
    - Remove total_contribution from INSERT statement
    - Let database compute it automatically
*/

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS create_bonus_contribution_trigger ON public.proposals;
DROP FUNCTION IF EXISTS create_bonus_contribution();

-- Update the bonus_contributions table to ensure total_contribution is computed
ALTER TABLE public.bonus_contributions 
DROP COLUMN IF EXISTS total_contribution;

ALTER TABLE public.bonus_contributions 
ADD COLUMN total_contribution numeric(12,2) GENERATED ALWAYS AS (fixed_amount + percentage_amount) STORED;

-- Create the corrected trigger function
CREATE OR REPLACE FUNCTION create_bonus_contribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create contribution when status changes to 'Fechado' and there isn't one already
  IF NEW.status = 'Fechado' AND OLD.status != 'Fechado' THEN
    -- Check if contribution already exists for this proposal
    IF NOT EXISTS (
      SELECT 1 FROM bonus_contributions 
      WHERE proposal_id = NEW.id
    ) THEN
      -- Insert bonus contribution (total_contribution will be computed automatically)
      INSERT INTO bonus_contributions (
        proposal_id,
        cliente_name,
        fixed_amount,
        percentage_amount,
        contribution_date
      ) VALUES (
        NEW.id,
        NEW.client,
        50.00,
        (NEW.total_value * 0.001), -- 0.1%
        CURRENT_DATE
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER create_bonus_contribution_trigger
  AFTER INSERT OR UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_bonus_contribution();

-- Update database types to reflect the actual schema
COMMENT ON COLUMN bonus_contributions.total_contribution IS 'Computed field: fixed_amount + percentage_amount';