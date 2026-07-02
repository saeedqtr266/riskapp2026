create extension if not exists pgcrypto;

do $$ begin
  create type app_role as enum ('department_user', 'department_manager', 'strategy_team', 'system_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type workflow_status as enum (
    'draft',
    'submitted_to_manager',
    'returned_to_user',
    'under_strategy_review',
    'returned_to_department',
    'official_risk',
    'final_approved'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type risk_level as enum ('Low', 'Medium', 'High', 'Critical');
exception when duplicate_object then null; end $$;

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists risk_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role app_role not null default 'department_user',
  department_id uuid references departments(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists risks (
  id uuid primary key default gen_random_uuid(),
  risk_code text not null unique default ('RISK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  department_id uuid not null references departments(id),
  category_id uuid not null references risk_categories(id),
  owner_id uuid references profiles(id),
  title text not null,
  description text not null,
  causes text not null,
  consequences text not null,
  existing_controls text not null default '',
  current_controls text not null default '',
  likelihood_score integer not null check (likelihood_score between 1 and 5),
  impact_score integer not null check (impact_score between 1 and 5),
  inherent_score integer not null check (inherent_score between 1 and 25),
  inherent_level risk_level not null,
  residual_likelihood_score integer not null check (residual_likelihood_score between 1 and 5),
  residual_impact_score integer not null check (residual_impact_score between 1 and 5),
  residual_score integer not null check (residual_score between 1 and 25),
  residual_level risk_level not null,
  mitigation_actions text not null default '',
  action_owner text not null default '',
  target_completion_date date,
  status workflow_status not null default 'draft',
  review_comments text,
  approval_status text not null default 'Draft',
  attachments jsonb not null default '[]'::jsonb,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk_workflow_events (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references risks(id) on delete cascade,
  actor_id uuid references profiles(id),
  from_status workflow_status,
  to_status workflow_status not null,
  comments text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_token on app_sessions(token_hash);
create index if not exists idx_sessions_expires on app_sessions(expires_at);
create index if not exists idx_profiles_department on profiles(department_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_risks_department on risks(department_id);
create index if not exists idx_risks_status on risks(status);
create index if not exists idx_risks_residual_level on risks(residual_level);
create index if not exists idx_risks_target_date on risks(target_completion_date);
create index if not exists idx_events_risk on risk_workflow_events(risk_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on profiles;
create trigger profiles_touch_updated_at before update on profiles
for each row execute function touch_updated_at();

drop trigger if exists risks_touch_updated_at on risks;
create trigger risks_touch_updated_at before update on risks
for each row execute function touch_updated_at();

insert into departments (name, code) values
  ('Information Technology', 'IT'),
  ('Finance', 'FIN'),
  ('Human Resources', 'HR'),
  ('Operations', 'OPS'),
  ('Strategy', 'STR'),
  ('Procurement', 'PRC')
on conflict (code) do nothing;

insert into risk_categories (name) values
  ('Cybersecurity'),
  ('Financial'),
  ('Operational'),
  ('Compliance'),
  ('Strategic'),
  ('Vendor and Procurement'),
  ('People and Culture')
on conflict (name) do nothing;
