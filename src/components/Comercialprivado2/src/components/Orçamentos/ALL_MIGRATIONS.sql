-- ========================================
-- Migration: 20260105161325_create_budgets_system.sql
-- ========================================

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

-- ========================================
-- Migration: 20260105163040_update_budgets_add_client_info.sql
-- ========================================

/*
  # Atualizar Sistema de Orçamentos - Informações do Cliente

  1. Alterações na Tabela `budgets`
    - `budget_number` (text) - Número sequencial no formato Ano-XXX
    - `client_name` (text) - Nome do cliente
    - `description` (text) - Descrição breve do orçamento
    - `status` (text) - Status do orçamento (open, closed)
    - `year` (integer) - Ano do orçamento
    - `sequence_number` (integer) - Número sequencial

  2. Função para gerar próximo número de orçamento
    - Cria função PL/pgSQL para gerar número sequencial automaticamente

  3. Índices para melhor performance
    - Índice em budget_number
    - Índice em status
*/

-- Adicionar novas colunas na tabela budgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'budget_number'
  ) THEN
    ALTER TABLE budgets ADD COLUMN budget_number text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE budgets ADD COLUMN client_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'description'
  ) THEN
    ALTER TABLE budgets ADD COLUMN description text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'status'
  ) THEN
    ALTER TABLE budgets ADD COLUMN status text DEFAULT 'open';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'year'
  ) THEN
    ALTER TABLE budgets ADD COLUMN year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'sequence_number'
  ) THEN
    ALTER TABLE budgets ADD COLUMN sequence_number integer;
  END IF;
END $$;

