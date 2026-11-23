import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { nikLoginEmail } from '@/lib/auth/identifier';
import { DEFAULT_PASSWORD } from '@/lib/auth/password';

// NIK peserta: angka saja, panjang bebas
const NIK_RE = /^\d+$/;

/**
 * Pendaftaran akun oleh super admin, tanpa mengirim email.
 * - create : daftarkan akun mentor (email) atau peserta (NIK). Akun dibuat tanpa kata sandi
 *            dan ditandai pending_activation. Orangnya mengaktifkan sendiri lewat halaman login.
 * - update : ubah data profil. Untuk peserta, mengubah NIK juga mengubah email login.
 * - assign : tetapkan atau lepas mentor untuk beberapa anak magang.
 * SUPABASE_SERVICE_ROLE_KEY hanya dipakai di server.
 */

type Kind = 'mentor' | 'participant';
type Body = {
  action?: 'create' | 'update' | 'assign' | 'delete';
  profileIds?: string[];
  profileId?: string;
  kind?: Kind;
  name?: string;
  /** Mentor: email login. Peserta: email kontak (opsional). */
  email?: string;
  division?: string;
  position?: string;
  phone?: string;
  /** NIK peserta (angka). */
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

    const { data: target } = await admin.from('profiles').select('role').eq('id', body.profileId).maybeSingle();
    const hasNik = target?.role === 'participant' || target?.role === 'mentor';
    if (target?.role === 'admin') return NextResponse.json({ error: 'Akun admin tidak diubah dari menu ini.' }, { status: 403 });

    const patch: Record<string, unknown> = {
      name,
      division: body.division || null,
      position: body.position || null,
      phone: body.phone || null,
      mentor_id: body.mentorId || null,
      mentor_name: body.mentorName || null,
      updated_at: new Date().toISOString(),
    };

    if (hasNik) {
      const nik = (body.nimNik ?? '').trim();
      if (body.nimNik !== undefined) {
        if (!nik) return NextResponse.json({ error: 'NIK wajib diisi.' }, { status: 400 });
        if (!NIK_RE.test(nik)) return NextResponse.json({ error: 'NIK wajib diisi dan hanya berisi angka.' }, { status: 400 });
        const { data: dup } = await admin
          .from('profiles')
          .select('id, name')
          .eq('nim_nik', nik)
          .neq('id', body.profileId)
          .maybeSingle();
        if (dup) return NextResponse.json({ error: `NIK ${nik} sudah terdaftar (${dup.name || 'pengguna lain'}).` }, { status: 409 });
        // Email login peserta mengikuti NIK
        const { error: authErr } = await admin.auth.admin.updateUserById(body.profileId, {
          email: nikLoginEmail(nik),
          email_confirm: true,
        });
        if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
        patch.nim_nik = nik;
      }
      if (body.email !== undefined) {
        const contact = (body.email ?? '').trim().toLowerCase();
        if (contact && !EMAIL_RE.test(contact)) return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
        patch.email = contact;
      }
    }

    const { error } = await admin.from('profiles').update(patch).eq('id', body.profileId);
    if (error) {
      const dupKey = error.message.includes('nim_nik') || error.code === '23505';
      return NextResponse.json({ error: dupKey ? 'NIK ini sudah terdaftar.' : error.message }, { status: dupKey ? 409 : 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- hapus akun (peserta / mentor) beserta seluruh riwayat logbook dan lampirannya
  if (body.action === 'delete') {
    if (!body.profileId) return NextResponse.json({ error: 'ID profil wajib diisi.' }, { status: 400 });

    const { data: target } = await admin.from('profiles').select('id, name, role').eq('id', body.profileId).maybeSingle();
    if (!target) {
      // Coba bersihkan juga dari auth jika ada
      await admin.auth.admin.deleteUser(body.profileId).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (target.role === 'admin') {
      return NextResponse.json({ error: 'Akun super admin tidak dapat dihapus.' }, { status: 403 });
    }

    // Bersihkan berkas lampiran foto/file logbook dari Supabase Storage jika ada
    try {
      const { data: logs } = await admin.from('logbooks').select('id').eq('user_id', body.profileId);
      const logIds = (logs || []).map((l) => l.id);
      if (logIds.length > 0) {
        const { data: atts } = await admin.from('attachments').select('file_path').in('logbook_id', logIds);
        const paths = (atts || []).map((a) => a.file_path).filter(Boolean);
        if (paths.length > 0) {
          await admin.storage.from('logbook-photos').remove(paths);
        }
      }
    } catch {
      // Abaikan jika pembersihan storage gagal, tetap lanjutkan penghapusan akun
    }

    // Hapus dari auth.users (secara cascade foreign key akan menghapus profiles, logbooks, attachments)
    const { error: authErr } = await admin.auth.admin.deleteUser(body.profileId);
    if (authErr && !authErr.message.toLowerCase().includes('not found')) {
      const { error: profErr } = await admin.from('profiles').delete().eq('id', body.profileId);
      if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
    } else {
      // Pastikan baris profile juga terhapus jika auth user tidak terikat
      await admin.from('profiles').delete().eq('id', body.profileId);
    }

    return NextResponse.json({ ok: true });
  }

  // ---- daftarkan akun baru (login dengan NIK; email hanya kontak)
  const kind: Kind = body.kind === 'mentor' ? 'mentor' : 'participant';
  const name = (body.name ?? '').trim();
  const contact = (body.email ?? '').trim().toLowerCase();
  if (!name) return NextResponse.json({ error: 'Nama wajib diisi.' }, { status: 400 });

  const nik = (body.nimNik ?? '').trim();
  if (!nik) return NextResponse.json({ error: 'NIK wajib diisi.' }, { status: 400 });
  if (!NIK_RE.test(nik)) return NextResponse.json({ error: 'NIK wajib diisi dan hanya berisi angka.' }, { status: 400 });
  if (contact && !EMAIL_RE.test(contact)) return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
  const { data: dup } = await admin.from('profiles').select('id, name').eq('nim_nik', nik).maybeSingle();
  if (dup) return NextResponse.json({ error: `NIK ${nik} sudah terdaftar (${dup.name || 'pengguna lain'}).` }, { status: 409 });
  const loginEmail = nikLoginEmail(nik);

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  const existing = list.users.find((u) => (u.email ?? '').toLowerCase() === loginEmail);

  if (existing) {
    return NextResponse.json({ error: `NIK ${nik} sudah terdaftar di sistem login.` }, { status: 409 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: loginEmail,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name, must_change_password: true },
  });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'Akun gagal dibuat.' }, { status: 500 });
  }
  const userId = data.user.id;

  const profile: Record<string, unknown> = {
    id: userId,
    email: contact,
    name,
    role: kind,
    division: body.division || null,
    position: body.position || null,
    phone: body.phone || null,
    nim_nik: nik,
    updated_at: new Date().toISOString(),
  };
  if (kind === 'participant') {
    profile.mentor_id = body.mentorId || null;
    profile.mentor_name = body.mentorName || null;
    profile.institution = 'PT Kawasan Industri Nusantara (KINRA Sei Mangkei)';
  }

  const { error: profErr } = await admin.from('profiles').upsert(profile);
  if (profErr) {
    const dupKey = profErr.message.includes('nim_nik') || profErr.code === '23505';
    return NextResponse.json({ error: dupKey ? 'NIK ini sudah terdaftar.' : profErr.message }, { status: dupKey ? 409 : 500 });
  }

  return NextResponse.json({ ok: true, identifier: nik });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  let profileId = url.searchParams.get('profileId') || url.searchParams.get('id');
  if (!profileId) {
    const json = (await req.json().catch(() => null)) as { profileId?: string; id?: string } | null;
    profileId = json?.profileId || json?.id || null;
  }
  if (!profileId) {
    return NextResponse.json({ error: 'ID profil wajib diisi.' }, { status: 400 });
  }

  // Gunakan alur POST dengan action 'delete'
  const mockReq = new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', profileId }),
  });
  return POST(mockReq);
}
