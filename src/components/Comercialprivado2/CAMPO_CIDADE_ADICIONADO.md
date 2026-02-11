# Campo Cidade Adicionado às Propostas

## Resumo

Adicionado campo **Cidade** aos cards de propostas, posicionado ao lado da **Margem** e **Valor Mensal**.

---

## Estrutura do Campo

- **Layout**: 3 colunas (Valor Mensal | Margem | Cidade)
- **Formato**: Texto livre (ex: "São Paulo", "Rio de Janeiro")
- **Editável**: Sim (exceto em modo read-only)
- **Opcional**: Sim (pode ficar vazio, mostrará "-")
- **Cor**: Roxo (text-purple-700)

---

## Como Usar

### Visualização no Card:

```
┌────────────────────────────────────────────────────┐
│ CLIENTE                                            │
│ Atlas Copco do Brasil                              │
│                                                    │
│ ──────────────────────────────────────────────────│
│                                                    │
│ VALOR MENSAL    MARGEM         CIDADE             │
│ R$ 65.454,54    15.50%         São Paulo          │
└────────────────────────────────────────────────────┘
```

### Para Editar a Cidade:

1. **Clique no campo da cidade** (onde está o valor ou "-")
2. Digite o nome da cidade (ex: "São Paulo")
3. **Pressione Enter** para salvar ou **ESC** para cancelar
4. O valor será salvo automaticamente no banco de dados

---

## Arquivos Modificados

### 1. **Migration SQL**
   - **Arquivo**: `supabase/migrations/20260205130000_add_cidade_to_proposals.sql`
   - **Ação**: Adiciona coluna `cidade` (text) na tabela `proposals`

### 2. **Script de Aplicação**
   - **Arquivo**: `apply-cidade-migration.js`
   - **Ação**: Script Node.js para aplicar a migration

### 3. **Tipo TypeScript**
   - **Arquivo**: `src/types/index.ts`
   - **Alteração**: Adicionado `cidade?: string` na interface `Proposal`

### 4. **ProposalCard**
   - **Arquivo**: `src/components/Proposals/ProposalCard.tsx`
   - **Alterações**:
     - Estados: `editingCidade`, `tempCidade`
     - Funções: `handleCidadeEdit()`, `handleCidadeSave()`, `handleCidadeCancel()`
     - UI: Campo editável com validação inline

### 5. **Proposals.tsx**
   - **Arquivo**: `src/components/Proposals/Proposals.tsx`
   - **Alterações**:
     - Query SELECT: Adicionado `cidade` ao select
     - Transform: Mapeamento `cidade: p.cidade || undefined`

---

## Aplicar Migration Manual

⚠️ **IMPORTANTE**: A migration precisa ser aplicada manualmente no banco de dados.

### Passos:

1. Acesse o **Supabase SQL Editor**:
   https://supabase.com/dashboard/project/zqqwcjujsiqotlyogyoj/sql

2. Execute este SQL:

```sql
-- Adicionar coluna cidade
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS cidade text;
```

3. Clique em **"Run"**

4. Verifique se a coluna foi criada:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proposals'
  AND column_name = 'cidade';
```

---

## Testando a Funcionalidade

### 1. Após aplicar a migration:

```bash
# Reiniciar o servidor (se necessário)
npm run dev
```

### 2. Teste no navegador:

1. Abra uma proposta
2. Veja os 3 campos lado a lado: **Valor Mensal | Margem | Cidade**
3. Clique no campo "Cidade"
4. Digite: "São Paulo"
5. Pressione Enter
6. Verifique que o valor foi salvo
7. Recarregue a página
8. O valor deve permanecer visível

---

## Layout Final

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTE              DATA        STATUS       CLOSER     SDR    │
│  Atlas Copco          04/02/2026  Proposta     Eduardo    M.     │
│                                                                   │
│  VALOR MENSAL         MARGEM          CIDADE         ← 3 CAMPOS! │
│  R$ 65.454,54         15.50%         São Paulo                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Dados

### Banco de Dados:
```sql
CREATE TABLE proposals (
  ...
  margem_percentual decimal(5,2),
  cidade text,                      -- ← NOVO CAMPO
  ...
);
```

### TypeScript:
```typescript
interface Proposal {
  ...
  margemPercentual?: number;
  cidade?: string;                  // ← NOVO CAMPO
  ...
}
```

---

## Notas Importantes

1. **Campo Opcional**: Pode ser deixado vazio (exibirá "-")
2. **Texto Livre**: Aceita qualquer texto
3. **Salvamento Automático**: Salva ao pressionar Enter
4. **Cancelamento**: Pressione ESC para cancelar a edição
5. **Read-Only**: Não editável em modo somente leitura
6. **Persistência**: Valor salvo no banco e carregado automaticamente

---

## Conclusão

O campo **Cidade** foi adicionado com sucesso ao lado dos campos **Valor Mensal** e **Margem**, permitindo que os usuários registrem a cidade relacionada a cada proposta de forma rápida e intuitiva!
