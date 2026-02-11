/*
  # Permitir que todos os usuários autenticados possam editar desafios

  1. Mudanças
    - Remove a política restritiva que permitia apenas admins a editar
    - Cria nova política que permite qualquer usuário autenticado editar desafios
  
  2. Segurança
    - SELECT: Todos usuários autenticados podem visualizar
    - INSERT: Todos usuários autenticados podem criar
    - UPDATE: Todos usuários autenticados podem atualizar
    - DELETE: Apenas admins podem deletar (mantido por segurança)
*/

-- Remover política antiga que restringia UPDATE apenas para admins
DROP POLICY IF EXISTS "Admins can update challenges" ON challenges;

-- Criar nova política de UPDATE para usuários autenticados
CREATE POLICY "Authenticated users can update challenges"
  ON challenges
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
