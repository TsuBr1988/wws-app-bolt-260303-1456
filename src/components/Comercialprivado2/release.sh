#!/bin/bash
set -e

BRANCH=$(git branch --show-current)
echo "📦 Enviando alterações para $BRANCH"

git add -A
git commit -m "release: $(date '+%d/%m/%Y %H:%M')" || echo "⚠️ Nada novo para commitar"
git push origin "$BRANCH"

echo "✅ Enviado. O Netlify fará o deploy automaticamente."
echo "🔗 Verifique o status em: https://app.netlify.com"