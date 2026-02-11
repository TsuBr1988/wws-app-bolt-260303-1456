/*
  # Remove unused weekly performance columns

  1. Changes
    - Remove column `conexoes_totais` from weekly_performance table
    - Remove column `contatos_ativados` from weekly_performance table
    - These metrics are no longer needed for performance calculation

  2. Security
    - No changes to RLS policies needed

  3. Notes
    - Data in these columns will be permanently lost
    - This change aligns with the updated performance metrics requirements
*/

-- Remove unused columns from weekly_performance table
DO $$
BEGIN
  -- Remove conexoes_totais column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_performance' AND column_name = 'conexoes_totais'
  ) THEN
    ALTER TABLE weekly_performance DROP COLUMN conexoes_totais;
  END IF;

  -- Remove contatos_ativados column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_performance' AND column_name = 'contatos_ativados'
  ) THEN
    ALTER TABLE weekly_performance DROP COLUMN contatos_ativados;
  END IF;
END $$;