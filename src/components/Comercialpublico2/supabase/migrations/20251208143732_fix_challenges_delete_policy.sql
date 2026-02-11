/*
  # Corrigir política de DELETE para desafios

  1. Mudanças
    - Remove a restrição de apenas admins poderem deletar
    - Permite que usuários autenticados deletem desafios
    - O controle de permissão continua sendo feito no frontend via SystemVersion

  2. Segurança
    - Todos usuários autenticados podem deletar desafios
    - O frontend já controla quem pode ver/usar os botões de edição/exclusão
*/

-- Remover política antiga de DELETE
DROP POLICY IF EXISTS "Admins can delete challenges" ON challenges;

-- Criar nova política de DELETE: usuários autenticados podem deletar
CREATE POLICY "Authenticated users can delete challenges"
  ON challenges
  FOR DELETE
  TO authenticated
  USING (true);
