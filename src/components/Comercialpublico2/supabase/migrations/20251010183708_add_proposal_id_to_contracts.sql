/*
  # Add proposal_id to contracts table

  1. Changes
    - Add `proposal_id` column to `contracts` table (foreign key to proposals)
    - Add index for performance
    
  2. Purpose
    - Link contracts to their original proposals/licitações
    - Allow ROI calculations to use original bid data (valor_meses, valor_mensal)
    - Track when contract was signed (using proposal's situacao change to "Contrato assinado")
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'proposal_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contracts_proposal_id ON contracts(proposal_id);