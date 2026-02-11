-- TABELA TI_CHAMADOS
CREATE TABLE IF NOT EXISTS ti_chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_numero integer UNIQUE NOT NULL,
  titulo text NOT NULL CHECK (TRIM(titulo) <> ''),
  descricao text NOT NULL,
  tipo text NOT NULL DEFAULT 'Correção' CHECK (tipo IN ('Estrutural', 'Melhoria', 'Correção')),
  modulo text NOT NULL DEFAULT 'Geral',
  prioridade text NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  categoria text NOT NULL DEFAULT 'Outros' CHECK (categoria IN ('Hardware', 'Software', 'Rede', 'Acesso', 'Email', 'Telefonia', 'Impressora', 'Outros')),
  status text NOT NULL DEFAULT 'A fazer' CHECK (status IN ('A fazer', 'Fazendo', 'Feito')),
  solicitante_nome text NOT NULL,
  solicitante_email text NOT NULL,
  responsavel_id uuid,
  responsavel_nome text,
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_inicio timestamptz,
  data_conclusao timestamptz,
  prazo_estimado timestamptz,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SEQUENCE
CREATE SEQUENCE IF NOT EXISTS ti_chamados_numero_seq START WITH 1;

-- FUNÇÃO AUTO-INCREMENT
CREATE OR REPLACE FUNCTION set_chamado_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chamado_numero IS NULL THEN
    NEW.chamado_numero := nextval('ti_chamados_numero_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER
DROP TRIGGER IF EXISTS trigger_set_chamado_numero ON ti_chamados;
CREATE TRIGGER trigger_set_chamado_numero
  BEFORE INSERT ON ti_chamados
  FOR EACH ROW
  EXECUTE FUNCTION set_chamado_numero();

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_ti_chamados_status ON ti_chamados(status);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_data_abertura ON ti_chamados(data_abertura DESC);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_responsavel_id ON ti_chamados(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_numero ON ti_chamados(chamado_numero);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_tipo ON ti_chamados(tipo);
CREATE INDEX IF NOT EXISTS idx_ti_chamados_modulo ON ti_chamados(modulo);

-- RLS
ALTER TABLE ti_chamados ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS
CREATE POLICY "Authenticated users can read all chamados"
  ON ti_chamados FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create chamados"
  ON ti_chamados FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update chamados"
  ON ti_chamados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete chamados"
  ON ti_chamados FOR DELETE TO authenticated USING (true);
