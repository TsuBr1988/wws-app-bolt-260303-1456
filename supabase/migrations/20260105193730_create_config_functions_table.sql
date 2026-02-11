/*
  # Criar tabela de funções de configuração

  1. Nova Tabela
    - `config_functions` (funções configuráveis)
      - `id` (uuid, primary key)
      - `code` (text, unique) - Código da função (ex: PORTEIRO)
      - `name` (text) - Nome completo da função
      - `base_salary` (numeric) - Salário base
      - `is_active` (boolean) - Se a função está ativa
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para todos (enquanto não há autenticação)

  3. Dados Iniciais
    - Inserir funções padrão para facilitar o uso inicial
*/

CREATE TABLE IF NOT EXISTS config_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  base_salary numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE config_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on config_functions"
  ON config_functions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_config_functions_code ON config_functions(code);
CREATE INDEX IF NOT EXISTS idx_config_functions_is_active ON config_functions(is_active);

-- Inserir funções padrão
INSERT INTO config_functions (code, name, base_salary, is_active) VALUES
  ('PORTEIRO', 'Porteiro', 1500.00, true),
  ('AUXILIAR_SERVICOS_GERAIS', 'Auxiliar de Serviços Gerais', 1400.00, true),
  ('ENCARREGADO', 'Encarregado', 2500.00, true),
  ('SUPERVISOR', 'Supervisor', 3500.00, true),
  ('COORDENADOR', 'Coordenador', 4500.00, true)
ON CONFLICT (code) DO NOTHING;