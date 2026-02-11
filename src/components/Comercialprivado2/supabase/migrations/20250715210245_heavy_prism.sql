/*
  # Corrigir políticas RLS da tabela user_profiles

  1. Problema
    - Recursão infinita detectada nas políticas RLS
    - Políticas complexas causando loops

  2. Solução
    - Remover todas as políticas existentes
    - Criar políticas simples e diretas
    - Evitar referências circulares

  3. Novas Políticas
    - SELECT: Usuários podem ver apenas seu próprio perfil
    - INSERT: Apenas usuários autenticados podem criar perfil
    - UPDATE: Usuários podem atualizar apenas seu próprio perfil
    - DELETE: Apenas admins podem deletar perfis
*/

-- Remover todas as políticas existentes da tabela user_profiles
DROP POLICY IF EXISTS "Admins can manage all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "only_owner" ON user_profiles;

-- Política simples para SELECT - usuários podem ver apenas seu próprio perfil
CREATE POLICY "users_can_read_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para INSERT - usuários autenticados podem criar seu próprio perfil
CREATE POLICY "users_can_insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE - usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_can_update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE - apenas para casos específicos (pode ser removida se não necessária)
CREATE POLICY "service_role_can_delete_profiles"
  ON user_profiles
  FOR DELETE
  TO service_role
  USING (true);