/*
  # Criar tabela budget_cities com dados das cidades paulistas

  1. Nova Tabela
    - `budget_cities`
      - `id` (uuid, primary key)
      - `name` (text, nome da cidade)
      - `iss_rate` (numeric, alíquota de ISS em %)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())

  2. Dados Iniciais
    - 10 cidades paulistas conforme solicitado
    - ISS rates de 2% a 5%

  3. Segurança
    - Enable RLS na tabela budget_cities
    - Políticas para usuários autenticados

  4. Compatibilidade
    - Estrutura alinhada com AddPositionModal.tsx
    - Campo name (não city_name)
    - Campo iss_rate para cálculo do BDI
*/

-- Criar tabela budget_cities
CREATE TABLE IF NOT EXISTS public.budget_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iss_rate numeric(5,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.budget_cities ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso
CREATE POLICY "Users can view budget cities"
  ON public.budget_cities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget cities"
  ON public.budget_cities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget cities"
  ON public.budget_cities
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget cities"
  ON public.budget_cities
  FOR DELETE
  TO authenticated
  USING (true);

-- Inserir dados das cidades paulistas
INSERT INTO public.budget_cities (name, iss_rate, is_active) VALUES
  ('São Paulo', 2.0, true),
  ('Campinas', 5.0, true),
  ('Ribeirão Preto', 2.0, true),
  ('Sorocaba', 5.0, true),
  ('Piracicaba', 5.0, true),
  ('Barueri', 5.0, true),
  ('Guarulhos', 3.0, true),
  ('Osasco', 5.0, true),
  ('São José dos Campos', 3.0, true),
  ('Taubaté', 5.0, true)
ON CONFLICT (name) 
DO UPDATE SET 
  iss_rate = EXCLUDED.iss_rate,
  is_active = EXCLUDED.is_active;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_cities_name 
  ON public.budget_cities(name);

CREATE INDEX IF NOT EXISTS idx_budget_cities_active 
  ON public.budget_cities(is_active) 
  WHERE is_active = true;

-- Comentários para documentação
COMMENT ON TABLE public.budget_cities IS 'Cidades com alíquotas de ISS para cálculo em orçamentos';
COMMENT ON COLUMN public.budget_cities.name IS 'Nome da cidade';
COMMENT ON COLUMN public.budget_cities.iss_rate IS 'Alíquota de ISS em porcentagem (ex: 2.0 para 2%)';
COMMENT ON COLUMN public.budget_cities.is_active IS 'Indica se a cidade está ativa para seleção';

-- Log de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela budget_cities criada com sucesso!';
  RAISE NOTICE '🏙️ 10 cidades inseridas/atualizadas';
  RAISE NOTICE '🔗 Compatível com AddPositionModal.tsx';
  RAISE NOTICE '💼 Pronta para uso no dropdown de cidades';
END $$;