#!/bin/bash

# ============================================
# Script de Exportação - Comercial Privado
# ============================================

echo "==================================="
echo "Exportar Dados - Comercial Privado"
echo "==================================="
echo ""

# Solicitar credenciais
read -p "Host do Supabase (ex: abc123.supabase.co): " ORIGEM_HOST
read -sp "Senha do banco: " ORIGEM_SENHA
echo ""
echo ""

export PGPASSWORD="$ORIGEM_SENHA"

# Tabelas principais
TABELAS="employees proposals probability_scores weekly_performance campaigns challenges marketing_instagram marketing_linkedin commercial_goals actions meeting_minutes marketing_planning_posts individual_prospection"

echo "Exportando dados..."
echo ""

pg_dump \
  -h "$ORIGEM_HOST" \
  -U postgres \
  -d postgres \
  --data-only \
  --column-inserts \
  $(for t in $TABELAS; do echo "-t $t"; done) \
  > dados_comercial_privado.sql 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✓ Dados exportados"
  echo ""

  echo "Ajustando nomes de tabelas (adicionando prefixo cp_)..."

  # Adicionar prefixo cp_ em todas as tabelas
  for tabela in $TABELAS; do
    sed -i "s/INSERT INTO $tabela/INSERT INTO cp_$tabela/g" dados_comercial_privado.sql
    sed -i "s/INSERT INTO public.$tabela/INSERT INTO cp_$tabela/g" dados_comercial_privado.sql
  done

  echo "✓ Nomes ajustados"
  echo ""
  echo "==================================="
  echo "✓ Exportação concluída!"
  echo "==================================="
  echo ""
  echo "Arquivo gerado: dados_comercial_privado.sql"
  echo ""
  echo "Próximo passo:"
  echo "  1. Importe este arquivo no banco principal"
  echo "  2. Use o SQL Editor do Supabase"
  echo ""
else
  echo ""
  echo "❌ Erro na exportação"
  echo ""
  echo "Verifique:"
  echo "  - Host está correto?"
  echo "  - Senha está correta?"
  echo "  - pg_dump está instalado?"
  echo ""
fi

unset PGPASSWORD
