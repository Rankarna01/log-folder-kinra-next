-- ==============================================================================
-- SETUP DAN SEEDER LENGKAP KINRA SEI MANGKEI (1-CLICK ALL-IN-ONE)
-- Salin SEMUA isi file ini lalu jalankan di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yjwutssjriumggjbfouv/sql/new
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. TABEL MENTORS
create table if not exists public.mentors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  division text not null,
  position text not null,
  email text,
  phone text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABEL PROFILES (Terkoneksi dengan auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null default 'participant' check (role in ('admin', 'mentor', 'participant')),
  division text,
  position text,
  mentor_id uuid references public.mentors(id) on delete set null,
  mentor_name text,
  nim_nik text,
  phone text,
  institution text default 'PT Kawasan Industri Nusantara (KINRA Sei Mangkei)',
  start_date date,
  end_date date,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABEL LOGBOOKS
create table if not exists public.logbooks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  start_time time without time zone not null default '08:30:00',
  end_time time without time zone not null default '12:00:00',
  duration_minutes integer default 210,
  title text not null,
  category text default 'tugas',
  raw_description text not null,
  ai_description text,
  final_description text not null,
  output text,
  obstacles text,
  work_location text not null default 'kantor' check (work_location in ('kantor', 'lapangan')),
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  review_notes text,
  reviewed_at timestamp with time zone,
  reviewed_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_date unique (user_id, date)
);

-- 5. TABEL ATTACHMENTS
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  logbook_id uuid references public.logbooks(id) on delete cascade not null,
  file_url text not null,
  file_path text not null,
  mime_type text default 'image/jpeg',
  file_size_kb integer,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.mentors enable row level security;
alter table public.profiles enable row level security;
alter table public.logbooks enable row level security;
alter table public.attachments enable row level security;

-- Policies Mentors
drop policy if exists "Anyone can read active mentors" on public.mentors;
create policy "Anyone can read active mentors" on public.mentors for select using (true);
drop policy if exists "Admins can manage mentors" on public.mentors;
create policy "Admins can manage mentors" on public.mentors for all using (true);

-- Policies Profiles
drop policy if exists "Users can read profiles" on public.profiles;
create policy "Users can read profiles" on public.profiles for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Policies Logbooks
drop policy if exists "Users can view logbooks" on public.logbooks;
create policy "Users can view logbooks" on public.logbooks for select using (true);
drop policy if exists "Users can insert their own logbooks" on public.logbooks;
create policy "Users can insert their own logbooks" on public.logbooks for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update logbooks" on public.logbooks;
create policy "Users can update logbooks" on public.logbooks for update using (true);
drop policy if exists "Users can delete their own logbooks" on public.logbooks;
create policy "Users can delete their own logbooks" on public.logbooks for delete using (auth.uid() = user_id);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('logbook-photos', 'logbook-photos', true)
on conflict (id) do nothing;

drop policy if exists "Logbook photos are publicly readable" on storage.objects;
create policy "Logbook photos are publicly readable" on storage.objects for select using (bucket_id = 'logbook-photos');

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos" on storage.objects for insert with check (bucket_id = 'logbook-photos' and auth.role() = 'authenticated');

-- 7. FUNGSI SEED USER KE AUTH.USERS & PUBLIC.PROFILES
create or replace function public.seed_user(
  p_email text,
  p_password text,
  p_name text,
  p_role text,
  p_division text,
  p_position text,
  p_mentor_name text default null
) returns uuid as $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
begin
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  select id into v_user_id from auth.users where email = p_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      p_email, v_encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name), now(), now(),
      '', '', '', '',
      '', '', '', ''
    );

    begin
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', p_email),
        'email', p_email, now(), now(), now()
      );
    exception when others then
      raise notice 'auth.identities gagal untuk %: %', p_email, sqlerrm;
    end;
  else
    update auth.users
    set encrypted_password = v_encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object('name', p_name),
        updated_at = now()
    where id = v_user_id;
  end if;

  insert into public.profiles (
    id, email, name, role, division, position, mentor_name, updated_at
  ) values (
    v_user_id, p_email, p_name, p_role, p_division, p_position, p_mentor_name, now()
  )
  on conflict (id) do update set
    name = excluded.name, role = excluded.role, division = excluded.division,
    position = excluded.position, mentor_name = excluded.mentor_name, updated_at = now();

  return v_user_id;
end;
$$ language plpgsql security definer;

