import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

/**
 * Buat atau reset akun login mentor. Hanya super admin yang boleh memanggil.
 * Memakai SUPABASE_SERVICE_ROLE_KEY yang hanya ada di server.
 * Kata sandi tidak pernah dikembalikan dalam respons dan tidak dicatat.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sesi tidak valid. Masuk ulang.' }, { status: 401 });

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya super admin yang dapat mengelola akun mentor.' }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local. Tambahkan lalu jalankan ulang server.' },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as { mentorId?: string; password?: string } | null;
  const mentorId = body?.mentorId;
  const password = body?.password ?? '';
  if (!mentorId) return NextResponse.json({ error: 'Mentor tidak valid.' }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` }, { status: 400 });
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: mentor, error: mentorErr } = await admin.from('mentors').select('*').eq('id', mentorId).maybeSingle();
  if (mentorErr || !mentor) return NextResponse.json({ error: 'Data mentor tidak ditemukan.' }, { status: 404 });
  if (!mentor.email) {
    return NextResponse.json({ error: 'Isi email mentor terlebih dahulu. Email ini menjadi username login.' }, { status: 400 });
  }

  const email = String(mentor.email).trim().toLowerCase();

  // Cari akun yang sudah ada berdasarkan email
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  const existing = list.users.find((u) => (u.email ?? '').toLowerCase() === email);

  let userId = existing?.id;
  let created = false;

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: mentor.name },
    });
    if (error || !data.user) return NextResponse.json({ error: error?.message ?? 'Akun gagal dibuat.' }, { status: 500 });
    userId = data.user.id;
    created = true;
  }

  // Pastikan profil berperan sebagai mentor (trigger hanya menebak dari awalan email)
  const { error: profErr } = await admin.from('profiles').upsert({
    id: userId,
    email,
    name: mentor.name,
    role: 'mentor',
    division: mentor.division,
    position: mentor.position,
    updated_at: new Date().toISOString(),
  });
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, email, created });
}
