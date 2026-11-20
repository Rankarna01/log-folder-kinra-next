import type { SupabaseClient } from '@supabase/supabase-js';
import type { Attachment } from '@/types/database';

export const BUCKET = 'logbook-photos';
export const MAX_FILE_MB = 20;
export const MAX_FILES = 10;

/** Validasi berkas sebelum diunggah. Mengembalikan pesan error, atau null bila lolos. */
export function validateFiles(files: File[], alreadyCount = 0): string | null {
  if (alreadyCount + files.length > MAX_FILES) {
    return `Maksimal ${MAX_FILES} lampiran per logbook.`;
  }
  for (const f of files) {
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      return `"${f.name}" melebihi ${MAX_FILE_MB} MB.`;
    }
  }
  return null;
}

export const isImage = (mime?: string | null) => !!mime && mime.startsWith('image/');
export const isPdf = (mime?: string | null) => mime === 'application/pdf';

export const fileNameOf = (path: string) => path.split('/').pop() || path;

const safeName = (name: string) =>
  name.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-80);

type SupabaseLike = SupabaseClient;

/**
 * Unggah berkas ke bucket lalu catat di tabel attachments.
 * Berkas yang gagal dicatat dibersihkan dari storage agar tidak menjadi yatim.
 */
export async function uploadAttachments(
  supabase: SupabaseLike,
  userId: string,
  logbookId: string,
  files: File[],
  caption: string
): Promise<{ ok: number; failed: string[] }> {
  let ok = 0;
  const failed: string[] = [];

  for (const file of files) {
    const path = `${userId}/${logbookId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName(file.name)}`;
    const bucket = supabase.storage.from(BUCKET);

    const { error: upErr } = await bucket.upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (upErr) {
      failed.push(file.name);
      continue;
    }

    const { data } = bucket.getPublicUrl(path);
    const { error: dbErr } = await supabase.from('attachments').insert({
      logbook_id: logbookId,
      file_url: data.publicUrl,
      file_path: path,
      mime_type: file.type,
      file_size_kb: Math.max(1, Math.round(file.size / 1024)),
      caption,
    });

    if (dbErr) {
      await bucket.remove([path]);
      failed.push(file.name);
      continue;
    }
    ok += 1;
  }

  return { ok, failed };
}

/** Hapus lampiran dari tabel dan storage. */
export async function deleteAttachment(supabase: SupabaseLike, att: Pick<Attachment, 'id' | 'file_path'>) {
  const { error } = await supabase.from('attachments').delete().eq('id', att.id);
  if (error) return error.message;
  await supabase.storage.from(BUCKET).remove([att.file_path]);
  return null;
}
