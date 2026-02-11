/*
  # Módulo de Prospecção - Tabelas Base

  1. Novas Tabelas
    - `prospection_users` - Usuários de prospecção
    - `prospection_weekly` - Dados semanais de prospecção
    - `prospection_ingest_images` - Ingestão via OCR de imagens do Reev

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para authenticated users

  3. Índices e Constraints
    - Unique constraint em (user_id, week_start) para weekly
    - Índices para performance de queries
*/

-- Enum para tipos de imagem OCR
CREATE TYPE prospection_image_kind AS ENUM ('conexoes', 'perfil', 'metas');
CREATE TYPE prospection_status AS ENUM ('uploaded', 'parsed', 'confirmed');

-- Tabela de usuários de prospecção
CREATE TABLE IF NOT EXISTS prospection_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de dados semanais de prospecção
CREATE TABLE IF NOT EXISTS prospection_weekly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES prospection_users(id) ON DELETE CASCADE,
  week_start date NOT NULL, -- Segunda-feira da semana (ISO)
  tag text,
  
  -- Métricas de Email
  emails_sent integer DEFAULT 0,
  emails_replied integer DEFAULT 0,
  
  -- Métricas de Telefone
  calls_made integer DEFAULT 0,
  calls_connected integer DEFAULT 0,
  
  -- Métricas de WhatsApp
  whatsapp_sent integer DEFAULT 0,
  whatsapp_connected integer DEFAULT 0,
  
  -- Métricas de LinkedIn
  linkedin_msgs integer DEFAULT 0,
  linkedin_connected integer DEFAULT 0,
  
  -- Métricas de Reuniões
  meetings_scheduled integer DEFAULT 0,
  meetings_held integer DEFAULT 0,
  
  -- Outras métricas
  positive_connections integer DEFAULT 0,
  disqualifications integer DEFAULT 0,
  new_contacts integer DEFAULT 0,
  unique_contacts_activated integer DEFAULT 0,
  unique_contacts_active integer DEFAULT 0,
  
  -- Métricas de qualificação
  mql integer DEFAULT 0,
  sql integer DEFAULT 0,
  new_clients integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint único para evitar duplicatas
  UNIQUE(user_id, week_start)
);

-- Tabela de ingestão de imagens via OCR
CREATE TABLE IF NOT EXISTS prospection_ingest_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES prospection_users(id) ON DELETE CASCADE,
  kind prospection_image_kind NOT NULL,
  period_start date,
  period_end date,
  week_start date, -- Derivada da period_start
  image_url text,
  ocr_raw text,
  parsed_payload jsonb,
  status prospection_status DEFAULT 'uploaded',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE prospection_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospection_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospection_ingest_images ENABLE ROW LEVEL SECURITY;

-- Políticas para authenticated users
CREATE POLICY "Users can read prospection_users"
  ON prospection_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert prospection_users"
  ON prospection_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update prospection_users"
  ON prospection_users
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete prospection_users"
  ON prospection_users
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read prospection_weekly"
  ON prospection_weekly
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert prospection_weekly"
  ON prospection_weekly
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update prospection_weekly"
  ON prospection_weekly
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete prospection_weekly"
  ON prospection_weekly
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can read prospection_ingest_images"
  ON prospection_ingest_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert prospection_ingest_images"
  ON prospection_ingest_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update prospection_ingest_images"
  ON prospection_ingest_images
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete prospection_ingest_images"
  ON prospection_ingest_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prospection_weekly_user_id ON prospection_weekly(user_id);
CREATE INDEX IF NOT EXISTS idx_prospection_weekly_week_start ON prospection_weekly(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_prospection_weekly_tag ON prospection_weekly(tag);
CREATE INDEX IF NOT EXISTS idx_prospection_ingest_images_user_id ON prospection_ingest_images(user_id);
CREATE INDEX IF NOT EXISTS idx_prospection_ingest_images_week_start ON prospection_ingest_images(week_start);
CREATE INDEX IF NOT EXISTS idx_prospection_ingest_images_kind ON prospection_ingest_images(kind);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_prospection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospection_users_updated_at
  BEFORE UPDATE ON prospection_users
  FOR EACH ROW EXECUTE FUNCTION update_prospection_updated_at();

CREATE TRIGGER update_prospection_weekly_updated_at
  BEFORE UPDATE ON prospection_weekly
  FOR EACH ROW EXECUTE FUNCTION update_prospection_updated_at();

CREATE TRIGGER update_prospection_ingest_images_updated_at
  BEFORE UPDATE ON prospection_ingest_images
  FOR EACH ROW EXECUTE FUNCTION update_prospection_updated_at();