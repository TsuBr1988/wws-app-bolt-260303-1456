/*
  # Add SQL Status to Proposal Enum

  1. Changes
    - Add 'SQL' as a valid status to the proposal_status enum type
    - This allows proposals to be marked as SQL (Sales Qualified Lead)

  2. Security
    - No security changes, only enum modification
*/

-- Add 'SQL' to the proposal_status enum
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'SQL';

-- Note: Enum values cannot be reordered after creation
-- The order will be: Proposta, Negociação, Fechado, Perdido, Análise de contrato, SQL
-- This doesn't affect functionality, only the internal enum order