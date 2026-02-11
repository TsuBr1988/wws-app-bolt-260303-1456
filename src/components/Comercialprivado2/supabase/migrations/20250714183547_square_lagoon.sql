/*
  # Criar usuário administrativo fixo

  1. Novo usuário administrativo
    - Email: auditoria@grupowws.com.br
    - Senha: Piguinha22@@
    - Role: Admin
    - Acesso total ao sistema

  2. Funcionário associado
    - Cadastro como funcionário Admin
    - Dados básicos para funcionamento do sistema

  3. Perfil de usuário
    - Perfil com role admin
    - Associação com funcionário
*/

-- Inserir funcionário administrativo
INSERT INTO employees (
  id,
  name,
  email,
  avatar,
  department,
  position,
  role,
  points,
  level,
  admission_date
) VALUES (
  gen_random_uuid(),
  'Auditoria Grupo WWS',
  'auditoria@grupowws.com.br',
  'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'Administração',
  'Auditor',
  'Admin',
  0,
  1,
  CURRENT_DATE
) ON CONFLICT (email) DO NOTHING;