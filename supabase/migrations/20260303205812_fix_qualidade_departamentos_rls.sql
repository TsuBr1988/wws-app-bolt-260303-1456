/*
  # Corrigir políticas RLS para qualidade_procedimentos_departamentos

  1. Alterações
    - Remove política existente que pode estar com problemas
    - Recria políticas específicas para cada operação (SELECT, INSERT, UPDATE, DELETE)
    - Garante que usuários autenticados tenham acesso completo
*/

-- Remove política existente
DROP POLICY IF EXISTS "Usuários autenticados podem tudo nos departamentos" ON qualidade_procedimentos_departamentos;

-- Cria políticas específicas para cada operação
CREATE POLICY "Usuários autenticados podem visualizar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR DELETE
  TO authenticated
  USING (true);
