/*
  # Adicionar campo observacao_proxima_acao

  1. Modificações na tabela
    - `proposals`
      - Adicionar coluna `observacao_proxima_acao` (text, opcional)

  2. Funcionalidade
    - Campo para observações sobre a próxima ação da licitação
    - Editável por qualquer usuário
    - Visível diretamente no card da licitação
*/

-- Adicionar coluna para observações da próxima ação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'observacao_proxima_acao'
  ) THEN
    ALTER TABLE proposals ADD COLUMN observacao_proxima_acao text;
  END IF;
END $$;