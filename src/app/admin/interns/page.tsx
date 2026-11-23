'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { useDivisions } from '@/lib/divisions';
import { PageHead, StatTiles, StatTile, Skeleton, EmptyState } from '@/components/ui/Kit';
import type { Mentor, Profile } from '@/types/database';

type Draft = {
  profileId?: string;
  name: string;
  email: string;
  division: string;
  position: string;
  nimNik: string;
  phone: string;
  mentorId: string;
};

const norm = (s?: string | null) => (s || '').trim().toLowerCase();

async function postAccount(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; status?: string };
  if (!res.ok) throw new Error(json.error || 'Permintaan gagal.');
  return json;
}

export default function AdminInternsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { divisions } = useDivisions();

  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [query, setQuery] = useState('');
  const [mentorFilter, setMentorFilter] = useState('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [nikError, setNikError] = useState<string | null>(null);
  const nikInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push('/login');
        return;
      }
      const [{ data: people, error }, { data: mentorRows }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'participant').order('name'),
        supabase.from('mentors').select('*').order('name'),
      ]);
      if (!active) return;
      if (error) toast.error(error.message, 'Data anak magang gagal dimuat');
      setInterns((people as Profile[]) || []);
      setMentors((mentorRows as Mentor[]) || []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase, reloadKey]);

  const activeMentors = useMemo(() => mentors.filter((m) => m.is_active), [mentors]);

  const visible = useMemo(() => {
    const q = norm(query);
    return interns.filter((p) => {
      if (mentorFilter !== 'all' && p.mentor_id !== mentorFilter) return false;
      if (!q) return true;
      return [p.name, p.nim_nik, p.email, p.division, p.mentor_name].some((v) => norm(v).includes(q));
    });
  }, [interns, query, mentorFilter]);

  const withMentor = interns.filter((p) => p.mentor_id).length;

  const openNew = () => {
    setNikError(null);
    setDraft({
      name: '',
      email: '',
      division: divisions[0] || '',
      position: 'Peserta Magang KINRA',
      nimNik: '',
      phone: '',
      mentorId: activeMentors[0]?.id || '',
    });
  };

  const openEdit = (p: Profile) => {
    setNikError(null);
    setDraft({
      profileId: p.id,
      name: p.name,
      email: p.email,
      division: p.division || divisions[0] || '',
      position: p.position || '',
      nimNik: p.nim_nik || '',
      phone: p.phone || '',
      mentorId: p.mentor_id || '',
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setNikError(null);

    const nik = draft.nimNik.trim();
    if (!nik) {
      setNikError('NIK wajib diisi.');
      nikInputRef.current?.focus();
      return;
    }
    if (!/^\d+$/.test(nik)) {
      setNikError('NIK hanya boleh berisi angka.');
      nikInputRef.current?.focus();
      return;
    }

    const dup = interns.find((p) => p.nim_nik === nik && p.id !== draft.profileId);
    if (dup) {
      setNikError(`NIK sudah digunakan oleh peserta ${dup.name}.`);
      nikInputRef.current?.focus();
      return;
    }

    const mentor = activeMentors.find((m) => m.id === draft.mentorId);
    if (!mentor) {
      toast.warning('Pilih mentor pembimbing.');
      return;
    }
    setSaving(true);
    try {
      if (draft.profileId) {
        await postAccount({
          action: 'update',
          nimNik: nik,
          email: draft.email.trim().toLowerCase(),
          profileId: draft.profileId,
          name: draft.name.trim(),
          division: draft.division,
          position: draft.position.trim(),
          phone: draft.phone.trim(),
          mentorId: mentor.id,
          mentorName: mentor.name,
        });
        toast.success(`Data ${draft.name.trim()} diperbarui.`);
      } else {
        await postAccount({
          action: 'create',
          kind: 'participant',
          name: draft.name.trim(),
          email: draft.email.trim().toLowerCase(),
          division: draft.division,
          position: draft.position.trim(),
          nimNik: nik,
          phone: draft.phone.trim(),
          mentorId: mentor.id,
          mentorName: mentor.name,
        });
        toast.success(
          `${draft.name.trim()} terdaftar. Peserta masuk dengan NIK di halaman login.`,
          'Anak magang ditambahkan'
        );
      }
      setDraft(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.toLowerCase().includes('nik') || msg.toLowerCase().includes('terdaftar')) {
        setNikError(msg);
        nikInputRef.current?.focus();
      } else {
        toast.error(msg, 'Gagal menyimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton height={260} />;

  return (
    <div className="kc-page">
      <PageHead
        eyebrow="Super admin · Data anak magang"
        title={`${interns.length} peserta magang terdaftar`}
        lead="Daftarkan peserta dengan NIK, lalu pilih mentor pembimbingnya. Peserta masuk dengan NIK dan membuat kata sandi sendiri di halaman login."
        actions={
          <button type="button" className="kc-btn kc-btn-primary" onClick={openNew} disabled={activeMentors.length === 0}>
            <i className="fa-solid fa-user-plus" aria-hidden="true"></i> Tambah anak magang
          </button>
        }
      />

      <StatTiles label="Ringkasan peserta">
        <StatTile icon="fa-solid fa-user-graduate" label="Peserta" value={interns.length} meta="Akun peserta magang" />
        <StatTile icon="fa-solid fa-user-tie" label="Sudah ada mentor" value={withMentor} meta={`Dari ${interns.length} peserta`} />
        <StatTile icon="fa-solid fa-chalkboard-user" label="Mentor aktif" value={activeMentors.length} meta="Pilihan pembimbing" />
      </StatTiles>

      {activeMentors.length === 0 && (
        <div className="kc-note" role="status">
          <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>Tambahkan mentor di menu Data Mentor terlebih dahulu sebelum menambah anak magang.</span>
        </div>
      )}

      <div className="kc-toolbar">
        <label className="kc-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, NIK, email…" aria-label="Cari anak magang" />
        </label>
        <select aria-label="Filter mentor" value={mentorFilter} onChange={(e) => setMentorFilter(e.target.value)} className="kc-input-inline">
          <option value="all">Semua mentor</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState>{interns.length === 0 ? 'Belum ada anak magang. Tambahkan peserta pertama.' : 'Tidak ada peserta yang cocok.'}</EmptyState>
      ) : (
        <div className="kc-grid">
          {visible.map((p) => (
            <article key={p.id} className="kc-card">
              <div className="kc-card-head">
                <div className="kc-avatar" aria-hidden="true">{p.name.charAt(0).toUpperCase()}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3>{p.name}</h3>
                  <p>{p.position || 'Peserta Magang KINRA'}</p>
                </div>
              </div>
              <ul className="kc-info">
                <li><i className="fa-solid fa-building" aria-hidden="true"></i><span>{p.division || '–'}</span></li>
                <li><i className="fa-solid fa-user-tie" aria-hidden="true"></i><span>{p.mentor_name || 'Belum memilih mentor'}</span></li>
                <li><i className="fa-regular fa-id-card" aria-hidden="true"></i><span>NIK {p.nim_nik || '–'}</span></li>
                {p.email && <li><i className="fa-regular fa-envelope" aria-hidden="true"></i><span><a href={`mailto:${p.email}`}>{p.email}</a></span></li>}
              </ul>
              <div className="kc-card-foot" style={{ gap: 8 }}>
                <button type="button" className="kc-btn" onClick={() => openEdit(p)}>
                  <i className="fa-solid fa-pen" aria-hidden="true"></i> Ubah data
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <div className="kc-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && setDraft(null)}>
          <div className="kc-modal" role="dialog" aria-modal="true" aria-labelledby="intern-form-title">
            <p className="kc-eyebrow">{draft.profileId ? 'Ubah data anak magang' : 'Anak magang baru'}</p>
            <h2 id="intern-form-title">{draft.profileId ? draft.name : 'Tambah anak magang'}</h2>

            <form onSubmit={save} className="kc-form">
              <div className="kc-field">
                <label htmlFor="i-name">Nama lengkap <span className="kc-req">*</span></label>
                <input id="i-name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Contoh: Muhammad Randy Karna" />
              </div>
              <div className="kc-field">
                <label htmlFor="i-nik" className="flex items-center justify-between">
                  <span>NIK <span className="kc-req">*</span></span>
                  {nikError && (
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-circle-exclamation"></i> {nikError}
                    </span>
                  )}
                </label>
                <input
                  ref={nikInputRef}
                  id="i-nik"
                  inputMode="numeric"
                  required
                  value={draft.nimNik}
                  onChange={(e) => {
                    setDraft({ ...draft, nimNik: e.target.value.replace(/\D/g, '') });
                    if (nikError) setNikError(null);
                  }}
                  placeholder="NIK (angka)"
                  className={nikError ? 'kc-input-error' : ''}
                  aria-invalid={!!nikError}
                />
                <p className={`kc-help ${nikError ? 'text-red-500 font-medium' : ''}`}>
                  {nikError ? (
                    <span className="flex items-center gap-1 text-red-500">
                      <i className="fa-solid fa-triangle-exclamation"></i> {nikError}
                    </span>
                  ) : (
                    'NIK ini menjadi username login peserta. Harus unik dan hanya angka.'
                  )}
                </p>
              </div>
              <div className="kc-field">
                <label htmlFor="i-mail">Email kontak (opsional)</label>
                <input id="i-mail" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="nama@email.com" />
                <p className="kc-help">Hanya untuk kontak. Tidak dipakai untuk masuk dan tidak dikirimi email.</p>
              </div>
              <div className="kc-field">
                <label htmlFor="i-div">Divisi penempatan</label>
                <select id="i-div" value={draft.division} onChange={(e) => setDraft({ ...draft, division: e.target.value })}>
                  {divisions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="kc-field">
                <label htmlFor="i-mentor">Mentor pembimbing <span className="kc-req">*</span></label>
                <select id="i-mentor" required value={draft.mentorId} onChange={(e) => setDraft({ ...draft, mentorId: e.target.value })}>
                  {activeMentors.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="kc-field">
                <label htmlFor="i-pos">Bagian / posisi</label>
                <input id="i-pos" value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
              </div>
              <div className="kc-field">
                <label htmlFor="i-tel">Telepon</label>
                <input id="i-tel" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button type="button" className="kc-btn" onClick={() => setDraft(null)}>Batal</button>
                <button type="submit" className="kc-btn kc-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan…' : draft.profileId ? 'Simpan perubahan' : 'Simpan & daftarkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
