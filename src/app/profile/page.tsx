'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useDivisions } from '@/lib/divisions';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { InstallButton } from '@/components/pwa/InstallButton';
import type { Mentor, Profile, UserRole } from '@/types/database';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

const ROLE_META: Record<UserRole, { title: string; chip: string; icon: string }> = {
  admin: { title: 'Profil Super Admin', chip: 'Super Admin', icon: 'fa-shield-halved' },
  mentor: { title: 'Profil Mentor Pembimbing', chip: 'Mentor Pembimbing', icon: 'fa-chalkboard-user' },
  participant: { title: 'Profil Peserta Magang', chip: 'Peserta Magang', icon: 'fa-user-graduate' },
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [name, setName] = useState('');
  const { divisions } = useDivisions();
  const [divisionPick, setDivision] = useState<string>('');
  const division = divisionPick || divisions[0] || '';
  const [position, setPosition] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const [{ data }, { data: mentorRows }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('mentors').select('*').eq('is_active', true).order('name'),
      ]);

      if (data) {
        const p = data as Profile;
        setProfile(p);
        setName(p.name || '');
        setDivision(p.division || '');
        setPosition(p.position || '');
        setMentorId(p.mentor_id || '');
      }
      setMentors((mentorRows as Mentor[]) || []);
      setFetching(false);
    }

    loadProfile();
  }, [router, supabase]);

  const role: UserRole = profile?.role ?? 'participant';
  const meta = ROLE_META[role];
  const isParticipant = role === 'participant';

  // Nama mentor ganda disembunyikan, sama seperti di form pendaftaran.
  const uniqueMentors = useMemo(() => {
    const seen = new Map<string, Mentor>();
    mentors.forEach((m) => {
      const key = m.name.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, m);
    });
    return [...seen.values()];
  }, [mentors]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const chosen = uniqueMentors.find((m) => m.id === mentorId);
    if (isParticipant && !chosen) {
      toast.warning('Pilih mentor pembimbing dari daftar.');
      setLoading(false);
      return;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      division,
      position: position.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (isParticipant && chosen) {
      payload.mentor_id = chosen.id;
      payload.mentor_name = chosen.name;
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);
    setLoading(false);

    if (error) {
      toast.error(error.message, 'Profil gagal diperbarui');
      return;
    }
    toast.success('Perubahan profil Anda sudah disimpan.');
    router.refresh();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNew.length < MIN_PASSWORD_LENGTH) {
      toast.warning(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.warning('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwSaving(false);
    if (error) {
      toast.error(error.message, 'Kata sandi gagal diubah');
      return;
    }
    setPwNew('');
    setPwConfirm('');
    toast.success('Kata sandi Anda sudah diperbarui.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (fetching) {
    return <div className="p-8 text-xs text-zinc-500 text-center">Memuat profil...</div>;
  }

  return (
    <div className="kc-page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <header className="kc-head">
        <p className="kc-eyebrow">Akun</p>
        <h1>{meta.title}</h1>
        <p>Perbarui data diri Anda. Email login tidak bisa diubah dari halaman ini.</p>
      </header>

      <section className="kc-card" style={{ alignItems: 'center', textAlign: 'center', gap: 10 }}>
        <div className="kc-avatar" style={{ width: 64, height: 64, borderRadius: 18, fontSize: 24 }} aria-hidden="true">
          <i className={`fa-solid ${meta.icon}`}></i>
        </div>
        <div>
          <h2 className="kc-section-title" style={{ fontSize: 18 }}>{profile?.name || '–'}</h2>
          <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>{profile?.email}</p>
        </div>
        <span className="kc-chip kc-chip-na">
          <i className={`fa-solid ${meta.icon}`} aria-hidden="true"></i>
          {meta.chip}
        </span>
      </section>

      <form onSubmit={handleUpdate} className="kc-card kc-form">
        <div className="kc-field">
          <label htmlFor="pf-name">Nama lengkap</label>
          <input id="pf-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="kc-field">
          <label htmlFor="pf-div">Divisi penempatan</label>
          <select id="pf-div" value={division} onChange={(e) => setDivision(e.target.value)}>
            {divisions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="kc-field">
          <label htmlFor="pf-pos">{isParticipant ? 'Bagian / posisi penugasan' : 'Jabatan'}</label>
          <input id="pf-pos" type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder={isParticipant ? 'Contoh: Junior Full stack developer' : 'Contoh: Kepala Unit TI'} />
        </div>

        {isParticipant && (
          <div className="kc-field">
            <label htmlFor="pf-mentor">Mentor pembimbing <span className="kc-req">*</span></label>
            <select id="pf-mentor" value={mentorId} onChange={(e) => setMentorId(e.target.value)} required>
              <option value="" disabled>{uniqueMentors.length ? 'Pilih mentor Anda' : 'Belum ada mentor terdaftar'}</option>
              {uniqueMentors.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" disabled={loading} className="kc-btn kc-btn-primary" style={{ justifyContent: 'center', height: 46 }}>
          {loading ? 'Menyimpan…' : 'Simpan perubahan'}
        </button>
      </form>

      <section className="kc-card kc-form">
        <div>
          <h2 className="kc-section-title">Pasang aplikasi</h2>
          <p className="kc-small kc-muted" style={{ margin: '4px 0 0' }}>Tambahkan Timesheet KINRA ke layar utama HP atau komputer.</p>
        </div>
        <InstallButton />
      </section>

      <form onSubmit={handleChangePassword} className="kc-card kc-form">
        <div>
          <h2 className="kc-section-title">Ubah kata sandi</h2>
          <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>Minimal {MIN_PASSWORD_LENGTH} karakter. Gunakan kombinasi huruf dan angka.</p>
        </div>
        <div className="kc-field">
          <label htmlFor="pw-new">Kata sandi baru</label>
          <input id="pw-new" type="password" required minLength={MIN_PASSWORD_LENGTH} value={pwNew} onChange={(e) => setPwNew(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="kc-field">
          <label htmlFor="pw-confirm">Ulangi kata sandi baru</label>
          <input id="pw-confirm" type="password" required minLength={MIN_PASSWORD_LENGTH} value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={pwSaving} className="kc-btn" style={{ justifyContent: 'center', height: 46 }}>
          <i className="fa-solid fa-key" aria-hidden="true"></i>
          {pwSaving ? 'Menyimpan…' : 'Ubah kata sandi'}
        </button>
      </form>

      <button type="button" onClick={handleLogout} className="kc-btn" style={{ justifyContent: 'center', color: 'var(--txt-bad)' }}>
        <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
        Keluar dari akun
      </button>
    </div>
  );
}
