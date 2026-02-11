# Glossário (WWS Hub)

Este documento consolida a terminologia e os conceitos de domínio usados no **WWS Hub** — aplicação web com múltiplos módulos (ex.: Comercial Público/Privado, Finanças, TI, Qualidade). O objetivo é alinhar a linguagem entre negócio, produto e engenharia e facilitar a leitura do código (principalmente onde o domínio aparece como **types TypeScript**, **constantes**, **services** e **funções Supabase**).

Para contexto geral do produto e dos módulos, veja: [project-overview.md](./project-overview.md)

---

## Como o repositório reflete o domínio

O domínio aparece principalmente nestas camadas/pastas:

- **Módulos**: `src/modules/financas`, `src/modules/ti`, `src/modules/qualidade`  
  (cada módulo agrupa telas, tipos e regras de uma área)
- **Sub-aplicações/áreas comerciais**:  
  - `src/components/Comercialpublico2`  
  - `src/components/Comercialprivado2`
- **Services** (acesso/manipulação de dados):  
  - `src/services/**`  
  - `src/modules/**/services/**`  
  - services dentro das sub-áreas comerciais
- **Tipos de dados**:
  - `src/types/**` (inclui interfaces de tabelas/indicadores)
  - `src/**/types/**` (tipos específicos por área)
- **Supabase Functions (ETL/Jobs/Integrações)**: `supabase/functions/**`  
  (ex.: importação de DRE)

---

## Tipos e interfaces de domínio (referências rápidas)

Abaixo uma seleção de “shape contracts” centrais do sistema. Onde há duplicidade de nomes (Público vs Privado, ou tipos iguais em módulos diferentes), as origens são listadas.

### Auth / Permissões

- **`AppUser`** — usuário autenticado e metadados  
  **Arquivo:** `src/hooks/useAuth.ts`
- **`UserPermissions`** — estrutura de permissões (roles/níveis)  
  **Arquivo:** `src/hooks/useAuth.ts`
- **`PermissionLevel`** — nível de permissão (type/alias)  
  **Arquivo:** `src/hooks/useAuth.ts`

### Finanças / DRE / Relatórios

- **`BalancesByCompany`** — agregações de saldos por empresa  
  **Arquivo:** `src/modules/financas/types.ts`
- **`CashSubView`** — subvisões do fluxo de caixa / navegação interna  
  **Arquivo:** `src/modules/financas/types.ts`
- **`CategoriaDRE`** — categoria de DRE (estrutura do módulo e seed)  
  **Arquivos:**
  - `src/modules/financas/types.ts`
  - `src/lib/seedCategoriasDRE.ts`
- **`CategoryNode`** — nó de árvore de categorias (relatórios hierárquicos)  
  **Arquivo:** `src/modules/financas/types.ts`
- **`CategoryRow`** — linha preparada para exibição/planilha (contract sheets)  
  **Arquivo:** `src/modules/financas/components/Features/contract_sheets/sheetDetailUtils.ts`
- **`DRELinha`** — linha consolidada/normalizada de DRE  
  **Arquivo:** `src/services/dreService.ts`
- **`MonthData`** — representação de competência (mês/ano) para séries e relatórios  
  **Arquivo:** `src/lib/months.ts`

### Contratos

- **`Contract`** — contrato e operações de datas/valores (utilitário de domínio)  
  **Arquivo:** `src/lib/contractUtils.ts`
- **`ContractAddendum` / `ContractWithAddendums`** — aditivos e composição do contrato  
  **Arquivo:** `src/lib/contractUtils.ts`

### Comercial (Público/Privado)

- **Propostas (Comercial Público)**  
  - **`Proposal` / `ProposalInsert` / `ProposalUpdate` / `ProbabilityScores`**  
    **Arquivo:** `src/components/Comercialpublico2/src/services/proposalService.ts`
- **Colaboradores (Comercial Público)**  
  - **`Employee` / `EmployeeInsert` / `EmployeeUpdate`**  
    **Arquivo:** `src/components/Comercialpublico2/src/services/employeeService.ts`
