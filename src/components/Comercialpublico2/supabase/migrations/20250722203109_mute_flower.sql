/*
  # Atualizar tabela probability_scores com novos critérios

  1. Modificações na tabela
    - Renomear colunas existentes para os novos critérios
    - Adicionar nova coluna para "Posição Após Lances"
    - Manter constraints de validação (1-3 pontos)
    
  2. Novos critérios
    - `requisitos_habilitacao` (era economic_buyer)
    - `processo_contratacao` (era metrics)
    - `plataforma` (era decision_criteria)
    - `postura_pregoeiro` (era decision_process)
    - `planilha_preco` (era identify_pain)
    - `modelo_planilha` (era champion)
    - `influencia` (era competition)
    - `requisitos_diferenciacao` (era engagement)
    - `posicao_apos_lances` (nova coluna)
*/

-- Renomear colunas existentes para os novos critérios
DO $$
BEGIN
  -- Renomear economic_buyer para requisitos_habilitacao
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'economic_buyer'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN economic_buyer TO requisitos_habilitacao;
  END IF;

  -- Renomear metrics para processo_contratacao
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'metrics'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN metrics TO processo_contratacao;
  END IF;

  -- Renomear decision_criteria para plataforma
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'decision_criteria'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN decision_criteria TO plataforma;
  END IF;

  -- Renomear decision_process para postura_pregoeiro
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'decision_process'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN decision_process TO postura_pregoeiro;
  END IF;

  -- Renomear identify_pain para planilha_preco
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'identify_pain'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN identify_pain TO planilha_preco;
  END IF;

  -- Renomear champion para modelo_planilha
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'champion'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN champion TO modelo_planilha;
  END IF;

  -- Renomear competition para influencia
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'competition'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN competition TO influencia;
  END IF;

  -- Renomear engagement para requisitos_diferenciacao
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'engagement'
  ) THEN
    ALTER TABLE probability_scores RENAME COLUMN engagement TO requisitos_diferenciacao;
  END IF;
END $$;

-- Adicionar nova coluna posicao_apos_lances se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'posicao_apos_lances'
  ) THEN
    ALTER TABLE probability_scores ADD COLUMN posicao_apos_lances integer DEFAULT 1;
    
    -- Adicionar constraint para validar valores entre 1 e 3
    ALTER TABLE probability_scores 
    ADD CONSTRAINT probability_scores_posicao_apos_lances_check 
    CHECK ((posicao_apos_lances >= 1) AND (posicao_apos_lances <= 3));
  END IF;
END $$;

-- Atualizar função de cálculo total_score para incluir nova coluna
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'probability_scores' AND column_name = 'total_score'
  ) THEN
    -- Remover coluna total_score se existir para recriá-la
    ALTER TABLE probability_scores DROP COLUMN IF EXISTS total_score;
  END IF;
  
  -- Adicionar coluna total_score com nova fórmula
  ALTER TABLE probability_scores 
  ADD COLUMN total_score integer GENERATED ALWAYS AS (
    requisitos_habilitacao + 
    processo_contratacao + 
    plataforma + 
    postura_pregoeiro + 
    planilha_preco + 
    modelo_planilha + 
    influencia + 
    requisitos_diferenciacao + 
    posicao_apos_lances
  ) STORED;
END $$;