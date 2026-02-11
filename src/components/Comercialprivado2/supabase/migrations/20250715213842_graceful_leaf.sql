/*
  # Corrigir travamento na busca de perfil - Políticas RLS

  1. Problema
    - Sistema trava em "Testando permissões RLS..."
    - Falta policy para SELECT na tabela user_profiles
    
  2. Solução
    - Remover todas as policies conflitantes
    - Criar policies simples e funcionais
    - Garantir que usuários autenticados possam ler seus próprios perfis
    
  3. Políticas Criadas
    - SELECT: Usuário pode ler apenas seu próprio perfil
    - INSERT: Usuário pode criar apenas seu próprio perfil
    - UPDATE: Usuário pode atualizar apenas seu próprio perfil
    - DELETE: Apenas admins podem deletar perfis
    - ADMIN: Admins podem gerenciar todos os perfis
*/

-- Remover todas as policies existentes para começar limpo
DROP POLICY IF EXISTS "Allow logged-in users to read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow logged-in users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own data" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON user_profiles;

-- Garantir que RLS está ativo
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Policy para SELECT - CRÍTICA para resolver o travamento
CREATE POLICY "Allow logged-in users to read their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Policy para INSERT - Permitir criação de perfil próprio
CREATE POLICY "Allow logged-in users to insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Policy para UPDATE - Permitir atualização de perfil próprio
CREATE POLICY "Allow logged-in users to update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Policy para DELETE - Apenas admins
CREATE POLICY "Only admins can delete profiles"
ON user_profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- 5. Policy especial para admins gerenciarem todos os perfis
CREATE POLICY "Admins can manage all profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- Criar índices para otimizar as consultas RLS
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_auth 
ON user_profiles (user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_admin 
ON user_profiles (role) 
WHERE role = 'admin';

-- Atualizar estatísticas para otimizar o query planner
ANALYZE user_profiles;

-- Comentários para documentação
COMMENT ON POLICY "Allow logged-in users to read their own profile" ON user_profiles IS 
'Permite que usuários autenticados leiam apenas seu próprio perfil - CRÍTICO para resolver travamento';

COMMENT ON POLICY "Allow logged-in users to insert own profile" ON user_profiles IS 
'Permite que usuários autenticados criem apenas seu próprio perfil';

COMMENT ON POLICY "Allow logged-in users to update own profile" ON user_profiles IS 
'Permite que usuários autenticados atualizem apenas seu próprio perfil';

COMMENT ON POLICY "Only admins can delete profiles" ON user_profiles IS 
'Apenas administradores podem deletar perfis de usuários';

COMMENT ON POLICY "Admins can manage all profiles" ON user_profiles IS 
'Administradores podem gerenciar todos os perfis (CRUD completo)';