/*
  # Adicionar coluna salary_additions à tabela budget_posts

  1. Nova Coluna
    - `budget_posts.salary_additions` (jsonb, nullable)
      - Armazena adicionais salariais do posto em formato JSON
      - Compatível com queries existentes que fazem SELECT incluindo salary_additions
      - Permite armazenar array de objetos com dados dos adicionais

  2. Estrutura JSON Esperada
    - Array de objetos contendo:
      - addition_id: ID do adicional salarial
      - name: Nome do adicional
      - value: Valor/percentual aplicado
      - percentage: Percentual do adicional
      - calculationBase: Base de cálculo ('salario_minimo', 'salario_base', 'valor_fixo')
      - fixedValue: Valor fixo (opcional)

  3. Compatibilidade
    - Coluna nullable para manter compatibilidade com registros existentes
    - Valor padrão '[]' (array vazio) para novos registros
    - Não afeta dados existentes
*/

-- Adicionar coluna salary_additions à tabela budget_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'budget_posts' 
    AND column_name = 'salary_additions'
  ) THEN
    ALTER TABLE public.budget_posts 
    ADD COLUMN salary_additions jsonb DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Coluna salary_additions adicionada à tabela budget_posts';
  ELSE
    RAISE NOTICE 'Coluna salary_additions já existe na tabela budget_posts';
  END IF;
END $$;

-- Comentário para documentação
COMMENT ON COLUMN public.budget_posts.salary_additions IS 
'Adicionais salariais do posto em formato JSON. Array de objetos contendo addition_id, name, value, percentage, calculationBase e fixedValue (opcional)';

-- Índice para melhorar performance de consultas JSON
CREATE INDEX IF NOT EXISTS idx_budget_posts_salary_additions 
ON public.budget_posts USING gin(salary_additions);