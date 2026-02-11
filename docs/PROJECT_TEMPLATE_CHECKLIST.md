# Checklist — Novo Sistema (padrão do template)

Use este checklist sempre que criar um sistema novo baseado neste template.

## 1) Inicialização do projeto
- [ ] Duplicou/clone o template
- [ ] Renomeou `name` em `package.json`
- [ ] Atualizou `title/description` em `src/app/layout.tsx`
- [ ] Confirmou que o tema está importado em `src/app/globals.css`
- [ ] Rodou `npm install`

## 2) Supabase (ambiente)
- [ ] Criou projeto no Supabase
- [ ] Preencheu `.env` a partir de `.env.example`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] (Opcional, server-side) `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Criou o schema mínimo (se for usar Configurações/roles):
  - [ ] `app_settings`
  - [ ] `user_profiles`
  - Ver: [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md)

## 3) Padrões obrigatórios (UI)
- [ ] Mobile-first: base para mobile, desktop só com `min-width` (`sm/md/lg/xl`)
  - Ver: [RESPONSIVE.md](RESPONSIVE.md)
- [ ] Mesma aparência: usar tokens do tema (evitar cores hard-coded)
  - Ver: [UI_THEME.md](UI_THEME.md)
- [ ] Usar helpers de layout do template:
  - [ ] `.app-container` para largura/padding
  - [ ] `.app-card` para superfícies
  - [ ] `.app-control` para inputs/botões

## 4) Estrutura de layout (todas as páginas)
- [ ] Todas as páginas estão dentro do layout compartilhado (topo/menu/rodapé)
- [ ] Menu contém os módulos principais + `/configuracoes`

## 5) Configurações (sempre presente)
- [ ] Existe a página `/configuracoes`
- [ ] Integrações **não sensíveis** podem ser mantidas em `app_settings`
- [ ] Segredos/tokens sensíveis ficam em variáveis de ambiente
- [ ] Se decidir guardar token no banco, registrar em [DECISIONS.md](DECISIONS.md) e aplicar RLS/segurança

## 6) Módulos (crescimento do sistema)
- [ ] Para cada módulo novo:
  - [ ] Criou rota: `src/app/<rota>/page.tsx`
  - [ ] Criou domínio: `src/modules/<modulo>/...`
  - [ ] Criou tabelas do módulo (o módulo é dono dos dados)
  - [ ] Integrações com outros módulos via serviços/contratos (sem acessar tabelas alheias diretamente)
  - Ver: [MODULES.md](MODULES.md)

## 7) Qualidade antes de subir
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Abriu as rotas principais e conferiu mobile + desktop
  - [ ] 390x844 (mobile)
  - [ ] 1366x768 (desktop)

## 8) Deploy (Hostinger)
- [ ] Configurou variáveis no painel (sem `.env` no repo)
- [ ] Setou comando de build: `npm run build`
- [ ] Setou comando de start: `npm run start`
- [ ] Validou domínio/subdomínio
- [ ] Abriu `/` e `/configuracoes` em produção
  - Ver: [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md)
