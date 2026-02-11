/*
  # Criar sistema de perfis de usuário

  1. Nova Tabela
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `email` (text)
      - `role` (enum: admin, closer, sdr)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `user_profiles`
    - Políticas para diferentes níveis de acesso
    - Apenas admins podem gerenciar usuários

  3. Função para criar perfil automaticamente
    - Trigger para criar perfil quando usuário é criado
*/

-- Criar enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'closer', 'sdr');

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role user_role DEFAULT 'sdr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Admins can manage all user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'sdr');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Inserir perfil admin padrão (se não existir)
INSERT INTO user_profiles (user_id, email, name, role)
SELECT 
  id,
  email,
  'Administrador',
  'admin'::user_role
FROM auth.users 
WHERE email LIKE '%admin%' 
  AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.users.id)
LIMIT 1;