import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Pendaftaran akun oleh super admin, tanpa email.
 * - create : daftarkan akun mentor/peserta. Akun dibuat tanpa kata sandi dan ditandai
 *            pending_activation. Orangnya mengaktifkan sendiri lewat halaman /aktivasi.
 * - update : ubah data profil (nama, divisi, jabatan, mentor, dst).
 * SUPABASE_SERVICE_ROLE_KEY hanya dipakai di server.
 */

type Kind = 'mentor' | 'participant';
type Body = {
  action?: 'create' | 'update' | 'assign';
  profileIds?: string[];
  profileId?: string;
  kind?: Kind;
  name?: string;
  email?: string;
  division?: string;
  position?: string;
  phone?: string;
  nimNik?: string;
  mentorId?: string | null;
  mentorName?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sesi tidak valid. Masuk ulang.' }, { status: 401 });

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya super admin yang dapat mengelola akun.' }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local. Tambahkan lalu restart server.' },
      { status: 500 }
    );
  }
  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const body = ((await req.json().catch(() => null)) ?? {}) as Body;

  // ---- tetapkan / lepas mentor untuk beberapa anak magang sekaligus
  if (body.action === 'assign') {
    const ids = Array.isArray(body.profileIds) ? body.profileIds.filter(Boolean) : [];
    if (ids.length === 0) return NextResponse.json({ error: 'Pilih minimal satu anak magang.' }, { status: 400 });
    const { error } = await admin
      .from('profiles')
      .update({
        mentor_id: body.mentorId || null,
        mentor_name: body.mentorName || null,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .eq('role', 'participant');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: ids.length });
  }

  // ---- ubah data profil
  if (body.action === 'update') {
    if (!body.profileId) return NextResponse.json({ error: 'Profil tidak valid.' }, { status: 400 });
    const name = (body.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 });
    const { error } = await admin
      .from('profiles')
      .update({
        name,
        division: body.division || null,
        position: body.position || null,
        phone: body.phone || null,
        ...(body.nimNik !== undefined ? { nim_nik: body.nimNik || null } : {}),
        mentor_id: body.mentorId || null,
        mentor_name: body.mentorName || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.profileId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ---- daftarkan akun baru (tanpa email)
  const kind: Kind = body.kind === 'mentor' ? 'mentor' : 'participant';
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  const existing = list.users.find((u) => (u.email ?? '').toLowerCase() === email);

  let userId = existing?.id;
  let status: 'created' | 'exists' = 'created';

  if (existing) {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', existing.id).maybeSingle();
    if (prof?.role === 'admin') {
      return NextResponse.json({ error: 'Email ini milik akun super admin.' }, { status: 409 });
    }
    status = 'exists';
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, pending_activation: true },
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Akun gagal dibuat.' }, { status: 500 });
    }
    userId = data.user.id;
  }

  const profile: Record<string, unknown> = {
    id: userId,
    email,
    name,
    role: kind,
    division: body.division || null,
    position: body.position || null,
    phone: body.phone || null,
    updated_at: new Date().toISOString(),
  };
  if (kind === 'participant') {
    profile.nim_nik = body.nimNik || null;
    profile.mentor_id = body.mentorId || null;
    profile.mentor_name = body.mentorName || null;
    profile.institution = 'PT Kawasan Industri Nusantara (KINRA Sei Mangkei)';
  }

  const { error: profErr } = await admin.from('profiles').upsert(profile);
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status, email });
}
