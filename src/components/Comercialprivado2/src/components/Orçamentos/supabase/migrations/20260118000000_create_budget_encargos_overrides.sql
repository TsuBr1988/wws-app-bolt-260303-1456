/*
  # Criar tabela de encargos customizados por orçamento

  1. Nova Tabela
    - `budget_encargos_overrides`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, referência para budgets) - O orçamento
      - `grupo_code` (text) - Código do grupo de encargos (ex: "GRUPO_A")
      - `encargo_code` (text) - Código único do encargo (ex: "INSS", "FGTS")
      - `encargo_name` (text) - Nome do encargo
      - `custom_rate` (numeric) - Taxa customizada (como decimal, ex: 0.20 para 20%)
      - `notes` (text, opcional) - Observações sobre a customização
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Índices
    - Índice único em (budget_id, encargo_code) para evitar duplicatas

  3. Segurança
    - RLS habilitado
    - Políticas de acesso liberadas (sem autenticação neste projeto)
*/

-- Criar tabela budget_encargos_overrides
CREATE TABLE IF NOT EXISTS budget_encargos_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  grupo_code text NOT NULL,
  encargo_code text NOT NULL,
  encargo_name text NOT NULL,
  custom_rate numeric NOT NULL CHECK (custom_rate >= 0 AND custom_rate <= 1),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS budget_encargos_overrides_budget_encargo_unique
  ON budget_encargos_overrides(budget_id, encargo_code);

-- Criar índice para consultas por budget_id
CREATE INDEX IF NOT EXISTS budget_encargos_overrides_budget_id_idx
  ON budget_encargos_overrides(budget_id);

-- Habilitar RLS
ALTER TABLE budget_encargos_overrides ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (sem autenticação)
CREATE POLICY "Permitir todas operações em budget_encargos_overrides"
  ON budget_encargos_overrides
  FOR ALL
  USING (true)
  WITH CHECK (true);
