/*
  # Sistema de Incentivo e Reconhecimento - Grupo WWS
  
  Criação do schema inicial completo para o sistema de gestão comercial.
  
  1. Enums
     - user_role (admin, closer, sdr)
     - employee_role (SDR, Closer, Admin)  
     - proposal_status (Proposta, Negociação, Fechado, Perdido)
  
  2. Tabelas Principais
     - user_profiles (perfis de usuário com roles)
     - employees (funcionários SDR/Closer/Admin)
     - proposals (pipeline de vendas/licitações)
     - weekly_performance (métricas semanais)
     - system_configurations (configurações do sistema)
     - challenges (desafios e metas)
     - badges (medalhas e conquistas)
     - employee_badges (relacionamento funcionário-medalha)
     - probability_scores (avaliações de probabilidade)
     - bonus_contributions (histórico do fundo de bonificação)
  
  3. Segurança
     - Habilitação de RLS em todas as tabelas
     - Políticas de acesso por role
*/

-- Criar enums
CREATE TYPE user_role AS ENUM ('admin', 'closer', 'sdr');
CREATE TYPE employee_role AS ENUM ('SDR', 'Closer', 'Admin');
CREATE TYPE proposal_status AS ENUM ('Proposta', 'Negociação', 'Fechado', 'Perdido');

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar text,
  role user_role DEFAULT 'sdr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  avatar text,
  role employee_role NOT NULL DEFAULT 'SDR',
  hire_date date DEFAULT CURRENT_DATE,
  points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de propostas/licitações
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  monthly_value numeric(12,2) NOT NULL DEFAULT 0,
  months integer NOT NULL DEFAULT 1,
  total_value numeric(12,2) NOT NULL DEFAULT 0,
  status proposal_status DEFAULT 'Proposta',
  commission numeric(12,2) DEFAULT 0,
  closer_id uuid REFERENCES employees(id),
  sdr_id uuid REFERENCES employees(id),
  closing_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de performance semanal
CREATE TABLE IF NOT EXISTS weekly_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_ending_date date NOT NULL,
  contatos_ativados integer DEFAULT 0,
  mql integer DEFAULT 0,
  visitas_agendadas integer DEFAULT 0,
  propostas_apresentadas integer DEFAULT 0,
  conexoes_totais integer DEFAULT 0,
  contrato_assinado integer DEFAULT 0,
  pontos_educacao integer DEFAULT 0,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, week_ending_date)
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL UNIQUE,
  config_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de desafios
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  target_type text NOT NULL, -- 'points', 'mql', 'sales', 'visitas_agendadas', 'contratos_assinados', 'pontos_educacao'
  target_value numeric(15,2) NOT NULL,
  reward_amount numeric(12,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  participants_ids uuid[] DEFAULT '{}',
  winner_ids uuid[] DEFAULT '{}',
  status text DEFAULT 'active', -- 'active', 'completed', 'expired'
  completion_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de badges/medalhas
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'Award',
  color text DEFAULT '#3B82F6',
  criteria jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de relacionamento funcionário-badge
CREATE TABLE IF NOT EXISTS employee_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, badge_id)
);

-- Tabela de avaliações de probabilidade
CREATE TABLE IF NOT EXISTS probability_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE UNIQUE,
  economic_buyer integer DEFAULT 0 CHECK (economic_buyer >= 0 AND economic_buyer <= 10),
  metrics integer DEFAULT 0 CHECK (metrics >= 0 AND metrics <= 10),
  decision_criteria integer DEFAULT 0 CHECK (decision_criteria >= 0 AND decision_criteria <= 10),
  decision_process integer DEFAULT 0 CHECK (decision_process >= 0 AND decision_process <= 10),
  identify_pain integer DEFAULT 0 CHECK (identify_pain >= 0 AND identify_pain <= 10),
  champion integer DEFAULT 0 CHECK (champion >= 0 AND champion <= 10),
  competition integer DEFAULT 0 CHECK (competition >= 0 AND competition <= 10),
  engagement integer DEFAULT 0 CHECK (engagement >= 0 AND engagement <= 10),
  total_score integer GENERATED ALWAYS AS (
    economic_buyer + metrics + decision_criteria + decision_process + 
    identify_pain + champion + competition + engagement
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de contribuições para o fundo de bonificação
CREATE TABLE IF NOT EXISTS bonus_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id),
  fixed_amount numeric(10,2) DEFAULT 50.00,
  percentage_amount numeric(12,2) DEFAULT 0,
  total_contribution numeric(12,2) GENERATED ALWAYS AS (fixed_amount + percentage_amount) STORED,
  contribution_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE probability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_contributions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Allow logged-in users to read their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow logged-in users to insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow logged-in users to update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para outras tabelas (leitura universal, edição por role)
CREATE POLICY "Allow authenticated users to read"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to read proposals"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins and closers/sdrs to manage proposals"
  ON proposals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'closer', 'sdr')
    )
  );

CREATE POLICY "Allow authenticated users to read weekly_performance"
  ON weekly_performance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage weekly_performance"
  ON weekly_performance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to read system_configurations"
  ON system_configurations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage system_configurations"
  ON system_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to read challenges"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage challenges"
  ON challenges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to read badges"
  ON badges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage badges"
  ON badges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to read employee_badges"
  ON employee_badges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage employee_badges"
  ON employee_badges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated users to read probability_scores"
  ON probability_scores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins and closers/sdrs to manage probability_scores"
  ON probability_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'closer', 'sdr')
    )
  );

CREATE POLICY "Allow authenticated users to read bonus_contributions"
  ON bonus_contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage bonus_contributions"
  ON bonus_contributions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_weekly_performance_updated_at
  BEFORE UPDATE ON weekly_performance
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON system_configurations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_probability_scores_updated_at
  BEFORE UPDATE ON probability_scores
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_closer ON proposals(closer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_sdr ON proposals(sdr_id);
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date ON proposals(closing_date);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_employee ON weekly_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_week ON weekly_performance(week_ending_date);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_system_configurations_type ON system_configurations(config_type);