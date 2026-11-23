import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { findLoginUser, resolveIdentifier } from '@/lib/auth/identifier';

/**
 * Cek status akun dari NIK (peserta) atau email (mentor/admin): belum didaftarkan,
 * sudah didaftarkan tapi belum aktif, atau sudah aktif. Mengembalikan email login Supabase.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Layanan belum siap. Hubungi admin.' }, { status: 500 });
  }
  const body = ((await req.json().catch(() => null)) ?? {}) as { identifier?: string };
  const resolved = resolveIdentifier(body.identifier ?? '');
  if (!resolved) {
    return NextResponse.json({ error: 'Masukkan NIK (peserta), ID admin, atau email (mentor).' }, { status: 400 });
  }

  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const found = await findLoginUser(admin, list.users, resolved);
  if (!found) return NextResponse.json({ state: 'not_found' });
  const authEmail = (found.email ?? '').toLowerCase();

  if (resolved.kind === 'email') {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', found.id).maybeSingle();
    if (prof?.role !== 'admin') {
      return NextResponse.json({ error: 'Akun ini masuk dengan NIK, bukan email.' }, { status: 403 });
    }
  }

  const state = found.user_metadata?.pending_activation === true ? 'pending' : 'active';
  return NextResponse.json({ state, email: authEmail });
}
