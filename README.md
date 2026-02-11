# Grupo WWS - Dashboard de Indicadores

Dashboard empresarial para acompanhamento de indicadores de performance nas áreas de RH, Compras, Operacional, Comercial e Financeiro.

## ✨ Funcionalidades

- **Dashboard Multi-Abas**: Organização clara por áreas de negócio
- **Cards Expansíveis**: Interface intuitiva com animações suaves
- **Gráficos Interativos**: Visualização dos últimos 12 meses usando Recharts
- **Tabelas Editáveis**: Edição inline de dados com validação
- **Persistência de Dados**: Armazenamento seguro com Supabase
- **Autenticação**: Sistema de login integrado
- **Responsive Design**: Otimizado para desktop e mobile

## 🚀 Indicadores Implementados

### RH
- **Quantidade de Funcionários**: Gráfico empilhado comparando WWS vs Worldwide

### Financeiro  
- **Faturamento**: Receitas mensais por empresa (WWS vs Worldwide)

### Comercial
- **Vendas Setor Público**: Performance mensal do segmento público
- **Vendas Setor Privado**: Performance mensal do segmento privado

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Componentes**: shadcn/ui (Cards, Tables, Buttons, etc.)
- **Gráficos**: Recharts
- **Animações**: Framer Motion
- **Backend**: Supabase (Database + Auth)
- **Build Tool**: Vite

## ⚙️ Configuração

1. **Clone o repositório e instale as dependências**:
   ```bash
   npm install
   ```

2. **Configure o Supabase**:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Copie a URL e a Anon Key do projeto
   - Renomeie `.env.example` para `.env` e configure:
     ```
     VITE_SUPABASE_URL=sua-supabase-url
     VITE_SUPABASE_ANON_KEY=sua-supabase-anon-key
     ```

3. **Execute as migrações SQL**:
   - No painel do Supabase, vá em SQL Editor
   - Execute o conteúdo do arquivo `supabase/migrations/create_dashboard_tables.sql`

4. **Inicie o projeto**:
   ```bash
   npm run dev
   ```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **hr_headcount**: Dados de funcionários por empresa e mês
- **fin_revenue**: Faturamento por empresa e mês  
- **com_sales**: Vendas por segmento (público/privado) e mês

### Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de acesso apenas para usuários autenticados
- Validações de dados no nível do banco

## 🎨 Design System

- **Cores**: Palette profissional com azul primário (#3B82F6)
- **Tipografia**: Sistema consistente com 3 pesos de fonte
- **Espaçamento**: Grid de 8px para alinhamento perfeito
- **Componentes**: Baseados no shadcn/ui para consistência

## 🔄 Fluxo de Dados

1. **Carregamento**: Busca dados dos últimos 12 meses no Supabase
2. **Visualização**: Renderiza gráficos e popula tabelas editáveis
3. **Edição**: Permite alteração inline com validação em tempo real
4. **Persistência**: Salva alterações via upsert (insert/update)
5. **Atualização**: Re-renderiza gráficos com dados atualizados

## 🚀 Futuras Expansões

- Filtros por período customizado
- Exportação de relatórios (PDF/Excel)
- Notificações por email
- Dashboard executivo com KPIs consolidados
- Integração com APIs externas
- Controle de permissões por usuário

## 📱 Responsividade

- Mobile First: Design otimizado para smartphones
- Breakpoints: 768px (tablet) e 1024px (desktop)
- Navegação adaptativa em dispositivos menores
- Gráficos responsivos com Recharts

## 🔐 Autenticação

- Sistema baseado em Supabase Auth
- Login com email/senha
- Sessões persistentes
- Logout seguro com limpeza de estado

---

**Grupo WWS** - Dashboard corporativo desenvolvido com as melhores práticas de desenvolvimento web moderno.