/*
  # Migração: Mover role para user_metadata e atualizar is_admin()

  1. Atualizar função is_admin() para ler role do user_metadata
  2. Remover coluna role da tabela user_profiles
  3. Ajustar políticas RLS que referenciam a coluna role
  4. Criar índices otimizados
*/

-- 1. Atualizar a função is_admin() para ler do user_metadata
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Ler a role do user_metadata do usuário autenticado
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
    false
  );
END;
$$;

-- 2. Verificar se a função can_edit_proposals() existe e atualizá-la se necessário
CREATE OR REPLACE FUNCTION can_edit_proposals()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admin pode editar tudo, outros roles podem editar propostas
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'closer', 'sdr'),
    false
  );
END;
$$;

-- 3. Remover políticas existentes da tabela user_profiles que referenciam a coluna role
DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all user profiles" ON user_profiles;

-- 4. Remover a coluna role da tabela user_profiles (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN role;
  END IF;
END $$;

-- 5. Recriar políticas RLS otimizadas para user_profiles (sem referência à coluna role)
CREATE POLICY "user_profiles_select_own"
ON user_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
ON user_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_own"
ON user_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_admin_all"
ON user_profiles FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 6. Criar índices otimizados
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_fast 
ON user_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email_fast 
ON user_profiles (email);

-- 7. Atualizar estatísticas para otimização
ANALYZE user_profiles;

-- 8. Comentário na tabela para documentação
COMMENT ON TABLE user_profiles IS 'Tabela otimizada para consultas rápidas de perfil de usuário. A role agora vem do user_metadata do auth.users.';