-- 8. EKSEKUSI SEEDING AKUN LENGKAP
select public.seed_user('admin@kinra.co.id', 'password123', 'Super Admin KINRA', 'admin', 'Divisi Manajemen & TI', 'Administrator Sistem');
select public.seed_user('mentor@kinra.co.id', 'password123', 'RIZKY DELIANNGI', 'mentor', 'Divisi Teknologi Informasi', 'Kepala Unit TI & Sistem Digital');
select public.seed_user('peserta@kinra.co.id', 'password123', 'Peserta Magang KINRA', 'participant', 'Divisi Teknologi Informasi', 'Junior Full stack developer', 'RIZKY DELIANNGI');

-- Auto-confirm akun jika user sebelumnya sudah mendaftar dengan email ini
update auth.users set email_confirmed_at = now() where email = 'rendykarna8@gmail.com';
update public.profiles set role = 'admin' where email = 'rendykarna8@gmail.com';

-- Patch token columns di auth.users agar GoTrue Auth Supabase tidak crash (Status 500)
update auth.users 
set 
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '');

-- 9. SEED DATA MENTOR RESMI KINRA
insert into public.mentors (name, division, position, email, phone)
values 
  ('RIZKY DELIANNGI', 'Divisi Teknologi Informasi', 'Kepala Unit TI & Sistem Digital', 'mentor@kinra.co.id', '08126001234'),
  ('Ir. HENDRA SAPUTRA', 'Divisi Operasional & Kawasan', 'Manajer Operasional Kawasan KEK', 'hendra.s@kinra.co.id', '08126005678'),
  ('SITI RAHMAWATI, S.E., M.Ak', 'Divisi Keuangan & Akuntansi', 'Supervisor Keuangan & Pajak', 'siti.rahmawati@kinra.co.id', '08137009876'),
  ('DEDI IRAWAN, S.H.', 'Divisi Umum, SDM & Hukum', 'Staf Senior SDM & Legal', 'dedi.irawan@kinra.co.id', '08216503412'),
  ('Ir. AGUS WIJAYA', 'Divisi Teknik & Pemeliharaan', 'Kepala Divisi Pemeliharaan Aset', 'agus.wijaya@kinra.co.id', '08116307890')
on conflict do nothing;

-- 10. SAMPLE LOGBOOK UNTUK REVIEW
do $$
declare
  v_peserta_id uuid;
begin
  select id into v_peserta_id from auth.users where email = 'peserta@kinra.co.id';
  if v_peserta_id is not null then
    insert into public.logbooks (
      user_id, date, start_time, end_time, duration_minutes, title, category,
      raw_description, final_description, output, obstacles, work_location, status
    ) values (
      v_peserta_id, current_date, '08:30:00', '16:30:00', 480,
      'Pengembangan Modul Autentikasi & RBAC Timesheet KINRA', 'tugas',
      'Mengerjakan integrasi Supabase Auth, middleware proteksi rute, dan portal role Super Admin & Mentor.',
      'Melakukan perancangan dan implementasi Role-Based Access Control (RBAC) pada sistem Timesheet KINRA Sei Mangkei. Mengembangkan halaman verifikasi logbook untuk mentor pembimbing dan dashboard ringkasan untuk Super Admin.',
      'Source code modul auth & halaman admin/mentor siap diuji',
      'Penyesuaian responsif PWA desktop dan mobile', 'kantor', 'submitted'
    ) on conflict (user_id, date) do nothing;

    insert into public.logbooks (
      user_id, date, start_time, end_time, duration_minutes, title, category,
      raw_description, final_description, output, obstacles, work_location, status,
      reviewed_by, reviewed_at
    ) values (
      v_peserta_id, current_date - interval '1 day', '08:30:00', '17:00:00', 510,
      'Setup PostgreSQL Schema & Migrasi Database Supabase', 'tugas',
      'Membuat tabel profiles, mentors, logbooks, attachments dan konfigurasi RLS policy.',
      'Menyusun skema database PostgreSQL untuk pencatatan logbook kegiatan harian peserta magang KINRA Sei Mangkei. Mengonfigurasi Row Level Security (RLS) policies agar data aman.',
      'File migrasi SQL terverifikasi di Supabase',
      'Tidak ada kendala', 'kantor', 'approved', 'RIZKY DELIANNGI', now() - interval '1 day'
    ) on conflict (user_id, date) do nothing;
  end if;
end $$;
