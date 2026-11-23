'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { useDivisions } from '@/lib/divisions';
import { PageHead, StatTiles, StatTile, Chip, Skeleton, EmptyState } from '@/components/ui/Kit';
import type { Mentor, Profile } from '@/types/database';
import { MentorDetailModal } from '@/components/admin/MentorDetailModal';
import { useConfirm } from '@/components/feedback/ConfirmProvider';

type Draft = {
  id?: string;
  name: string;
  division: string;
  position: string;
  nik: string;
  email: string;
  phone: string;
  is_active: boolean;
  invite: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  division: '',
  position: '',
  nik: '',
  email: '',
  phone: '',
  is_active: true,
  invite: true,
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

export default function AdminMentorsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const { divisions } = useDivisions();

  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [pesertaByMentor, setPesertaByMentor] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState<string>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [nikError, setNikError] = useState<string | null>(null);
  const nikInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [people, setPeople] = useState<Profile[]>([]);
  const [mentorAccounts, setMentorAccounts] = useState<{ id: string; name: string; email: string | null; nim_nik: string | null }[]>([]);
  const accountOf = (m: { name: string; email: string | null }) =>
    mentorAccounts.find((a) => (m.email && a.email === m.email) || a.name === m.name) ?? null;
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push('/login');
        return;
      }
      const [{ data: rows, error }, { data: people }, { data: accounts }] = await Promise.all([
        supabase.from('mentors').select('*').order('name'),
        supabase.from('profiles').select('id,name,email,nim_nik,division,position,mentor_id,mentor_name').eq('role', 'participant').order('name'),
        supabase.from('profiles').select('id,name,email,nim_nik').eq('role', 'mentor'),
      ]);
      setMentorAccounts((accounts as typeof mentorAccounts) || []);
      if (!active) return;
      if (error) toast.error(error.message, 'Data mentor gagal dimuat');
      setMentors((rows as Mentor[]) || []);
      const counts: Record<string, number> = {};
      (people || []).forEach((p: { mentor_id: string | null }) => {
        if (p.mentor_id) counts[p.mentor_id] = (counts[p.mentor_id] || 0) + 1;
      });
      setPesertaByMentor(counts);
      setPeople((people as Profile[]) || []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
    // toast stabil dari provider; reloadKey memicu muat ulang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase, reloadKey]);

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

  const openNew = () => {
    setNikError(null);
    setDraft({ ...EMPTY_DRAFT, division: divisions[0] || '' });
  };
  const openEdit = (m: Mentor) => {
    setNikError(null);
    setDraft({
      id: m.id,
      name: m.name,
      division: m.division,
      position: m.position,
      nik: accountOf(m)?.nim_nik || '',
      email: m.email || '',
      phone: m.phone || '',
      is_active: m.is_active,
      invite: true,
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setNikError(null);

    const nik = draft.nik.trim();
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

    const account = draft.id ? accountOf({ name: draft.name, email: draft.email }) : null;
    const dupMentor = mentorAccounts.find(
      (m) => m.nim_nik === nik && m.id !== account?.id
    );
    if (dupMentor) {
      setNikError(`NIK sudah digunakan oleh mentor ${dupMentor.name}.`);
      nikInputRef.current?.focus();
      return;
    }
    const dupIntern = people.find((i) => i.nim_nik === nik);
    if (dupIntern) {
      setNikError(`NIK sudah digunakan oleh peserta magang ${dupIntern.name}.`);
      nikInputRef.current?.focus();
      return;
    }

    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      division: draft.division || divisions[0] || '',
      position: draft.position.trim(),
      email: draft.email.trim().toLowerCase() || null,
      phone: draft.phone.trim() || null,
      is_active: draft.is_active,
    };

    try {
      const common = {
        name: payload.name,
        email: payload.email,
        division: payload.division,
        position: payload.position,
        phone: payload.phone,
        nimNik: nik,
      };

      if (account) {
        await postAccount({ action: 'update', profileId: account.id, ...common });
      } else {
        await postAccount({ action: 'create', kind: 'mentor', ...common });
      }

      if (draft.id) {
        const { error } = await supabase.from('mentors').update(payload).eq('id', draft.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('mentors').insert(payload);
        if (error) throw new Error(error.message);
      }

      toast.success(
        draft.id
          ? `Data ${payload.name} diperbarui.`
          : `${payload.name} terdaftar. Mentor masuk dengan NIK dan membuat kata sandi di halaman login.`,
        draft.id ? 'Mentor diperbarui' : 'Mentor ditambahkan'
      );
      setDraft(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.toLowerCase().includes('nik') || msg.toLowerCase().includes('terdaftar')) {
        setNikError(msg);
        nikInputRef.current?.focus();
      } else {
        toast.error(msg, 'Gagal menyimpan mentor');
      }
    } finally {
      setSaving(false);
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
      ? `Hapus ${m.name}? ${n} peserta yang dibimbing akan kehilangan mentor. Tindakan ini tidak bisa dibatalkan.`
      : `Hapus ${m.name}? Tindakan ini tidak bisa dibatalkan.`;
    if (!(await confirm({ message: msg, confirmLabel: 'Hapus mentor', danger: true }))) return;
    const { error } = await supabase.from('mentors').delete().eq('id', m.id);
    if (error) {
      toast.error(error.message, 'Mentor gagal dihapus');
      return;
    }
    toast.success(`${m.name} dihapus dari daftar mentor.`);
    setReloadKey((k) => k + 1);
  };

  if (loading) return <Skeleton height={260} />;

  return (
    <div className="kc-page">
      <PageHead
        eyebrow="Super admin · Data mentor"
        title={`${mentors.length} mentor terdaftar, ${totals.active} aktif`}
        lead="Daftarkan mentor dengan NIK. Mentor masuk dengan NIK dan membuat kata sandinya sendiri di halaman login."
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
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, NIK, posisi, email…" aria-label="Cari mentor" />
        </label>
        <select aria-label="Filter divisi" value={division} onChange={(e) => setDivision(e.target.value)} className="kc-input-inline">
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
                  <Chip tone={m.is_active ? 'good' : 'na'} icon={`fa-solid ${m.is_active ? 'fa-circle-check' : 'fa-circle-pause'}`}>
                    {m.is_active ? 'Aktif' : 'Nonaktif'}
                  </Chip>
                  {dup && <Chip tone="warn" icon="fa-solid fa-clone">Nama ganda</Chip>}
                </div>

                <ul className="kc-info">
                  <li><i className="fa-solid fa-building" aria-hidden="true"></i><span>{m.division}</span></li>
                  <li><i className="fa-regular fa-id-card" aria-hidden="true"></i><span>NIK {accountOf(m)?.nim_nik || '–'}</span></li>
                  {m.email && <li><i className="fa-regular fa-envelope" aria-hidden="true"></i><span><a href={`mailto:${m.email}`}>{m.email}</a></span></li>}
                  <li><i className="fa-solid fa-phone" aria-hidden="true"></i><span>{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : '–'}</span></li>
                </ul>

                <div className="kc-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div><span>Peserta</span><b>{peserta}</b></div>
                  <div><span>Status</span><b style={{ fontSize: 14 }}>{m.is_active ? 'Aktif' : 'Nonaktif'}</b></div>
                </div>

                <div className="kc-card-foot" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="kc-btn" onClick={() => openEdit(m)}>
                    <i className="fa-solid fa-pen" aria-hidden="true"></i> Ubah
                  </button>
                  <button type="button" className="kc-btn" onClick={() => setDetailId(m.id)}>
                    <i className="fa-solid fa-users" aria-hidden="true"></i> Anak magang
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

      {detailId && (() => {
        const detailMentor = mentors.find((m) => m.id === detailId);
        if (!detailMentor) return null;
        return (
          <MentorDetailModal
            mentor={detailMentor}
            people={people}
            onClose={() => setDetailId(null)}
            onChanged={() => setReloadKey((k) => k + 1)}
          />
        );
      })()}

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
                <label htmlFor="m-nik" className="flex items-center justify-between">
                  <span>NIK <span className="kc-req">*</span></span>
                  {nikError && (
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-circle-exclamation"></i> {nikError}
                    </span>
                  )}
                </label>
                <input
                  ref={nikInputRef}
                  id="m-nik"
                  inputMode="numeric"
                  required
                  value={draft.nik}
                  onChange={(e) => {
                    setDraft({ ...draft, nik: e.target.value.replace(/\D/g, '') });
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
                    'NIK ini menjadi username login mentor. Harus unik dan hanya angka.'
                  )}
                </p>
              </div>
              <div className="kc-field">
                <label htmlFor="m-mail">Email kontak (opsional)</label>
                <input id="m-mail" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="nama@kinra.co.id" />
                <p className="kc-help">Hanya untuk kontak. Tidak dipakai untuk masuk.</p>
              </div>
              <div className="kc-field">
                <label htmlFor="m-tel">Telepon</label>
                <input id="m-tel" type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <label className="kc-check">
                <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
                <span>Aktif, tampil di pilihan mentor</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button type="button" className="kc-btn" onClick={() => setDraft(null)}>Batal</button>
                <button type="submit" className="kc-btn kc-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan…' : draft.id ? 'Simpan' : 'Simpan & daftarkan akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
