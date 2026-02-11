/*
  # Create Installment Payments System

  1. New Tables
    - `installment_payments`
      - `id` (uuid, primary key)
      - `installment_id` (uuid, foreign key to loan_installments)
      - `payment_note_id` (uuid, foreign key to payment_notes)
      - `amount_paid` (numeric)
      - `payment_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `installment_payments` table
    - Add policies for authenticated users
*/

-- Criar tabela de pagamentos de parcelas
CREATE TABLE IF NOT EXISTS installment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id uuid NOT NULL REFERENCES loan_installments(id) ON DELETE CASCADE,
  payment_note_id uuid NOT NULL REFERENCES payment_notes(id) ON DELETE RESTRICT,
  amount_paid numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view installment payments"
  ON installment_payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert installment payments"
  ON installment_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update installment payments"
  ON installment_payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete installment payments"
  ON installment_payments
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_installment_payments_installment_id ON installment_payments(installment_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_payment_note_id ON installment_payments(payment_note_id);
