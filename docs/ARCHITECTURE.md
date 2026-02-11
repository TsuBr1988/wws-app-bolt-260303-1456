# Arquitetura

## Visão geral
Este sistema é **modular**: novas funcionalidades entram como **módulos** independentes, com suas próprias tabelas e regras, mas capazes de **integrar** com dados de outros módulos via contratos/serviços (sem acoplamento direto).

## Layout (todas as páginas)
Todas as páginas seguem uma estrutura padrão, onde o que muda é apenas o **conteúdo**:
- Topo (header)
- Menu (sidebar/nav)
- Conteúdo da página
- Rodapé (footer)

Regra: topo/menu/rodapé são componentes compartilhados (layout/base), e cada página injeta seu conteúdo no “miolo”.

## Módulos (conceito)
Um módulo é uma unidade de negócio com:
- Responsabilidade clara (ex: "Clientes")
- Tabelas próprias (o módulo é o **dono** dos dados)
- APIs/serviços internos para leitura/escrita por outros módulos

**Importante:** outros módulos não devem acessar diretamente tabelas que não são suas; devem consumir via serviço/repositório/endpoint do módulo dono.

Guia completo: [MODULES.md](MODULES.md)

## Exemplos de módulos
### Clientes
- Objetivo: cadastro completo de clientes
- Dados: tabela(s) do módulo para manter os clientes
- Integrações: módulos como "Orçamento" consultam clientes por um serviço do módulo

### Tabela de Preço
- Objetivo: manter serviços/itens, preços, horas e regras de precificação
- Dados: tabela(s) do módulo para itens e valores
- Integrações: "Orçamento" puxa itens e valores para compor propostas

### Orçamento
- Objetivo: gerar e registrar orçamentos
- Dados: tabela(s) do módulo para orçamentos e itens do orçamento
- Integrações: consome "Clientes" (cliente selecionado) e "Tabela de Preço" (itens/valores)

### Configurações
- Objetivo: centralizar integrações e parâmetros do sistema
- UI: rota `/configuracoes`
- Dados: `app_settings` (opcional) + variáveis de ambiente para segredos

## Padrões de integração entre módulos
- Referências entre módulos via IDs (ex: `cliente_id`, `item_preco_id`)
- Consultas via serviços do módulo dono (ex: `ClientesService.getById()`)
- Fluxos que agregam dados (ex: montar orçamento) vivem no módulo agregador (ex: "Orçamento")

## Mapeamento no projeto atual (Vite + React)
- Layout/base compartilhado: `src/components/layout/*` (ex: Header)
- Páginas/abas: `src/pages/*` (conteúdo de cada área)
- Módulos (domínio + UI específica): `src/modules/<modulo>/*`
- Integrações/infra (Supabase, utilitários): `src/lib/*`

## Padrões de código
- Validação: entradas validadas na borda (controller/handler) e regras de negócio no módulo
- Erros: formato consistente (mensagens úteis e tratáveis)
- Logs: registrar eventos de negócio importantes e erros
- Camadas (se aplicável): controller/service/repository

## Frontend/UI
- Tema: tokens Amber Minimal (ver docs/UI_THEME.md)
- Responsividade: mobile-first (ver docs/RESPONSIVE.md)
