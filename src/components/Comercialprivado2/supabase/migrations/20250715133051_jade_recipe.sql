/*
  # Create system configurations tables

  1. New Tables
    - `system_configurations`
      - `id` (uuid, primary key)
      - `config_type` (text) - 'monthly_goals', 'commission_tiers', 'weekly_metrics'
      - `config_data` (jsonb) - flexible JSON storage for different config types
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `system_configurations` table
    - Add policy for authenticated users to manage configurations
*/

CREATE TABLE IF NOT EXISTS system_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL,
  config_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage system configurations"
  ON system_configurations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_system_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_system_configurations_updated_at();

-- Insert default configurations
INSERT INTO system_configurations (config_type, config_data) VALUES
('monthly_goals', '[
  {"month": 1, "monthName": "Janeiro", "targetValue": 300000},
  {"month": 2, "monthName": "Fevereiro", "targetValue": 300000},
  {"month": 3, "monthName": "Março", "targetValue": 300000},
  {"month": 4, "monthName": "Abril", "targetValue": 300000},
  {"month": 5, "monthName": "Maio", "targetValue": 300000},
  {"month": 6, "monthName": "Junho", "targetValue": 300000},
  {"month": 7, "monthName": "Julho", "targetValue": 300000},
  {"month": 8, "monthName": "Agosto", "targetValue": 300000},
  {"month": 9, "monthName": "Setembro", "targetValue": 300000},
  {"month": 10, "monthName": "Outubro", "targetValue": 300000},
  {"month": 11, "monthName": "Novembro", "targetValue": 300000},
  {"month": 12, "monthName": "Dezembro", "targetValue": 300000}
]'),
('commission_tiers', '[
  {"id": "1", "percentage": 0.4, "minValue": 0, "maxValue": 600000, "label": "0 - 600k"},
  {"id": "2", "percentage": 0.8, "minValue": 600000, "maxValue": 1200000, "label": "600k - 1,2M"},
  {"id": "3", "percentage": 1.2, "minValue": 1200000, "maxValue": null, "label": "Mais que 1,2M"}
]'),
('weekly_metrics', '[
  {"id": "1", "name": "Propostas apresentadas", "points": 30, "role": "Closer"},
  {"id": "2", "name": "Conexões totais", "points": 1, "role": "Both"},
  {"id": "3", "name": "Contrato assinado", "points": 50, "role": "Closer"},
  {"id": "4", "name": "Contatos ativados", "points": 1, "role": "SDR"},
  {"id": "5", "name": "MQL", "points": 5, "role": "SDR"},
  {"id": "6", "name": "Visitas agendadas", "points": 10, "role": "SDR"}
]')
ON CONFLICT DO NOTHING;