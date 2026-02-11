/*
  # Correção do fluxo de login - Políticas RLS otimizadas
  
  1. Limpeza completa das políticas existentes
  2. Criação de políticas RLS eficientes e específicas
  3. Otimização de índices para performance
  4. Função helper para verificação de admin
  
  Objetivo: Resolver travamento no login e garantir fluxo leve de autenticação
*/

-- 1. Remover todas as políticas existentes da tabela user_profiles
DROP POLICY IF EXISTS "Allow logged-in users to read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own data" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON user_profiles;

-- 2. Garantir que RLS está ativado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar função helper otimizada para verificar admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 4. Criar políticas RLS otimizadas e específicas

-- Política 1: Permitir que usuário autenticado leia seu próprio perfil
CREATE POLICY "user_profiles_select_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política 2: Permitir que usuário autenticado insira seu próprio perfil
CREATE POLICY "user_profiles_insert_own"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política 3: Permitir que usuário autenticado atualize seu próprio perfil
CREATE POLICY "user_profiles_update_own"
ON user_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política 4: Permitir que admins gerenciem todos os perfis
CREATE POLICY "user_profiles_admin_all"
ON user_profiles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 5. Criar índices otimizados para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_fast 
ON user_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_fast 
ON user_profiles (role);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email_fast 
ON user_profiles (email);

-- Índice específico para admins (usado pela função is_admin)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_admin 
ON user_profiles (role) 
WHERE role = 'admin';

-- Índice específico para usuários autenticados
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_auth 
ON user_profiles (user_id) 
WHERE user_id IS NOT NULL;

-- 6. Otimizar query planner
ANALYZE user_profiles;

-- 7. Comentários para documentação
COMMENT ON POLICY "user_profiles_select_own" ON user_profiles IS 
'Permite que usuário autenticado leia apenas seu próprio perfil';

COMMENT ON POLICY "user_profiles_insert_own" ON user_profiles IS 
'Permite que usuário autenticado crie apenas seu próprio perfil';

COMMENT ON POLICY "user_profiles_update_own" ON user_profiles IS 
'Permite que usuário autenticado atualize apenas seu próprio perfil';

COMMENT ON POLICY "user_profiles_admin_all" ON user_profiles IS 
'Permite que administradores gerenciem todos os perfis de usuário';

COMMENT ON FUNCTION is_admin() IS 
'Função helper para verificar se o usuário atual é administrador';