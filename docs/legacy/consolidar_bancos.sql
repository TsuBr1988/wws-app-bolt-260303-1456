/*
  ============================================
  CONSOLIDAÇÃO: Comercial Privado → Dashboard Principal
  ============================================

  PASSO 1: Execute este script no banco do DASHBOARD PRINCIPAL

  Este script cria todas as tabelas do Comercial Privado com prefixo "cp_"
*/

-- ENUMS
DO $$ BEGIN CREATE TYPE cp_employee_role AS ENUM ('SDR', 'Closer', 'Admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cp_proposal_status AS ENUM ('Proposta', 'Negociação', 'Fechado', 'Perdido', 'SQL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cp_campaign_status AS ENUM ('active', 'paused', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cp_challenge_status AS ENUM ('active', 'completed', 'expired'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cp_target_type AS ENUM ('points', 'sales'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cp_commercial_goal_target_type AS ENUM ('sales', 'mg', 'proposals', 'contract_value'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cp_commercial_goal_status AS ENUM ('active', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- TABELAS
CREATE TABLE IF NOT EXISTS cp_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar text DEFAULT '',
  department text NOT NULL DEFAULT 'Vendas',
  position text NOT NULL,
  role cp_employee_role NOT NULL DEFAULT 'SDR',
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  admission_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  monthly_value decimal(12,2) NOT NULL,
  months integer NOT NULL,
  total_value decimal(12,2) NOT NULL,
  status cp_proposal_status DEFAULT 'Proposta',
  commission decimal(12,2) DEFAULT 0,
  commission_rate decimal(5,2) DEFAULT 0.4,
  closer_id uuid REFERENCES cp_employees(id) ON DELETE SET NULL,
  sdr_id uuid REFERENCES cp_employees(id) ON DELETE SET NULL,
  budget_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_probability_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES cp_proposals(id) ON DELETE CASCADE,
  economic_buyer integer CHECK (economic_buyer BETWEEN 1 AND 3) DEFAULT 1,
  metrics integer CHECK (metrics BETWEEN 1 AND 3) DEFAULT 1,
  decision_criteria integer CHECK (decision_criteria BETWEEN 1 AND 3) DEFAULT 1,
  decision_process integer CHECK (decision_process BETWEEN 1 AND 3) DEFAULT 1,
  identify_pain integer CHECK (identify_pain BETWEEN 1 AND 3) DEFAULT 1,
  champion integer CHECK (champion BETWEEN 1 AND 3) DEFAULT 1,
  competition integer CHECK (competition BETWEEN 1 AND 3) DEFAULT 1,
  engagement integer CHECK (engagement BETWEEN 1 AND 3) DEFAULT 1,
  total_score integer GENERATED ALWAYS AS (economic_buyer + metrics + decision_criteria + decision_process + identify_pain + champion + competition + engagement) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id)
);

CREATE TABLE IF NOT EXISTS cp_weekly_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES cp_employees(id) ON DELETE CASCADE,
  week_ending_date date NOT NULL,
  tarefas integer DEFAULT 0,
  propostas_apresentadas integer DEFAULT 0,
  conexoes integer DEFAULT 0,
  contrato_assinado integer DEFAULT 0,
  contatos_ativados integer DEFAULT 0,
  mql integer DEFAULT 0,
  visitas_agendadas integer DEFAULT 0,
  conexoes_totais integer DEFAULT 0,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, week_ending_date)
);

CREATE TABLE IF NOT EXISTS cp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_points integer DEFAULT 0,
  participants integer DEFAULT 0,
  status cp_campaign_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reward_amount text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_type cp_target_type NOT NULL,
  target_value numeric NOT NULL,
  status cp_challenge_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  participants integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cp_marketing_instagram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  impressions integer DEFAULT 0,
  profile_visits integer DEFAULT 0,
  accounts_reached integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  posts integer DEFAULT 0,
  reels integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_marketing_linkedin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  impressions integer DEFAULT 0,
  profile_visits integer DEFAULT 0,
  reactions integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  posts integer DEFAULT 0,
  followers_gained integer DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_commercial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  department text NOT NULL,
  target_type cp_commercial_goal_target_type NOT NULL,
  target_value numeric(12,2) NOT NULL,
  meta_mensal_vendas numeric(12,2) DEFAULT 0,
  meta_mensal_mg numeric(12,2) DEFAULT 0,
  meta_mensal_numero_propostas integer DEFAULT 0,
  meta_mensal_valor_contratos numeric(12,2) DEFAULT 0,
  monthly_contract_value numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status cp_commercial_goal_status DEFAULT 'active',
  UNIQUE(year, month, department, target_type)
);

CREATE TABLE IF NOT EXISTS cp_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  responsible_id uuid REFERENCES cp_employees(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  participants text[],
  content text NOT NULL,
  created_by_id uuid REFERENCES cp_employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_marketing_planning_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  platform text NOT NULL,
  post_date date NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'planned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_individual_prospection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  week_date date NOT NULL,
  conexoes_realizadas integer DEFAULT 0,
  meta_semanal_conexoes integer DEFAULT 0,
  perfis_visitados integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_name, week_date)
);

-- RLS
ALTER TABLE cp_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_probability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_marketing_instagram ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_marketing_linkedin ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_commercial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_marketing_planning_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_individual_prospection ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Allow all" ON cp_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_probability_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_weekly_performance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_challenges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_marketing_instagram FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_marketing_linkedin FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_commercial_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_meeting_minutes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_marketing_planning_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON cp_individual_prospection FOR ALL TO authenticated USING (true) WITH CHECK (true);