-- Criar função para gerar próximo número de orçamento
CREATE OR REPLACE FUNCTION get_next_budget_number(p_year integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_sequence integer;
  v_budget_number text;
BEGIN
  -- Buscar o próximo número sequencial para o ano
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_sequence
  FROM budgets
  WHERE year = p_year;

  -- Formatar como Ano-XXX
  v_budget_number := p_year || '-' || LPAD(v_sequence::text, 3, '0');

  RETURN v_budget_number;
END;
$$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_budget_number ON budgets(budget_number);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(year);


-- ========================================
-- Migration: 20260105170107_create_cities_table.sql
-- ========================================

/*
  # Tabela de Cidades e Taxas de ISSQN

  1. Nova Tabela
    - `cities` (cidades)
      - `id` (uuid, primary key)
      - `name` (text) - Nome da cidade
      - `iss_rate` (numeric) - Taxa de ISSQN (%)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Dados Iniciais
    - Inserir cidades padrão com suas taxas de ISSQN

  3. Segurança
    - Habilitar RLS na tabela
    - Políticas para permitir operações públicas
*/

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iss_rate numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on cities"
  ON cities
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

INSERT INTO cities (name, iss_rate) VALUES
  ('AMERICANA', 3.0),
  ('ÁGUAS DE SANTA BÁRBARA', 2.0),
  ('CAMPINAS', 5.0),
  ('SÃO PAULO', 5.0),
  ('VOTORANTIM', 5.0)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- Migration: 20260105174229_create_materials_table.sql
-- ========================================

/*
  # Criar tabela de materiais

  1. Nova Tabela
    - `materials` (materiais)
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `name` (text) - Nome do material
      - `brand` (text) - Marca
      - `quantity` (numeric) - Quantidade
      - `unit_value` (numeric) - Valor unitário
      - `total_value` (numeric) - Valor total
      - `amortization` (integer) - Amortização em meses
      - `monthly_value` (numeric) - Valor mensal calculado (total / amortização)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para todos (enquanto não há autenticação)
*/

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text DEFAULT '',
  quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  total_value numeric(10,2) DEFAULT 0,
  amortization integer DEFAULT 12,
  monthly_value numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on materials"
  ON materials
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_materials_budget_id ON materials(budget_id);


-- ========================================
-- Migration: 20260105184947_create_equipments_table.sql
-- ========================================

/*
  # Criar tabela de equipamentos

  1. Nova Tabela
    - `equipments` (equipamentos)
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `name` (text) - Nome do equipamento
      - `brand` (text) - Marca
      - `quantity` (numeric) - Quantidade
      - `unit_value` (numeric) - Valor unitário
      - `total_value` (numeric) - Valor total
      - `amortization` (integer) - Amortização em meses
      - `monthly_value` (numeric) - Valor mensal calculado (total / amortização)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para todos (enquanto não há autenticação)
*/

CREATE TABLE IF NOT EXISTS equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text DEFAULT '',
  quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  total_value numeric(10,2) DEFAULT 0,
  amortization integer DEFAULT 12,
  monthly_value numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on equipments"
  ON equipments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_equipments_budget_id ON equipments(budget_id);


-- ========================================
-- Migration: 20260105190545_create_uniforms_table.sql
-- ========================================

/*
  # Create uniforms table

  1. New Tables
    - `uniforms`
      - `id` (uuid, primary key) - Unique identifier for the uniform
      - `budget_id` (uuid, foreign key) - Reference to the budget
      - `name` (text) - Name of the uniform
      - `brand` (text) - Brand of the uniform
      - `quantity` (numeric) - Quantity of uniforms
      - `unit_value` (numeric) - Unit price of the uniform
      - `total_value` (numeric) - Total value (quantity × unit_value)
      - `amortization` (integer) - Amortization period in months
      - `monthly_value` (numeric) - Monthly amortized value
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `uniforms` table
    - Permissive policy for all operations (until authentication is added)

  3. Important Notes
    - This table follows the same structure as materials and equipments tables
    - All monetary values are stored with 2 decimal precision
    - Foreign key constraint ensures data integrity with budgets table
*/

CREATE TABLE IF NOT EXISTS uniforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text DEFAULT '',
  quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  total_value numeric(10,2) DEFAULT 0,
  amortization integer DEFAULT 12,
  monthly_value numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE uniforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on uniforms"
  ON uniforms
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_uniforms_budget_id ON uniforms(budget_id);


-- ========================================
-- Migration: 20260106000000_create_budget_calculations_table.sql
-- ========================================

/*
  # Tabela de Cálculos de Orçamentos

  1. Nova Tabela
    - `budget_calculations` (resultados dos cálculos)
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `function_data` (jsonb) - Dados completos dos cálculos por função
      - `total_bdi` (numeric) - Taxa BDI calculada
      - `total_contract` (numeric) - Valor total do contrato
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para acesso público (preparado para autenticação futura)

  3. Notas
    - Cada orçamento tem apenas um registro de cálculo (relacionamento 1:1)
    - Quando regerar a planilha, o registro é atualizado (UPSERT)
    - Os dados são salvos automaticamente ao clicar em "GERAR PLANILHA COMPLETA"
*/

-- Tabela de cálculos de orçamentos
CREATE TABLE IF NOT EXISTS budget_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL UNIQUE REFERENCES budgets(id) ON DELETE CASCADE,
  function_data jsonb NOT NULL,
  total_bdi numeric(10,4) NOT NULL,
  total_contract numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budget_calculations ENABLE ROW LEVEL SECURITY;

-- Política permissiva para todos (enquanto não há autenticação)
CREATE POLICY "Allow all operations on budget_calculations"
  ON budget_calculations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_budget_calculations_budget_id ON budget_calculations(budget_id);


-- ========================================
-- Migration: 20260106182000_add_margem_fields_to_budgets.sql
-- ========================================

/*
  # Adicionar Campos de Margem aos Orçamentos

  1. Alterações
    - Adiciona `margem_lucro` (numeric) - Margem de lucro em porcentagem (padrão 10%)
    - Adiciona `margem_adm` (numeric) - Margem administrativa em porcentagem (padrão 5%)

  2. Notas
    - Os valores padrão são 10% para lucro e 5% para administrativa
    - Campos permitem valores decimais para precisão
*/

-- Adicionar campos de margem à tabela budgets
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS margem_lucro numeric(5,2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS margem_adm numeric(5,2) DEFAULT 5.0;

-- Atualizar orçamentos existentes com os valores padrão
UPDATE budgets
SET margem_lucro = 10.0, margem_adm = 5.0
WHERE margem_lucro IS NULL OR margem_adm IS NULL;


-- ========================================
-- Migration: 20260107200000_create_differentiated_benefits_table.sql
-- ========================================

/*
  # Create Differentiated Benefits Table

  1. New Tables
    - `differentiated_benefits`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `function_id` (uuid, references budget_functions)
      - `name` (text) - Nome do benefício
      - `monthly_value` (numeric) - Valor mensal do benefício
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS differentiated_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL,
  function_id text NOT NULL,
  name text NOT NULL,
  monthly_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE differentiated_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON differentiated_benefits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON differentiated_benefits
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- ========================================
-- Migration: 20260108190000_add_vt_value_city_iss_to_budget_functions.sql
-- ========================================

/*
  # Adicionar campos específicos por função

  1. Modificações
    - Adiciona `vt_value` em `budget_functions` - Valor de VT específico por função
    - Adiciona `city` em `budget_functions` - Cidade específica por função
    - Adiciona `iss_rate` em `budget_functions` - Taxa de ISS específica por função

  2. Notas
    - Esses campos permitem que cada função tenha configurações individuais
    - Se não especificado, usa os valores padrão do orçamento
*/

-- Adicionar campos específicos à tabela budget_functions
ALTER TABLE budget_functions
ADD COLUMN IF NOT EXISTS vt_value numeric(10,2) DEFAULT 5.50,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS iss_rate numeric(5,2);


-- ========================================
-- Migration: 20260109000000_create_capex_table.sql
-- ========================================

/*
  # Criar tabela de Capex (Capital Expenditure)

  1. Nova Tabela
    - `capex` - Investimentos de capital para os postos
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `name` (text) - Nome do item de capex
      - `brand` (text) - Marca/Fornecedor
      - `quantity` (integer) - Quantidade
      - `unit_value` (numeric) - Valor unitário
      - `total_value` (numeric) - Valor total
      - `amortization` (integer) - Meses de amortização
      - `monthly_value` (numeric) - Valor mensal após amortização
      - `allocated_functions` (text[]) - IDs das funções alocadas
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS
    - Política permissiva para todos (preparado para autenticação futura)
*/

-- Criar tabela de capex
CREATE TABLE IF NOT EXISTS capex (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  quantity integer DEFAULT 1,
  unit_value numeric(10,2) NOT NULL,
  total_value numeric(10,2) NOT NULL,
  amortization integer DEFAULT 12,
  monthly_value numeric(10,2) NOT NULL,
  allocated_functions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE capex ENABLE ROW LEVEL SECURITY;

-- Política permissiva para todos
CREATE POLICY "Allow all operations on capex"
  ON capex
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_capex_budget_id ON capex(budget_id);


