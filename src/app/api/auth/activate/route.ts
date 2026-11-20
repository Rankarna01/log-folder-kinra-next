import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

/**
 * Aktivasi akun yang didaftarkan admin. Hanya akun yang ditandai pending_activation
 * yang bisa diaktifkan, dan kata sandinya dibuat oleh pemilik akun sendiri.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Layanan aktivasi belum siap. Hubungi admin.' }, { status: 500 });
  }

  const body = ((await req.json().catch(() => null)) ?? {}) as { email?: string; password?: string };
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  if (!email) return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` }, { status: 400 });
  }

  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const found = list.users.find((u) => (u.email ?? '').toLowerCase() === email);
  if (!found) {
    return NextResponse.json({ error: 'Email ini belum didaftarkan admin. Hubungi admin KINRA.' }, { status: 404 });
  }
  if (found.user_metadata?.pending_activation !== true) {
    return NextResponse.json({ error: 'Akun ini sudah aktif. Silakan masuk dengan kata sandi Anda.' }, { status: 409 });
  }

  const { error } = await admin.auth.admin.updateUserById(found.id, {
    password,
    user_metadata: { ...found.user_metadata, pending_activation: false },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
