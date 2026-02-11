# UI Theme — Amber Minimal

## Objetivo
Usar tokens (CSS variables) do tema para evitar cores/fontes/spacing “soltos”.

## Onde fica
Este projeto usa Tailwind como “fonte da verdade” de cores/spacing/fontes.

- Base CSS (fontes e ajustes globais): `src/index.css`
- Tokens/cores/custom utilities: `tailwind.config.js`

## Como usar (HTML/CSS)
1) Carregue o CSS do tema no layout/base.
2) Use as variáveis no seu CSS:
- Background: `var(--background)`
- Texto: `var(--foreground)`
- Borda: `var(--border)`
- Superfícies: `var(--card)`, `var(--popover)`, `var(--muted)`, `var(--accent)`
- Destaque: `var(--primary)`
- Foco: `var(--ring)`
- Radius: `var(--radius)`

## Dark mode
Adicione a classe `dark` em um wrapper (ex: `<html class="dark">` ou `<body class="dark">`) para ativar os tokens do modo escuro.

## Mobile-first (obrigatório)
- Escreva o CSS base para mobile primeiro.
- Só adicione regras de desktop dentro de `@media (min-width: ...)`.
- Evite valores “travados” para containers principais; use `max-width` e `minmax()`.

## Tokens obrigatórios (regra do projeto)
- Não introduzir novas cores hard-coded (hex/rgb/hsl) em componentes/páginas.
- Preferir classes Tailwind (ex: `text-gray-900`, `bg-white`, `bg-brand-dark`) e utilities existentes (ex: `gradient-*`).

## Helpers disponíveis
Para manter o CSS leve, as utilities específicas do projeto (ex: `gradient-*`) ficam no Tailwind.

Ver também: [RESPONSIVE.md](RESPONSIVE.md)
E para padrões de componentes/combinações Tailwind: [UI_PATTERNS.md](UI_PATTERNS.md)

## Tailwind + tokens (como usar)
- Use classes do Tailwind para layout (`grid`, `gap-*`, `p-*`, `lg:*`, etc)
- Para cores, priorize as cores mapeadas para tokens (ex: `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`)
- Evite `text-[#...]` / `bg-[#...]` no app
