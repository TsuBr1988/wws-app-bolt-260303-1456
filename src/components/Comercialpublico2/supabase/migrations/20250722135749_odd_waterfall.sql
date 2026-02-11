/*
  # Fix client_name column reference in bonus contribution trigger

  1. Fixes
    - Updates trigger function to use correct column name 'client_name'
    - Ensures trigger references match actual table schema
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS create_bonus_contribution_trigger ON proposals;
DROP FUNCTION IF EXISTS create_bonus_contribution();

-- Create updated trigger function with correct column name
CREATE OR REPLACE FUNCTION create_bonus_contribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create contribution when status changes TO 'Fechado' (from any other status)
  IF NEW.status = 'Fechado' AND (OLD.status IS NULL OR OLD.status != 'Fechado') THEN
    -- Check if contribution already exists for this proposal
    IF NOT EXISTS (
      SELECT 1 FROM bonus_contributions WHERE proposal_id = NEW.id
    ) THEN
      INSERT INTO bonus_contributions (
        proposal_id,
        client_name,
        fixed_amount,
        percentage_amount,
        contribution_date
      ) VALUES (
        NEW.id,
        NEW.client,
        50.00,
        (NEW.total_value * 0.001),
        CURRENT_DATE
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER create_bonus_contribution_trigger
  AFTER INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_bonus_contribution();