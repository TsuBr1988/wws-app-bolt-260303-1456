/*
  # Create Configuration Tables for Equipments, Materials, and Capex

  1. New Tables
    - `config_equipments`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text) - Equipment name
      - `brand` (text) - Equipment brand
      - `default_quantity` (numeric) - Default quantity
      - `unit_value` (numeric) - Unit price
      - `default_amortization` (integer) - Default amortization period in months
      - `is_active` (boolean) - Whether the item is active
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
    
    - `config_materials`
      - Same structure as config_equipments
    
    - `config_capex`
      - Same structure as config_equipments
    
    - `config_uniforms`
      - Same structure as config_equipments (if not exists)

  2. Security
    - Enable RLS on all tables
    - Permissive policy for all operations (public access for configuration)

  3. Important Notes
    - These tables store template/preset items for quick budget creation
    - Items can be activated/deactivated without deletion
    - All monetary values use numeric(10,2) for precision
    - Default values help speed up budget creation
*/

-- Create config_equipments table
CREATE TABLE IF NOT EXISTS config_equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text DEFAULT '',
  default_quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  default_amortization integer DEFAULT 12,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE config_equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on config_equipments"
  ON config_equipments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_config_equipments_is_active ON config_equipments(is_active);

-- Create config_materials table
CREATE TABLE IF NOT EXISTS config_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text DEFAULT '',
  default_quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  default_amortization integer DEFAULT 12,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE config_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on config_materials"
  ON config_materials
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_config_materials_is_active ON config_materials(is_active);

-- Create config_capex table
CREATE TABLE IF NOT EXISTS config_capex (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text DEFAULT '',
  default_quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  default_amortization integer DEFAULT 12,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE config_capex ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on config_capex"
  ON config_capex
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_config_capex_is_active ON config_capex(is_active);

-- Create config_uniforms table (if not exists)
CREATE TABLE IF NOT EXISTS config_uniforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text DEFAULT '',
  default_quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  default_amortization integer DEFAULT 12,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE config_uniforms ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'config_uniforms' 
    AND policyname = 'Allow all operations on config_uniforms'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all operations on config_uniforms" ON config_uniforms FOR ALL TO public USING (true) WITH CHECK (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_config_uniforms_is_active ON config_uniforms(is_active);

-- Insert sample data for config_equipments
INSERT INTO config_equipments (name, brand, default_quantity, unit_value, default_amortization, is_active)
VALUES 
  ('Aspirador de Pó Industrial', 'Electrolux', 2, 1200.00, 24, true),
  ('Enceradeira Industrial', 'Cleaner', 2, 800.00, 24, true),
  ('Carrinho de Limpeza', 'Bralimpia', 3, 450.00, 12, true)
ON CONFLICT DO NOTHING;

-- Insert sample data for config_materials
INSERT INTO config_materials (name, brand, default_quantity, unit_value, default_amortization, is_active)
VALUES 
  ('Desinfetante 5L', 'Veja', 10, 25.00, 1, true),
  ('Sabão em Pó 5kg', 'Omo', 5, 35.00, 1, true),
  ('Papel Higiênico (Fardo)', 'Personal', 20, 45.00, 1, true)
ON CONFLICT DO NOTHING;

-- Insert sample data for config_capex
INSERT INTO config_capex (name, brand, default_quantity, unit_value, default_amortization, is_active)
VALUES 
  ('Computador Desktop', 'Dell', 1, 3500.00, 36, true),
  ('Impressora Multifuncional', 'HP', 1, 1200.00, 24, true),
  ('Mesa de Escritório', 'Tok Stok', 1, 800.00, 60, true)
ON CONFLICT DO NOTHING;

-- Insert sample data for config_uniforms
INSERT INTO config_uniforms (name, brand, default_quantity, unit_value, default_amortization, is_active)
VALUES 
  ('Camisa Polo', 'Hering', 2, 45.00, 12, true),
  ('Calça Profissional', 'Workwear', 2, 80.00, 12, true),
  ('Sapato de Segurança', 'Marluvas', 1, 120.00, 12, true)
ON CONFLICT DO NOTHING;