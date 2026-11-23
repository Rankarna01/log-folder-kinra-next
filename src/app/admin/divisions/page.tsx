'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/feedback/FeedbackProvider';
import type { Division } from '@/lib/divisions';
import { PageHead, Skeleton, EmptyState } from '@/components/ui/Kit';
import { Pagination } from '@/components/ui/Pagination';

const norm = (s?: string | null) => (s || '').trim().toLowerCase();

export default function AdminDivisionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Division[]>([]);
  const [people, setPeople] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [editing, setEditing] = useState<{ id?: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const [{ data: divs, error }, { data: profs }] = await Promise.all([
        supabase.from('divisions').select('*').order('name'),
        supabase.from('profiles').select('division').eq('role', 'participant'),
      ]);
      if (!active) return;
      if (error) toast.error(error.message, 'Master divisi gagal dimuat');
      setRows((divs as Division[]) ?? []);
      const count: Record<string, number> = {};
      (profs ?? []).forEach((p: { division: string | null }) => {
        if (p.division) count[p.division] = (count[p.division] || 0) + 1;
      });
      setPeople(count);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
    // toast stabil dari provider; reloadKey memicu muat ulang setelah simpan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase, reloadKey]);

  const visible = useMemo(() => {
    const q = norm(query);
    return rows.filter((d) => !q || norm(d.name).includes(q));
  }, [rows, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.ceil(visible.length / PAGE_SIZE) || 1;
  const paginatedDivisions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [visible, page, PAGE_SIZE]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return;
    setSaving(true);
    const duplicate = rows.some((r) => norm(r.name) === norm(name) && r.id !== editing.id);
    if (duplicate) {
      setSaving(false);
      toast.warning('Nama divisi itu sudah ada.');
      return;
    }
    const { error } = editing.id
      ? await supabase.from('divisions').update({ name }).eq('id', editing.id)
      : await supabase.from('divisions').insert({ name });
    setSaving(false);
    if (error) {
      toast.error(error.message, 'Gagal menyimpan divisi');
      return;
    }
    toast.success(editing.id ? 'Nama divisi diperbarui.' : `${name} ditambahkan.`);
    setEditing(null);
    setReloadKey((k) => k + 1);
  };

  const toggle = async (d: Division) => {
    const { error } = await supabase.from('divisions').update({ is_active: !d.is_active }).eq('id', d.id);
    if (error) {
      toast.error(error.message, 'Status gagal diubah');
      return;
    }
    toast.info(`${d.name} ${d.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`);
    setReloadKey((k) => k + 1);
  };

  if (loading) return <Skeleton />;

  const active = rows.filter((r) => r.is_active).length;

  return (
    <div className="kc-page">
      <PageHead
        eyebrow="Super admin · Master data"
        title={`${rows.length} divisi, ${active} aktif`}
        lead="Daftar divisi dipakai di pendaftaran peserta, profil, dan data mentor. Divisi yang dinonaktifkan tidak muncul di pilihan baru."
        actions={
          <button type="button" className="kc-btn kc-btn-primary" onClick={() => setEditing({ name: '' })}>
          <i className="fa-solid fa-plus" aria-hidden="true"></i> Tambah divisi
        </button>
        }
      />

      <div className="kc-toolbar">
        <label className="kc-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari divisi…" aria-label="Cari divisi" />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState>{rows.length === 0 ? 'Belum ada divisi. Tambahkan divisi pertama.' : 'Tidak ada divisi yang cocok.'}</EmptyState>
      ) : (
        <>
          <div className="kc-grid">
            {paginatedDivisions.map((d) => (
              <article key={d.id} className="kc-card" style={{ opacity: d.is_active ? 1 : 0.7 }}>
                <div className="kc-card-head">
                  <div className="kc-avatar" aria-hidden="true"><i className="fa-solid fa-sitemap"></i></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3>{d.name}</h3>
                    <p>{people[d.name] || 0} peserta</p>
                  </div>
                </div>
                <span className={`kc-chip ${d.is_active ? 'kc-chip-good' : 'kc-chip-na'}`} style={{ alignSelf: 'flex-start' }}>
                  <i className={`fa-solid ${d.is_active ? 'fa-circle-check' : 'fa-circle-pause'}`} aria-hidden="true"></i>
                  {d.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
                <div className="kc-card-foot" style={{ gap: 8 }}>
                  <button type="button" className="kc-btn" onClick={() => setEditing({ id: d.id, name: d.name })}>
                    <i className="fa-solid fa-pen" aria-hidden="true"></i> Ubah nama
                  </button>
                  <button type="button" className="kc-btn" onClick={() => toggle(d)}>
                    <i className={`fa-solid ${d.is_active ? 'fa-pause' : 'fa-play'}`} aria-hidden="true"></i>
                    {d.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={visible.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            label="divisi"
          />
        </>
      )}

      {editing && (
        <div className="kc-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="kc-modal" role="dialog" aria-modal="true" aria-labelledby="div-title">
            <p className="kc-eyebrow">{editing.id ? 'Ubah divisi' : 'Divisi baru'}</p>
            <h2 id="div-title">{editing.id ? editing.name : 'Tambah divisi'}</h2>
            <form onSubmit={save} className="kc-form">
              <div className="kc-field">
                <label htmlFor="div-name">Nama divisi <span className="kc-req">*</span></label>
                <input id="div-name" required autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Contoh: Divisi Pengembangan Bisnis" />
                {editing.id && <p className="kc-help">Nama lama pada profil peserta tidak ikut berubah otomatis.</p>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="kc-btn" onClick={() => setEditing(null)}>Batal</button>
                <button type="submit" className="kc-btn kc-btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
