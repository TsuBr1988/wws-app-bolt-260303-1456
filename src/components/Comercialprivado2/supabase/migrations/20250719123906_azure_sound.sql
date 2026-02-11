/*
  # Add pontos_educacao column to weekly_performance table

  1. Changes
    - Add `pontos_educacao` column to `weekly_performance` table
    - Set default value to 0 for existing records
    - Update trigger function to include pontos_educacao in total_points calculation

  2. Notes
    - This enables tracking education points for both Closers and SDRs
    - Column will be included in automatic total_points calculation
    - Safe to run on existing data (sets default value of 0)
*/

-- Add the pontos_educacao column to weekly_performance table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_performance' AND column_name = 'pontos_educacao'
  ) THEN
    ALTER TABLE weekly_performance ADD COLUMN pontos_educacao integer DEFAULT 0;
  END IF;
END $$;

-- Update the trigger function to include pontos_educacao in total_points calculation
CREATE OR REPLACE FUNCTION calculate_weekly_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total points including the new pontos_educacao field
  NEW.total_points := COALESCE(NEW.tarefas, 0) + 
                      COALESCE(NEW.pontos_educacao, 0) + 
                      COALESCE(NEW.propostas_apresentadas, 0) + 
                      COALESCE(NEW.contrato_assinado, 0) + 
                      COALESCE(NEW.mql, 0) + 
                      COALESCE(NEW.visitas_agendadas, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;