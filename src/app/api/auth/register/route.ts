import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { nikLoginEmail, NIK_RE } from '@/lib/auth/identifier';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  name?: string;
  nik?: string;
  email?: string;
  division?: string;
  position?: string;
  phone?: string;
  mentorId?: string;
  password?: string;
};

/**
 * Pendaftaran mandiri anak magang: data diri, mentor pembimbing, dan kata sandi sendiri.
 * Akun langsung aktif dan login memakai NIK.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Layanan belum siap. Hubungi admin.' }, { status: 500 });

  const body = ((await req.json().catch(() => null)) ?? {}) as Body;
  const name = (body.name ?? '').trim();
  const nik = (body.nik ?? '').trim();
  const contact = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const mentorId = (body.mentorId ?? '').trim();

  if (!name) return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
  if (!NIK_RE.test(nik)) return NextResponse.json({ error: 'NIK wajib diisi dan hanya berisi angka.' }, { status: 400 });
  if (contact && !EMAIL_RE.test(contact)) return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
  if (!mentorId) return NextResponse.json({ error: 'Pilih mentor pembimbing.' }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` }, { status: 400 });
  }

  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: mentor } = await admin.from('mentors').select('id,name,division').eq('id', mentorId).eq('is_active', true).maybeSingle();
  if (!mentor) return NextResponse.json({ error: 'Mentor pembimbing tidak ditemukan. Pilih ulang.' }, { status: 400 });

  const { data: dup } = await admin.from('profiles').select('id').eq('nim_nik', nik).maybeSingle();
  if (dup) return NextResponse.json({ error: 'NIK ini sudah terdaftar. Silakan masuk.' }, { status: 409 });

  const loginEmail = nikLoginEmail(nik);
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (createErr || !created.user) {
    const msg = createErr?.message ?? 'Akun gagal dibuat.';
    const exists = /already|registered|exists/i.test(msg);
    return NextResponse.json({ error: exists ? 'NIK ini sudah terdaftar. Silakan masuk.' : msg }, { status: exists ? 409 : 500 });
  }

  const { error: profErr } = await admin.from('profiles').upsert({
    id: created.user.id,
    email: contact,
    name,
    role: 'participant',
    division: body.division?.trim() || mentor.division || null,
    position: body.position?.trim() || null,
    phone: body.phone?.trim() || null,
    nim_nik: nik,
    mentor_id: mentor.id,
    mentor_name: mentor.name,
    institution: 'PT Kawasan Industri Nusantara (KINRA Sei Mangkei)',
    updated_at: new Date().toISOString(),
  });
  if (profErr) {
    // Akun yang gagal dicatat profilnya dibersihkan agar NIK bisa didaftarkan ulang
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: loginEmail, nik });
}
