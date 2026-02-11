# Abas Vazias? Solução Rápida!

## Se RH, Operacional, Compras, Qualidade, Contratos, Cultura ou Atas estiverem VAZIAS:

### Execute estes 3 comandos:

```bash
cp .env.correct .env
npm run build
```

### Depois recarregue a página com: **Ctrl+Shift+R**

---

## Verificação Automática

Para verificar se está tudo correto:

```bash
./verificar-banco.sh
```

---

## Por que isso acontece?

O arquivo `.env` às vezes reverte para o banco antigo (`ccbafepmznoltyeukueg`), que está vazio.

O banco correto é: `vehbyoihnkxzblsmlpdz`

---

## Documentação Completa

- `docs/legacy/COMO_VERIFICAR_BANCO.md` - Guia detalhado
- `docs/legacy/CONFIGURACAO_BANCOS_DE_DADOS.md` - Estrutura completa dos bancos
- `.env.correct` - Backup das credenciais corretas
