/*
  # Adicionar campo para controlar se licitação gera comissão e conta para meta

  1. Alterações
    - Adiciona coluna `nao_gera_comissao` na tabela `proposals`
      - Tipo: boolean
      - Default: false (gera comissão normalmente)
      - NOT NULL
    
  2. Descrição
    - Campo permite marcar licitações que não devem gerar comissão
    - Licitações marcadas não contam para meta comercial
    - Licitações marcadas aparecem em todos os controles mas não contribuem para totais
    - Útil para contratos especiais, licitações de teste, etc.

  3. Segurança
    - Campo editável apenas por usuários autenticados
    - RLS existente já cobre este campo
*/

-- Adicionar campo nao_gera_comissao na tabela proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'nao_gera_comissao'
  ) THEN
    ALTER TABLE proposals ADD COLUMN nao_gera_comissao boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Adicionar comentário explicativo
COMMENT ON COLUMN proposals.nao_gera_comissao IS 'Indica se esta licitação NÃO deve gerar comissão nem contar para meta comercial. Útil para contratos especiais que devem aparecer nos controles mas não nos totais.';