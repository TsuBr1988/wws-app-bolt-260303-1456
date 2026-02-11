# Como Aplicar a Migration de Margem

## Opção 1: Via Supabase Dashboard (RECOMENDADO)

### Passo 1: Acessar o SQL Editor
1. Acesse: https://supabase.com/dashboard/project/zqqwcjujsiqotlyogyoj/sql
2. Faça login na sua conta Supabase

### Passo 2: Executar o SQL
Cole e execute este SQL:

```sql
-- Add margem_percentual column
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS margem_percentual decimal(5,2);

-- Add comment for documentation
COMMENT ON COLUMN proposals.margem_percentual IS 'Margem percentual da proposta (ex: 15.5 para 15.5%)';
```

### Passo 3: Verificar
Execute para confirmar que a coluna foi adicionada:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proposals'
AND column_name = 'margem_percentual';
```

Deve retornar:
```
column_name         | data_type
--------------------|-----------
margem_percentual   | numeric
```

## Opção 2: Via Script Node.js

```bash
cd src/components/Comercialprivado2
node apply-margem-migration.js
```

## Testando a Funcionalidade

Após aplicar a migration:

1. **Abra o sistema Comercial Privado**
2. **Vá para a aba de Propostas**
3. **No card de uma proposta, você verá:**
   - Título "Margem" abaixo do Valor Mensal
   - Um campo clicável mostrando `-` (se vazio) ou o valor da margem (se preenchido)
4. **Clique no campo de margem**
   - O campo ficará editável
   - Digite a margem (ex: 15.5 para 15.5%)
   - Pressione Enter para salvar
   - O valor será salvo automaticamente no banco

## Estrutura do Campo

- **Layout**: Lado a lado com "Valor Mensal" (grid de 2 colunas)
- **Formato**: Decimal com 2 casas (ex: 15.50)
- **Exibição**: Com símbolo % (ex: "15.50%")
- **Editável**: Sim (exceto em modo read-only)
- **Opcional**: Sim (pode ficar vazio, mostrará "-")

## Exemplo de Uso

1. Proposta com valor mensal de R$ 100.000,00
2. Os campos aparecem lado a lado:
   ```
   VALOR MENSAL     MARGEM
   R$ 100.000,00    -
   ```
3. Clique no campo "Margem" (onde está o "-")
4. Digite: `15.5`
5. Pressione Enter
6. Valor salvo: 15.50%
7. Exibição no card: "15.50%"

## Arquivos Modificados

1. **Migration**:
   - `supabase/migrations/20260205120000_add_margem_to_proposals.sql`

2. **TypeScript Types**:
   - `src/types/index.ts` (interface Proposal)

3. **Componente React**:
   - `src/components/Proposals/ProposalCard.tsx`

## Solução de Problemas

### Erro: "column already exists"
A coluna já foi adicionada. Ignore o erro e prossiga.

### Campo não aparece no card
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça hard reload (Ctrl+F5)
3. Verifique se está no banco correto (Comercial Privado)

### Erro ao salvar
1. Verifique se a migration foi aplicada
2. Verifique o console do navegador (F12)
3. Confirme que está usando as credenciais corretas
