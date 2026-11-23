-- Peserta magang masuk dengan NIK (16 digit). NIK harus unik.
-- Jalankan di Supabase SQL Editor. Jika gagal karena data ganda, perbaiki dulu dengan query di panduan.

create unique index if not exists profiles_nim_nik_unique
  on public.profiles (nim_nik)
  where nim_nik is not null;
