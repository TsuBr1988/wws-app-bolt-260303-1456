/*
  # Dados iniciais para o sistema

  1. Badges padrão
  2. Funcionários de exemplo
  3. Prêmios do catálogo
  4. Campanha inicial
*/

-- Inserir badges padrão
INSERT INTO badges (name, icon, color, description) VALUES
('Top Closer', 'trophy', 'bg-yellow-500', 'Melhor closer do mês'),
('Meta Batida', 'target', 'bg-green-500', 'Meta mensal atingida'),
('Agendador Pro', 'calendar', 'bg-blue-500', 'Excelente em agendamentos'),
('Persistente', 'zap', 'bg-purple-500', 'Nunca desiste'),
('Inovador', 'lightbulb', 'bg-orange-500', 'Ideias criativas'),
('Colaborativo', 'users', 'bg-teal-500', 'Trabalha bem em equipe');

-- Inserir funcionários de exemplo
INSERT INTO employees (name, email, avatar, department, position, role, points, level) VALUES
('André Silva', 'andre.silva@empresa.com', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'Vendas', 'Closer', 'Closer', 2850, 5),
('Carlos Santos', 'carlos.santos@empresa.com', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'Vendas', 'SDR', 'SDR', 1340, 3),
('Maria Oliveira', 'maria.oliveira@empresa.com', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'Vendas', 'SDR', 'SDR', 980, 2);

-- Inserir prêmios no catálogo
INSERT INTO rewards (name, description, points, category, image, stock, is_available) VALUES
('iPhone 15 Pro', 'Último modelo do iPhone com 256GB', 5000, 'Tecnologia', 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop', 5, true),
('MacBook Air M3', 'MacBook Air com chip M3 e 16GB RAM', 8000, 'Tecnologia', 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop', 3, true),
('AirPods Pro', 'Fones de ouvido com cancelamento de ruído', 1500, 'Tecnologia', 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop', 10, true),
('Vale Presente Amazon', 'Vale presente de R$ 500 para Amazon', 2000, 'Vale Presente', 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop', 20, true),
('Smartwatch Apple', 'Apple Watch Series 9 GPS', 3000, 'Tecnologia', 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop', 8, true);

-- Inserir campanha inicial
INSERT INTO campaigns (title, description, start_date, end_date, target_points, participants, status) VALUES
('Campanha de Vendas Q1 2025', 'Incentive para aumentar as vendas no primeiro trimestre', '2025-01-01', '2025-03-31', 5000, 25, 'active');

-- Associar badges aos funcionários
DO $$
DECLARE
  andre_id uuid;
  carlos_id uuid;
  maria_id uuid;
  badge_top_closer uuid;
  badge_meta_batida uuid;
  badge_agendador uuid;
  badge_persistente uuid;
BEGIN
  -- Buscar IDs dos funcionários
  SELECT id INTO andre_id FROM employees WHERE email = 'andre.silva@empresa.com';
  SELECT id INTO carlos_id FROM employees WHERE email = 'carlos.santos@empresa.com';
  SELECT id INTO maria_id FROM employees WHERE email = 'maria.oliveira@empresa.com';
  
  -- Buscar IDs dos badges
  SELECT id INTO badge_top_closer FROM badges WHERE name = 'Top Closer';
  SELECT id INTO badge_meta_batida FROM badges WHERE name = 'Meta Batida';
  SELECT id INTO badge_agendador FROM badges WHERE name = 'Agendador Pro';
  SELECT id INTO badge_persistente FROM badges WHERE name = 'Persistente';
  
  -- Associar badges aos funcionários
  INSERT INTO employee_badges (employee_id, badge_id) VALUES
  (andre_id, badge_top_closer),
  (andre_id, badge_meta_batida),
  (carlos_id, badge_agendador),
  (maria_id, badge_persistente);
END $$;