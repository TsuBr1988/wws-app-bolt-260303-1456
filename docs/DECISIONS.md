# Decisões (ADR-lite)

Registre aqui decisões que afetam o futuro do projeto.

Use este arquivo especialmente para decisões de **arquitetura modular**, por exemplo:
- duplicação intencional de dados entre módulos
- JOIN entre tabelas de módulos diferentes por motivo de performance
- mudanças de ownership de tabelas
- criação de um módulo compartilhado (core/shared)

## Template
### [AAAA-MM-DD] Título curto
**Contexto:**  
Descreva o problema/necessidade e o que motivou a decisão.

**Decisão:**  
O que foi decidido (objetivo + regra).

**Alternativas consideradas:**  
- Alternativa 1
- Alternativa 2

**Consequências:**  
- Impactos práticos (manutenção, performance, segurança, DX)

## Exemplos de decisões comuns neste template
- Permitir JOIN entre módulos por performance
- Duplicar dados de cliente no orçamento por histórico
- Persistir token sensível no banco (ou proibir) e como proteger (RLS/Vault)
- Definir política de roles (admin/manager/user/viewer)

### [2026-02-20] Solicitações de Marketing (tickets)
**Contexto:**  
Precisávamos criar uma aba de **Solicitações** dentro de Marketing, com comportamento semelhante ao módulo de TI, mas com campos próprios (tipo/departamento/pontos) e sem data de entrega. Também era necessário restringir ações de gestão (editar/mover status/arquivar) para usuários do Marketing/admin.

**Decisão:**  
- Criar um módulo dedicado em `src/components/Comercialprivado2/src/modules/marketing/solicitacoes/`.
- Criar tabelas próprias do módulo: `public.marketing_solicitacoes` (tickets) e `public.marketing_roles` (quem pode gerenciar).
- Aplicar permissão de gestão no client (admin ou `marketing_roles.role = 'editor'`), mantendo o mesmo workflow do TI (`A fazer` → `Fazendo` → `Feito`) e UI em Lista + Kanban.

**Alternativas consideradas:**  
- Reaproveitar diretamente o módulo de TI (inviável por schema/campos diferentes).
- Criar permissão via Supabase Auth/RLS (não adotado agora, pois o login atual usa `app_users` e o app consome via anon key no client).

**Consequências:**  
- Evolução modular (ownership de dados do Marketing) e consistência com TI.
- Permissões dependem de regras no client e do cadastro em `marketing_roles`.
- Se RLS for habilitado futuramente, será necessário desenhar políticas compatíveis com o modelo de autenticação do projeto.

### [2026-02-26] Permissões do Marketing na matriz (Configurações → Usuários)
**Contexto:**  
Precisávamos que todas as permissões da aba Marketing (acesso à aba/sub-abas e ações de pedir/editar Solicitações/Atas/Tarefas) fossem configuráveis na mesma matriz existente de permissões (Não visualizar / Observar / Editar), evitando telas paralelas e padronizando o modelo.

**Decisão:**  
- Adotar `public.user_indicator_permissions` como fonte principal para permissões do Marketing, com `page = 'marketing'` e linhas (indicator_name) específicas (ex.: `Marketing > Solicitações`, `Solicitações - Pedir`, `Solicitações - Editar`).
- Manter `public.user_permissions` apenas como controle de acesso à aba (ex.: `page = 'marketing'`), derivado automaticamente quando existir qualquer permissão de indicador para aquela página.
- Manter compatibilidade com o legado `public.marketing_roles` apenas como fallback para gestão de Solicitações, até a migração total.

**Alternativas consideradas:**  
- Criar tabela nova de permissões por ação (mais complexidade e manutenção).
- Guardar tudo em `user_permissions` com níveis (exigiria migração de schema e refator amplo).

**Consequências:**  
- Admin consegue configurar Marketing no mesmo padrão das demais permissões.
- As permissões ficam mais explícitas e auditáveis (linhas/níveis).
- Até remover o legado, existe mais de uma fonte possível (matriz + fallback), então a matriz deve ser tratada como o caminho oficial.

### [2026-02-27] Comercial Privado: campo Empresa em Propostas
**Contexto:**  
No fluxo de Propostas do Comercial Privado (criação, filtros e KPI Estratégico), precisávamos segmentar resultados por “Empresa” com um conjunto fixo de opções para padronizar análises e evitar valores divergentes.

**Decisão:**  
- Adicionar a coluna `public.proposals.empresa` no banco do módulo **COMERCIAL_PRIVADO**.
- Padronizar o campo “Empresa” no UI com as opções: `WWS`, `Worldwide`, `2WS`.

**Alternativas consideradas:**  
- Manter lista dinâmica baseada nos valores existentes no banco (gera inconsistência e dificulta padronização).
- Inferir “Empresa” a partir de outros campos (não confiável e não explícito).

**Consequências:**  
- Novas propostas passam a exigir seleção de Empresa e KPIs podem filtrar com consistência.
- Ambientes sem a migration aplicada podem não persistir o campo até atualizar o schema.
