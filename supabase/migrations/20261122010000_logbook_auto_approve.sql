-- Logbook langsung disetujui saat disimpan, tetapi tetap bisa diubah pemiliknya.
-- Mentor tetap bisa melihat dan meninjau. Jalankan sekali di Supabase SQL Editor.

drop policy if exists "Owners update until approved, reviewers update any" on public.logbooks;
create policy "Owners update own logbooks, reviewers update any"
  on public.logbooks for update
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('mentor', 'admin'))
  )
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('mentor', 'admin'))
  );

drop policy if exists "Owners delete until approved" on public.logbooks;
create policy "Owners delete own logbooks"
  on public.logbooks for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can insert attachments to own unapproved logbook" on public.attachments;
create policy "Users can insert attachments to own logbook"
  on public.attachments for insert
  with check (
    exists (select 1 from public.logbooks l where l.id = logbook_id and l.user_id = auth.uid())
  );

drop policy if exists "Users can delete attachments of own unapproved logbook" on public.attachments;
create policy "Users can delete attachments of own logbook"
  on public.attachments for delete
  using (
    exists (select 1 from public.logbooks l where l.id = logbook_id and l.user_id = auth.uid())
  );
