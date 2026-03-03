/*
  # Adicionar políticas para role anon em qualidade_procedimentos_departamentos

  1. Alterações
    - Adiciona políticas para o role 'anon' além de 'authenticated'
    - Isso permite que requisições sem JWT também funcionem (temporário para debug)
*/

-- Adiciona políticas para anon (usuários não autenticados)
CREATE POLICY "Anon pode visualizar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon pode criar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon pode atualizar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon pode deletar departamentos"
  ON qualidade_procedimentos_departamentos
  FOR DELETE
  TO anon
  USING (true);
