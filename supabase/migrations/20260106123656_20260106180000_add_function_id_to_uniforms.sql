/*
  # Adicionar referência de função aos uniformes

  1. Alterações
    - Adicionar coluna `function_id` na tabela `uniforms`
      - Referência para a função (budget_functions) a qual o uniforme pertence
      - Tipo: uuid (foreign key)
      - Obrigatório: sim
      - ON DELETE CASCADE: se a função for deletada, os uniformes também serão

  2. Notas
    - Cada uniforme agora está associado a uma função específica
    - Isso permite gerenciar uniformes separadamente por função
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uniforms' AND column_name = 'function_id'
  ) THEN
    ALTER TABLE uniforms 
      ADD COLUMN function_id uuid NOT NULL REFERENCES budget_functions(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_uniforms_function_id ON uniforms(function_id);
  END IF;
END $$;