- **Performance semanal (Comercial Público)**  
  - **`WeeklyPerformance` / `WeeklyPerformanceInsert` / `WeeklyPerformanceUpdate`**  
    **Arquivo:** `src/components/Comercialpublico2/src/services/weeklyPerformanceService.ts`
- **Entidades “espelhadas” Público/Privado**  
  - **`Badge`**, **`Campaign`**, **`Challenge`**, **`BonusFund`**, **`BonusContribution`**, **`BonusEmployee`**  
    **Arquivos:**
    - Público: `src/components/Comercialpublico2/src/types/index.ts`  
    - Privado: `src/components/Comercialprivado2/src/types/index.ts`
- **Orçamentos (Comercial Privado)**  
  - **`Budget`**, **`Benefit`**  
    **Arquivo:** `src/components/Comercialprivado2/src/components/Orçamentos/src/types.ts`
  - **`BenefitOverride`** — overrides de benefícios aplicados via service  
    **Arquivo:** `src/components/Comercialprivado2/src/components/Orçamentos/src/services/budgetBenefitsService.ts`

### TI / Qualidade

- **`Chamado`** — ticket/demanda de TI  
  **Arquivo:** `src/modules/ti/types.ts`
- **`ChamadoHistoricoItem`** — item de histórico de um chamado  
  **Arquivo:** `src/modules/ti/types.ts`
- **`AtaAnaliseCritica`** — “ata”/registro de análise crítica (Qualidade)  
  **Arquivo:** `src/modules/qualidade/types.ts`

### Indicadores / Tabelas (interfaces de DB)

- Interfaces de séries temporais e cadastros (ex.: **`HrHeadcount`**, **`FinRevenue`**, **`Client`**, **`Department`**, **`BscItem`**, etc.)  
  **Arquivo:** `src/types/database.ts`

---

## Enumerações e vocabulários controlados

Alguns “enums” são implementados como `enum` ou como *string literal unions* (types). Na prática, funcionam como vocabulário controlado do domínio.

- **`AccessType`** — tipo de acesso/perfil (contexto de autorização)  
  **Arquivo:** `src/components/Comercialpublico2/src/contexts/AccessContext.tsx`
- **`ProposalStatus`** — status de proposta  
  **Arquivo:** `src/components/Comercialpublico2/src/constants/status.ts`
- **`SituacaoNotificacao`** — situação/estado de notificação  
  **Arquivo:** `src/components/Comercialpublico2/src/types/notificacao.ts`
- **TI (Chamados):**  
  - `ChamadoTipo`, `ChamadoPrioridade`, `ChamadoStatus`, `ChamadoModulo`, `ChamadoEstimativa`  
  **Arquivo:** `src/modules/ti/chamadosConstants.ts`
- **Finanças:**  
  - `Company`, `FileType`, `CoaViewMode`, `ClientType`, `CostCenterCategory` e filtros relacionados  
  **Arquivo:** `src/modules/financas/types.ts`

> Atenção a nomes duplicados: existe `ViewState` em TI e em Finanças (`src/modules/ti/types.ts` e `src/modules/financas/types.ts`). Prefira imports com caminho explícito e evite re-export cego.

---

## Termos centrais do domínio (com mapeamento para o código)

### DRE (Demonstrativo de Resultados)

**O que é:** relatório financeiro por competência com categorias/linhas e totais/subtotais.

**Onde aparece:**
- Service principal: `src/services/dreService.ts`  
  - `buscarDREPorContrato` (consulta por contrato)
  - `listarContratosDRE` (lista contratos disponíveis)
  - `calcularSubtotais` (regras de subtotalização)
- Importação/ETL: `supabase/functions/importar-dre/index.ts`  
  - `parsearColunaCompetencia` (normalização de competência)
  - `carregarCategorias`, `processarAba`, `processarExcel` (pipeline de importação)
- Tipos: `src/modules/financas/types.ts` (`CategoriaDRE`, `CategoryNode`) e `src/services/dreService.ts` (`DRELinha`)

---

