# Configuração de Bancos de Dados

## Estrutura Atual

### 1. Sistema Principal (vehbyoihnkxzblsmlpdz)
**URL:** `https://vehbyoihnkxzblsmlpdz.supabase.co`

**Variáveis de ambiente:**
```
VITE_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzAsImV4cCI6MjA3NDQ5NzczMH0.p_al_To4ZlYDgMKCaJU_PyOOXia2BLStvylddXMvog4
```

**Service Role (secret - NÃO COMMIT):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkyMTczMCwiZXhwIjoyMDc0NDk3NzMwfQ.uvU-Dnq3sNdhkk854O3kQWv7b7wrxFN7vuYp86zbnEE
```

**Abas que usam este banco:**
- ✅ Login/Autenticação
- ✅ RH
- ✅ Operacional
- ✅ Compras
- ✅ Qualidade
- ✅ Contratos
- ✅ Cultura
- ✅ Atas e Ações

**Arquivo de configuração:** `src/lib/supabase.ts`

---

### 2. Comercial Público (ahqojiwxcruomzdlxulg)
**URL:** `https://ahqojiwxcruomzdlxulg.supabase.co`

**Variáveis de ambiente:**
```
VITE_COMERCIAL_PUBLICO2_SUPABASE_URL=https://ahqojiwxcruomzdlxulg.supabase.co
VITE_COMERCIAL_PUBLICO2_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocW9qaXd4Y3J1b216ZGx4dWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjU1MTMsImV4cCI6MjA2ODcwMTUxM30.rRxMsxfuGd6hnNPF435tuPxsH3w8b6wsZvyKrQOvJWk
```

**Módulo:** Comercial Público (banco independente)

**Arquivo de configuração:** `src/components/Comercialpublico2/src/lib/supabase.ts`

---

### 3. Comercial Privado (zqqwcjujsiqotlyogyoj)
**URL:** `https://zqqwcjujsiqotlyogyoj.supabase.co`

**Variáveis de ambiente:**
```
VITE_COMERCIAL_PRIVADO2_SUPABASE_URL=https://zqqwcjujsiqotlyogyoj.supabase.co
VITE_COMERCIAL_PRIVADO2_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcXdjanVqc2lxb3RseW9neW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDM2OTYsImV4cCI6MjA2NzgxOTY5Nn0.JvkTF9NNOQyUvz8pFjJpwUhB24J-GE7af-HBuSzxagg
```

**Módulo:** Comercial Privado (banco independente)

**Arquivo de configuração:** `src/components/Comercialprivado2/src/lib/supabase.ts`

---

### 4. Orçamentos (Bridge - usa banco principal)
**URL:** `https://vehbyoihnkxzblsmlpdz.supabase.co` (mesmo do sistema principal)

**Variáveis de ambiente:**
```
VITE_BUDGETS_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
VITE_BUDGETS_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzAsImV4cCI6MjA3NDQ5NzczMH0.p_al_To4ZlYDgMKCaJU_PyOOXia2BLStvylddXMvog4
```

**Módulo:** Sistema de Orçamentos integrado ao Comercial Privado mas que acessa o banco principal

**Arquivos de configuração:**
- `src/components/Comercialprivado2/src/components/Orçamentos/src/lib/supabase.ts`
- `src/components/Comercialprivado2/src/components/Budgets/budgetsSupabase.ts`

---

### 5. Finanças (cbnegamstnxwsctjyxwc)
**URL:** `https://cbnegamstnxwsctjyxwc.supabase.co`

**Variáveis de ambiente:**
```
VITE_FINANCAS_SUPABASE_URL=https://cbnegamstnxwsctjyxwc.supabase.co
VITE_FINANCAS_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibmVnYW1zdG54d3NjdGp5eHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzEwMDUsImV4cCI6MjA3OTg0NzAwNX0.wD4XYvizFv0FC1VgepqlNNUlUZqNzQxjkufFMjVkWK4
```

**Service Role (secret - NÃO COMMIT):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibmVnYW1zdG54d3NjdGp5eHdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI3MTAwNSwiZXhwIjoyMDc5ODQ3MDA1fQ.MJG0nVmSOt7zsrbZQKeP4Go47INI0H-anSW0cmbKqEU
```

**Módulo:** Finanças (banco independente)

**Arquivo de configuração:** `src/modules/financas/App.tsx`

**Observações:**
- Este módulo possui seu próprio banco de dados Supabase
- As configurações podem ser alteradas na interface da aba Finanças através do painel de Configurações
- O sistema usa localStorage para armazenar as credenciais configuradas pelo usuário
- As variáveis de ambiente servem como fallback caso não haja configuração no localStorage

---

## IMPORTANTE - Não Altere!

O arquivo `.env` está configurado corretamente. **NÃO ALTERE** as URLs principais a menos que seja estritamente necessário:

```env
VITE_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
```

**Esta é a URL correta do sistema principal!**

Se o sistema travar ou não carregar, verifique se o `.env` não foi alterado acidentalmente.

---

## Bancos Antigos (NÃO USAR)

❌ **ccbafepmznoltyeukueg.supabase.co** - Banco ANTIGO, não utilizar mais!

---

## Troubleshooting

### Sistema não carrega / tela branca
1. Verifique se `VITE_SUPABASE_URL` está apontando para `vehbyoihnkxzblsmlpdz`
2. Execute `npm run build` para recompilar
3. Recarregue a página com Ctrl+Shift+R

### Dados não aparecem em uma aba
1. Verifique qual banco a aba deveria usar (consulte a lista acima)
2. Verifique se o arquivo de configuração está correto
3. Verifique se as tabelas existem no banco correto

### Mudança de banco de dados
Se precisar mudar o banco de um módulo:
1. Atualize o arquivo `.env` com as novas credenciais
2. Execute `npm run build`
3. Documente a mudança neste arquivo
