/*
  # Schema inicial para Sistema de Incentivo e Reconhecimento

  1. Novas Tabelas
    - `employees` - Funcionários (SDRs, Closers, Admins)
    - `proposals` - Propostas de vendas
    - `probability_scores` - Avaliações de probabilidade das propostas
    - `weekly_performance` - Performance semanal dos funcionários
    - `bonus_contributions` - Contribuições para o fundo de bonificação
    - `campaigns` - Campanhas de incentivo
    - `rewards` - Catálogo de prêmios
    - `recognitions` - Reconhecimentos entre funcionários
    - `badges` - Badges/conquistas dos funcionários
    - `employee_badges` - Relacionamento funcionários-badges

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados

  3. Funcionalidades
    - Triggers para cálculo automático de comissões
    - Funções para atualização de pontuação
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para tipos de funcionários
CREATE TYPE employee_role AS ENUM ('SDR', 'Closer', 'Admin');

-- Enum para status de propostas
CREATE TYPE proposal_status AS ENUM ('Proposta', 'Negociação', 'Fechado', 'Perdido');

-- Enum para status de campanhas
CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'completed');

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar text DEFAULT '',
  department text NOT NULL DEFAULT 'Vendas',
  position text NOT NULL,
  role employee_role NOT NULL DEFAULT 'SDR',
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  admission_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Relacionamento funcionários-badges
CREATE TABLE IF NOT EXISTS employee_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, badge_id)
);

-- Tabela de propostas
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  monthly_value decimal(12,2) NOT NULL,
  months integer NOT NULL,
  total_value decimal(12,2) NOT NULL,
  status proposal_status DEFAULT 'Proposta',
  commission decimal(12,2) DEFAULT 0,
  commission_rate decimal(5,2) DEFAULT 0.4,
  closer_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  sdr_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de avaliações de probabilidade
CREATE TABLE IF NOT EXISTS probability_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  economic_buyer integer CHECK (economic_buyer BETWEEN 1 AND 3) DEFAULT 1,
  metrics integer CHECK (metrics BETWEEN 1 AND 3) DEFAULT 1,
  decision_criteria integer CHECK (decision_criteria BETWEEN 1 AND 3) DEFAULT 1,
  decision_process integer CHECK (decision_process BETWEEN 1 AND 3) DEFAULT 1,
  identify_pain integer CHECK (identify_pain BETWEEN 1 AND 3) DEFAULT 1,
  champion integer CHECK (champion BETWEEN 1 AND 3) DEFAULT 1,
  competition integer CHECK (competition BETWEEN 1 AND 3) DEFAULT 1,
  engagement integer CHECK (engagement BETWEEN 1 AND 3) DEFAULT 1,
  total_score integer GENERATED ALWAYS AS (
    economic_buyer + metrics + decision_criteria + decision_process + 
    identify_pain + champion + competition + engagement
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id)
);

-- Tabela de performance semanal
CREATE TABLE IF NOT EXISTS weekly_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
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

-- Tabela de contribuições para o fundo de bonificação
CREATE TABLE IF NOT EXISTS bonus_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  contract_value decimal(12,2) NOT NULL,
  fixed_amount decimal(8,2) DEFAULT 50.00,
  percentage_amount decimal(12,2) DEFAULT 0,
  total_contribution decimal(12,2) DEFAULT 0,
  contribution_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_points integer DEFAULT 0,
  participants integer DEFAULT 0,
  status campaign_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de prêmios
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL,
  category text NOT NULL,
  image text DEFAULT '',
  stock integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de reconhecimentos
CREATE TABLE IF NOT EXISTS recognitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  to_employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  message text NOT NULL,
  points integer DEFAULT 50,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE probability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Authenticated users can read employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage employee_badges"
  ON employee_badges FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage proposals"
  ON proposals FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage probability_scores"
  ON probability_scores FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage weekly_performance"
  ON weekly_performance FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read bonus_contributions"
  ON bonus_contributions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage recognitions"
  ON recognitions FOR ALL
  TO authenticated
  USING (true);

-- Função para calcular comissão automaticamente
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular taxa de comissão baseada no valor mensal
  IF NEW.monthly_value >= 100000 THEN
    NEW.commission_rate := 1.2;
  ELSIF NEW.monthly_value >= 50000 THEN
    NEW.commission_rate := 0.8;
  ELSE
    NEW.commission_rate := 0.4;
  END IF;
  
  -- Calcular valor total e comissão
  NEW.total_value := NEW.monthly_value * NEW.months;
  NEW.commission := (NEW.total_value * NEW.commission_rate) / 100;
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular comissão automaticamente
CREATE TRIGGER calculate_commission_trigger
  BEFORE INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission();

-- Função para calcular pontos semanais
CREATE OR REPLACE FUNCTION calculate_weekly_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_points := 
    (NEW.tarefas * 1) +
    (NEW.propostas_apresentadas * 50) +
    (NEW.conexoes * 1) +
    (NEW.contrato_assinado * 50) +
    (NEW.contatos_ativados * 1) +
    (NEW.mql * 5) +
    (NEW.visitas_agendadas * 10) +
    (NEW.conexoes_totais * 1);
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular pontos semanais
CREATE TRIGGER calculate_weekly_points_trigger
  BEFORE INSERT OR UPDATE ON weekly_performance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_weekly_points();

-- Função para criar contribuição do fundo quando proposta é fechada
CREATE OR REPLACE FUNCTION create_bonus_contribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a proposta foi fechada (status mudou para 'Fechado')
  IF NEW.status = 'Fechado' AND (OLD.status IS NULL OR OLD.status != 'Fechado') THEN
    INSERT INTO bonus_contributions (
      proposal_id,
      client_name,
      contract_value,
      fixed_amount,
      percentage_amount,
      total_contribution
    ) VALUES (
      NEW.id,
      NEW.client,
      NEW.total_value,
      50.00,
      NEW.total_value * 0.0001, -- 0.01%
      50.00 + (NEW.total_value * 0.0001)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar contribuição do fundo
CREATE TRIGGER create_bonus_contribution_trigger
  AFTER INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_bonus_contribution();

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_probability_scores_updated_at
  BEFORE UPDATE ON probability_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();