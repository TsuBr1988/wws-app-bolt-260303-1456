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
