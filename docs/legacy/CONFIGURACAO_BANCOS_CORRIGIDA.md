# Configuração de Bancos de Dados - CORRIGIDA ✅

## Problema Identificado

As abas principais (RH, Operacional, Compras, Qualidade, Cultura, Atas) estavam **vazias** porque o sistema estava apontando para um banco Supabase **incorreto**.

## Correções Aplicadas

### 1. Sistema Principal (.env)

**ANTES (Incorreto):**
```
VITE_SUPABASE_URL=https://hfoategxekuvcazejrnq.supabase.co
```

**DEPOIS (Correto):**
```
VITE_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzAsImV4cCI6MjA3NDQ5NzczMH0.p_al_To4ZlYDgMKCaJU_PyOOXia2BLStvylddXMvog4
```

### 2. Comercial Privado 2 (.env criado)

```
VITE_SUPABASE_URL=https://zqqwcjujsiqotlyogyoj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcXdjanVqc2lxb3RseW9neW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDM2OTYsImV4cCI6MjA2NzgxOTY5Nn0.JvkTF9NNOQyUvz8pFjJpwUhB24J-GE7af-HBuSzxagg
```

### 3. Comercial Público 2 (.env criado)

```
VITE_SUPABASE_URL=https://ahqojiwxcruomzdlxulg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocW9qaXd4Y3J1b216ZGx4dWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjU1MTMsImV4cCI6MjA2ODcwMTUxM30.rRxMsxfuGd6hnNPF435tuPxsH3w8b6wsZvyKrQOvJWk
```

## Estrutura Final de Bancos

### 🟦 Banco Principal
**URL:** https://vehbyoihnkxzblsmlpdz.supabase.co

**Usado por:**
- ✅ Login/Autenticação
- ✅ RH
- ✅ Operacional
- ✅ Compras
- ✅ Qualidade
- ✅ Contratos
- ✅ Cultura
- ✅ Atas e Ações
- ✅ Finanças
- ✅ Orçamentos (dentro do Comercial Privado)

### 🟩 Banco Comercial Privado
**URL:** https://zqqwcjujsiqotlyogyoj.supabase.co

**Usado por:**
- ✅ Aba Comercial Privado 2 (todas as funcionalidades)
- ✅ Propostas
- ✅ Comissões
- ✅ Desafios
- ✅ Metas Comerciais
- ✅ Marketing

### 🟧 Banco Comercial Público
**URL:** https://ahqojiwxcruomzdlxulg.supabase.co

**Usado por:**
- ✅ Aba Comercial Público 2 (todas as funcionalidades)
- ✅ Licitações
- ✅ Contratos Públicos
- ✅ Certidões
- ✅ Tarefas

## Como Verificar se Está Funcionando

### 1. Recarregue a Aplicação
```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

### 2. Teste as Abas
- **RH:** Deve mostrar funcionários, absenteísmo, rescisões
- **Operacional:** Deve mostrar FTs, visitas
- **Compras:** Deve mostrar uniformes, materiais, equipamentos
- **Qualidade:** Deve mostrar política, documentos
- **Cultura:** Deve mostrar BSC, livros, flywheel
- **Atas:** Deve mostrar atas e ações

### 3. Verifique no Console do Navegador
Se ainda houver problemas, abra o Console (F12) e procure por:
- ❌ Erros de autenticação Supabase
- ❌ Erros 404 ou 401
- ❌ Mensagens de "Invalid API key"

## Troubleshooting

### Problema: Abas ainda estão vazias

**Solução 1:** Limpar cache do navegador
- Pressione Ctrl+Shift+Delete
- Limpe cache e cookies
- Recarregue a página (F5)

**Solução 2:** Verificar se o build foi feito
```bash
npm run build
```

**Solução 3:** Verificar variáveis de ambiente
```bash
# No terminal, execute:
cat .env | grep VITE_SUPABASE_URL
```

Deve retornar:
```
VITE_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
```

### Problema: Erro "Invalid API key"

**Causa:** As chaves Anon estão incorretas ou expiradas

**Solução:** Verifique no painel do Supabase se as chaves estão corretas:
1. Acesse o dashboard do Supabase
2. Vá em Settings > API
3. Copie a chave "anon" / "public"
4. Atualize no arquivo .env correspondente

## Arquivos Modificados

1. ✅ `/tmp/cc-agent/63392080/project/.env`
2. ✅ `/tmp/cc-agent/63392080/project/src/components/Comercialprivado2/.env`
3. ✅ `/tmp/cc-agent/63392080/project/src/components/Comercialpublico2/.env`

## Status Final

✅ **TUDO CORRIGIDO!**

- Sistema Principal apontando para banco correto
- Comercial Privado 2 com banco próprio configurado
- Comercial Público 2 com banco próprio configurado
- Build realizado com sucesso
- Pronto para uso!
