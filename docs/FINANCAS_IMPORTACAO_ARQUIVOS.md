# Finanças — Importação de arquivos (XLSX/CSV/TXT)

## Onde fica o código
- Parser de arquivos (linhas → transações): `src/modules/financas/utils.ts` (`parseFinanceFile`)
- UI do upload/processamento: `src/modules/financas/components/Features/files/FilesTab.tsx`
- Salvamento no Supabase: `FilesTab.tsx` (tabela `transactions` + `daily_balances`)

## Formatos suportados
- **XLSX / XLSM**: lidos via ExcelJS no browser.
- **CSV / TXT / TSV**: lidos como texto com detecção automática de separador (`\t`, `;` ou `,`).

Observação: **`.xls` (Excel antigo)** não é suportado pelo loader usado no browser. Se receber `.xls`, exporte/"Salvar como" `.xlsx`.

## Como o parser identifica as colunas
O parser procura um "cabeçalho" e tenta mapear índices por aproximação.

### Detecção de linha de cabeçalho
Alguns relatórios exportados têm:
- linha de título antes do cabeçalho,
- linhas vazias,
- ou mais de um bloco.

Por isso, o parser **varre as primeiras ~30 linhas** e escolhe a linha com melhor pontuação (prioriza presença de coluna de **valor** e de colunas de **data**).

### Colunas esperadas (por token)
O parser normaliza cabeçalhos (minúsculas e sem acentos) e procura, por exemplo:

- **Valor**: `valor`, `total`, `liquido`, `montante`
- **Vencimento**: `vencimento`, `vencto`, `venc`
- **Pagamento/Recebimento**: `pagamento`, `recebimento`, `baixa`, `liquidacao`
- **Competência**: `competencia`, `compet`
- **Descrição**: `desc`, `hist`, ou fallback para `fornecedor`/`cliente`/`nome`
- **Categoria**: `cat`, `class`, `grupo`, `conta`, `plano`
- **Centro de custo**: `centro`, `custo`, `dep`, `cc`, `projeto`

Se a coluna de **valor** não for encontrada, o arquivo é ignorado (retorna 0 transações).

## Leitura de XLSX no browser (detalhes)
- O loader usa `file.arrayBuffer()` e passa **`Uint8Array`** para `workbook.xlsx.load(...)`.
  - Isso evita casos em que o ExcelJS, dependendo do bundler/runtime, falha ao interpretar o buffer.
- Para cada célula, o parser **prefere `cell.text`**.
  - Isso preserva formatação do Excel (datas e moeda) e evita datas como número serial (ex.: `45234`) quebrarem a conversão.

## Depuração rápida
1. Abra o console e verifique se aparece log do tipo:
   - `Erro ao ler como Excel (...), tentando fallback...`
   Se isso acontecer em `.xlsx`, o arquivo pode estar corrompido, ser `.xls` renomeado, estar protegido/senhas, ou ter sido gerado por uma ferramenta não compatível.

2. Se o processamento termina com:
   - `Iniciando processamento de 0 transações...`
   então o parser não encontrou cabeçalho/coluna de valor, ou o arquivo está vazio.

3. Se a UI mostra dados mas o banco não reflete:
   - conferir se o módulo está usando o Supabase correto e se há permissões/RLS para `transactions` e `daily_balances`.

## Inserção no banco (Supabase)
O fluxo padrão do upload:
- Apaga registros anteriores de `transactions`
- Insere em lote (batch de 100)
- Faz `upsert` de `daily_balances`

Se der erro no batch, o código tenta retry linha-a-linha e loga no console os IDs que falharam.
