/*
  # Adicionar campo de funções alocadas aos materiais

  1. Alterações
    - Adicionar coluna `allocated_functions` na tabela `materials`
      - Armazena um array JSON com os IDs das funções que receberão o rateio do material
      - Tipo: jsonb (JSON binário para melhor performance)
      - Padrão: [] (array vazio, significa que será rateado entre todas as funções)

  2. Notas
    - Se o array estiver vazio, o material será rateado entre todas as funções do orçamento
    - Se o array tiver IDs, o material será rateado apenas entre as funções selecionadas
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'allocated_functions'
  ) THEN
    ALTER TABLE materials ADD COLUMN allocated_functions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;