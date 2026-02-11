/*
  # Sistema de Empréstimos

  1. Novas Tabelas
    - `loans`
      - `id` (uuid, chave primária)
      - `company` (text) - WWS Services ou Worldwide Segurança
      - `lender` (text) - Nome do credor
      - `description` (text) - Descrição do empréstimo
      - `total_amount` (numeric) - Valor total do empréstimo
      - `interest_rate` (numeric) - Taxa de juros (%)
      - `start_date` (date) - Data de início
      - `end_date` (date) - Data de término
      - `installments_count` (integer) - Número de parcelas
      - `status` (text) - active ou paid
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `loan_installments`
      - `id` (uuid, chave primária)
      - `loan_id` (uuid, foreign key) - Referência ao empréstimo
      - `installment_number` (integer) - Número da parcela
      - `due_date` (date) - Data de vencimento
      - `amount` (numeric) - Valor da parcela
      - `paid` (boolean) - Se foi paga
      - `payment_date` (date, nullable) - Data do pagamento
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - RLS habilitado em ambas as tabelas
    - Políticas para usuários autenticados
*/

-- Criar tabela de empréstimos
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  lender text NOT NULL,
  description text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date,
  installments_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de parcelas de empréstimos
CREATE TABLE IF NOT EXISTS loan_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  payment_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_loans_company ON loans(company);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_start_date ON loans(start_date);
CREATE INDEX IF NOT EXISTS idx_loan_installments_loan_id ON loan_installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_installments_due_date ON loan_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_loan_installments_paid ON loan_installments(paid);

-- Habilitar RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;

-- Políticas para loans
CREATE POLICY "Usuários autenticados podem visualizar empréstimos"
  ON loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar empréstimos"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar empréstimos"
  ON loans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar empréstimos"
  ON loans FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para loan_installments
CREATE POLICY "Usuários autenticados podem visualizar parcelas"
  ON loan_installments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar parcelas"
  ON loan_installments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar parcelas"
  ON loan_installments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar parcelas"
  ON loan_installments FOR DELETE
  TO authenticated
  USING (true);