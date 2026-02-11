/*
  # Add Title and Pilar Descriptions to Strategic Plan

  1. Changes
    - Add main_title field for editable title
    - Add description fields for each of the 5 strategic pillars

  2. New Columns
    - `main_title` (text) - Editable title for the main text section
    - `pilar1_description` (text) - Description for first pillar
    - `pilar2_description` (text) - Description for second pillar
    - `pilar3_description` (text) - Description for third pillar
    - `pilar4_description` (text) - Description for fourth pillar
    - `pilar5_description` (text) - Description for fifth pillar
*/

-- Add title and pilar description columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'main_title'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN main_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar1_description'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar1_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar2_description'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar2_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar3_description'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar3_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar4_description'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar4_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'strategic_plan' AND column_name = 'pilar5_description'
  ) THEN
    ALTER TABLE strategic_plan ADD COLUMN pilar5_description text;
  END IF;
END $$;