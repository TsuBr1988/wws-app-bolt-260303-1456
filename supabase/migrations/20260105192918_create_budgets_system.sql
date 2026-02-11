/*
  # Sistema de Orçamentos - Schema Inicial

  1. Novas Tabelas
    - `budgets` (orçamentos)
      - `id` (uuid, primary key)
      - `name` (text) - Nome do orçamento
      - `vt_value` (numeric) - Valor do Vale Transporte
      - `iss_rate` (numeric) - Taxa de ISSQN (%)
      - `city` (text) - Cidade
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `budget_functions` (funções do orçamento)
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `function_name` (text) - Nome da função
      - `quantity` (integer) - Quantidade de funcionários
      - `salary` (numeric) - Salário base
      - `scale` (text) - Escala de trabalho
      - `shift_type` (text) - Tipo de horário (diurno/noturno)
      - `periculosity_percent` (numeric) - % Periculosidade
      - `unhealthiness_percent` (numeric) - % Insalubridade
      - `bonus_percent` (numeric) - % Gratificação
      - `night_additional_percent` (numeric) - % Adicional noturno
      - `hours_per_day` (numeric) - Horas por dia
      - `reduced_hour_percent` (numeric) - % Hora reduzida
      - `has_intrajornada` (boolean) - Tem intrajornada?
      - `intrajornada_percent` (numeric) - % Intrajornada
      - `created_at` (timestamptz)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados (preparado para autenticação futura)
*/

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vt_value numeric(10,2) DEFAULT 5.50,
  iss_rate numeric(5,2) DEFAULT 3.0,
  city text DEFAULT 'AMERICANA',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de funções dos orçamentos
CREATE TABLE IF NOT EXISTS budget_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  quantity integer DEFAULT 1,
  salary numeric(10,2) NOT NULL,
  scale text NOT NULL,
  shift_type text DEFAULT 'diurno',
  periculosity_percent numeric(5,2) DEFAULT 0,
  unhealthiness_percent numeric(5,2) DEFAULT 0,
  bonus_percent numeric(5,2) DEFAULT 0,
  night_additional_percent numeric(5,2) DEFAULT 20,
  hours_per_day numeric(5,2) DEFAULT 0,
  reduced_hour_percent numeric(10,4) DEFAULT 14.2857,
  has_intrajornada boolean DEFAULT false,
  intrajornada_percent numeric(10,4) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_functions ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para todos (enquanto não há autenticação)
-- Quando adicionar auth, estas políticas devem ser atualizadas
CREATE POLICY "Allow all operations on budgets"
  ON budgets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on budget_functions"
  ON budget_functions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_budget_functions_budget_id ON budget_functions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at DESC);