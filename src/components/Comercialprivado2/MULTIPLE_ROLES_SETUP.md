# Configuração de Múltiplos Papéis para Funcionários

## O que mudou?

Agora os funcionários podem ter múltiplos papéis no sistema comercial. Um mesmo funcionário pode ser tanto **Closer** quanto **SDR** ao mesmo tempo.

### Antes
- Um funcionário podia ser apenas Closer OU SDR
- Campo único: `role`

### Depois
- Um funcionário pode ser Closer E SDR simultaneamente
- Novos campos: `is_closer` e `is_sdr` (checkboxes)
- Campo `role` mantido para indicar o tipo de acesso (Vendedor ou Admin)

## Como aplicar a migration

### Opção 1: Usando o script Node.js (Recomendado)

```bash
cd src/components/Comercialprivado2
node apply-multiple-roles-migration.js
```

### Opção 2: SQL Manual (caso o script não funcione)

Execute este SQL no **Supabase SQL Editor** do banco do Comercial Privado:

```sql
-- Adicionar novos campos booleanos para papéis
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS is_closer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sdr boolean DEFAULT false;

-- Migrar dados existentes do role para is_closer
UPDATE employees
SET is_closer = true
WHERE role = 'Closer';

-- Migrar dados existentes do role para is_sdr
UPDATE employees
SET is_sdr = true
WHERE role = 'SDR';

-- Garantir que admins não sejam nem closer nem SDR
UPDATE employees
SET is_closer = false, is_sdr = false
WHERE role = 'Admin';

-- Adicionar comentários explicativos
COMMENT ON COLUMN employees.is_closer IS 'Indica se o funcionário pode atuar como Closer';
COMMENT ON COLUMN employees.is_sdr IS 'Indica se o funcionário pode atuar como SDR';
```

## Como usar no sistema

### Cadastrando funcionários

1. Acesse **Configurações > Funcionários**
2. Clique em **Novo Funcionário**
3. Preencha os dados básicos
4. Em **Tipo de Acesso**, escolha:
   - **Vendedor (Closer/SDR)**: Para funcionários da área comercial
   - **Administrador**: Para acesso total ao sistema
5. Se escolher "Vendedor", marque os papéis:
   - ✅ **Closer**: Pode fechar vendas e gerenciar propostas
   - ✅ **SDR**: Pode prospectar e qualificar leads
6. **Você pode marcar ambos!** Um funcionário pode ser Closer E SDR

### Editando funcionários existentes

1. Clique no ícone de edição ao lado do funcionário
2. Marque/desmarque os papéis conforme necessário
3. Salve as alterações

### Visualizando papéis

Na lista de funcionários, você verá badges coloridas indicando todos os papéis:
- 🔵 **Closer** (azul)
- 🟢 **SDR** (verde)
- 🔴 **Admin** (vermelho)

Um funcionário com múltiplos papéis terá múltiplas badges.

## Validações

- Funcionários do tipo "Vendedor" devem ter pelo menos um papel (Closer ou SDR)
- Administradores não podem ter papéis de Closer ou SDR
- É possível marcar ambos Closer e SDR para o mesmo funcionário

## Impacto nas Propostas

Agora, ao criar/editar propostas, os funcionários aparecerão nas listas de acordo com seus papéis:
- Funcionários com `is_closer = true` aparecerão na lista de Closers
- Funcionários com `is_sdr = true` aparecerão na lista de SDRs
- Se um funcionário tiver ambos os papéis, ele aparecerá em ambas as listas

## Perguntas Frequentes

**P: O que acontece com os funcionários existentes?**
R: A migration converte automaticamente os dados. Closers terão `is_closer = true`, SDRs terão `is_sdr = true`.

**P: Posso ter um funcionário apenas Closer ou apenas SDR?**
R: Sim! Você pode marcar apenas um dos checkboxes.

**P: Um Admin pode ser Closer ou SDR?**
R: Não. Administradores têm acesso total mas não aparecem nas listas de Closers/SDRs.

**P: Como funciona nas comissões?**
R: Funcionários com papel de Closer podem receber comissões de vendas. O papel SDR não afeta comissões diretamente.
