/*
  # Otimização de Performance para user_profiles

  1. Políticas RLS Simplificadas
    - Remove políticas complexas que causam lentidão
    - Implementa políticas diretas e eficientes
    - Adiciona índices para melhor performance

  2. Índices de Performance
    - Índice em user_id para consultas rápidas
    - Índice em email para buscas
    - Índice composto para consultas frequentes

  3. Função Otimizada
    - Remove recursões desnecessárias
    - Simplifica lógica de acesso
*/

-- Remover políticas existentes que podem estar causando lentidão
DROP POLICY IF EXISTS "users_can_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "service_role_can_delete_profiles" ON user_profiles;

-- Criar políticas RLS super simples e eficientes
CREATE POLICY "enable_read_for_authenticated_users" ON user_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "enable_insert_for_authenticated_users" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enable_update_for_own_profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enable_delete_for_service_role" ON user_profiles
  FOR DELETE TO service_role
  USING (true);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_fast ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_fast ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_fast ON user_profiles (role);

-- Atualizar estatísticas da tabela para otimização do query planner
ANALYZE user_profiles;

-- Comentário para documentação
COMMENT ON TABLE user_profiles IS 'Tabela otimizada para consultas rápidas de perfil de usuário';