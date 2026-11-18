-- Migration schema for KINRA Sei Mangkei Logbook
-- Compatible with Supabase Auth & PostgreSQL

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (synced with Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  division text,
  position text,
  mentor_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

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
  status text not null default 'approved' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- 1 Logbook per user per day rule
  constraint unique_user_date unique (user_id, date)
);

-- Enable RLS for logbooks
alter table public.logbooks enable row level security;

create policy "Users can view their own logbooks"
  on public.logbooks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logbooks"
  on public.logbooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own logbooks"
  on public.logbooks for update
  using (auth.uid() = user_id);

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

create policy "Users can view own logbook attachments"
  on public.attachments for select
  using (
    exists (
      select 1 from public.logbooks
      where logbooks.id = attachments.logbook_id and logbooks.user_id = auth.uid()
    )
  );

create policy "Users can insert attachments to own logbook"
  on public.attachments for insert
  with check (
    exists (
      select 1 from public.logbooks
      where logbooks.id = attachments.logbook_id and logbooks.user_id = auth.uid()
    )
  );

-- Create Storage bucket for documentation photos
insert into storage.buckets (id, name, public)
values ('logbook-photos', 'logbook-photos', true)
on conflict (id) do nothing;

create policy "Logbook photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'logbook-photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'logbook-photos' and auth.role() = 'authenticated');