### Competência (mês/ano de referência)

**O que é:** período contábil (ex.: `2025-01`) usado em DRE, séries e indicadores.

**Onde aparece:**
- Utilitários de datas/competência: `src/lib/months.ts`  
  - `getLast12Months`, `getMonthsInRange`, `formatMonthLabel`, etc.
- Importação DRE: `supabase/functions/importar-dre/index.ts` (`parsearColunaCompetencia`)

---

### Contrato

**O que é:** entidade central para análises financeiras e operacionais (vigência, valor, aditivos, lembretes).

**Onde aparece:**
- Regras utilitárias: `src/lib/contractUtils.ts`  
  - Datas/vigência: `getCurrentEndDate`, `getDaysUntilEnd`, `isContractExpired`, `isContractEndingSoon`, `getClosestEndDate`
  - Valores: `getCurrentValue`, `getValueForMonth`
  - Formatação pt-BR: `formatCurrency`, `formatDateBR`

---

### Aditivo (contratual)

**O que é:** alteração em contrato; pode ser:
- **Pontual** (temporária)
- **Permanente** (renovação/reajuste estrutural)
- **Informativo** (não altera valor/vigência, mas registra evento)

**Onde aparece:** `src/lib/contractUtils.ts`  
- `isInformativeAddendum`
- `getActivePunctualAddendum`
- `getMostRecentPermanentAddendum`
- `getPunctualAddendumEndingSoon`

---

### Reajuste (IPCA / Dissídio)

**O que é:** regras/lembretes de reajuste contratual.

**Onde aparece:** `src/lib/contractUtils.ts`  
- `shouldShowDissidioReminder`
- `shouldShowIPCAReminder`

---

### Proposta (Comercial)

**O que é:** oportunidade comercial com status, probabilidade e ordenação de pipeline.

**Onde aparece:**
- Service: `src/components/Comercialpublico2/src/services/proposalService.ts`
- Ordenação e regras de “prioridade”: `src/components/Comercialpublico2/src/utils/sortPropostas.ts` (`applyDefaultOrder`)
- Normalização de estados: `src/components/Comercialpublico2/src/utils/statusMap.ts` (`mapSituacaoToStatus`, `mapStatusToSituacao`)

---

### Notificação

**O que é:** alertas/pendências e lembretes operacionais (ex.: “próxima ação”, prazos, estado).

**Onde aparece:**
- Tipo: `src/components/Comercialpublico2/src/types/notificacao.ts` (`SituacaoNotificacao`)
- Funções Supabase (exemplo): `src/components/Comercialpublico2/supabase/functions/notificar_proxima_acao/**`

---

### Chamado (TI)

**O que é:** ticket/demanda interna com tipo, prioridade, status, módulo impactado e histórico.

**Onde aparece:**
- Tipos: `src/modules/ti/types.ts` (`Chamado`, `ChamadoHistoricoItem`)
- Constantes/enums: `src/modules/ti/chamadosConstants.ts`

---

### Ata / Análise Crítica (Qualidade)

**O que é:** registro formal (reuniões, inspeções, análises) com itens, evidências e pendências.

**Onde aparece:**
- Tipos: `src/modules/qualidade/types.ts` (`AtaAnaliseCritica` e relacionados)
- Componentes do módulo: `src/modules/qualidade/components/**`

---

### Orçamento (Budgets / Orçamentos)

**O que é:** composição de custos/benefícios e parâmetros para cálculo (Comercial Privado).

**Onde aparece:**
- Tipos: `src/components/Comercialprivado2/src/components/Orçamentos/src/types.ts` (`Budget`, `Benefit`)
- Services: `src/components/Comercialprivado2/src/components/Orçamentos/src/services/**` (ex.: overrides de benefícios)

---

### Indicadores (KPIs / séries temporais)

**O que é:** métricas como headcount, turnover, receitas, margens, visitas operacionais etc.

**Onde aparece:**
- Interfaces/linhas de tabela: `src/types/database.ts`
- Componentes de KPI (Finanças): `src/modules/financas/components/Features/kpis/**`

