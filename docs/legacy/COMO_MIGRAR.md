# Como Consolidar os Dois Bancos em Um

## Situação Atual
- ✅ **Banco A (Dashboard)**: O que você quer manter
- ✅ **Banco B (Comercial Privado)**: Dados que serão movidos para o Banco A

## 3 Passos Simples

### 📝 PASSO 1: Criar Tabelas no Banco Principal

1. Acesse o Supabase do **Dashboard Principal**
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo: `docs/legacy/consolidar_bancos.sql`
4. Clique em **RUN**

✅ Isso cria todas as tabelas com prefixo `cp_`

---

### 📤 PASSO 2: Exportar Dados do Banco Antigo

**Opção A - Usando pg_dump (Recomendado)**

No terminal, execute:

```bash
# Configure suas credenciais
ORIGEM_HOST="seu-comercial-privado.supabase.co"
ORIGEM_SENHA="sua-senha"

# Exportar dados
PGPASSWORD=$ORIGEM_SENHA pg_dump \
  -h $ORIGEM_HOST \
  -U postgres \
  -d postgres \
  --data-only \
  --column-inserts \
  -t employees \
  -t proposals \
  -t challenges \
  -t marketing_instagram \
  -t marketing_linkedin \
  -t commercial_goals \
  -t actions \
  -t meeting_minutes \
  > dados_comercial_privado.sql

# Substituir nomes de tabelas (adicionar prefixo cp_)
sed -i 's/INSERT INTO employees/INSERT INTO cp_employees/g' dados_comercial_privado.sql
sed -i 's/INSERT INTO proposals/INSERT INTO cp_proposals/g' dados_comercial_privado.sql
sed -i 's/INSERT INTO challenges/INSERT INTO cp_challenges/g' dados_comercial_privado.sql
sed -i 's/INSERT INTO marketing_instagram/INSERT INTO cp_marketing_instagram/g' dados_comercial_privado.sql
sed -i 's/INSERT INTO marketing_linkedin/INSERT INTO cp_marketing_linkedin/g' dados_comercial_privado.sql
sed -i 's/INSERT INTO commercial_goals/INSERT INTO cp_commercial_goals/g' dados_comercial_privado.sql
sed -i 's/INSERT INTO actions/INSERT INTO cp_actions/g' dados_comercial_privado.sql
sed -i 's/INSERT INTO meeting_minutes/INSERT INTO cp_meeting_minutes/g' dados_comercial_privado.sql
```

**Opção B - Exportar CSV (Manual)**

Para cada tabela importante no Supabase do Comercial Privado:
1. Vá em **Table Editor**
2. Clique nos 3 pontos (⋮) → **Export as CSV**
3. Depois importe no banco principal na tabela com prefixo `cp_`

---

### 📥 PASSO 3: Importar Dados no Banco Principal

1. Acesse o Supabase do **Dashboard Principal**
2. Vá em **SQL Editor**
3. Cole o conteúdo de: `dados_comercial_privado.sql`
4. Clique em **RUN**

---

### 🔧 PASSO 4: Atualizar Código Frontend

Buscar e substituir no código do Comercial Privado:

```typescript
// Antes
from('employees')
from('proposals')
from('challenges')

// Depois
from('cp_employees')
from('cp_proposals')
from('cp_challenges')
```

Use find/replace no VS Code:
- `from('employees')` → `from('cp_employees')`
- `from('proposals')` → `from('cp_proposals')`
- Etc...

---

### 🔑 PASSO 5: Atualizar .env

No Comercial Privado, atualize `.env`:

```env
# Cole os valores do Dashboard Principal aqui
VITE_SUPABASE_URL=https://seu-dashboard-principal.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-principal
```

---

### ✅ PASSO 6: Testar

```bash
npm run dev
```

Teste:
- Login funciona?
- Propostas aparecem?
- Desafios carregam?
- Gráficos mostram dados?

---

## Lista de Tabelas Migradas

As principais tabelas do Comercial Privado que agora têm prefixo `cp_`:

- ✅ `employees` → `cp_employees`
- ✅ `proposals` → `cp_proposals`
- ✅ `challenges` → `cp_challenges`
- ✅ `marketing_instagram` → `cp_marketing_instagram`
- ✅ `marketing_linkedin` → `cp_marketing_linkedin`
- ✅ `commercial_goals` → `cp_commercial_goals`
- ✅ `actions` → `cp_actions`
- ✅ `meeting_minutes` → `cp_meeting_minutes`

---

## Problemas Comuns

**Erro: "relation cp_employees does not exist"**
→ Execute o PASSO 1 novamente

**Erro: "duplicate key"**
→ Você importou os dados 2 vezes. Limpe com:
```sql
TRUNCATE TABLE cp_employees CASCADE;
```

**Aplicação não carrega**
→ Verifique se atualizou o `.env` (PASSO 5)

---

## Tempo Estimado

⏱️ 30-45 minutos

## Backup

Antes de começar, faça backup:
- Exporte todos os dados do banco antigo (CSV)
- Faça commit do código atual

---

**Dúvidas?** Todos os scripts estão prontos no arquivo `docs/legacy/consolidar_bancos.sql`
