/*
  # Add margem_percentual to proposals table

  1. Changes
    - Add margem_percentual column to proposals table
    - Store margin percentage for each proposal
    - Default value is NULL (optional field)

  2. Notes
    - Stores margin as decimal (e.g., 15.5 for 15.5%)
    - Can be edited directly from proposal cards
*/

-- Add margem_percentual column
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS margem_percentual decimal(5,2);

-- Add comment for documentation
COMMENT ON COLUMN proposals.margem_percentual IS 'Margem percentual da proposta (ex: 15.5 para 15.5%)';
