# Configuração da IA (Google Gemini)

O relatório do CFO utiliza o **Google Gemini** (gratuito) para gerar insights inteligentes sobre seus dados financeiros.

## Passo a Passo para Configurar

### 1. Obter a Chave de API do Google Gemini

1. Acesse: **https://aistudio.google.com/app/apikey**
2. Faça login com sua conta Google
3. Clique no botão **"Create API Key"** (ou "Get API Key")
4. Selecione um projeto do Google Cloud (ou crie um novo)
5. Copie a chave gerada (começará com `AIza...`)

**A API do Gemini é GRATUITA** e oferece um limite generoso de requisições por dia.

### 2. Adicionar a Chave no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Localize a linha: `VITE_GEMINI_API_KEY=SUA_CHAVE_AQUI`
3. Substitua `SUA_CHAVE_AQUI` pela sua chave copiada
4. Exemplo:
   ```
   VITE_GEMINI_API_KEY=AIzaSyBOti4mM-6x9WDnZIjIey...
   ```

### 3. Reiniciar o Servidor de Desenvolvimento

Após adicionar a chave, você precisa **reiniciar o servidor**:

```bash
# Pare o servidor (Ctrl+C) e reinicie:
npm run dev
```

### 4. Testar o Relatório CFO

1. Acesse a página de **Dashboard** no módulo Finanças
2. Role até o final da página
3. Clique no botão **"Gerar Insights CFO"**
4. Aguarde alguns segundos enquanto a IA analisa os dados
5. O relatório completo aparecerá abaixo do botão

## O que o Relatório CFO Inclui

- ✅ **Saldo Atual e Projeções** (próximos 3 meses)
- ✅ **Top 10 Principais Despesas** do mês
- ✅ **Análise de Inadimplência** (total, média de dias, top 5 clientes)
- ✅ **KPIs do Mês** (faturamento, margem, WWS, Worldwide)
- ✅ **Insights com IA**:
  - Análise do mês atual
  - Análise anual
  - Riscos identificados
  - Ações estratégicas recomendadas

## Solução de Problemas

### Erro: "Não foi possível gerar insights"

- **Causa**: Chave de API não configurada ou inválida
- **Solução**:
  1. Verifique se copiou a chave corretamente
  2. Certifique-se de que não há espaços extras
  3. Reinicie o servidor após adicionar a chave

### Erro: "Quota exceeded"

- **Causa**: Limite diário de requisições atingido (raro no plano gratuito)
- **Solução**: Aguarde 24 horas ou crie uma nova chave de API

## Segurança

⚠️ **IMPORTANTE**: Nunca compartilhe sua chave de API publicamente ou commite o arquivo `.env` no Git!

O arquivo `.env` já está no `.gitignore` para evitar exposição acidental.

## Links Úteis

- 🔑 [Obter Chave de API do Gemini](https://aistudio.google.com/app/apikey)
- 📚 [Documentação do Google Gemini](https://ai.google.dev/docs)
- 💰 [Limites e Preços](https://ai.google.dev/pricing)
