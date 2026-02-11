/*
  # Corrigir políticas RLS para user_profiles

  1. Problema
    - Sistema fica carregando indefinidamente após login
    - RLS está bloqueando SELECT na tabela user_profiles
    - Usuários autenticados não conseguem acessar seus próprios perfis

  2. Solução
    - Remover políticas antigas conflitantes
    - Criar políticas específicas para cada operação (SELECT, INSERT, UPDATE)
    - Permitir que usuários acessem apenas seus próprios dados
    - Manter segurança com auth.uid()

  3. Políticas Criadas
    - SELECT: Usuário pode ler apenas seu próprio perfil
    - INSERT: Usuário pode criar apenas seu próprio perfil
    - UPDATE: Usuário pode atualizar apenas seu próprio perfil
    - Admins podem gerenciar todos os perfis
*/

-- Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Anyone authenticated can read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own data" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "enable_read_for_authenticated_users" ON user_profiles;

-- Garantir que RLS está ativado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuário pode ler apenas seu próprio perfil
CREATE POLICY "Allow users to read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para INSERT: Usuário pode criar apenas seu próprio perfil
CREATE POLICY "Allow users to insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para UPDATE: Usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "Allow users to update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para DELETE: Apenas admins podem deletar perfis
CREATE POLICY "Only admins can delete profiles"
ON user_profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política adicional para admins: Podem gerenciar todos os perfis
CREATE POLICY "Admins can manage all profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Criar índices para otimizar performance das consultas
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_auth 
ON user_profiles (user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_admin 
ON user_profiles (role) 
WHERE role = 'admin';

-- Atualizar estatísticas para otimizar query planner
ANALYZE user_profiles;

-- Comentários para documentação
COMMENT ON POLICY "Allow users to read own profile" ON user_profiles IS 
'Permite que usuários autenticados leiam apenas seu próprio perfil usando auth.uid()';

COMMENT ON POLICY "Allow users to insert own profile" ON user_profiles IS 
'Permite que usuários autenticados criem apenas seu próprio perfil';

COMMENT ON POLICY "Allow users to update own profile" ON user_profiles IS 
'Permite que usuários autenticados atualizem apenas seu próprio perfil';

COMMENT ON POLICY "Only admins can delete profiles" ON user_profiles IS 
'Apenas administradores podem deletar perfis de usuários';

COMMENT ON POLICY "Admins can manage all profiles" ON user_profiles IS 
'Administradores podem gerenciar todos os perfis (CRUD completo)';