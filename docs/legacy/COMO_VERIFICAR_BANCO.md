# Como Verificar e Corrigir o Banco de Dados

## Problema Comum

Se as abas **RH, Operacional, Compras, Qualidade, Contratos, Cultura e Atas** estiverem **VAZIAS**, significa que o sistema está conectado ao banco de dados ERRADO.

## Solução Rápida

### Opção 1: Script Automático

Execute o script de verificação:

```bash
./verificar-banco.sh
```

Se detectar erro, ele corrigirá automaticamente. Depois execute:

```bash
npm run build
```

### Opção 2: Correção Manual

1. Abra o arquivo `.env`
2. Verifique se as primeiras linhas são:

```env
VITE_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzAsImV4cCI6MjA3NDQ5NzczMH0.p_al_To4ZlYDgMKCaJU_PyOOXia2BLStvylddXMvog4
```

3. Se estiver diferente, copie o arquivo `.env.correct`:

```bash
cp .env.correct .env
```

4. Execute o build:

```bash
npm run build
```

5. Recarregue a página com **Ctrl+Shift+R**

## Como Identificar o Problema

### Sinais de Banco ERRADO:
- Abas vazias (sem dados)
- Login não funciona
- Sistema trava na tela de carregamento

### Sinais de Banco CORRETO:
- Todas as abas têm dados
- Login funciona normalmente
- Sistema carrega rapidamente

## URLs dos Bancos

### ✅ CORRETO (Sistema Principal)
```
https://vehbyoihnkxzblsmlpdz.supabase.co
```

### ❌ INCORRETO (Banco Antigo - NÃO USAR)
```
https://ccbafepmznoltyeukueg.supabase.co
```

## Arquivos de Backup

Caso precise restaurar as configurações corretas:

- `.env.correct` - Configuração correta completa
- `docs/legacy/CONFIGURACAO_BANCOS_DE_DADOS.md` - Documentação completa
- `verificar-banco.sh` - Script de verificação automática

## Fluxo de Correção

```
┌─────────────────────┐
│  Sistema com Abas   │
│      Vazias         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Executar            │
│ ./verificar-banco.sh│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ npm run build       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Ctrl+Shift+R        │
│ (recarregar página) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ✅ Sistema OK!      │
│ Abas com dados      │
└─────────────────────┘
```

## Prevenção

Para evitar que o problema aconteça novamente:

1. **NÃO altere** manualmente o arquivo `.env` sem verificar
2. **SEMPRE use** o arquivo `.env.correct` como referência
3. **Execute** `./verificar-banco.sh` antes de fazer alterações
4. **Documente** qualquer mudança em `docs/legacy/CONFIGURACAO_BANCOS_DE_DADOS.md`
