CREATE TABLE public.admin_credentials (
  id text PRIMARY KEY,
  password_hash text,
  reset_code_hash text,
  reset_expires_at timestamptz,
  reset_attempts int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_credentials TO service_role;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;