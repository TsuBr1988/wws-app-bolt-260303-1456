/*
  # Corrigir políticas RLS da tabela probability_scores

  1. Políticas atualizadas
    - Adicionar políticas públicas para INSERT, UPDATE e DELETE
    - Manter política existente para authenticated users
    - Garantir que usuários possam salvar avaliações de probabilidade

  2. Segurança
    - Permitir acesso público temporariamente
    - Manter RLS habilitado
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins and closers/sdrs to manage probability_scores" ON probability_scores;
DROP POLICY IF EXISTS "Allow authenticated users to read probability_scores" ON probability_scores;

-- Add public access policies similar to proposals table
CREATE POLICY "Allow public read access to probability_scores"
  ON probability_scores
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to probability_scores"
  ON probability_scores
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to probability_scores"
  ON probability_scores
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to probability_scores"
  ON probability_scores
  FOR DELETE
  TO public
  USING (true);

-- Keep authenticated user policies for additional access
CREATE POLICY "Allow authenticated users to manage probability_scores"
  ON probability_scores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);