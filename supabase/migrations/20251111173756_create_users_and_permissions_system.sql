/*
  # Create Users and Permissions System

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `email` (text, unique, required) - Email/login do usuário
      - `password` (text, required) - Senha do usuário (em produção seria hash)
      - `name` (text) - Nome do usuário
      - `is_admin` (boolean) - Se é administrador
      - `is_active` (boolean) - Se está ativo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Referência ao usuário
      - `page` (text, required) - Nome da página/aba
      - `can_view` (boolean) - Se pode visualizar a página
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_indicator_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Referência ao usuário
      - `page` (text, required) - Nome da página/aba
      - `indicator_name` (text, required) - Nome do indicador
      - `can_view` (boolean) - Se pode visualizar o indicador
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read and write access
  
  3. Initial Data
    - Create admin user: auditoria@grupowws.com.br
  
  4. Important Notes
    - Admin users have full access to all pages and indicators
    - Regular users need explicit permissions to access pages/indicators
    - Passwords should be hashed in production (this is a simplified version)
*/

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text DEFAULT '',
  is_admin boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  page text NOT NULL,
  can_view boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page)
);

-- Create user_indicator_permissions table
CREATE TABLE IF NOT EXISTS user_indicator_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  page text NOT NULL,
  indicator_name text NOT NULL,
  can_view boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page, indicator_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_indicator_permissions_user_id ON user_indicator_permissions(user_id);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_indicator_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_users
CREATE POLICY "Allow public read access to app_users"
  ON app_users FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to app_users"
  ON app_users FOR ALL TO public WITH CHECK (true);

-- Create RLS policies for user_permissions
CREATE POLICY "Allow public read access to user_permissions"
  ON user_permissions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to user_permissions"
  ON user_permissions FOR ALL TO public WITH CHECK (true);

-- Create RLS policies for user_indicator_permissions
CREATE POLICY "Allow public read access to user_indicator_permissions"
  ON user_indicator_permissions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to user_indicator_permissions"
  ON user_indicator_permissions FOR ALL TO public WITH CHECK (true);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_indicator_permissions_updated_at ON user_indicator_permissions;
CREATE TRIGGER update_user_indicator_permissions_updated_at
  BEFORE UPDATE ON user_indicator_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user
INSERT INTO app_users (email, password, name, is_admin, is_active)
VALUES ('auditoria@grupowws.com.br', 'Admin@2024', 'Auditoria', true, true)
ON CONFLICT (email) DO UPDATE SET is_admin = true, is_active = true;