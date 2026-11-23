-- ID login untuk admin (mis. 0001). Email dan kata sandi admin tidak berubah.
-- Jalankan di Supabase SQL Editor.

alter table public.profiles add column if not exists login_id text;

create unique index if not exists profiles_login_id_unique
  on public.profiles (login_id)
  where login_id is not null;

-- Pasang ID login 0001 untuk akun super admin
update public.profiles
set login_id = '0001', updated_at = now()
where role = 'admin'
  and id = (select id from public.profiles where role = 'admin' order by created_at limit 1);
