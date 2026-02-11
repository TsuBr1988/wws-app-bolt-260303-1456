/*
  # Add Pilares to Strategic Plan

  1. Changes
    - Add 5 columns for strategic pillars (pilares) to strategic_plan table
    - Each pilar has a text field to store its name/description

  2. New Columns
    - `pilar1` (text) - First strategic pillar
    - `pilar2` (text) - Second strategic pillar
    - `pilar3` (text) - Third strategic pillar
    - `pilar4` (text) - Fourth strategic pillar
    - `pilar5` (text) - Fifth strategic pillar
    - `main_text` (text) - Main descriptive text for the strategic plan
*/

-- Add pilares columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar1'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar2'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar3'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar3 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar4'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar4 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar5'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar5 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'main_text'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN main_text text;
  END IF;
END $$;