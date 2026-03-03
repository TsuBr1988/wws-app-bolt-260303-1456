# Instruções para Adicionar Campo "familia" no Supabase

## 📋 Resumo
Adicionar o campo `familia` (texto) na tabela `budgets` para classificar orçamentos por segmento de cliente.

---

## 🗄️ Banco de Dados
**Nome do projeto Supabase:** `vehbyoihnkxzblsmlpdz` (conforme console do navegador)

---

## 📝 Passos para Aplicar a Migration

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto `vehbyoihnkxzblsmlpdz`

2. **Abra o SQL Editor**
   - No menu lateral esquerdo, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Cole o SQL abaixo**
   ```sql
   -- Adicionar coluna familia à tabela budgets
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'budgets' AND column_name = 'familia'
     ) THEN
       ALTER TABLE budgets ADD COLUMN familia text;
     END IF;
   END $$;

   -- Adicionar comentário à coluna
   COMMENT ON COLUMN budgets.familia IS 'Segmento/Família do cliente (Shopping, Saúde, Múltiplos pontos, Indústria, Condomínio, Aeroportos)';
   ```

4. **Execute a Query**
   - Clique no botão **"Run"** (ou pressione `Ctrl/Cmd + Enter`)
   - Aguarde a confirmação de sucesso

5. **Verifique a Coluna**
   - Vá em **"Table Editor"** no menu lateral
   - Selecione a tabela `budgets`
   - Confirme que a coluna `familia` aparece na lista de colunas

---

### Opção 2: Via Supabase CLI (Para desenvolvedores)

Se você usa a CLI do Supabase localmente:

1. **Execute a migration**
   ```bash
   supabase db push
   ```

2. **Ou aplique manualmente**
   ```bash
   supabase db execute -f src/components/Comercialprivado2/src/components/Orçamentos/supabase/migrations/20260218000000_add_familia_to_budgets.sql
   ```

---

## ✅ Validação

Após aplicar a migration, teste:

1. **Abra a aplicação** e navegue até a página de Orçamentos
2. **Clique em "Novo Orçamento"** ou edite um orçamento existente
3. **Verifique** se o campo "Família" aparece no formulário com as opções:
   - Shopping
   - Saúde
   - Múltiplos pontos (Varejo)
   - Indústria
   - Condomínio
   - Aeroportos
4. **Salve um orçamento** com uma família selecionada
5. **Verifique no console** que não há mais erros de coluna não encontrada

---

## 📂 Arquivo de Migration Criado

O arquivo SQL da migration foi salvo em:
```
src/components/Comercialprivado2/src/components/Orçamentos/supabase/migrations/20260218000000_add_familia_to_budgets.sql
```

---

## 🔄 Mudanças no Código

As seguintes alterações foram feitas no código:

### NewBudgetModal.tsx
- ✅ Adicionado state `familia` 
- ✅ Adicionada constante `FAMILY_OPTIONS` com as opções de família
- ✅ Adicionado campo SELECT no formulário
- ✅ Incluído `familia` nas queries de INSERT e UPDATE
- ✅ Carregamento do valor de `familia` ao editar orçamento

---

## ⚠️ Notas Importantes

- O campo `familia` é **opcional** (pode ser NULL)
- Orçamentos existentes não terão valor em `familia` até serem editados
- A migration usa `DO $$ ... END $$` para evitar erros caso a coluna já exista
- O tipo de dado é `text` sem limite de caracteres

---

## 🆘 Troubleshooting

### Erro: "permission denied"
- Certifique-se de estar logado com uma conta que tem permissões de administrador no projeto
- Tente usar o service role key se estiver usando a API

### Erro: "relation budgets does not exist"
- Verifique se a tabela `budgets` existe no schema `public`
- Confirme que está conectado ao banco/projeto correto

### Coluna não aparece no formulário
- Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
- Verifique se há erros no console do navegador
- Confirme que o servidor de desenvolvimento foi reiniciado

---

**Data da Migration:** 18 de Fevereiro de 2026
**Autor:** Sistema de Orçamentos - Módulo Comercial Privado
