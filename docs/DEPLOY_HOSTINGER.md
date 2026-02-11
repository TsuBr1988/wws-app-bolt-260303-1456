# Deploy (Hostinger — Node.js gerenciado)

## Objetivo
Subir o app **Vite (React SPA)** em ambiente Node.js gerenciado e usar Supabase como banco.

## Pré-requisitos
- Projeto criado no Supabase e chaves disponíveis
- Node.js 20+ (ou versão suportada pela sua hospedagem)

## Variáveis de ambiente (produção)
Configurar no painel da Hostinger (antes do build):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Observação importante (Vite):
- Essas variáveis são injetadas no bundle no **momento do build**. Então elas precisam estar definidas quando o Hostinger executar `npm run build`.

Regras:
- Não subir `.env` para o git
- Segredos sempre via painel de variáveis

## Build e start
Scripts do projeto (ver `package.json`):
- Build: `npm run build`
- Start (Node): `npm run start`

Em hospedagem gerenciada, normalmente você configura:
- diretório do projeto
- comando de build
- comando de start
- versão do Node

## Checklist de deploy
- App buildando local com `npm run build`
- `.env` não vai para o git (use variáveis do painel)
- Domínio/subdomínio apontando para a aplicação

## Pós-deploy
- Abra `/` (e páginas do app)
- Confirme que o app carrega sem erros

## Porta
O Hostinger normalmente fornece a porta em `PORT`. O `npm run start` deste projeto respeita `PORT` automaticamente.

## Observações
- Se você usar `SUPABASE_SERVICE_ROLE_KEY`, garanta que chamadas que usam essa chave rodam apenas em Server Components/rotas server-side.
