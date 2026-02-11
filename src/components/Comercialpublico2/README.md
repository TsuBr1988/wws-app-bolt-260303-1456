# Sistema de Incentivo e Reconhecimento - Grupo WWS

Sistema completo de gestão de vendas, comissões e performance para equipes de SDR e Closers.

## 🚀 Setup Rápido

### 1. Configurar Supabase
```bash
# Aplicar migrações do banco
npm run db:push

# Criar usuário administrativo
npm run create-admin
```

### 2. Variáveis de Ambiente
Crie um arquivo `.env` com:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
SUPA_ADMIN_PASS=sua_senha_admin_segura
```

### 3. Executar Aplicação
```bash
npm run dev
```

## 👤 Login Administrativo
- **Email:** auditoria@grupowws.com.br
- **Senha:** Definida na variável `SUPA_ADMIN_PASS`

## 📊 Funcionalidades

- ✅ **Dashboard** - Visão geral de vendas e comissões
- ✅ **Propostas** - Gestão completa do pipeline de vendas
- ✅ **Comissões** - Cálculo automático baseado em volume
- ✅ **Performance Semanal** - Acompanhamento de métricas por função
- ✅ **Fundo de Bonificação** - Sistema de distribuição proporcional
- ✅ **Destaque do Mês** - Ranking e gamificação
- ✅ **Configurações** - Metas, comissões e funcionários

## 🔧 Tecnologias

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Netlify
- **Autenticação:** Supabase Auth com RLS

## 📈 Sistema de Comissões

### Escala Progressiva (baseada no volume mensal):
- **0,4%** - Até R$ 600.000
- **0,8%** - R$ 600.000 - R$ 1.200.000 (SUPERMETA)
- **1,2%** - Acima de R$ 1.200.000 (MEGAMETA)

### Distribuição:
- **Closer:** Recebe a % completa do valor global
- **SDR:** Recebe a mesma % que o Closer (quando indicado na proposta)

## 🎯 Performance Semanal

### Métricas Closers:
- Propostas apresentadas (30 pts)
- Conexões totais (1 pt)
- Contrato assinado (50 pts)

### Métricas SDRs:
- Contatos ativados (1 pt)
- MQL (5 pts)
- Visitas agendadas (10 pts)
- Conexões totais (1 pt)

## 💰 Fundo de Bonificação

### Contribuições por contrato fechado:
- **R$ 50,00** fixo
- **0,01%** do valor global

### Distribuição:
- Proporcional aos meses trabalhados no ano
- Apenas funcionários não-administrativos
- Pagamento manual com zeragem do fundo

## 🔐 Segurança

- **RLS (Row Level Security)** otimizado para performance
- **Políticas específicas** por operação (SELECT, INSERT, UPDATE)
- **Autenticação leve** apenas para controle de permissões
- **Base de dados única** compartilhada entre todos os usuários
- **Cache inteligente** para evitar consultas desnecessárias

### Políticas RLS Configuradas

#### Tabela `user_profiles`:
- **"Allow logged-in users to read their own profile"**: Usuário lê apenas seu próprio registro de perfil (outros dados, não a role)
- **"Allow logged-in users to insert own profile"**: Usuário pode criar apenas seu próprio registro de perfil
- **"Allow logged-in users to update own profile"**: Usuário pode atualizar apenas seu próprio registro de perfil
- **"Admins can manage all user profiles"**: Administradores podem gerenciar todos os registros de perfil

#### Outras Tabelas:
- **Leitura universal**: Todos os usuários autenticados podem visualizar dados
- **Edição por role**: 
  - **Admin**: Pode editar todas as tabelas
  - **Closer/SDR**: Pode editar apenas propostas

### Fluxo de Autenticação Otimizado

1. **Login**: Apenas autenticação via Supabase Auth
2. **Role**: A role (admin/closer/sdr) é lida diretamente do `user_metadata` do objeto `user` retornado pelo Supabase Auth.
3. **Perfil (Opcional)**: Busca dados adicionais do perfil (nome, avatar, etc.) da tabela `user_profiles` (se necessário).
4. **Cache**: Armazena dados do usuário e perfil por 5 minutos para performance.
5. **Permissões**: Frontend controla edição e visibilidade baseado na role.

## 📝 Estrutura do Banco

### Tabelas Principais:
- `user_profiles` - Perfis de usuário com roles
- `employees` - Funcionários (SDR/Closer/Admin)
- `proposals` - Pipeline de vendas
- `weekly_performance` - Métricas semanais (com cálculo de pontos no banco)
- `system_configurations` - Configurações do sistema
- `bonus_contributions` - Histórico do fundo de bonificação

### Enums:
- `user_role` - admin, closer, sdr
- `employee_role` - SDR, Closer, Admin
- `proposal_status` - Proposta, Negociação, Fechado, Perdido

## 🚀 Deploy

O sistema está configurado para deploy automático no Netlify. Basta conectar o repositório e as variáveis de ambiente.

---

**Desenvolvido para Grupo WWS** 🔥
