#!/bin/bash

# Script para verificar se o banco de dados está configurado corretamente

echo "🔍 Verificando configuração do banco de dados..."
echo ""

# Ler a URL atual do .env
current_url=$(grep "^VITE_SUPABASE_URL=" .env | cut -d '=' -f2)

# URL correta
correct_url="https://vehbyoihnkxzblsmlpdz.supabase.co"

echo "URL atual:   $current_url"
echo "URL correta: $correct_url"
echo ""

if [ "$current_url" = "$correct_url" ]; then
    echo "✅ Banco de dados configurado CORRETAMENTE!"
    echo ""
    echo "Abas que devem ter dados:"
    echo "  - RH"
    echo "  - Operacional"
    echo "  - Compras"
    echo "  - Qualidade"
    echo "  - Contratos"
    echo "  - Cultura"
    echo "  - Atas e Ações"
    echo "  - Finanças"
    exit 0
else
    echo "❌ ERRO: Banco de dados INCORRETO!"
    echo ""
    echo "Corrigindo automaticamente..."

    # Copiar arquivo correto
    cp .env.correct .env

    echo "✅ Arquivo .env corrigido!"
    echo ""
    echo "⚠️  IMPORTANTE: Execute 'npm run build' para aplicar as mudanças"
    exit 1
fi
