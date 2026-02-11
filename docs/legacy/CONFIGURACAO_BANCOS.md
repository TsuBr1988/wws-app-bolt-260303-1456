# Configuração dos Bancos de Dados

## Três Bancos Diferentes

### 1. Sistema Principal
**URL:** https://vehbyoihnkxzblsmlpdz.supabase.co

**Abas que utilizam:**
- Login/Autenticação
- RH
- Operacional
- Compras
- Qualidade
- Contratos
- Cultura
- Atas e Ações
- Finanças
- Orçamentos (dentro do Comercial Privado)

**Variáveis de ambiente:**
```
VITE_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzAsImV4cCI6MjA3NDQ5NzczMH0.p_al_To4ZlYDgMKCaJU_PyOOXia2BLStvylddXMvog4
```

---

### 2. Banco Comercial Privado
**URL:** https://zqqwcjujsiqotlyogyoj.supabase.co

**Abas que utilizam:**
- Comercial Privado 2

**Variáveis de ambiente:**
```
VITE_COMERCIAL_PRIVADO2_SUPABASE_URL=https://zqqwcjujsiqotlyogyoj.supabase.co
VITE_COMERCIAL_PRIVADO2_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcXdjanVqc2lxb3RseW9neW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDM2OTYsImV4cCI6MjA2NzgxOTY5Nn0.JvkTF9NNOQyUvz8pFjJpwUhB24J-GE7af-HBuSzxagg
```

**Observação:** A aba Orçamentos dentro do Comercial Privado usa o banco PRINCIPAL, não este.

---

### 3. Banco Comercial Público
**URL:** https://ahqojiwxcruomzdlxulg.supabase.co

**Abas que utilizam:**
- Comercial Público 2

**Variáveis de ambiente:**
```
VITE_COMERCIAL_PUBLICO2_SUPABASE_URL=https://ahqojiwxcruomzdlxulg.supabase.co
VITE_COMERCIAL_PUBLICO2_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocW9qaXd4Y3J1b216ZGx4dWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjU1MTMsImV4cCI6MjA2ODcwMTUxM30.rRxMsxfuGd6hnNPF435tuPxsH3w8b6wsZvyKrQOvJWk
```

---

## Arquivos de Configuração

### Arquivo Principal: `.env`
Contém as variáveis para os 3 bancos.

### Módulos Comerciais
- **Comercial Privado 2:** `src/components/Comercialprivado2/src/lib/supabase.ts`
  - Usa `VITE_COMERCIAL_PRIVADO2_SUPABASE_URL` com fallback para `VITE_SUPABASE_URL`

- **Comercial Público 2:** `src/components/Comercialpublico2/src/lib/supabase.ts`
  - Usa `VITE_COMERCIAL_PUBLICO2_SUPABASE_URL` com fallback para `VITE_SUPABASE_URL`

- **Orçamentos:** `src/components/Comercialprivado2/src/components/Orçamentos/src/lib/supabase.ts`
  - Usa `VITE_BUDGETS_SUPABASE_URL` com fallback para `VITE_SUPABASE_URL` (banco principal)

---

## Troubleshooting

Se as abas estiverem vazias:
1. Verifique se o arquivo `.env` está correto
2. Reinicie o servidor de desenvolvimento
3. Limpe o cache do navegador
4. Verifique se o banco está acessível e as credenciais estão corretas
