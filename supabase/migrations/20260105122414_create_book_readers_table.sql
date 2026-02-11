/*
  # Criar tabela de Leitores de Livros

  1. Nova Tabela
    - `book_readers`
      - `id` (uuid, primary key)
      - `nome` (text, nome da pessoa que empresta livros)
      - `ativo` (boolean, indica se o leitor está ativo)
      - `created_at` (timestamp, data de criação)
      - `updated_at` (timestamp, data de última atualização)

  2. Segurança
    - Habilitar RLS na tabela `book_readers`
    - Políticas para usuários autenticados lerem
    - Políticas para usuários autenticados criarem/editarem/excluírem

  3. Notas
    - Tabela para armazenar nomes de pessoas que pegam livros emprestados
    - Facilita a seleção de pessoas no formulário de empréstimo
    - Mantém histórico de todos os leitores
*/

-- Criar tabela de leitores
CREATE TABLE IF NOT EXISTS book_readers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE book_readers ENABLE ROW LEVEL SECURITY;

-- Política de leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver leitores"
  ON book_readers
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar leitores"
  ON book_readers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política de atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar leitores"
  ON book_readers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política de exclusão para usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir leitores"
  ON book_readers
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_book_readers_nome ON book_readers(nome);
CREATE INDEX IF NOT EXISTS idx_book_readers_ativo ON book_readers(ativo);

-- Inserir leitores existentes da tabela book_loans
INSERT INTO book_readers (nome, ativo)
SELECT DISTINCT pessoa, true
FROM book_loans
WHERE pessoa IS NOT NULL
ON CONFLICT (nome) DO NOTHING;