---

## Siglas e abreviações

- **DRE** — *Demonstrativo de Resultados*  
  Relacionado a: `src/services/dreService.ts`, `supabase/functions/importar-dre/index.ts`
- **COA** — *Chart of Accounts* (Plano de Contas)  
  Relacionado a: `CoaViewMode` em `src/modules/financas/types.ts`
- **KPI** — *Key Performance Indicator* (Indicador-chave)  
  Relacionado a: `src/types/database.ts` e `src/modules/financas/components/Features/kpis/**`
- **IPCA** — índice para reajuste  
  Relacionado a: `shouldShowIPCAReminder` em `src/lib/contractUtils.ts`
- **FT** — entidade operacional (tabelas `OperationalFTs` / `FTsTableRow`)  
  Relacionado a: `src/types/database.ts`
- **Supabase** — BaaS (Auth/DB/Functions)  
  Relacionado a: `supabase/functions/**` e libs `src/lib/supabase.ts` (e variantes por sub-aplicação)

---

## Personas / Atores (visão de produto → código)

### Comercial (Público e Privado)
- **Objetivos:** gerir pipeline de propostas, acompanhar status, campanhas/desafios; gerar e acompanhar orçamentos (privado).
- **Código:** `src/components/Comercialpublico2/**`, `src/components/Comercialprivado2/**`, `ProposalStatus`, `sortPropostas.ts`, `statusMap.ts`.

### Financeiro / Controladoria
- **Objetivos:** consolidar DRE por competência, analisar margens/contratos, importar planilhas e navegar por categorias.
- **Código:** `src/modules/financas/**`, `src/services/dreService.ts`, `supabase/functions/importar-dre/**`.

### TI (Suporte interno)
- **Objetivos:** registrar, priorizar e acompanhar chamados, com histórico e previsibilidade.
- **Código:** `src/modules/ti/types.ts`, `src/modules/ti/chamadosConstants.ts`.

### Qualidade
- **Objetivos:** registrar atas/análises críticas, evidências e ações.
- **Código:** `src/modules/qualidade/types.ts`, `src/modules/qualidade/components/**`.

### Administrador / Gestor
- **Objetivos:** dashboards/indicadores e governança (acessos/permissões).
- **Código:** `useAuth` (`src/hooks/useAuth.ts`), dashboards e services agregadores.

---

## Regras e invariantes recorrentes (para implementação consistente)

### Contratos e vigência
- A **data fim atual** pode ser alterada por aditivos (`getCurrentEndDate`) e a **data mais próxima** pode envolver múltiplos eventos (`getClosestEndDate`).
- “Expirado” e “encerrando em breve” devem usar as funções do domínio (`isContractExpired`, `isContractEndingSoon`, `getDaysUntilEnd`) em `src/lib/contractUtils.ts`.
- **Valor atual do contrato** deve considerar aditivos e vigência (`getCurrentValue`).

### Aditivos
- Diferenciar:
  - **informativo** (`isInformativeAddendum`)
  - **pontual ativo** (`getActivePunctualAddendum`)
  - **permanente mais recente** (`getMostRecentPermanentAddendum`)
- Para alertas de término de aditivo pontual, usar `getPunctualAddendumEndingSoon`.

### Reajustes (IPCA / Dissídio)
- Lógica de lembretes deve seguir:
  - `shouldShowDissidioReminder`
  - `shouldShowIPCAReminder`
  (ambas em `src/lib/contractUtils.ts`)

### DRE e competência (importação/normalização)
- Competência deve ser parseada/normalizada consistentemente (`parsearColunaCompetencia`).
- Pipeline de importação segue etapas:
  `carregarCategorias` → `processarAba` → `processarExcel`  
  (em `supabase/functions/importar-dre/index.ts`)

### Convenções pt-BR (exibição)
- Para UI/relatórios, manter consistência com:
  - `formatCurrency`
  - `formatDateBR`
  (em `src/lib/contractUtils.ts`)

---

## Recursos relacionados

- [project-overview.md](./project-overview.md)
