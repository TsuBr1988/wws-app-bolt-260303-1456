# UI Patterns (consistência visual)

Objetivo: manter **todos os sistemas com a mesma aparência** usando Tailwind + tokens Amber Minimal.

Regras:
- Use `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-accent`
- Evite `bg-[#...]`, `text-[#...]` e sombras inventadas
- Mobile-first: `grid-cols-1` no base; aumente colunas com `sm:`/`lg:`

## Página (estrutura)
- Wrapper: `className="grid gap-4"`
- Card padrão: `className="app-card p-4"`
- Cabeçalho de página: título + descrição curta

Exemplo (header):
- `className="app-card p-4"`
- Título: `className="text-base font-semibold"`
- Descrição: `className="text-sm text-muted-foreground mt-1"`

## Botões (padrão)
- Primário: `className="app-control bg-foreground text-background hover:bg-foreground/90"`
- Neutro: `className="app-control"`

## Inputs/Select/Textarea
- Sempre usar `app-control` + largura:
  - input: `className="app-control w-full"`
  - select: `className="app-control w-full"`

## Cards clicáveis (lista de módulos)
- `className="app-card p-3 hover:bg-accent"`
- Texto secundário: `text-xs text-muted-foreground`

## Listas responsivas
- Grid simples:
  - `className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"`

## Tabela (quando precisar)
Preferir cards no mobile. Se usar tabela:
- Container com overflow no mobile:
  - `className="app-card p-0 overflow-x-auto"`
- Tabela:
  - `className="min-w-[720px] w-full text-sm"`
- Cabeçalho:
  - `className="text-xs text-muted-foreground border-b border-border"`

## Erros e avisos
- Erro: `className="text-xs text-destructive"`
- Ajuda: `className="text-xs text-muted-foreground"`
