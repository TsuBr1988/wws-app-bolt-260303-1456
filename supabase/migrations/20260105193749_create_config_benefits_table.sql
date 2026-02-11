/*
  # Criar tabela de benefícios de configuração

  1. Nova Tabela
    - `config_benefits` (benefícios configuráveis)
      - `id` (uuid, primary key)
      - `code` (text, unique) - Código do benefício (ex: VT, VA)
      - `name` (text) - Nome completo do benefício
      - `calculation_type` (text) - Tipo de cálculo (fixed, per_day, per_month, formula)
      - `base_value` (numeric) - Valor base
      - `formula` (text) - Fórmula de cálculo (opcional)
      - `is_active` (boolean) - Se o benefício está ativo
      - `order_index` (integer) - Ordem de exibição
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para todos (enquanto não há autenticação)

  3. Dados Iniciais
    - Inserir benefícios padrão comuns
*/

CREATE TABLE IF NOT EXISTS config_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  calculation_type text NOT NULL DEFAULT 'fixed' CHECK (calculation_type IN ('fixed', 'per_day', 'per_month', 'formula')),
  base_value numeric(10,2) DEFAULT 0,
  formula text DEFAULT '',
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE config_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on config_benefits"
  ON config_benefits
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_config_benefits_code ON config_benefits(code);
CREATE INDEX IF NOT EXISTS idx_config_benefits_order_index ON config_benefits(order_index);
CREATE INDEX IF NOT EXISTS idx_config_benefits_is_active ON config_benefits(is_active);

-- Inserir benefícios padrão
INSERT INTO config_benefits (code, name, calculation_type, base_value, formula, is_active, order_index) VALUES
  ('VT', 'Vale Transporte', 'formula', 0, 'vtU * 2 * diasU * q', true, 1),
  ('VA', 'Vale Alimentação', 'per_day', 25.00, '', true, 2),
  ('VR', 'Vale Refeição', 'per_day', 35.00, '', true, 3),
  ('PLANO_SAUDE', 'Plano de Saúde', 'per_month', 150.00, '', true, 4),
  ('PLANO_ODONTO', 'Plano Odontológico', 'per_month', 50.00, '', true, 5),
  ('SEGURO_VIDA', 'Seguro de Vida', 'per_month', 20.00, '', true, 6)
ON CONFLICT (code) DO NOTHING;