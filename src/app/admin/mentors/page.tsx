'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useDivisions } from '@/lib/divisions';
import { useToast } from '@/components/feedback/FeedbackProvider';
import type { Mentor } from '@/types/database';
import { PageHead, StatTiles, StatTile, Skeleton, EmptyState } from '@/components/ui/Kit';
import { generatePassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

type Draft = {
  id?: string;
  name: string;
  division: string;
  position: string;
  email: string;
  phone: string;
  is_active: boolean;
  account: boolean;
  password: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  division: '',
  position: '',
  email: '',
  phone: '',
  is_active: true,
  account: true,
  password: '',
};

type Issued = { email: string; password: string; created: boolean; name: string };

const norm = (s?: string | null) => (s || '').trim().toLowerCase();

export default function AdminMentorsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const { divisions } = useDivisions();
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [pesertaByMentor, setPesertaByMentor] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState<string>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetFor, setResetFor] = useState<Mentor | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [issued, setIssued] = useState<Issued | null>(null);
  const [copied, setCopied] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push('/login');
      return;
    }

    const [{ data: rows, error }, { data: people }] = await Promise.all([
      supabase.from('mentors').select('*').order('name'),
      supabase.from('profiles').select('mentor_id').eq('role', 'participant'),
    ]);

    if (error) toast.error(error.message, 'Data mentor gagal dimuat');
    setMentors((rows as Mentor[]) || []);

    const counts: Record<string, number> = {};
    (people || []).forEach((p: { mentor_id: string | null }) => {
      if (p.mentor_id) counts[p.mentor_id] = (counts[p.mentor_id] || 0) + 1;
    });
    setPesertaByMentor(counts);
    setLoading(false);
    }
    load();
  }, [router, supabase, toast, reloadKey]);


  // Nama yang sama muncul lebih dari sekali: ditandai agar admin bisa merapikan data.
  const dupNames = useMemo(() => {
    const count = new Map<string, number>();
    mentors.forEach((m) => count.set(norm(m.name), (count.get(norm(m.name)) || 0) + 1));
    return new Set([...count.entries()].filter(([, c]) => c > 1).map(([k]) => k));
  }, [mentors]);

  const visible = useMemo(() => {
    const q = norm(query);
    return mentors.filter((m) => {
      if (division !== 'all' && m.division !== division) return false;
      if (status === 'active' && !m.is_active) return false;
      if (status === 'inactive' && m.is_active) return false;
      if (!q) return true;
      return [m.name, m.position, m.email, m.division].some((v) => norm(v).includes(q));
    });
  }, [mentors, query, division, status]);

  const totals = useMemo(
    () => ({
      active: mentors.filter((m) => m.is_active).length,
      peserta: Object.values(pesertaByMentor).reduce((a, b) => a + b, 0),
      duplicates: mentors.filter((m) => dupNames.has(norm(m.name))).length,
    }),
    [mentors, pesertaByMentor, dupNames]
  );

  const openNew = () => setDraft({ ...EMPTY_DRAFT, password: generatePassword() });
  const openEdit = (m: Mentor) =>
    setDraft({
      id: m.id,
      name: m.name,
      division: m.division,
      position: m.position,
      email: m.email || '',
      phone: m.phone || '',
      is_active: m.is_active,
      account: false,
      password: generatePassword(),
    });

  const callAccountApi = async (mentorId: string, password: string) => {
    const res = await fetch('/api/admin/mentor-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId, password }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; created?: boolean; email?: string };
    if (!res.ok) throw new Error(json.error || 'Akun mentor gagal disiapkan.');
    return json;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);

    const payload = {
      name: draft.name.trim(),
      division: draft.division || divisions[0] || '',
      position: draft.position.trim(),
      email: draft.email.trim() || null,
      phone: draft.phone.trim() || null,
      is_active: draft.is_active,
    };

    let mentorId = draft.id;
    if (draft.id) {
      const { error } = await supabase.from('mentors').update(payload).eq('id', draft.id);
      if (error) {
        setSaving(false);
        toast.error(error.message, 'Gagal menyimpan mentor');
        return;
      }
    } else {
      const { data, error } = await supabase.from('mentors').insert(payload).select('id').single();
      if (error || !data) {
        setSaving(false);
        toast.error(error?.message ?? 'Mentor gagal ditambahkan', 'Gagal menyimpan mentor');
        return;
      }
      mentorId = data.id;
    }

    if (draft.account) {
      if (!payload.email) {
        setSaving(false);
        toast.warning('Mentor tersimpan, tetapi akun login belum dibuat karena email kosong.', 'Akun belum dibuat');
        setDraft(null);
        setReloadKey((k) => k + 1);
        return;
      }
      if (draft.password.length < MIN_PASSWORD_LENGTH) {
        setSaving(false);
        toast.warning(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
        return;
      }
      try {
        const res = await callAccountApi(mentorId!, draft.password);
        setIssued({ email: res.email!, password: draft.password, created: !!res.created, name: payload.name });
      } catch (err) {
        toast.error((err as Error).message, 'Akun login gagal dibuat');
      }
    } else {
      toast.success(draft.id ? `Data ${payload.name} diperbarui.` : `${payload.name} ditambahkan sebagai mentor.`);
    }

    setSaving(false);
    setDraft(null);
    setReloadKey((k) => k + 1);
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetFor) return;
    if (resetPassword.length < MIN_PASSWORD_LENGTH) {
      toast.warning(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    setSaving(true);
    try {
      const res = await callAccountApi(resetFor.id, resetPassword);
      setIssued({ email: res.email!, password: resetPassword, created: !!res.created, name: resetFor.name });
      setResetFor(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error((err as Error).message, 'Reset kata sandi gagal');
    } finally {
      setSaving(false);
    }
  };

  const copyPassword = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.warning('Salin manual dari kolom kata sandi.');
    }
  };

  const toggleActive = async (m: Mentor) => {
    const { error } = await supabase.from('mentors').update({ is_active: !m.is_active }).eq('id', m.id);
    if (error) {
      toast.error(error.message, 'Status gagal diubah');
      return;
    }
    toast.info(`${m.name} ${m.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`);
    setReloadKey((k) => k + 1);
  };

  const remove = async (m: Mentor) => {
    const n = pesertaByMentor[m.id] || 0;
    const msg = n > 0
      ? `Hapus ${m.name}? ${n} peserta yang dibimbing akan kehilangan mentor dan harus memilih ulang. Tindakan ini tidak bisa dibatalkan.`
      : `Hapus ${m.name}? Tindakan ini tidak bisa dibatalkan.`;
    if (!window.confirm(msg)) return;

    const { error } = await supabase.from('mentors').delete().eq('id', m.id);
    if (error) {
      toast.error(error.message, 'Mentor gagal dihapus');
      return;
    }
    toast.success(`${m.name} dihapus dari daftar mentor.`);
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return <Skeleton height={260} />;
  }

  return (
    <div className="kc-page">
      <PageHead
        eyebrow="Super admin · Data mentor"
        title={`${mentors.length} mentor terdaftar, ${totals.active} aktif`}
        lead="Kelola mentor pembimbing yang dipilih peserta saat mendaftar. Jumlah peserta dihitung langsung dari profil."
        actions={
          <button type="button" className="kc-btn kc-btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus" aria-hidden="true"></i> Tambah mentor
        </button>
        }
      />

      <StatTiles label="Ringkasan mentor">
        <StatTile icon="fa-solid fa-chalkboard-user" label="Mentor aktif" value={totals.active} meta={`Dari ${mentors.length} data`} />
        <StatTile icon="fa-solid fa-user-graduate" label="Peserta dibimbing" value={totals.peserta} meta="Peserta yang sudah memilih mentor" />
        <StatTile icon="fa-solid fa-clone" label="Nama ganda" value={totals.duplicates} meta={totals.duplicates > 0 ? 'Perlu dirapikan' : 'Tidak ada'} />
      </StatTiles>

      <div className="kc-toolbar">
        <label className="kc-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, posisi, email…" aria-label="Cari mentor" />
        </label>
        <select
          aria-label="Filter divisi"
          value={division}
          onChange={(e) => setDivision(e.target.value)}
          className="kc-input-inline"
        >
          <option value="all">Semua divisi</option>
          {divisions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <div className="kc-seg" role="tablist" aria-label="Filter status">
          <button role="tab" aria-selected={status === 'all'} onClick={() => setStatus('all')}>Semua</button>
          <button role="tab" aria-selected={status === 'active'} onClick={() => setStatus('active')}>Aktif</button>
          <button role="tab" aria-selected={status === 'inactive'} onClick={() => setStatus('inactive')}>Nonaktif</button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState>{mentors.length === 0 ? 'Belum ada mentor. Tambahkan mentor pertama.' : 'Tidak ada mentor yang cocok.'}</EmptyState>
      ) : (
        <div className="kc-grid">
          {visible.map((m) => {
            const peserta = pesertaByMentor[m.id] || 0;
            const dup = dupNames.has(norm(m.name));
            return (
              <article key={m.id} className="kc-card" style={{ opacity: m.is_active ? 1 : 0.7 }}>
                <div className="kc-card-head">
                  <div className="kc-avatar" aria-hidden="true">{m.name.charAt(0).toUpperCase()}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3>{m.name}</h3>
                    <p>{m.position || '–'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`kc-chip ${m.is_active ? 'kc-chip-good' : 'kc-chip-na'}`}>
                    <i className={`fa-solid ${m.is_active ? 'fa-circle-check' : 'fa-circle-pause'}`} aria-hidden="true"></i>
                    {m.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {dup && (
                    <span className="kc-chip kc-chip-warn">
                      <i className="fa-solid fa-clone" aria-hidden="true"></i>
                      Nama ganda
                    </span>
                  )}
                </div>

                <ul className="kc-info">
                  <li>
                    <i className="fa-solid fa-building" aria-hidden="true"></i>
                    <span>{m.division}</span>
                  </li>
                  <li>
                    <i className="fa-regular fa-envelope" aria-hidden="true"></i>
                    <span>{m.email ? <a href={`mailto:${m.email}`}>{m.email}</a> : '–'}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-phone" aria-hidden="true"></i>
                    <span>{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : '–'}</span>
                  </li>
                </ul>

                <div className="kc-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div><span>Peserta</span><b>{peserta}</b></div>
                  <div><span>Status</span><b style={{ fontSize: 14 }}>{m.is_active ? 'Aktif' : 'Nonaktif'}</b></div>
                </div>

                <div className="kc-card-foot" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="kc-btn" onClick={() => openEdit(m)}>
                    <i className="fa-solid fa-pen" aria-hidden="true"></i> Ubah
                  </button>
                  <button
                    type="button"
                    className="kc-btn"
                    disabled={!m.email}
                    title={m.email ? 'Atur ulang kata sandi login' : 'Isi email mentor dulu'}
                    onClick={() => {
                      setResetFor(m);
                      setResetPassword(generatePassword());
                    }}
                  >
                    <i className="fa-solid fa-key" aria-hidden="true"></i> Sandi
                  </button>
                  <button type="button" className="kc-btn" onClick={() => toggleActive(m)}>
                    <i className={`fa-solid ${m.is_active ? 'fa-pause' : 'fa-play'}`} aria-hidden="true"></i>
                    {m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button type="button" className="kc-btn kc-btn-danger" onClick={() => remove(m)} aria-label={`Hapus ${m.name}`}>
                    <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {draft && (
        <div className="kc-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && setDraft(null)}>
          <div className="kc-modal" role="dialog" aria-modal="true" aria-labelledby="mentor-form-title">
            <p className="kc-eyebrow">{draft.id ? 'Ubah data' : 'Mentor baru'}</p>
            <h2 id="mentor-form-title">{draft.id ? draft.name : 'Tambah mentor'}</h2>
            <p>Data ini muncul di pilihan mentor saat peserta mendaftar.</p>

            <form onSubmit={save} className="kc-form">
              <div className="kc-field">
                <label htmlFor="m-name">Nama lengkap & gelar <span className="kc-req">*</span></label>
                <input id="m-name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Contoh: Ir. Hendra Saputra" />
              </div>
              <div className="kc-field">
                <label htmlFor="m-div">Divisi <span className="kc-req">*</span></label>
                <select id="m-div" value={draft.division || divisions[0] || ''} onChange={(e) => setDraft({ ...draft, division: e.target.value })}>
                  {divisions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="kc-field">
                <label htmlFor="m-pos">Jabatan</label>
                <input id="m-pos" value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} placeholder="Contoh: Manajer Operasional Kawasan KEK" />
              </div>
              <div className="kc-field">
                <label htmlFor="m-mail">Email</label>
                <input id="m-mail" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="nama@kinra.co.id" />
              </div>
              <div className="kc-field">
                <label htmlFor="m-tel">Telepon</label>
                <input id="m-tel" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <label className="kc-check">
                <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
                <span>Aktif, tampil di pilihan mentor</span>
              </label>

              <div className="kc-account-box">
                <label className="kc-check">
                  <input type="checkbox" checked={draft.account} onChange={(e) => setDraft({ ...draft, account: e.target.checked })} />
                  <span>{draft.id ? 'Perbarui kata sandi login' : 'Buat akun login untuk mentor ini'}</span>
                </label>
                {draft.account && (
                  <div className="kc-field" style={{ marginTop: 12 }}>
                    <label htmlFor="m-pass">Kata sandi</label>
                    <div className="kc-input-row">
                      <input id="m-pass" type="text" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} autoComplete="off" spellCheck={false} />
                      <button type="button" className="kc-btn" onClick={() => setDraft({ ...draft, password: generatePassword() })}>
                        <i className="fa-solid fa-rotate" aria-hidden="true"></i> Generate
                      </button>
                    </div>
                    <p className="kc-help">
                      Username login memakai email mentor{draft.email ? `: ${draft.email}` : ''}. Mentor bisa mengganti kata sandi sendiri dari halaman Profil.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button type="button" className="kc-btn" onClick={() => setDraft(null)}>Batal</button>
                <button type="submit" className="kc-btn kc-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="kc-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && setResetFor(null)}>
          <div className="kc-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <p className="kc-eyebrow">Atur ulang kata sandi</p>
            <h2 id="reset-title">{resetFor.name}</h2>
            <p>Kata sandi baru akan menggantikan yang lama. Mentor perlu diberi tahu kata sandi barunya.</p>
            <form onSubmit={submitReset} className="kc-form">
              <div className="kc-field">
                <label htmlFor="r-pass">Kata sandi baru</label>
                <div className="kc-input-row">
                  <input id="r-pass" type="text" required value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} autoComplete="off" spellCheck={false} />
                  <button type="button" className="kc-btn" onClick={() => setResetPassword(generatePassword())}>
                    <i className="fa-solid fa-rotate" aria-hidden="true"></i> Generate
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="kc-btn" onClick={() => setResetFor(null)}>Batal</button>
                <button type="submit" className="kc-btn kc-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan kata sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {issued && (
        <div className="kc-modal-backdrop" role="presentation">
          <div className="kc-modal" role="dialog" aria-modal="true" aria-labelledby="issued-title">
            <p className="kc-eyebrow">{issued.created ? 'Akun dibuat' : 'Kata sandi diperbarui'}</p>
            <h2 id="issued-title">{issued.name}</h2>
            <p>Berikan kredensial ini kepada mentor. Kata sandi hanya ditampilkan sekali dan tidak disimpan di sistem.</p>
            <div className="kc-cred">
              <div>
                <span>Username (email)</span>
                <b>{issued.email}</b>
              </div>
              <div>
                <span>Kata sandi</span>
                <b className="kc-mono">{issued.password}</b>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" className="kc-btn" onClick={() => copyPassword(`Email: ${issued.email}\nKata sandi: ${issued.password}`)}>
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`} aria-hidden="true"></i>
                {copied ? 'Tersalin' : 'Salin'}
              </button>
              <button type="button" className="kc-btn kc-btn-primary" onClick={() => setIssued(null)}>Sudah saya catat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
