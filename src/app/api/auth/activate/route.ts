import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { findLoginUser, resolveIdentifier } from '@/lib/auth/identifier';

/**
 * Aktivasi akun yang didaftarkan admin (lewat NIK peserta atau email mentor).
 * Hanya akun yang ditandai pending_activation yang bisa diaktifkan, dan kata sandinya
 * dibuat oleh pemilik akun sendiri.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Layanan aktivasi belum siap. Hubungi admin.' }, { status: 500 });
  }

  const body = ((await req.json().catch(() => null)) ?? {}) as { identifier?: string; password?: string };
  const resolved = resolveIdentifier(body.identifier ?? '');
  const password = body.password ?? '';
  if (!resolved) return NextResponse.json({ error: 'Masukkan NIK, ID admin, atau email.' }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` }, { status: 400 });
  }

  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const found = await findLoginUser(admin, list.users, resolved);
  if (!found) {
    return NextResponse.json({ error: 'Data ini belum didaftarkan admin. Hubungi admin KINRA.' }, { status: 404 });
  }
  if (resolved.kind === 'email') {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', found.id).maybeSingle();
    if (prof?.role !== 'admin') {
      return NextResponse.json({ error: 'Akun ini aktivasi dengan NIK, bukan email.' }, { status: 403 });
    }
  }
  if (found.user_metadata?.pending_activation !== true) {
    return NextResponse.json({ error: 'Akun ini sudah aktif. Silakan masuk dengan kata sandi Anda.' }, { status: 409 });
  }

  const { error } = await admin.auth.admin.updateUserById(found.id, {
    password,
    user_metadata: { ...found.user_metadata, pending_activation: false },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, email: (found.email ?? '').toLowerCase() });
}
