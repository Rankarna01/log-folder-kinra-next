-- Bucket bukti dokumentasi logbook + policy storage & attachments.
-- Jalankan sekali di Supabase SQL Editor (aman dijalankan ulang).

-- 1. Bucket publik (URL bukti bisa dibuka oleh mentor, admin, dan peserta)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logbook-photos',
  'logbook-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Policy storage. Path berbentuk: <user_id>/<logbook_id>/<berkas>
drop policy if exists "Logbook photos are publicly readable" on storage.objects;
create policy "Logbook photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'logbook-photos');

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (
    bucket_id = 'logbook-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own logbook photos" on storage.objects;
create policy "Users can delete own logbook photos"
  on storage.objects for delete
  using (
    bucket_id = 'logbook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Attachments hanya boleh ditambah/dihapus oleh pemilik logbook
drop policy if exists "Users can insert attachments to own logbook" on public.attachments;
create policy "Users can insert attachments to own logbook"
  on public.attachments for insert
  with check (
    exists (
      select 1 from public.logbooks l
      where l.id = logbook_id and l.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete attachments of own logbook" on public.attachments;
create policy "Users can delete attachments of own logbook"
  on public.attachments for delete
  using (
    exists (
      select 1 from public.logbooks l
      where l.id = logbook_id and l.user_id = auth.uid()
    )
  );

grant select, insert, delete on public.attachments to authenticated;
grant select on public.attachments to anon;
