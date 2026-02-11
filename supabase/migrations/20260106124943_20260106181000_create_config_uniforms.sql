/*
  # Criar tabela de uniformes padrão configuráveis

  1. Nova Tabela
    - `config_uniforms`
      - `id` (uuid, primary key) - Identificador único
      - `name` (text) - Nome do uniforme
      - `brand` (text) - Marca padrão (opcional)
      - `default_quantity` (numeric) - Quantidade padrão
      - `default_amortization` (integer) - Vida útil padrão em meses
      - `unit_value` (numeric) - Valor unitário
      - `is_active` (boolean) - Se está ativo para seleção
      - `created_at` (timestamptz) - Data de criação

  2. Dados Iniciais
    - Camiseta: 2 unidades, 6 meses, R$ 36,50
    - Calça: 2 unidades, 6 meses, R$ 42,60
    - Sapato: 1 unidade, 12 meses, R$ 52,00

  3. Segurança
    - RLS habilitado
    - Políticas para leitura pública e escrita futura
*/

CREATE TABLE IF NOT EXISTS config_uniforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text DEFAULT '',
  default_quantity numeric(10,2) DEFAULT 1,
  default_amortization integer DEFAULT 12,
  unit_value numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE config_uniforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on config_uniforms"
  ON config_uniforms
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Inserir uniformes padrão
INSERT INTO config_uniforms (name, default_quantity, default_amortization, unit_value)
VALUES 
  ('Camiseta', 2, 6, 36.50),
  ('Calça', 2, 6, 42.60),
  ('Sapato', 1, 12, 52.00)
ON CONFLICT DO NOTHING;