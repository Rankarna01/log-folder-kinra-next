import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

/**
 * Cek status akun dari email: belum didaftarkan, sudah didaftarkan tapi belum aktif,
 * atau sudah aktif. Dipakai halaman login untuk memilih langkah berikutnya.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Layanan belum siap. Hubungi admin.' }, { status: 500 });
  }
  const body = ((await req.json().catch(() => null)) ?? {}) as { email?: string };
  const email = (body.email ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });

  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const found = list.users.find((u) => (u.email ?? '').toLowerCase() === email);
  if (!found) return NextResponse.json({ state: 'not_found' });
  if (found.user_metadata?.pending_activation === true) return NextResponse.json({ state: 'pending' });
  return NextResponse.json({ state: 'active' });
}
