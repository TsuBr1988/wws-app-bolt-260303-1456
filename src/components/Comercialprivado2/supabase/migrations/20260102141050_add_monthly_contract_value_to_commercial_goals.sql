/*
  # Add Monthly Contract Value Type to Commercial Goals

  ## Overview
  Adds a new target type for commercial goals to track monthly contract values instead of total global values.
  
  ## Changes
  - Adds 'valores_mensais_contratos' to the commercial_goal_target_type enum
  - This allows goals to track the monthly value of contracts (e.g., R$ 50k/month) rather than total value (e.g., R$ 600k total)
  
  ## Example
  - Contract: R$ 600k total (R$ 50k/month for 12 months)
  - With this type, only R$ 50k counts toward the goal
  
  ## Notes
  - Uses the 'monthly_value' field from proposals table
  - Separate from 'sales' type which uses 'total_value'
*/

-- Add the new enum value to commercial_goal_target_type
ALTER TYPE commercial_goal_target_type ADD VALUE IF NOT EXISTS 'valores_mensais_contratos';
