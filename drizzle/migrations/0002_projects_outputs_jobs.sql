ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS upload_status text NOT NULL DEFAULT 'uploaded';
ALTER TABLE public.assets ALTER COLUMN upload_status SET DEFAULT 'pending';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS retry_of uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  source_asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('captions','enhanced_audio','cut_audio')),
  storage_path text,
  filename text NOT NULL,
  mime_type text,
  size_bytes bigint,
  duration_ms integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS output_id uuid REFERENCES public.outputs(id) ON DELETE SET NULL;

GRANT SELECT, DELETE ON public.outputs TO authenticated;
GRANT ALL ON public.outputs TO service_role;
ALTER TABLE public.outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own outputs select" ON public.outputs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own outputs delete" ON public.outputs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS outputs_job_id_key ON public.outputs(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outputs_project_idx ON public.outputs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outputs_user_idx ON public.outputs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_user_idx ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS assets_project_idx ON public.assets(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_project_idx ON public.jobs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_user_status_idx ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS usage_user_period_idx ON public.usage_ledger(user_id, period_start);