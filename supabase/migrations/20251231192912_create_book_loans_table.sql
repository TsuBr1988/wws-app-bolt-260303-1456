/*
  # Create book loans table

  1. New Tables
    - `book_loans`
      - `id` (uuid, primary key)
      - `pessoa` (text) - Name of the person who borrowed the book
      - `livro` (text) - Name of the book
      - `data_emprestimo` (date) - Date when the book was borrowed
      - `data_devolucao` (date, nullable) - Date when the book was returned (null if still borrowed)
      - `numero_paginas` (integer) - Number of pages in the book
      - `created_at` (timestamptz) - Timestamp of record creation

  2. Security
    - Enable RLS on `book_loans` table
    - Add policies for authenticated users to manage book loans
*/

CREATE TABLE IF NOT EXISTS book_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa text NOT NULL,
  livro text NOT NULL,
  data_emprestimo date NOT NULL DEFAULT CURRENT_DATE,
  data_devolucao date,
  numero_paginas integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view book loans"
  ON book_loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert book loans"
  ON book_loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update book loans"
  ON book_loans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete book loans"
  ON book_loans FOR DELETE
  TO authenticated
  USING (true);