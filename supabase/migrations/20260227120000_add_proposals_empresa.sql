-- Add "empresa" field to proposals (Comercial Privado)

alter table public.proposals
  add column if not exists empresa text;

-- Optional constraint: allow NULL, but when provided must be one of the known companies
DO $$
BEGIN
  ALTER TABLE public.proposals
    ADD CONSTRAINT proposals_empresa_check
    CHECK (empresa IS NULL OR empresa IN ('WWS', 'Worldwide', '2WS'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
