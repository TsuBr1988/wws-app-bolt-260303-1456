# Deploy (Hostinger)

Este projeto é um **Vite (React SPA)**.

Na Hostinger, o padrão que usamos é **Deployments** (preset Vite), gerando e servindo o `dist/`.
Também existe alternativa via **Web Hosting (public_html)** ou **Node.js gerenciado**.

## Variáveis de ambiente (produção)
Configurar no painel da Hostinger (antes do build):
- `VITE_SUPABASE_GERAL_URL`
- `VITE_SUPABASE_GERAL_ANON`
- `VITE_SUPABASE_FINANCAS_URL`
- `VITE_SUPABASE_FINANCAS_ANON`
- `VITE_SUPABASE_COMERCIAL_PRIVADO_URL`
- `VITE_SUPABASE_COMERCIAL_PRIVADO_ANON`
- `VITE_SUPABASE_COMERCIAL_PUBLICO_URL`
- `VITE_SUPABASE_COMERCIAL_PUBLICO_ANON`

Observação importante (Vite):
- Essas variáveis são injetadas no bundle no **momento do build**. Então elas precisam estar definidas quando o Hostinger executar `npm run build`.

Se essas variáveis não estiverem configuradas, o deploy pode até concluir, mas o app pode quebrar em runtime ao tentar inicializar o Supabase.

Nota: alguns scripts legados do repo podem citar `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, mas o app principal usa o padrão multi-projeto acima.

---

## Padrão do time — Hostinger Deployments (preset Vite)

### Configuração (igual ao painel)
- **Framework preset:** Vite
- **Root directory:** `/` (a raiz do zip precisa conter `package.json`)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Package manager:** npm

### Como enviar os arquivos
- Faça upload de um `.zip` **do código-fonte** (sem `node_modules`).
- Importante: o zip deve conter `package.json` na raiz (evite zipar “a pasta pai” e deixar o projeto um nível abaixo).

### Troubleshooting: 403 Forbidden no domínio
Na Hostinger, 403 normalmente indica que o servidor não encontrou um arquivo inicial/publicável (ex: `dist/index.html`) ou o domínio não está apontando para o deployment.

Caso campeão (muito comum em subdomínios):
- O subdomínio está com **Document root / Pasta** apontando para `public_html/`, mas **não existe** `public_html/index.html`.
- Como o servidor não permite listar diretórios, o resultado é **403 Forbidden**.

Como confirmar rápido:
1. Hostinger → Domains → Subdomains → editar o subdomínio → ver **Document root / Pasta**.
2. Hostinger → Files → File Manager → abrir essa mesma pasta → conferir se existe `index.html` na raiz.

Como corrigir:
- Apontar o Document root para a pasta que realmente contém o `index.html` publicado.
- Alternativamente, copiar o conteúdo do build (ex.: `dist/` → `public_html/`).

Observação prática:
- Mesmo usando **Deployments**, alguns ambientes/plans podem materializar o artefato publicado em uma pasta diferente (por exemplo, `nodejs/`). O importante é: o Document root do subdomínio precisa apontar para a pasta que contém `index.html`.

Checklist:
1. Veja os logs do deployment e confirme que o build terminou com sucesso.
2. Confirme que o artefato publicado contém `dist/index.html`.
3. Confirme que o domínio/subdomínio está vinculado a esse deployment (e não a outro site/pasta vazia).
4. Confirme que as `VITE_SUPABASE_*_URL`/`VITE_SUPABASE_*_ANON` estão configuradas antes do build.

Sinal de que você está servindo HTML de DEV (e não o `dist/`):
- No DevTools/Console aparece tentativa de WebSocket para `ws://localhost:8081/`.
- Em “View page source” existem referências como `@vite/client` ou `src/main.tsx`.

Correção:
- Garanta que o subdomínio está servindo o build (`index.html` + `assets/`) e não o código-fonte.

## Opção A — Web Hosting (estático / public_html)

### Passo a passo
1. Rode localmente: `npm install` e `npm run build`.
2. No File Manager do Hostinger, abra `public_html/`.
3. **Envie o conteúdo de `dist/`** (o `index.html` e a pasta `assets/`) para dentro de `public_html/`.
	- Importante: não envie a pasta `dist/` “por cima” (ex: `public_html/dist/index.html`). O `index.html` precisa ficar em `public_html/index.html`.
4. Confirme que existe `public_html/index.html`.

### SPA routes (React Router)
Este repo inclui um `.htaccess` em `public/.htaccess` que o Vite copia para `dist/.htaccess`.
Ao subir o `dist/` para `public_html/`, isso habilita fallback de rotas para `/index.html`.

### Se estiver dando 403 Forbidden no `/`
Geralmente é uma destas causas:
- `public_html/` não tem `index.html` (ou você enviou o projeto inteiro, mas não o `dist/`).
- Permissões incorretas (pastas `755`, arquivos `644`).
- Um `.htaccess` com regras de `Deny`/bloqueio.

Checklist rápido:
- Verifique se `public_html/index.html` existe e abre pelo File Manager.
- Se existir `.htaccess` antigo, renomeie temporariamente para testar (ex: `.htaccess-disabled`).
- Ajuste permissões para o padrão (755/644).

## Opção B — Hostinger Node.js gerenciado

### Objetivo
Rodar o app em ambiente Node.js gerenciado e servir o `dist/` via `server.mjs`.

### Pré-requisitos
- Node.js 20+ (ou versão suportada pela sua hospedagem)

### Passo a passo (hPanel)
1. Hostinger → Websites → Manage → **Advanced** → **Node.js**.
2. **Create application** (ou equivalente).
3. Configurar:
	- **Application root**: a pasta onde está o `package.json`.
	- **Application URL**: selecione/crie o subdomínio (ex.: `baseteste.grupowws.com.br`).
	- **Application startup file**: `server.mjs`.
	- **Node version**: 20+.
4. Em **Environment variables** da aplicação:
	- Defina todas as `VITE_SUPABASE_*_URL`/`VITE_SUPABASE_*_ANON` (essas variáveis precisam existir **antes** do build).
5. Rode:
	- `npm install`
	- `npm run build`
6. Reinicie a aplicação (Restart).

Validação:
- Abra `https://baseteste.grupowws.com.br/health` e confirme `{"ok":true}`.
- Abra `/` e confirme que os assets em `/assets/...` carregam.

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

## Nota sobre Document root / public_html
- Em Node.js gerenciado, o que manda é o **Application URL** estar vinculado à aplicação Node.
- Se o subdomínio ainda estiver servindo `public_html/` (e der 403), é sinal de que o subdomínio **não** está vinculado à aplicação Node, ou está vinculado ao site errado.

## Observações
- Se você usar `SUPABASE_SERVICE_ROLE_KEY`, garanta que chamadas que usam essa chave rodam apenas em Server Components/rotas server-side.
