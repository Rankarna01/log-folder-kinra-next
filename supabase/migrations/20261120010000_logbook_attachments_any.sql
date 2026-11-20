-- Lampiran bukti: semua jenis berkas, maks. 20 MB per berkas.
-- Jalankan sekali di Supabase SQL Editor (aman dijalankan ulang).
update storage.buckets
set allowed_mime_types = null,
    file_size_limit = 20971520
where id = 'logbook-photos';
