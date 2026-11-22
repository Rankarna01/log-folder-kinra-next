-- Template laporan cetak per pengguna (generator laporan, tahap 1).
create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.report_templates enable row level security;

drop policy if exists "report_templates_owner" on public.report_templates;
create policy "report_templates_owner"
  on public.report_templates
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.report_templates to authenticated;
grant all on public.report_templates to service_role;
