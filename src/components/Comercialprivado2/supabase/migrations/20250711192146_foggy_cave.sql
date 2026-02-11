/*
  # Fix bonus_contributions RLS policies

  1. Security Changes
    - Update RLS policies for bonus_contributions table
    - Allow INSERT and UPDATE operations for authenticated users
    - Ensure triggers can execute properly

  2. Policy Updates
    - Add comprehensive policies for all operations
    - Fix trigger execution permissions
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read bonus_contributions" ON bonus_contributions;

-- Create comprehensive RLS policies for bonus_contributions
CREATE POLICY "Authenticated users can manage bonus_contributions"
  ON bonus_contributions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure the trigger function has proper permissions
CREATE OR REPLACE FUNCTION create_bonus_contribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create bonus contribution for closed proposals
  IF NEW.status = 'Fechado' AND (OLD.status IS NULL OR OLD.status != 'Fechado') THEN
    INSERT INTO bonus_contributions (
      proposal_id,
      client_name,
      contract_value,
      fixed_amount,
      percentage_amount,
      total_contribution
    ) VALUES (
      NEW.id,
      NEW.client,
      NEW.total_value,
      50.00,
      NEW.total_value * 0.0001,
      50.00 + (NEW.total_value * 0.0001)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_bonus_contribution_trigger ON proposals;
CREATE TRIGGER create_bonus_contribution_trigger
  AFTER INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_bonus_contribution();