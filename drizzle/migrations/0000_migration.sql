create table public.profiles (
  user_id uuid primary key,
  display_name text,
  first_intent text check (first_intent in ('captions','voice-enhancer','silence-cutter')),
  terms_accepted_at timestamptz,
  terms_version text,
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = user_id);

create table public.preferences (
  user_id uuid primary key,
  caption_language text not null default 'auto',
  caption_length_mode text not null default 'standard' check (caption_length_mode in ('short','standard')),
  caption_style jsonb,
  custom_words text[] not null default '{}',
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.preferences to authenticated;
grant all on public.preferences to service_role;
alter table public.preferences enable row level security;
create policy "own prefs select" on public.preferences for select to authenticated using (auth.uid() = user_id);
create policy "own prefs insert" on public.preferences for insert to authenticated with check (auth.uid() = user_id);
create policy "own prefs update" on public.preferences for update to authenticated using (auth.uid() = user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  status text not null default 'active' check (status in ('active','deleting')),
  last_tool text,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_updated on public.projects (user_id, updated_at desc);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "own projects select" on public.projects for select to authenticated using (auth.uid() = user_id);
create policy "own projects insert" on public.projects for insert to authenticated with check (auth.uid() = user_id);
create policy "own projects update" on public.projects for update to authenticated using (auth.uid() = user_id);
create policy "own projects delete" on public.projects for delete to authenticated using (auth.uid() = user_id);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null default 'source',
  role text not null default 'source',
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  duration_ms integer not null,
  has_video boolean not null default false,
  width integer,
  height integer,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);
create index assets_project on public.assets (project_id);
grant select, insert, delete on public.assets to authenticated;
grant all on public.assets to service_role;
alter table public.assets enable row level security;
create policy "own assets select" on public.assets for select to authenticated using (auth.uid() = user_id);
create policy "own assets insert" on public.assets for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "own assets delete" on public.assets for delete to authenticated using (auth.uid() = user_id);

create table public.caption_docs (
  project_id uuid primary key references public.projects(id) on delete cascade,
  user_id uuid not null,
  asset_id uuid references public.assets(id) on delete set null,
  language text not null,
  length_mode text not null,
  words jsonb not null default '[]',
  segments jsonb not null default '[]',
  style jsonb,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
grant select, update on public.caption_docs to authenticated;
grant all on public.caption_docs to service_role;
alter table public.caption_docs enable row level security;
create policy "own captions select" on public.caption_docs for select to authenticated using (auth.uid() = user_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  type text not null,
  params jsonb not null default '{}',
  status text not null default 'running' check (status in ('queued','running','succeeded','failed','canceled')),
  error_code text,
  duration_ms integer,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index jobs_project on public.jobs (project_id, created_at desc);
grant select on public.jobs to authenticated;
grant all on public.jobs to service_role;
alter table public.jobs enable row level security;
create policy "own jobs select" on public.jobs for select to authenticated using (auth.uid() = user_id);

create table public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  job_id uuid not null unique,
  seconds integer not null,
  period_start date not null,
  created_at timestamptz not null default now()
);
create index usage_user_period on public.usage_ledger (user_id, period_start);
grant select on public.usage_ledger to authenticated;
grant all on public.usage_ledger to service_role;
alter table public.usage_ledger enable row level security;
create policy "own usage select" on public.usage_ledger for select to authenticated using (auth.uid() = user_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  tool text,
  outcome text,
  duration_ms integer,
  error_code text,
  created_at timestamptz not null default now()
);
grant all on public.events to service_role;
alter table public.events enable row level security;