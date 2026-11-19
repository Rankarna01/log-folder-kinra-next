-- Kunci logbook yang sudah disetujui mentor + master data divisi.
-- Jalankan sekali di Supabase SQL Editor (aman dijalankan ulang).

-- ============================================================
-- 1. Logbook approved tidak bisa diubah atau dihapus peserta
-- ============================================================
-- Policy lama terlalu longgar (using (true)). Diganti: pemilik hanya boleh
-- mengubah logbook yang belum approved; mentor & admin tetap bisa meninjau.

drop policy if exists "Users can update logbooks" on public.logbooks;
create policy "Owners update until approved, reviewers update any"
  on public.logbooks for update
  using (
    (auth.uid() = user_id and status <> 'approved')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('mentor', 'admin'))
  )
  with check (
    (auth.uid() = user_id and status <> 'approved')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('mentor', 'admin'))
  );

drop policy if exists "Users can delete their own logbooks" on public.logbooks;
create policy "Owners delete until approved"
  on public.logbooks for delete
  using (auth.uid() = user_id and status <> 'approved');

-- Lampiran ikut terkunci: tidak bisa ditambah atau dihapus setelah approved
drop policy if exists "Users can insert attachments to own logbook" on public.attachments;
create policy "Users can insert attachments to own unapproved logbook"
  on public.attachments for insert
  with check (
    exists (
      select 1 from public.logbooks l
      where l.id = logbook_id and l.user_id = auth.uid() and l.status <> 'approved'
    )
  );

drop policy if exists "Users can delete attachments of own logbook" on public.attachments;
create policy "Users can delete attachments of own unapproved logbook"
  on public.attachments for delete
  using (
    exists (
      select 1 from public.logbooks l
      where l.id = logbook_id and l.user_id = auth.uid() and l.status <> 'approved'
    )
  );

-- ============================================================
-- 2. Master data divisi
-- ============================================================
create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.divisions enable row level security;

drop policy if exists "Anyone can read divisions" on public.divisions;
create policy "Anyone can read divisions"
  on public.divisions for select
  using (true);

drop policy if exists "Admins manage divisions" on public.divisions;
create policy "Admins manage divisions"
  on public.divisions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

grant select on public.divisions to anon, authenticated;
grant insert, update, delete on public.divisions to authenticated;

insert into public.divisions (name) values
  ('Divisi Teknologi Informasi'),
  ('Divisi Operasional & Kawasan'),
  ('Divisi Keuangan & Akuntansi'),
  ('Divisi Umum, SDM & Hukum'),
  ('Divisi Teknik & Pemeliharaan')
on conflict (name) do nothing;
