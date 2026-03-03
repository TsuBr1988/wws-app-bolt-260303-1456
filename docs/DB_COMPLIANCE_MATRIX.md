# Matriz de Conformidade de Bancos (Supabase)

Data da verificação: **2026-02-24**

## Escopo
Verificação da adoção do padrão obrigatório:

- `src/lib/supabaseClients.ts`
- `src/lib/databaseResolver.ts`
- uso de `getDatabase(modulo)` ou wrappers locais que delegam para o resolver

## Resultado executivo

Status geral: **CONFORME (com monitoramento contínuo recomendado)**.

- Não há mais import profundo indevido do cliente global em dashboard comercial público (`../../../../../lib/supabase`).
- Fluxos críticos já usam o resolver central (auth, finanças, contratos multi-módulo, atas/ações, cultura, TI, OKR).
- Módulos comerciais usam wrappers locais (`src/components/Comercialpublico2/src/lib/supabase.ts` e `src/components/Comercialprivado2/src/lib/supabase.ts`) que delegam ao resolver.

## Matriz por módulo

| Módulo | Banco alvo | Cliente efetivo | Status | Risco de conflito |
|---|---|---|---|---|
| RH | app-wws-geral | `supabaseGeral` | Conforme | Baixo |
| OPERACIONAL | app-wws-geral | `supabaseGeral` | Conforme | Baixo |
| COMERCIAL (estrutura geral) | app-wws-geral | `supabaseGeral` | Conforme | Baixo |
| COMPRAS | app-wws-geral | `supabaseGeral` | Conforme | Baixo |
| QUALIDADE | app-wws-geral | `supabaseGeral` | Conforme | Baixo |
| CULTURA | app-wws-geral | `supabaseGeral` | Conforme | Baixo |
| ATAS | app-wws-geral | `supabaseGeral` | Conforme | Baixo |
| FINANCAS | app-wws-financas | `supabaseFinancas` | Conforme | Baixo |
| COMERCIAL_PRIVADO | app-wws-comercial-privado | `supabaseComercialPrivado` | Conforme | Baixo |
| COMERCIAL_PUBLICO | app-wws-comercial-publico | `supabaseComercialPublico` | Conforme | Baixo |

## Evidências rápidas (amostragem por busca)

1. **Resolver ativo**
   - `getDatabase(` presente em múltiplos serviços/páginas de domínio.

2. **Clientes oficiais definidos**
   - `src/lib/supabaseClients.ts` exporta: `supabaseGeral`, `supabaseFinancas`, `supabaseComercialPrivado`, `supabaseComercialPublico`.

3. **Routing oficial de módulo**
   - `src/lib/databaseResolver.ts` mapeia:
     - `FINANCAS` -> `supabaseFinancas`
     - `COMERCIAL_PRIVADO` -> `supabaseComercialPrivado`
     - `COMERCIAL_PUBLICO` -> `supabaseComercialPublico`
     - demais módulos -> `supabaseGeral`

4. **Correção aplicada nesta rodada**
   - `src/components/Comercialpublico2/src/components/Dashboard/ContractsExpiringCard.tsx`
   - `src/components/Comercialpublico2/src/components/Dashboard/ReequilibrioCard.tsx`
   - ambos agora importam `../../lib/supabase` (wrapper local do módulo), removendo dependência do cliente global.

## Checklist de prevenção (anti regressão)

- [ ] Ao criar novo serviço/página, usar `getDatabase(modulo)` ou wrapper local do módulo.
- [ ] Não importar cliente global de outro domínio por caminho relativo profundo.
- [ ] Não criar `createClient(...)` ad-hoc no frontend fora de `src/lib/supabaseClients.ts`.
- [ ] Em PR de dados, anexar mini-relatório: **módulo, banco, cliente, risco**.

Validação automática disponível via comando:

- `npm run check:db-isolation`

## Próxima ação sugerida

Adicionar uma checagem automatizada em CI (lint customizado/grep) para falhar build quando houver import indevido de `lib/supabase` fora do padrão de módulo.
