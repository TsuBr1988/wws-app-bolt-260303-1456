---
name: hostinger-deploy
description: Use quando precisar publicar/depurar deploy na Hostinger (Deployments/Vite, Web Hosting/public_html ou Node.js gerenciado) e especialmente quando houver erro 403/rotas SPA.
phases: [P, E, V, C]
mode: false
---

# Hostinger Deploy (Vite SPA)

## Quando usar
- Deploy do app na Hostinger (principalmente **Deployments** com preset **Vite**).
- Erros de produção como **403 Forbidden**, build que “passa” mas site não abre, ou rotas do React Router quebrando.
- Precisar relembrar o padrão do time (build command / output dir / env vars).

## Padrão do time (Deployments)
No painel da Hostinger (Deployments):
- Framework preset: **Vite**
- Root directory: **/** (o `package.json` precisa estar na raiz do zip)
- Build command: **npm run build**
- Output directory: **dist**
- Package manager: **npm**
- Node: **20+** (22 também costuma funcionar)

## Variáveis de ambiente (obrigatórias)
Configurar no painel **antes do build**:
- `VITE_SUPABASE_GERAL_URL`
- `VITE_SUPABASE_GERAL_ANON`
- `VITE_SUPABASE_FINANCAS_URL`
- `VITE_SUPABASE_FINANCAS_ANON`
- `VITE_SUPABASE_COMERCIAL_PRIVADO_URL`
- `VITE_SUPABASE_COMERCIAL_PRIVADO_ANON`
- `VITE_SUPABASE_COMERCIAL_PUBLICO_URL`
- `VITE_SUPABASE_COMERCIAL_PUBLICO_ANON`

Observação: no Vite, variáveis `VITE_*` entram no bundle no build. Se não estiverem definidas, o deploy pode publicar, mas o app pode quebrar em runtime.

Nota: alguns scripts legados do repo podem citar `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, mas o app principal usa o padrão multi-projeto acima.

## Como empacotar (zip)
- Enviar **código-fonte** (não incluir `node_modules`).
- O `.zip` deve conter `package.json` **na raiz**.
- Evitar zipar uma pasta “pai” que coloque o projeto um nível abaixo do root directory.

## Diagnóstico rápido de 403 Forbidden
403 na Hostinger costuma ser **servidor** (não é erro do React/Supabase):
1. Confirmar logs do deployment: build concluído com sucesso.
2. Confirmar que o artefato publicado possui `dist/index.html`.
3. Confirmar que o domínio/subdomínio está vinculado ao deployment correto.
4. Se for Web Hosting/manual: checar permissões (pastas 755, arquivos 644) e `.htaccess` bloqueando.

Caso campeão (subdomínio):
- O subdomínio aponta o **Document root** para `public_html/` (ou outra pasta) que **não tem** `index.html`.
- Como listagem de diretório é bloqueada, o resultado vira **403 Forbidden**.

Como confirmar/corrigir:
1. Subdomains → editar → ver a pasta de **Document root**.
2. File Manager → abrir essa pasta → garantir `index.html` na raiz + `assets/`.
3. Se o artefato publicado foi parar em outra pasta (ex.: `nodejs/`), ajustar o Document root para lá **ou** copiar o conteúdo do build para a pasta servida.

Sinal de que você está servindo HTML de DEV (e não o build):
- Console tenta `ws://localhost:8081/`.
- Page Source contém `@vite/client`.

Correção: servir `dist/index.html` + `dist/assets/` (e `.htaccess` para SPA).

## SPA routing (React Router)
- Para Web Hosting (Apache/LiteSpeed), usar `public/.htaccess` (o Vite copia para `dist/.htaccess`).
- Se a plataforma ignorar `.htaccess`, procurar no painel opção equivalente a “SPA fallback / rewrite to index.html”.

## Node.js gerenciado (Hostinger)
Checklist mínimo:
- Node 20+
- Application root = pasta do `package.json`
- Application URL = subdomínio (ex.: `baseteste.grupowws.com.br`)
- Startup file = `server.mjs`
- Definir `VITE_SUPABASE_*` **antes** de rodar `npm run build`
- Rodar `npm install` → `npm run build` → Restart
- Validar `/health`

## Referências no repo
- Guia principal: `docs/DEPLOY_HOSTINGER.md`
- Servidor Node (opção alternativa): `server.mjs`
