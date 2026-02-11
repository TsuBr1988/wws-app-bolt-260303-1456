/*
  # Remove colocacao_atual column and migrate data to posicao_atual

  1. Data Migration
    - Copy any existing data from colocacao_atual to posicao_atual
    
  2. Schema Changes
    - Drop the colocacao_atual column if it exists
    
  3. Notes
    - This ensures only posicao_atual exists in the database
    - Prevents column not found errors in queries
*/

-- Migrate any existing data from colocacao_atual to posicao_atual (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'colocacao_atual'
  ) THEN
    UPDATE public.proposals
    SET posicao_atual = COALESCE(posicao_atual, colocacao_atual)
    WHERE colocacao_atual IS NOT NULL
      AND (posicao_atual IS NULL OR posicao_atual = '');
      
    -- Drop the old column
    ALTER TABLE public.proposals DROP COLUMN colocacao_atual;
  END IF;
END $$;