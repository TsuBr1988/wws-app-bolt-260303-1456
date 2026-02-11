/*
  # Dados iniciais para o sistema
  
  1. Badges padrão do sistema
  2. Configurações iniciais
  3. Métricas semanais padrão
*/

-- Inserir badges padrão
INSERT INTO badges (id, name, description, icon, color) VALUES
  (gen_random_uuid(), 'Primeiro Contrato', 'Fechou seu primeiro contrato', 'Award', '#3B82F6'),
  (gen_random_uuid(), 'Meta Mensal', 'Atingiu a meta mensal', 'Target', '#10B981'),
  (gen_random_uuid(), 'Vendedor do Mês', 'Foi o vendedor destaque do mês', 'Crown', '#F59E0B'),
  (gen_random_uuid(), 'Consistência', '4 semanas consecutivas com pontuação positiva', 'TrendingUp', '#8B5CF6'),
  (gen_random_uuid(), 'Grande Negócio', 'Fechou contrato acima de R$ 100k', 'DollarSign', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- Inserir configurações padrão do sistema
INSERT INTO system_configurations (config_type, config_data) VALUES
  ('commission_tiers', '[
    {
      "id": "tier1",
      "percentage": 0.4,
      "minValue": 0,
      "maxValue": 600000,
      "label": "Básico (0-600k)"
    },
    {
      "id": "tier2", 
      "percentage": 0.8,
      "minValue": 600000,
      "maxValue": 1200000,
      "label": "Supermeta (600k-1.2M)"
    },
    {
      "id": "tier3",
      "percentage": 1.2,
      "minValue": 1200000,
      "maxValue": null,
      "label": "Megameta (+1.2M)"
    }
  ]'),
  ('weekly_metrics', '[
    {
      "id": "contatos_ativados",
      "name": "Contatos Ativados",
      "points": 1,
      "role": "SDR"
    },
    {
      "id": "mql",
      "name": "MQL",
      "points": 5,
      "role": "SDR"
    },
    {
      "id": "visitas_agendadas",
      "name": "Visitas Agendadas",
      "points": 10,
      "role": "SDR"
    },
    {
      "id": "conexoes_totais",
      "name": "Conexões Totais",
      "points": 1,
      "role": "Both"
    },
    {
      "id": "propostas_apresentadas",
      "name": "Propostas Apresentadas",
      "points": 30,
      "role": "Closer"
    },
    {
      "id": "contrato_assinado",
      "name": "Contrato Assinado",
      "points": 50,
      "role": "Closer"
    }
  ]'),
  ('monthly_goals_2025', '[
    {
      "month": 1,
      "monthName": "Janeiro",
      "targetValue": 300000
    },
    {
      "month": 2,
      "monthName": "Fevereiro", 
      "targetValue": 350000
    },
    {
      "month": 3,
      "monthName": "Março",
      "targetValue": 400000
    },
    {
      "month": 4,
      "monthName": "Abril",
      "targetValue": 450000
    },
    {
      "month": 5,
      "monthName": "Maio",
      "targetValue": 500000
    },
    {
      "month": 6,
      "monthName": "Junho",
      "targetValue": 550000
    },
    {
      "month": 7,
      "monthName": "Julho",
      "targetValue": 600000
    },
    {
      "month": 8,
      "monthName": "Agosto",
      "targetValue": 650000
    },
    {
      "month": 9,
      "monthName": "Setembro",
      "targetValue": 700000
    },
    {
      "month": 10,
      "monthName": "Outubro",
      "targetValue": 750000
    },
    {
      "month": 11,
      "monthName": "Novembro",
      "targetValue": 800000
    },
    {
      "month": 12,
      "monthName": "Dezembro",
      "targetValue": 850000
    }
  ]')
ON CONFLICT (config_type) DO NOTHING;