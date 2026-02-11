/*
  # Criar tabela de certidões

  1. Nova Tabela
    - `certidoes`
      - `id` (uuid, primary key)
      - `nome` (text, nome da certidão)
      - `data_vencimento_wws` (date, vencimento para WWS)
      - `data_vencimento_worldwide` (date, vencimento para Worldwide)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  2. Segurança
    - Habilitar RLS na tabela `certidoes`
    - Permitir acesso público para leitura e escrita
*/

CREATE TABLE IF NOT EXISTS certidoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data_vencimento_wws date,
  data_vencimento_worldwide date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE certidoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (como outras tabelas do sistema)
CREATE POLICY "Allow public read access to certidoes" 
  ON certidoes 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow public write access to certidoes" 
  ON certidoes 
  FOR ALL 
  TO public 
  WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_certidoes_updated_at 
  BEFORE UPDATE ON certidoes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir algumas certidões padrão para exemplo
INSERT INTO certidoes (nome, data_vencimento_wws, data_vencimento_worldwide) VALUES
('Certidão Negativa de Débitos Trabalhistas (CNDT)', '2024-12-31', '2024-12-31'),
('Certidão Regularidade FGTS', '2024-11-30', '2024-11-30'),
('Certidão Negativa Federal (Receita Federal)', '2024-10-15', '2024-10-15'),
('Certidão Negativa Estadual', '2024-09-20', '2024-09-20'),
('Certidão Negativa Municipal', '2024-08-25', '2024-08-25'),
('Alvará de Funcionamento', '2025-06-30', '2025-06-30'),
('Licença Ambiental', '2025-03-15', '2025-03-15')
ON CONFLICT DO NOTHING;