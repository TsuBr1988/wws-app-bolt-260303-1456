/*
  # Corrigir políticas RLS da tabela challenges

  1. Mudanças
    - Remove a política antiga que permitia apenas admins
    - Cria políticas específicas para cada operação
    - Permite que usuários autenticados criem e visualizem desafios
    - Apenas admins podem atualizar e deletar desafios
  
  2. Segurança
    - SELECT: Todos usuários autenticados podem visualizar
    - INSERT: Todos usuários autenticados podem criar
    - UPDATE: Apenas admins
    - DELETE: Apenas admins
*/

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow admins to manage challenges" ON challenges;
DROP POLICY IF EXISTS "Allow authenticated users to read challenges" ON challenges;

-- Política de SELECT: usuários autenticados podem ler
CREATE POLICY "Authenticated users can view challenges"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de INSERT: usuários autenticados podem criar
CREATE POLICY "Authenticated users can create challenges"
  ON challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política de UPDATE: apenas admins podem atualizar
CREATE POLICY "Admins can update challenges"
  ON challenges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Política de DELETE: apenas admins podem deletar
CREATE POLICY "Admins can delete challenges"
  ON challenges
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );