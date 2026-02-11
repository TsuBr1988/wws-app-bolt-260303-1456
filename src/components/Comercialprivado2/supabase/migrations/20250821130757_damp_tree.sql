/*
  # Add active contacts field to prospection weekly

  1. New Columns
    - Add `active_contacts` column to `prospection_weekly` table
    - Integer field for tracking active contacts in the period
    - Default value of 0
    
  2. Index
    - Add index for performance on the new field
*/

-- Add active_contacts field to prospection_weekly table
ALTER TABLE prospection_weekly 
ADD COLUMN IF NOT EXISTS active_contacts integer DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_prospection_weekly_active_contacts 
ON prospection_weekly(active_contacts);

-- Add comment to explain the field
COMMENT ON COLUMN prospection_weekly.active_contacts IS 'Quantidade de contatos ativos no período da semana';