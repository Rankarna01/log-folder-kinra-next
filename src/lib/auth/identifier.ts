// Identitas masuk:
// - peserta magang memakai NIK (angka, panjang bebas). Email login internal dibentuk dari NIK.
// - admin memakai ID login (mis. 0001) yang disimpan di profil; email aslinya tidak berubah.
// - mentor memakai email.
// Email kontak peserta disimpan terpisah di profil dan tidak dipakai untuk masuk.

import type { SupabaseClient, User } from '@supabase/supabase-js';

export const NIK_RE = /^\d+$/;
export const LOGIN_ID_RE = /^[a-z0-9._-]{2,32}$/;
export const PESERTA_EMAIL_DOMAIN = 'peserta.kinra.local';

export const nikLoginEmail = (nik: string) => `${nik.trim()}@${PESERTA_EMAIL_DOMAIN}`;

export type ResolvedIdentifier =
  | { kind: 'email'; email: string }
  | { kind: 'nik'; email: string; loginId: string }
  | { kind: 'login_id'; loginId: string };

/** Mengubah NIK, email, atau ID login yang diketik menjadi bentuk yang bisa dipakai server. */
export function resolveIdentifier(input: string): ResolvedIdentifier | null {
  const v = input.trim().toLowerCase();
  if (!v) return null;
  if (v.includes('@')) return { kind: 'email', email: v };
  if (NIK_RE.test(v)) return { kind: 'nik', email: nikLoginEmail(v), loginId: v };
  if (LOGIN_ID_RE.test(v)) return { kind: 'login_id', loginId: v };
  return null;
}

/**
 * Mencari akun login. Untuk angka, ID admin dicek dulu (mis. 0001), lalu NIK peserta.
 */
export async function findLoginUser(admin: SupabaseClient, users: User[], r: ResolvedIdentifier): Promise<User | undefined> {
  if (r.kind === 'email') {
    return users.find((u) => (u.email ?? '').toLowerCase() === r.email);
  }
  const { data: byId } = await admin.from('profiles').select('id').eq('login_id', r.loginId).maybeSingle();
  if (byId) return users.find((u) => u.id === byId.id);
  if (r.kind === 'nik') {
    return users.find((u) => (u.email ?? '').toLowerCase() === r.email);
  }
  return undefined;
}
