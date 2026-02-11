# Mobile-first & Responsivo (Desktop)

## Princípio
O layout deve nascer para telas pequenas (mobile). Desktop é melhoria progressiva via breakpoints.

## Regras práticas
- Base (sem media query): assume 360–430px de largura.
- Nunca fixar larguras em px para containers principais; usar `max-width` + padding.
- Tipografia e espaçamentos em `rem` e/ou multiplicadores de `--spacing`.
- Alvos de toque: botões/inputs com pelo menos ~44px de altura.
- Evitar tabelas “cruas” no mobile; preferir cards/stack (ou scroll horizontal com cuidado).

## Breakpoints sugeridos (CSS puro)
- `@media (min-width: 640px)`  (sm)
- `@media (min-width: 768px)`  (md)
- `@media (min-width: 1024px)` (lg)
- `@media (min-width: 1280px)` (xl)

Se estiver usando Tailwind, isso vira:
- `sm:*`, `md:*`, `lg:*`, `xl:*`

## Padrões de layout
### Container
- Mobile: padding lateral confortável
- Desktop: centraliza e limita largura

### Grids
- Mobile: 1 coluna
- Desktop: 2–4 colunas conforme necessidade

Exemplo (1 col → 3 col):
```css
.grid-cards { display: grid; gap: var(--space-4); grid-template-columns: 1fr; }
@media (min-width: 1024px) {
  .grid-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
```

Exemplo equivalente (Tailwind):
- `className="grid gap-3 grid-cols-1 lg:grid-cols-3"`

## Checklist rápido (antes de subir)
- A página funciona em 390x844 (mobile) sem zoom horizontal
- Componentes continuam legíveis em 1366x768 (desktop)
- Inputs/botões clicáveis no touch
