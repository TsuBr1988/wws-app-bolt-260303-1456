# Configuração Correta do Banco de Dados

## Sistema Principal

**URL:** https://vehbyoihnkxzblsmlpdz.supabase.co

**Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzAsImV4cCI6MjA3NDQ5NzczMH0.p_al_To4ZlYDgMKCaJU_PyOOXia2BLStvylddXMvog4
```

**Service Role Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkyMTczMCwiZXhwIjoyMDc0NDk3NzMwfQ.uvU-Dnq3sNdhkk854O3kQWv7b7wrxFN7vuYp86zbnEE
```

### Abas que usam este banco:

✅ **Login/Autenticação**
✅ **RH** - Dados de funcionários, absenteísmo, rescisões, contratos
✅ **Operacional** - FTs, visitas de supervisores, visitas de clientes
✅ **Compras** - Uniformes, materiais de limpeza, EPIs, equipamentos, combustível, Sem Parar
✅ **Qualidade** - Política de qualidade, processos de qualidade
✅ **Contratos** - Contratos, aditivos, margem de contratos
✅ **Cultura** - BSC, OKR, livros, empréstimos, plano estratégico
✅ **Atas e Ações** - Atas de reunião, ações e comentários

---

## Módulos com Bancos Próprios

### Finanças (Banco Próprio)
**URL:** https://cbnegamstnxwsctjyxwc.supabase.co
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibmVnYW1zdG54d3NjdGp5eHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzEwMDUsImV4cCI6MjA3OTg0NzAwNX0.wD4XYvizFv0FC1VgepqlNNUlUZqNzQxjkufFMjVkWK4`

### Comercial Público 2 (Banco de Teste)
**URL:** https://ahqojiwxcruomzdlxulg.supabase.co
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocW9qaXd4Y3J1b216ZGx4dWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjU1MTMsImV4cCI6MjA2ODcwMTUxM30.rRxMsxfuGd6hnNPF435tuPxsH3w8b6wsZvyKrQOvJWk`

### Comercial Privado 2 (Banco de Teste)
**URL:** https://zqqwcjujsiqotlyogyoj.supabase.co
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcXdjanVqc2lxb3RseW9neW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDM2OTYsImV4cCI6MjA2NzgxOTY5Nn0.JvkTF9NNOQyUvz8pFjJpwUhB24J-GE7af-HBuSzxagg`

### Orçamentos (Usa o Banco Principal)
**URL:** https://vehbyoihnkxzblsmlpdz.supabase.co (mesmo do sistema principal)
**Anon Key:** Mesma do sistema principal

---

## Solução de Problemas

### Se as abas estiverem vazias:

1. Verifique se o arquivo `.env` está com as credenciais corretas
2. A URL deve ser: `https://vehbyoihnkxzblsmlpdz.supabase.co`
3. Se necessário, copie o conteúdo de `.env.correct` para `.env`
4. Execute `npm run build` para aplicar as mudanças
5. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

### Arquivo .env correto:

```env
VITE_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzAsImV4cCI6MjA3NDQ5NzczMH0.p_al_To4ZlYDgMKCaJU_PyOOXia2BLStvylddXMvog4
```

---

## Importante

⚠️ **NUNCA** use estas URLs no sistema principal:
- ❌ `https://ccbafepmznoltyeukueg.supabase.co` (banco antigo/errado)
- ❌ `https://ahqojiwxcruomzdlxulg.supabase.co` (banco de teste - Comercial Público)
- ❌ `https://zqqwcjujsiqotlyogyoj.supabase.co` (banco de teste - Comercial Privado)

✅ **SEMPRE** use: `https://vehbyoihnkxzblsmlpdz.supabase.co`
