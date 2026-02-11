/*
  # Sistema de Modelos de Comissionamento

  1. Novas Tabelas
    - `commission_models`
      - Armazena os diferentes modelos de comissionamento
      - Campos: id, name, description, type, active
    
    - `commission_model_rules`
      - Armazena as regras de cada modelo (parcelas, percentuais, prazos)
      - Campos: model_id, rule_type, percentage, months_after_signature, etc
    
    - `employee_commission_models`
      - Associação entre colaboradores e modelos de comissão
      - Campos: employee_id, model_id, start_date, end_date, active
    
    - `commission_payments`
      - Pagamentos de comissão gerados automaticamente
      - Campos: contract_id, employee_id, amounts, dates, status
    
    - `commission_adjustments`
      - Histórico de ajustes em pagamentos de comissão
      - Campos: payment_id, previous_amount, new_amount, reason
  
  2. Enums
    - commission_model_type: tipos de modelo
    - commission_rule_type: tipos de regra
    - commission_payment_status: status de pagamento
  
  3. Security
    - RLS desabilitado para todas as tabelas (conforme padrão do projeto)
*/

-- Criar tipos enum
DO $$ BEGIN
  CREATE TYPE commission_model_type AS ENUM ('monthly_progressive', 'biannual_split', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_rule_type AS ENUM ('first_payment', 'recurring_payment', 'split_payment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_payment_status AS ENUM ('pending', 'scheduled', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela: commission_models
CREATE TABLE IF NOT EXISTS commission_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type commission_model_type NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: commission_model_rules
CREATE TABLE IF NOT EXISTS commission_model_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES commission_models(id) ON DELETE CASCADE NOT NULL,
  rule_type commission_rule_type NOT NULL,
  percentage numeric(5,2) NOT NULL,
  months_after_signature integer NOT NULL DEFAULT 0,
  payment_count integer DEFAULT 1,
  split_percentage numeric(5,2),
  annual_multiplier boolean DEFAULT false,
  order_sequence integer DEFAULT 0,
  allow_adjustments boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela: employee_commission_models
CREATE TABLE IF NOT EXISTS employee_commission_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id integer NOT NULL,
  model_id uuid REFERENCES commission_models(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: commission_payments
CREATE TABLE IF NOT EXISTS commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  employee_id integer NOT NULL,
  model_id uuid REFERENCES commission_models(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES commission_model_rules(id) ON DELETE SET NULL,
  contract_value numeric(15,2) NOT NULL,
  original_amount numeric(15,2) NOT NULL,
  adjusted_amount numeric(15,2) NOT NULL,
  paid_amount numeric(15,2),
  due_date date NOT NULL,
  payment_date date,
  status commission_payment_status DEFAULT 'pending',
  payment_sequence integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: commission_adjustments
CREATE TABLE IF NOT EXISTS commission_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES commission_payments(id) ON DELETE CASCADE NOT NULL,
  previous_amount numeric(15,2) NOT NULL,
  new_amount numeric(15,2) NOT NULL,
  adjustment_reason text NOT NULL,
  adjusted_by text,
  adjusted_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_commission_model_rules_model_id ON commission_model_rules(model_id);
CREATE INDEX IF NOT EXISTS idx_employee_commission_models_employee_id ON employee_commission_models(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_commission_models_model_id ON employee_commission_models(model_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_contract_id ON commission_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_employee_id ON commission_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_due_date ON commission_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);
CREATE INDEX IF NOT EXISTS idx_commission_adjustments_payment_id ON commission_adjustments(payment_id);

-- Desabilitar RLS (conforme padrão do projeto)
ALTER TABLE commission_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE commission_model_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_commission_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE commission_adjustments DISABLE ROW LEVEL SECURITY;

-- Inserir modelos padrão
INSERT INTO commission_models (id, name, description, type, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Modelo 1 - Progressivo Mensal', 'Vendedor recebe 1,5% do valor da primeira mensalidade 2 meses após assinatura, seguido de 0,5% por 11 meses', 'monthly_progressive', true),
  ('00000000-0000-0000-0000-000000000002', 'Modelo 2 - Bianual Split', 'Comissão de 0,8% do valor anual paga em 2 parcelas: 60% após 90 dias e 40% após 12 meses (ajustável)', 'biannual_split', true)
ON CONFLICT (id) DO NOTHING;

-- Regras do Modelo 1
INSERT INTO commission_model_rules (model_id, rule_type, percentage, months_after_signature, payment_count, split_percentage, annual_multiplier, order_sequence, allow_adjustments) VALUES
  ('00000000-0000-0000-0000-000000000001', 'first_payment', 1.50, 2, 1, 100, false, 1, false),
  ('00000000-0000-0000-0000-000000000001', 'recurring_payment', 0.50, 3, 11, null, false, 2, false)
ON CONFLICT DO NOTHING;

-- Regras do Modelo 2
INSERT INTO commission_model_rules (model_id, rule_type, percentage, months_after_signature, payment_count, split_percentage, annual_multiplier, order_sequence, allow_adjustments) VALUES
  ('00000000-0000-0000-0000-000000000002', 'split_payment', 0.80, 3, 1, 60, true, 1, false),
  ('00000000-0000-0000-0000-000000000002', 'split_payment', 0.80, 12, 1, 40, true, 2, true)
ON CONFLICT DO NOTHING;