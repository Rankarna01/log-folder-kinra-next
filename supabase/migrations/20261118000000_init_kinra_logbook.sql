-- Migration schema for KINRA Sei Mangkei Logbook
-- Compatible with Supabase Auth & PostgreSQL

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Mentors table (Daftar Mentor Resmi KINRA Sei Mangkei)
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

-- Profiles table (synced with Supabase Auth)
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

-- Enable RLS for profiles & mentors
alter table public.mentors enable row level security;
alter table public.profiles enable row level security;

-- Mentors policies: anyone authenticated can read mentors list
drop policy if exists "Anyone can read active mentors" on public.mentors;
create policy "Anyone can read active mentors"
  on public.mentors for select
  using (true);

drop policy if exists "Admins can manage mentors" on public.mentors;
create policy "Admins can manage mentors"
  on public.mentors for all
  using (true);

-- Profiles policies
drop policy if exists "Users can read profiles" on public.profiles;
create policy "Users can read profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Logbooks table
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
  -- 1 Logbook per user per day rule
  constraint unique_user_date unique (user_id, date)
);

-- Enable RLS for logbooks
alter table public.logbooks enable row level security;

drop policy if exists "Users can view logbooks" on public.logbooks;
create policy "Users can view logbooks"
  on public.logbooks for select
  using (true);

drop policy if exists "Users can insert their own logbooks" on public.logbooks;
create policy "Users can insert their own logbooks"
  on public.logbooks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update logbooks" on public.logbooks;
create policy "Users can update logbooks"
  on public.logbooks for update
  using (true);

drop policy if exists "Users can delete their own logbooks" on public.logbooks;
create policy "Users can delete their own logbooks"
  on public.logbooks for delete
  using (auth.uid() = user_id);

-- Attachments table for logbook photo documentation
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

alter table public.attachments enable row level security;

drop policy if exists "Users can view logbook attachments" on public.attachments;
create policy "Users can view logbook attachments"
  on public.attachments for select
  using (true);

drop policy if exists "Users can insert attachments to own logbook" on public.attachments;
create policy "Users can insert attachments to own logbook"
  on public.attachments for insert
  with check (auth.role() = 'authenticated');

-- Create Storage bucket for documentation photos
insert into storage.buckets (id, name, public)
values ('logbook-photos', 'logbook-photos', true)
on conflict (id) do nothing;

drop policy if exists "Logbook photos are publicly readable" on storage.objects;
create policy "Logbook photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'logbook-photos');

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'logbook-photos' and auth.role() = 'authenticated');

-- Seed Data: Mentor Resmi KINRA Sei Mangkei
insert into public.mentors (name, division, position, email, phone)
values 
  ('RIZKY DELIANNGI', 'Divisi Teknologi Informasi', 'Kepala Unit TI & Sistem Digital', 'rizky.delianngi@kinra.co.id', '08126001234'),
  ('Ir. HENDRA SAPUTRA', 'Divisi Operasional & Kawasan', 'Manajer Operasional Kawasan KEK', 'hendra.s@kinra.co.id', '08126005678'),
  ('SITI RAHMAWATI, S.E., M.Ak', 'Divisi Keuangan & Akuntansi', 'Supervisor Keuangan & Pajak', 'siti.rahmawati@kinra.co.id', '08137009876'),
  ('DEDI IRAWAN, S.H.', 'Divisi Umum, SDM & Hukum', 'Staf Senior SDM & Legal', 'dedi.irawan@kinra.co.id', '08216503412'),
  ('Ir. AGUS WIJAYA', 'Divisi Teknik & Pemeliharaan', 'Kepala Divisi Pemeliharaan Aset', 'agus.wijaya@kinra.co.id', '08116307890')
on conflict do nothing;

-- Otomatisasi Profil & Role Super Admin / Mentor saat Register
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case 
      when new.email like 'admin%' or new.email = 'rendykarna8@gmail.com' then 'admin'
      when new.email like 'mentor%' then 'mentor'
      else 'participant'
    end
  )
  on conflict (id) do update set
    role = excluded.role;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Pastikan akun yang sudah ada langsung diupdate role-nya
update public.profiles
set role = 'admin'
where email = 'rendykarna8@gmail.com' or email like 'admin%';

