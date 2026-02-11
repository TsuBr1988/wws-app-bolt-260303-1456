/*
  # Add 'nao_conta_meta_comercial' field to proposals

  1. Changes
    - Add `nao_conta_meta_comercial` boolean column to `proposals` table
    - Default value is `false` (counts for commercial goals by default)
    - This field allows marking proposals that should not count towards commercial goals
      but still generate commissions (different from nao_gera_comissao which excludes both)

  2. Notes
    - This field is independent from `nao_gera_comissao`
    - When `nao_gera_comissao` is true, the proposal doesn't generate commission AND doesn't count for goals
    - When `nao_conta_meta_comercial` is true, the proposal generates commission but doesn't count for goals
*/

-- Add the new field to proposals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'nao_conta_meta_comercial'
  ) THEN
    ALTER TABLE proposals ADD COLUMN nao_conta_meta_comercial boolean DEFAULT false;
  END IF;
END $$;