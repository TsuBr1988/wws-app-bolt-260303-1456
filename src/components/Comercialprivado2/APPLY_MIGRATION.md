# IMPORTANTE: Migration para Integração Orçamentos → Propostas

## Execute este SQL no banco de dados do Comercial Privado 2

Você precisa executar este SQL no painel do Supabase do projeto **Comercial Privado 2**.

### Como executar:

1. Acesse o dashboard do Supabase do projeto Comercial Privado 2
2. Vá em "SQL Editor" no menu lateral
3. Cole o SQL abaixo e execute

### SQL a executar:

\`\`\`sql
-- Adiciona coluna budget_id à tabela proposals
DO $$
BEGIN
  -- Verifica se a coluna já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'budget_id'
  ) THEN
    -- Adiciona a coluna
    ALTER TABLE proposals ADD COLUMN budget_id text;

    -- Cria índice para melhorar performance
    CREATE INDEX idx_proposals_budget_id ON proposals(budget_id);

    RAISE NOTICE 'Coluna budget_id adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna budget_id já existe na tabela proposals.';
  END IF;
END $$;
\`\`\`

### O que este SQL faz:

- Adiciona a coluna `budget_id` (texto) na tabela `proposals`
- Cria um índice para melhorar a performance de consultas
- É seguro executar múltiplas vezes (verifica se já existe antes)

### Após executar:

1. Recarregue a página do sistema (F5)
2. Tente clicar no botão "Gerar Proposta" novamente
3. O modal de Nova Proposta deve abrir com os dados pré-preenchidos do orçamento
