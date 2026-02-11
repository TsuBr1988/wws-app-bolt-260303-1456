# Módulos (arquitetura modular)

## Objetivo
Permitir que o sistema cresça ao longo do tempo adicionando **módulos novos** que se integram ao restante do sistema, mantendo organização e baixo acoplamento.

Regra do template: todo sistema nasce com o módulo **Configurações** (`/configuracoes`).

## O que é um módulo
Um módulo é uma unidade de negócio com:
- Escopo claro (um “domínio”)
- Regras de negócio próprias
- Tabelas próprias (o módulo é o **dono** dos dados)
- Uma interface de integração (serviços/repositórios/endpoints) para outros módulos consumirem

## Regra de ouro: ownership de dados
- Cada tabela “pertence” a um módulo.
- Outros módulos **não** acessam diretamente as tabelas que não são suas.
- Integração deve ocorrer via:
  - serviço do módulo dono (ex: `ClientesService`), e/ou
  - repositório/fachada do módulo dono, e/ou
  - endpoint interno do módulo dono (quando aplicável)

Isso reduz o risco de quebrar o sistema quando um módulo evolui.

## Integração entre módulos
### Referências
- Módulos referenciam entidades externas por ID.
- Exemplo: o módulo Orçamento guarda `cliente_id` (referência ao módulo Clientes).

### Leitura
- Para exibir dados agregados (ex: listar orçamentos com nome do cliente), o módulo agregador consulta o módulo dono.
- Evite JOIN cruzando tabelas de módulos diferentes como padrão (só usar se você decidir registrar essa exceção em DECISIONS).

### Escrita
- Somente o módulo dono deve fazer escrita nos seus dados.
- Se um fluxo precisar alterar dados de outro módulo, chame uma ação do módulo dono (ex: “atualizar status do cliente”).

## Padrão de pastas (sugestão)
Padrão recomendado (Next.js + TS):
- UI/rotas: `src/app/<rota>/page.tsx`
- Domínio do módulo: `src/modules/<modulo>/...`

Exemplo:
- `src/app/clientes/page.tsx`
- `src/modules/clientes/clientes.repo.ts`
- `src/modules/clientes/clientes.service.ts`

Cada módulo pode conter:
- `controllers/` (entrada/rotas)
- `services/` (regras de negócio)
- `repositories/` (acesso a dados)
- `views/` (telas/páginas do módulo)
- `migrations/` (schema do módulo)

Em Next.js (App Router), páginas ficam em `src/app/<rota>/page.tsx` e podem consumir componentes/serviços do módulo em `src/modules/<modulo>/...`.

## Layout compartilhado (todas as páginas)
Todas as páginas devem usar um layout base com:
- Topo (header)
- Menu (nav/sidebar)
- Conteúdo (slot)
- Rodapé (footer)

Regra: o módulo só entrega o **conteúdo**; o layout é reutilizado.

No template, isso já existe em `src/app/layout.tsx`.

## Exemplos (do seu cenário)
### Módulo: Clientes
- Tabelas: `clientes` (e auxiliares se necessário)
- Funções: CRUD completo, validação de dados, status, observações
- Interface para outros módulos:
  - `getById(id)`
  - `search(filters)`

### Módulo: Tabela de Preço
- Tabelas: `tabela_preco_itens` (ou similar)
- Funções: CRUD de serviços/itens, preços, horas, regras
- Interface:
  - `getItemById(id)`
  - `listAtivos()`

### Módulo: Orçamento
- Tabelas: `orcamentos`, `orcamento_itens`
- Funções: criar orçamento, adicionar itens, calcular totais, histórico
- Integrações:
  - consulta Clientes para escolher/exibir cliente
  - consulta Tabela de Preço para selecionar itens e copiar valores para o orçamento

### Módulo: Configurações
- Tabelas (opcional): `app_settings`
- Funções: manter chaves de integração, parâmetros do sistema e toggles
- Observação: tokens/chaves sensíveis preferir variáveis de ambiente
- UI: `/configuracoes`

### Módulo: Usuários & Níveis
- Tabelas (opcional): `user_profiles`
- Funções: atribuir `role` por usuário e controlar acesso por permissões

Schema sugerido: [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md)

## Quando registrar uma decisão (ADR-lite)
Registre em [DECISIONS.md](DECISIONS.md) quando você:
- permitir JOIN entre módulos em consultas críticas
- duplicar dados entre módulos (ex: copiar nome do cliente para o orçamento)
- mudar ownership de uma tabela
- criar um “módulo core/shared”
